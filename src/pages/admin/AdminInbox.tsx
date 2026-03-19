import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, MessageSquare, Sparkles, Search, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendPushNotification, pushTemplates } from "@/lib/pushNotifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Thread {
  propertyId: string;
  propertyName: string;
  clientName: string;
  clientInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  lastSenderIsClient: boolean;
}

const AdminInbox = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "awaiting">("all");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [smartReplies, setSmartReplies] = useState<{ label: string; message: string }[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["inbox-threads"],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, property_name, address, client_user_id");
      if (!props) return [];
      const { data: allMsgs } = await (supabase.from("property_messages" as any) as any).select("*").order("created_at", { ascending: false });
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_initials");
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });

      const threadMap: Record<string, Thread> = {};
      (allMsgs || []).forEach((msg: any) => {
        const prop = props.find(p => p.id === msg.property_id);
        if (!prop) return;
        if (!threadMap[msg.property_id]) {
          const clientProfile = profileMap[prop.client_user_id];
          threadMap[msg.property_id] = {
            propertyId: msg.property_id,
            propertyName: prop.property_name || prop.address,
            clientName: clientProfile?.full_name || "Client",
            clientInitials: clientProfile?.avatar_initials || "??",
            lastMessage: msg.message,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
            lastSenderIsClient: msg.sender_id !== user?.id,
          };
        }
        if (!msg.is_read && msg.sender_id !== user?.id) {
          threadMap[msg.property_id].unreadCount++;
        }
      });

      return Object.values(threadMap).sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    },
  });

  const filteredThreads = (threads || []).filter(t => {
    if (search && !t.clientName.toLowerCase().includes(search.toLowerCase()) && !t.propertyName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "unread" && t.unreadCount === 0) return false;
    if (filter === "awaiting" && !t.lastSenderIsClient) return false;
    return true;
  });

  const loadThreadMessages = async (propertyId: string) => {
    setLoadingMessages(true);
    const { data } = await (supabase.from("property_messages" as any) as any).select("*").eq("property_id", propertyId).order("created_at", { ascending: true });
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_initials");
    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = p; });

    setMessages((data || []).map((m: any) => ({
      ...m,
      senderName: profileMap[m.sender_id]?.full_name || "Unknown",
      senderInitials: profileMap[m.sender_id]?.avatar_initials || "??",
    })));
    setLoadingMessages(false);

    // Mark as read
    await (supabase.from("property_messages" as any) as any).update({ is_read: true }).eq("property_id", propertyId).neq("sender_id", user?.id);
    queryClient.invalidateQueries({ queryKey: ["inbox-threads"] });
  };

  useEffect(() => {
    if (activeThread) loadThreadMessages(activeThread);
  }, [activeThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel("inbox-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "property_messages" }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ["inbox-threads"] });
      if (activeThread && (payload.new as any).property_id === activeThread) {
        loadThreadMessages(activeThread);
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread || !user) return;
    setIsSending(true);
    const { error } = await (supabase.from("property_messages" as any) as any).insert({ property_id: activeThread, sender_id: user.id, message: newMessage.trim() });
    if (error) { toast.error("Failed to send"); setIsSending(false); return; }
    setNewMessage("");
    setIsSending(false);
    loadThreadMessages(activeThread);
  };

  const generateReplies = async () => {
    if (!activeThread) return;
    setLoadingReplies(true);
    const thread = threads?.find(t => t.propertyId === activeThread);
    const { data } = await supabase.functions.invoke("ai-smart-reply", {
      body: { messages: messages.slice(-10).map(m => ({ role: m.sender_id === user?.id ? "admin" : "client", content: m.message })), clientName: thread?.clientName, propertyAddress: thread?.propertyName },
    });
    if (data?.replies) setSmartReplies(data.replies);
    setLoadingReplies(false);
  };

  const totalUnread = (threads || []).reduce((s, t) => s + t.unreadCount, 0);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Inbox" }]} />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left: Thread List */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
            <div className="flex gap-1">
              {(["all", "unread", "awaiting"] as const).map(f => (
                <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" className="text-xs capitalize flex-1" onClick={() => setFilter(f)}>
                  {f}{f === "unread" && totalUnread > 0 ? ` (${totalUnread})` : ""}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filteredThreads.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No conversations</p>
            ) : filteredThreads.map(t => (
              <button key={t.propertyId} onClick={() => { setActiveThread(t.propertyId); setSmartReplies([]); }} className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer bg-transparent ${activeThread === t.propertyId ? "bg-muted" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">{t.clientInitials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{t.clientName}</span>
                      {t.unreadCount > 0 && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{t.unreadCount}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.propertyName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessage.slice(0, 60)}</p>
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Right: Message Thread */}
        <div className="flex-1 flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="h-14 border-b border-border flex items-center justify-between px-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{threads?.find(t => t.propertyId === activeThread)?.clientName}</p>
                  <p className="text-xs text-muted-foreground">{threads?.find(t => t.propertyId === activeThread)?.propertyName}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/clients/${activeThread}`)} className="text-xs">View Client →</Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : messages.map(msg => {
                  const isAdmin = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex mb-3 ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </ScrollArea>

              {/* AI Suggested Replies */}
              {smartReplies.length > 0 && (
                <div className="px-4 pb-2 border-l-2 border-l-accent mx-4 mb-2">
                  <p className="text-xs font-medium text-accent mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Suggested Replies</p>
                  <div className="flex gap-2 flex-wrap">
                    {smartReplies.map((r, i) => (
                      <button key={i} onClick={() => setNewMessage(r.message)} className="text-xs bg-muted hover:bg-muted/80 rounded-md px-3 py-1.5 text-foreground cursor-pointer border-none transition-colors">{r.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Button variant="ghost" size="sm" onClick={generateReplies} disabled={loadingReplies} className="shrink-0">
                  {loadingReplies ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent" />}
                </Button>
                <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} className="text-sm" />
                <Button size="sm" onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
