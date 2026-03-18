import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

const ProjectMessagesTab = ({ projectId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages } = useQuery({
    queryKey: ["project-messages", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (msg: string) => {
      const { error } = await supabase.from("project_messages").insert({
        project_id: projectId,
        sender_id: user!.id,
        message: msg,
        participant_type: "admin",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-messages", projectId] });
      setNewMessage("");
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Project Messages</h3>

        {/* Messages */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
          {(messages || []).length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans text-center py-8">No messages yet. Start the conversation.</p>
          ) : (
            messages!.map((msg: any) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[8px] h-4 capitalize">{msg.participant_type}</Badge>
                      {msg.is_urgent && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-sm font-sans">{msg.message}</p>
                    <p className={`text-[10px] font-sans mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newMessage.trim()) sendMessage.mutate(newMessage.trim());
            }}
          />
          <Button size="icon" onClick={() => {
            if (newMessage.trim()) sendMessage.mutate(newMessage.trim());
          }}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProjectMessagesTab;
