import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Save, Loader2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceNotesPanelProps {
  invoiceId: string;
  initialNotes: string | null;
  onUpdate?: () => void;
}

const QUICK_TAGS = [
  "Follow up needed",
  "Client dispute",
  "Partial payment agreed",
  "Payment plan active",
  "Collections pending",
  "Approved by client",
];

const InvoiceNotesPanel = ({ invoiceId, initialNotes, onUpdate }: InvoiceNotesPanelProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("invoices").update({ notes: notes || null }).eq("id", invoiceId);
    setIsSaving(false);
    if (error) { toast.error("Failed to save notes"); return; }
    toast.success("Notes saved");
    setIsEditing(false);
    onUpdate?.();
  };

  const addTag = (tag: string) => {
    const prefix = notes.trim() ? `${notes.trim()}\n` : "";
    setNotes(`${prefix}[${tag}]`);
    setIsEditing(true);
  };

  if (!isEditing && !notes) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <StickyNote className="w-3.5 h-3.5" />
        Add internal note...
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StickyNote className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-sans font-semibold text-foreground">Internal Notes</span>
      </div>

      {isEditing ? (
        <>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Private admin notes about this invoice..."
            className="text-sm font-sans"
          />
          <div className="flex flex-wrap gap-1 mb-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors border-none cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5 inline mr-0.5" />{tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs font-sans gap-1">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setNotes(initialNotes || ""); }} className="text-xs font-sans">
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-sans text-foreground bg-muted/30 rounded-md p-2.5 w-full text-left whitespace-pre-wrap hover:bg-muted/50 transition-colors border-none cursor-pointer"
        >
          {notes}
        </button>
      )}
    </div>
  );
};

export default InvoiceNotesPanel;
