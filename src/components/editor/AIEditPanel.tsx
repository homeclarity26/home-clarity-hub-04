import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SanitizedHtml } from "@/components/ui/SanitizedHtml";
import { supabase } from "@/integrations/supabase/client";

interface AIEditPanelProps {
  currentContent: string;
  contentType?: string;
  onApply: (newContent: string) => void;
  onDiscard: () => void;
}

const AIEditPanel = ({ currentContent, contentType, onApply, onDiscard }: AIEditPanelProps) => {
  const [instruction, setInstruction] = useState("");
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setIsLoading(true);
    setEditedContent(null);

    try {
      // Use supabase.functions.invoke so the user's JWT is sent automatically.
      // Previously this used raw fetch() with the anon key, which broke after
      // we added requireAuth to the edge function.
      const { data, error } = await supabase.functions.invoke("ai-edit", {
        body: { currentContent, instruction: instruction.trim(), contentType },
      });

      if (error) {
        toast.error("AI edit failed — please try again.");
        setIsLoading(false);
        return;
      }

      setEditedContent(data?.editedContent || "");
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
        placeholder="Describe the edit (e.g., 'make more concise', 'add urgency')"
        className="w-full p-2 border border-border rounded-md text-sm font-sans bg-background text-foreground resize-none min-h-[44px]"
        rows={2}
      />

      {!editedContent && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={isLoading || !instruction.trim()} className="gap-1.5 text-xs">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEditPanel;
