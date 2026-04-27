import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, Video, Link } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import VideoMessageBubble from "@/components/VideoMessageBubble";
import { sendPushNotification, pushTemplates } from "@/lib/pushNotifications";

interface Message {
  id: string;
  property_id: string;
  sender_id: string;
  message: string;
  message_type?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  senderName?: string;
  senderInitials?: string;
}

interface MessagesTabProps {
  propertyId?: string;
  creatorName?: string;
  creatorInitials?: string;
  initialMessage?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "m1", property_id: "mock", sender_id: "creator",
    message: "Welcome to your Home Clarity Hub portal! This is your direct line to our team.",
    is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    senderName: "Adam Kilgore", senderInitials: "AK",
  },
  {
    id: "m2", property_id: "mock", sender_id: "client",
    message: "Thanks! Quick question: the roof section says Fair condition. Does that mean we need to replace it soon?",
    is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    senderName: "You", senderInitials: "JR",
  },
  {
    id: "m3", property_id: "mock", sender_id: "creator",
    message: "Great question! Fair condition means it's functional but showing wear. I'd recommend budgeting for replacement in 3–5 years.",
    is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderName: "Adam Kilgore", senderInitials: "AK",
  },
];

const MessagesTab = ({ propertyId, creatorName = "Your HBC Advisor", creatorInitials = "HB", initialMessage }: MessagesTabProps) => {
  const { user, profile, isCreator } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isMock = propertyId?.startsWith("mock-");

  const fetchMessages = async () => {
    if (isMock) { setMessages(MOCK_MESSAGES); setIsLoading(false); return; }
    if (!propertyId) { setIsLoading(false); return; }

    try {
      const { data: msgs, error } = await supabase.from("property_messages")
        .select("*").eq("property_id", propertyId).order("created_at", { ascending: true });
      if (error) throw error;
      const rawMsgs = (msgs as unknown as Message[]) || [];

      const senderIds = [...new Set(rawMsgs.map((m) => m.sender_id))];
      let profileMap: Record<string, { name: string; initials: string }> = {};
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_initials").in("user_id", senderIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, { name: p.full_name || "Unknown", initials: p.avatar_initials || "??" }]));
        }
      }

      const enriched = rawMsgs.map((m) => ({
        ...m,
        senderName: m.sender_id === user?.id ? "You" : (profileMap[m.sender_id]?.name || creatorName),
        senderInitials: m.sender_id === user?.id ? (profile?.avatar_initials || "Me") : (profileMap[m.sender_id]?.initials || creatorInitials),
      }));
      setMessages(enriched);

      const unreadIds = rawMsgs.filter((m) => !m.is_read && m.sender_id !== user?.id).map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("property_messages" as "properties").update({ is_read: true } as Record<string, unknown>).in("id", unreadIds);
      }
    } catch (err) { console.error("Error loading messages:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, [propertyId, user?.id]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (isMock || !propertyId) return;
    const channel = supabase
      .channel(`messages-${propertyId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "property_messages", filter: `property_id=eq.${propertyId}` }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId, isMock]);

  useEffect(() => { if (initialMessage) setNewMessage(initialMessage); }, [initialMessage]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (isMock) {
      setMessages((prev) => [...prev, { id: `m${Date.now()}`, property_id: propertyId!, sender_id: "client", message: newMessage.trim(), is_read: false, created_at: new Date().toISOString(), senderName: "You", senderInitials: profile?.avatar_initials || "ME" }]);
      setNewMessage(""); return;
    }
    if (!propertyId || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("property_messages").insert({ property_id: propertyId, sender_id: user.id, message: newMessage.trim() });
      if (error) throw error;
      
      // Notify the admin/creator about the new client message.
      // `properties` has no `creator_user_id` column — the creator lives on
      // the property's report row (`reports.created_by`). Fall back to
      // whichever admin most recently created/published a report for this
      // property; if there's none, skip the push rather than crash.
      const { data: creatorReport } = await supabase.from("reports")
        .select("created_by")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (creatorReport?.created_by) {
        const senderName = profile?.full_name || "A client";
        sendPushNotification(pushTemplates.newMessage(creatorReport.created_by, senderName, newMessage.trim()));
      }
      
      setNewMessage(""); await fetchMessages();
    } catch (err) { console.error("Send failed:", err); toast.error("Failed to send message. Try again."); }
    finally { setIsSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      <section className="text-center py-10 md:py-12 px-6 md:px-20 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Messages</h1>
        <p className="font-sans text-base text-muted-foreground">Direct communication with your HBC advisor.</p>
      </section>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 pb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EmptyState icon={MessageSquare} title="No Messages Yet" description="Send a message to start the conversation with your advisor." />
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = isMock ? msg.sender_id === "client" : msg.sender_id === user?.id;
                const isVideo = msg.message_type === "video";

                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${isOwn ? "bg-foreground text-background" : "bg-accent/20 text-accent"}`}>
                      {msg.senderInitials}
                    </div>
                    {isVideo && msg.metadata?.url ? (
                      <VideoMessageBubble
                        url={msg.metadata.url}
                        senderName={msg.senderName || ""}
                        timestamp={formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        isOwn={isOwn}
                      />
                    ) : (
                      <div className={`max-w-[72%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed ${isOwn ? "bg-foreground text-background rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] font-sans text-muted-foreground px-1">
                          {msg.senderName} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3 md:p-4 flex gap-2 items-end bg-card">
            <textarea
              value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isCreator ? "Reply to client..." : "Ask a question or leave a note for your advisor..."}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
            />
            <Button size="sm" className="shrink-0 h-10 px-4 gap-1.5" onClick={handleSend} disabled={isSending || !newMessage.trim()}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="font-sans text-xs hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground text-center mt-3">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default MessagesTab;
