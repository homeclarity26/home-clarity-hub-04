import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  property_id: string;
  sender_id: string;
  message: string;
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
    id: "m1",
    property_id: "mock",
    sender_id: "creator",
    message: "Welcome to your Home Clarity Hub portal! This is your direct line to our team. Feel free to ask any questions about your home report or upcoming projects.",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    senderName: "Adam Kilgore",
    senderInitials: "AK",
  },
  {
    id: "m2",
    property_id: "mock",
    sender_id: "client",
    message: "Thanks! Quick question — the roof section says Fair condition. Does that mean we need to replace it soon, or just keep an eye on it?",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    senderName: "You",
    senderInitials: "JR",
  },
  {
    id: "m3",
    property_id: "mock",
    sender_id: "creator",
    message: "Great question! Fair condition means it's functional but showing wear. Based on your roof age (2009), I'd recommend budgeting for replacement in the next 3–5 years. No immediate action required, but we should address the flashing around the chimney sooner — that's the higher-risk item.",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderName: "Adam Kilgore",
    senderInitials: "AK",
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
    if (isMock) {
      setMessages(MOCK_MESSAGES);
      setIsLoading(false);
      return;
    }
    if (!propertyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: msgs, error } = await (supabase
        .from("property_messages" as any) as any)
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rawMsgs = (msgs as unknown as Message[]) || [];

      // Fetch sender names
      const senderIds = [...new Set(rawMsgs.map((m) => m.sender_id))];
      let profileMap: Record<string, { name: string; initials: string }> = {};

      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_initials")
          .in("user_id", senderIds);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p) => [p.user_id, { name: p.full_name || "Unknown", initials: p.avatar_initials || "??" }])
          );
        }
      }

      const enriched = rawMsgs.map((m) => ({
        ...m,
        senderName: m.sender_id === user?.id ? "You" : (profileMap[m.sender_id]?.name || creatorName),
        senderInitials: m.sender_id === user?.id
          ? (profile?.avatar_initials || "Me")
          : (profileMap[m.sender_id]?.initials || creatorInitials),
      }));

      setMessages(enriched);

      // Mark unread messages from the other party as read
      const unreadIds = rawMsgs
        .filter((m) => !m.is_read && m.sender_id !== user?.id)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("property_messages" as "properties")
          .update({ is_read: true } as Record<string, unknown>)
          .in("id", unreadIds);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [propertyId, user?.id]);

  // Pre-fill message from other tabs
  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [initialMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (isMock) {
      const mockNew: Message = {
        id: `m${Date.now()}`,
        property_id: propertyId!,
        sender_id: "client",
        message: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        senderName: "You",
        senderInitials: profile?.avatar_initials || "ME",
      };
      setMessages((prev) => [...prev, mockNew]);
      setNewMessage("");
      return;
    }

    if (!propertyId || !user) return;

    setIsSending(true);
    try {
      const { error } = await (supabase
        .from("property_messages" as any) as any)
        .insert({
          property_id: propertyId,
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages();
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Failed to send message. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Hero */}
      <section className="text-center py-10 md:py-12 px-6 md:px-20 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Messages</h1>
        <p className="font-sans text-base text-muted-foreground">
          Direct communication with your HBC advisor.
        </p>
      </section>

      {/* Chat Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 pb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-sans text-muted-foreground text-center">
                  No messages yet. Send a message to start the conversation with your HBC advisor.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = isMock
                  ? msg.sender_id === "client"
                  : msg.sender_id === user?.id;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                      isOwn
                        ? "bg-foreground text-background"
                        : "bg-accent/20 text-accent"
                    }`}>
                      {msg.senderInitials}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[72%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed ${
                        isOwn
                          ? "bg-foreground text-background rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] font-sans text-muted-foreground px-1">
                        {msg.senderName} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 md:p-4 flex gap-2 items-end bg-card">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isCreator ? "Reply to client..." : "Ask a question or leave a note for your advisor..."}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <Button
              size="sm"
              className="shrink-0 h-10 px-4 gap-1.5"
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="font-sans text-xs hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>

        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground text-center mt-3">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default MessagesTab;
