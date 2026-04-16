import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SanitizedHtml } from "@/components/ui/SanitizedHtml";

interface AIEditPanelProps {
  currentContent: string;
  contentType?: string;
  onApply: (newContent: string) => void;
  onDiscard: () => void;
}

const AI_EDIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-edit`;

const AIEditPanel = ({ currentContent, contentType, onApply, onDiscard }: AIEditPanelProps) => {
  const [instruction, setInstruction] = useState("");
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setIsLoading(true);
    setEditedContent(null);

    try {
      const resp = await fetch(AI_EDIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ currentContent, instruction: instruction.trim(), contentType }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) toast.error("Rate limited. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error(err.error || "AI edit failed");
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setEditedContent(data.editedContent || "");
    } catch (e) {
      console.error("AI edit error:", e);
      toast.error("Failed to generate edit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-accent/30 rounded-lg bg-card p-4 space-y-3 shadow-lg">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent font-medium">AI Edit</p>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. Make this more concise, add urgency, rewrite for a technical audience..."
        className="w-full h-20 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors font-sans resize-none"
        disabled={isLoading}
      />

      {!editedContent && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={!instruction.trim() || isLoading} className="gap-1.5 text-xs">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Generate
          </Button>
          <Button variant="ghost" size="sm" onClick={onDiscard} className="text-xs text-muted-foreground">
            Cancel
          </Button>
        </div>
      )}

      {editedContent !== null && (
        <div className="space-y-3">
          <div className="border border-border rounded-md p-3 bg-background max-h-48 overflow-y-auto">
            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Preview</p>
            <SanitizedHtml html={editedContent} className="text-sm text-foreground font-sans leading-relaxed" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onApply(editedContent)} className="gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5" /> Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditedContent(null); setInstruction(""); }} className="text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5 mr-1" /> Try Again
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscard} className="text-xs text-muted-foreground">
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEditPanel;
