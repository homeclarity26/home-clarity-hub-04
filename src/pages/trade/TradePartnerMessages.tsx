import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send } from "lucide-react";
import { useMyAssignedProjects, useMyProjectMessages, useSendProjectMessage } from "@/hooks/useTradePartnerData";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const TradePartnerMessages = () => {
  const { user } = useAuth();
  const { data: projects, isLoading: projLoading } = useMyAssignedProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { data: messages } = useMyProjectMessages(selectedProject || undefined);
  const sendMessage = useSendProjectMessage();
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim() || !selectedProject) return;
    sendMessage.mutate({ projectId: selectedProject, message: draft });
    setDraft("");
  };

  if (projLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">Messages</h1>

      {(projects || []).length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No conversations</h3>
          <p className="text-xs text-muted-foreground font-sans">Messages will appear once you're assigned to a project.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Project list */}
          <div className="space-y-1">
            <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-2">Projects</p>
            {(projects || []).map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer ${selectedProject === p.id ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Messages */}
          <Card className="flex flex-col h-[500px]">
            {!selectedProject ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-sans">Select a project to view messages</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(messages || []).length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground font-sans">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    (messages || []).map((m: any) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm font-sans ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                            <p>{m.message}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(m.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border p-3 flex items-center gap-2">
                  <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..." className="font-sans" onKeyDown={e => e.key === "Enter" && handleSend()} />
                  <Button size="icon" onClick={handleSend} disabled={!draft.trim()}><Send className="w-4 h-4" /></Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TradePartnerMessages;
