import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, Video, Link, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import VideoMessageBubble from "@/components/VideoMessageBubble";

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

interface AdminMessagesSectionProps {
  propertyId: string;
  clientName?: string;
  propertyAddress?: string;
}

const AdminMessagesSection = ({ propertyId, clientName, propertyAddress }: AdminMessagesSectionProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [smartReplies, setSmartReplies] = useState<{ label: string; message: string }[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const { data: msgs, error } = await (supabase.from("property_messages" as any) as any)
        .select("*").eq("property_id", propertyId).order("created_at", { ascending: true });
      if (error) throw error;
      const rawMsgs = (msgs as unknown as Message[]) || [];

      const senderIds = [...new Set(rawMsgs.map((m) => m.sender_id))];
      let profileMap: Record<string, { name: string; initials: string }> = {};
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_initials").in("user_id", senderIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, { name: p.full_name || "Unknown", initials: p.avatar_initials || "??" }]));
      }

      const enriched = rawMsgs.map((m) => ({
        ...m,
        senderName: m.sender_id === user?.id ? "You" : (profileMap[m.sender_id]?.name || "Client"),
        senderInitials: m.sender_id === user?.id ? (profile?.avatar_initials || "Me") : (profileMap[m.sender_id]?.initials || "CL"),
      }));
      setMessages(enriched);

      const unreadIds = rawMsgs.filter((m) => !m.is_read && m.sender_id !== user?.id).map((m) => m.id);
      if (unreadIds.length > 0) {
        await (supabase.from("property_messages" as any) as any).update({ is_read: true }).in("id", unreadIds);
      }
    } catch (err) { console.error("Error loading messages:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, [propertyId, user?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!propertyId) return;
    const channel = supabase
      .channel(`admin-messages-${propertyId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "property_messages", filter: `property_id=eq.${propertyId}` }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);
    try {
      const { error } = await (supabase.from("property_messages" as any) as any).insert({ property_id: propertyId, sender_id: user.id, message: newMessage.trim() });
      if (error) throw error;
      setNewMessage(""); await fetchMessages();
    } catch (err) { console.error("Send failed:", err); toast.error("Failed to send message."); }
    finally { setIsSending(false); }
  };

  const handleSendVideo = async () => {
    if (!videoUrl.trim() || !user) return;
    setIsSending(true);
    try {
      const { error } = await (supabase.from("property_messages" as any) as any).insert({
        property_id: propertyId,
        sender_id: user.id,
        message: "📹 Video Message",
        message_type: "video",
        metadata: { url: videoUrl.trim() },
      });
      if (error) throw error;
      setVideoUrl("");
      setVideoDialogOpen(false);
      await fetchMessages();
      toast.success("Video message sent");
    } catch (err) { toast.error("Failed to send video."); }
    finally { setIsSending(false); }
  };

  const handleAIReply = async () => {
    setLoadingReplies(true);
    setSmartReplies([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-smart-reply", {
        body: { messages: messages.slice(-10), clientName, propertyAddress },
      });
      if (error) throw error;
      setSmartReplies(data?.replies || []);
    } catch { toast.error("Failed to generate replies"); }
    finally { setLoadingReplies(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-sans font-semibold text-foreground">Messages</h3>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: "500px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-sm font-sans text-muted-foreground">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const isVideo = msg.message_type === "video";

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
                    <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      <div className={`px-3 py-2 rounded-xl text-sm font-sans ${isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] font-sans text-muted-foreground mt-0.5 px-1">
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

        {/* AI Smart Reply suggestions */}
        {smartReplies.length > 0 && (
          <div className="border-t border-border px-3 py-2 bg-accent/5 space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Suggestions</p>
            {smartReplies.map((r, i) => (
              <button key={i} onClick={() => { setNewMessage(r.message); setSmartReplies([]); }}
                className="w-full text-left px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                <Badge variant="outline" className="text-[9px] mb-0.5">{r.label}</Badge>
                <p className="text-xs font-sans text-foreground line-clamp-2">{r.message}</p>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-3 flex gap-2 items-end bg-card">
          <Button variant="ghost" size="sm" className="shrink-0 h-9 w-9 p-0" onClick={() => setVideoDialogOpen(true)} title="Send Video">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleAIReply} disabled={loadingReplies || messages.length === 0} className="gap-1.5 text-xs font-sans shrink-0">
            {loadingReplies ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span style={{background:'#C4A265',color:'#1B2B4D'}} className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0">B</span>}Ask Bobby
          </Button>
          <textarea
            value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Reply to client..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
            style={{ maxHeight: "100px", overflowY: "auto" }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 100) + "px"; }}
          />
          <Button size="sm" className="shrink-0 h-9 px-3 gap-1.5" onClick={handleSend} disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-sans">Send Video Message</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-sans text-muted-foreground">Paste a Loom, YouTube, or Vimeo URL to send as a video message.</p>
            <div className="space-y-1.5">
              <Input placeholder="https://www.loom.com/share/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="font-sans" />
            </div>
            <Button onClick={handleSendVideo} disabled={isSending || !videoUrl.trim()} className="w-full font-sans gap-2">
              <Video className="w-4 h-4" />{isSending ? "Sending..." : "Send Video Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Enter to send · Shift+Enter for new line</p>
    </div>
  );
};

export default AdminMessagesSection;
