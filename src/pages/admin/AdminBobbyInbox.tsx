import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendPushNotification } from "@/lib/pushNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Escalation {
  id: string;
  message_id: string;
  thread_id: string;
  property_id: string;
  status: string;
  context_summary: string | null;
  created_at: string;
  message?: { content: string; created_at: string };
  property?: { address: string | null; client_user_id: string };
  client?: { full_name: string | null };
}

export default function AdminBobbyInbox() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("escalation_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const enriched: Escalation[] = [];
      for (const esc of data) {
        const { data: msg } = await supabase
          .from("bobby_messages")
          .select("content, created_at")
          .eq("id", esc.message_id)
          .single();

        const { data: prop } = await supabase
          .from("properties")
          .select("address, client_user_id")
          .eq("id", esc.property_id)
          .single();

        let client: { full_name: string | null } | null = null;
        if (prop?.client_user_id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", prop.client_user_id)
            .single();
          client = prof;
        }

        enriched.push({
          ...esc,
          message: msg || undefined,
          property: prop || undefined,
          client: client || undefined,
        });
      }

      setEscalations(enriched);
      setLoading(false);
    };
    load();
  }, []);

  const handleReply = async (esc: Escalation) => {
    if (!replyText.trim()) return;
    setSending(true);

    await supabase.from("bobby_messages").insert({
      thread_id: esc.thread_id,
      sender: "adam",
      content: replyText.trim(),
    });

    await supabase
      .from("escalation_queue")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", esc.id);

    // Push notification to homeowner
    const { data: thread } = await supabase
      .from("bobby_threads")
      .select("client_user_id, property_id")
      .eq("id", esc.thread_id)
      .single();

    if (thread?.client_user_id) {
      sendPushNotification({
        user_id: thread.client_user_id,
        title: "Adam replied to your message",
        body: replyText.trim().slice(0, 100),
        url: `/portal/${thread.property_id}`,
      });
    }

    setEscalations((prev) =>
      prev.map((e) => (e.id === esc.id ? { ...e, status: "resolved" } : e))
    );
    setReplyText("");
    setReplyingTo(null);
    setSending(false);
    toast({ title: "Reply sent", description: "Client will see your message in their Bobby thread." });
  };

  const handleDismiss = async (id: string) => {
    await supabase
      .from("escalation_queue")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", id);

    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "dismissed" } : e))
    );
  };

  const pending = escalations.filter((e) => e.status === "pending" || e.status === "in_progress");
  const resolved = escalations.filter((e) => e.status === "resolved" || e.status === "dismissed");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">Bobby Inbox</h1>
        <p className="text-sm font-sans text-muted-foreground mt-1">
          Escalated messages that need your personal reply.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : pending.length === 0 && resolved.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No escalations yet. Bobby is handling everything.</p>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Pending ({pending.length})
              </h2>
              {pending.map((esc) => (
                <Card key={esc.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {esc.client?.full_name || "Unknown client"} — {esc.property?.address || "Unknown property"}
                      </p>
                      <p className="text-sm font-sans text-foreground mt-1">
                        {esc.message?.content || "No message content"}
                      </p>
                      {esc.context_summary && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          AI context: {esc.context_summary}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(replyingTo === esc.id ? null : esc.id)}
                        className="min-h-[36px]"
                      >
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(esc.id)}
                        className="min-h-[36px] text-muted-foreground"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  {replyingTo === esc.id && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply to the homeowner..."
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        size="sm"
                        disabled={!replyText.trim() || sending}
                        onClick={() => handleReply(esc)}
                        className="min-h-[44px] shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </section>
          )}

          {resolved.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolved ({resolved.length})
              </h2>
              {resolved.map((esc) => (
                <Card key={esc.id} className="p-4 opacity-60">
                  <p className="text-xs font-mono text-muted-foreground">
                    {esc.client?.full_name || "Unknown"} — {esc.status}
                  </p>
                  <p className="text-sm font-sans text-foreground mt-1 line-clamp-1">
                    {esc.message?.content || ""}
                  </p>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
