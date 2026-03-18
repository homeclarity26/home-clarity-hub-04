import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useProjectMessages, logProjectActivity } from "@/hooks/useProjectData";

interface Props { projectId: string; }

const ProjectMessagesTab = ({ projectId }: Props) => {
  const { user } = useAuth(); const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const { data: messages } = useProjectMessages(projectId);

  const send = useMutation({
    mutationFn: async (text: string) => { const { error } = await supabase.from("project_messages").insert({ project_id: projectId, sender_id: user!.id, message: text, participant_type: "admin" }); if (error) throw error; await logProjectActivity(projectId, "message_sent", "Message sent", user?.id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-messages", projectId] }); setMsg(""); },
  });

  return (
    <div className="space-y-4 mt-4"><Card className="p-4">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Project Messages</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {(messages || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans text-center py-8">No messages yet.</p> : messages!.map((m) => {
          const isMe = m.sender_id === user?.id;
          return (<div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}><div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}><div className="flex items-center gap-2 mb-0.5"><Badge variant="outline" className="text-[8px] h-4 capitalize">{m.participant_type}</Badge>{m.is_urgent && <AlertTriangle className="w-3 h-3 text-amber-500" />}</div><p className="text-sm font-sans">{m.message}</p><p className={`text-[10px] font-sans mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{format(new Date(m.created_at), "MMM d, h:mm a")}</p></div></div>);
        })}
      </div>
      <div className="flex gap-2"><Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." className="text-sm" onKeyDown={(e) => { if (e.key === "Enter" && msg.trim()) send.mutate(msg.trim()); }} /><Button size="icon" onClick={() => { if (msg.trim()) send.mutate(msg.trim()); }}><Send className="w-4 h-4" /></Button></div>
    </Card></div>
  );
};

export default ProjectMessagesTab;
