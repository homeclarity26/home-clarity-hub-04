import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow, format } from "date-fns";
import { FileText, DollarSign, MessageSquare, Wrench, Paperclip, User, Megaphone, Settings, Sparkles, StickyNote, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EVENT_CONFIG: Record<string, { icon: any; color: string }> = {
  report: { icon: FileText, color: "text-primary" },
  invoice: { icon: DollarSign, color: "text-accent" },
  payment: { icon: DollarSign, color: "text-green-600" },
  message_client: { icon: MessageSquare, color: "text-foreground" },
  message_admin: { icon: MessageSquare, color: "text-primary" },
  project: { icon: Wrench, color: "text-blue-600" },
  document: { icon: Paperclip, color: "text-muted-foreground" },
  login: { icon: User, color: "text-muted-foreground/50" },
  announcement: { icon: Megaphone, color: "text-accent" },
  equipment: { icon: Settings, color: "text-muted-foreground" },
  ai_action: { icon: Sparkles, color: "text-purple-600" },
  admin_note: { icon: StickyNote, color: "text-accent" },
};

interface ClientTimelineTabProps {
  propertyId: string;
}

const ClientTimelineTab = ({ propertyId }: ClientTimelineTabProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["client-timeline", propertyId],
    queryFn: async () => {
      // Get timeline events
      const { data: timeline } = await supabase.from("client_timeline_events").select("*").eq("client_id", propertyId).order("created_at", { ascending: false }).limit(100);
      
      // Also get activity_log events
      const { data: activity } = await supabase.from("activity_log").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(50);

      const all = [
        ...(timeline || []).map((e: any) => ({ ...e, source: "timeline" })),
        ...(activity || []).map((a: any) => ({ id: a.id, event_type: a.action_type, event_description: a.message, actor: "system", created_at: a.created_at, is_admin_note: false, source: "activity" })),
      ];

      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const addNote = async () => {
    if (!noteText.trim() || !user) return;
    setAddingNote(true);
    await supabase.from("client_timeline_events").insert({
      client_id: propertyId,
      event_type: "admin_note",
      event_description: noteText.trim(),
      actor: "admin",
      is_admin_note: true,
      note_text: noteText.trim(),
    });
    setNoteText("");
    setAddingNote(false);
    queryClient.invalidateQueries({ queryKey: ["client-timeline", propertyId] });
    toast.success("Note added");
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex gap-2">
          <Textarea placeholder="Add an internal note..." value={noteText} onChange={e => setNoteText(e.target.value)} className="text-sm min-h-[60px] bg-card" />
          <Button onClick={addNote} disabled={!noteText.trim() || addingNote} size="sm" className="shrink-0 self-end gap-1">
            {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add Note
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (events || []).length === 0 ? (
        <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No activity recorded yet.</p></Card>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
          {(events || []).map((event: any) => {
            const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.equipment;
            const Icon = config.icon;
            return (
              <div key={event.id} className="relative mb-4">
                <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center ${event.is_admin_note ? "bg-accent/20" : "bg-card border border-border"}`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>
                <Card className={`p-3 ml-2 ${event.is_admin_note ? "bg-accent/5 border-accent/20" : ""}`}>
                  <p className="text-sm text-foreground">{event.event_description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">{event.actor || "system"}</Badge>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientTimelineTab;
