import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ClientStickyNotesProps {
  propertyId: string;
}

const ClientStickyNotes = ({ propertyId }: ClientStickyNotesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Use activity_log for internal notes with action_type = 'sticky_note'
  const { data: notes, isLoading } = useQuery({
    queryKey: ["sticky-notes", propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("property_id", propertyId)
        .eq("action_type", "sticky_note")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleAdd = async () => {
    if (!newNote.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("activity_log").insert({
        property_id: propertyId,
        user_id: user.id,
        action_type: "sticky_note",
        message: newNote.trim(),
      });
      if (error) throw error;
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["sticky-notes", propertyId] });
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("activity_log").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    queryClient.invalidateQueries({ queryKey: ["sticky-notes", propertyId] });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-accent" />
        <h4 className="text-sm font-sans font-semibold text-foreground">Internal Notes</h4>
        <span className="text-[10px] font-mono text-muted-foreground">({notes?.length || 0})</span>
      </div>

      <div className="space-y-2 mb-3">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a private note about this client…"
          rows={2}
          className="text-sm font-sans resize-none"
        />
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={handleAdd} disabled={saving || !newNote.trim()}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (notes || []).length > 0 ? (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {(notes || []).map((note) => (
            <div key={note.id} className="group bg-accent/5 border border-accent/10 rounded-md p-3 relative">
              <p className="text-xs font-sans text-foreground whitespace-pre-wrap pr-6">{note.message}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
              </p>
              <button
                onClick={() => handleDelete(note.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-muted-foreground hover:text-destructive p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-sans text-muted-foreground text-center py-3">No notes yet.</p>
      )}
    </Card>
  );
};

export default ClientStickyNotes;
