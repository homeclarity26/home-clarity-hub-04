import { useState, useRef } from "react";
import { Sparkles, Send, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SanitizedHtml } from "@/components/ui/SanitizedHtml";

/**
 * PageAIChat — Inline AI editing assistant for individual report pages.
 *
 * Shown at the bottom of each ReportPage in edit mode. The admin can type
 * natural-language instructions like "Make this more urgent", "Add a note
 * about the rust on the south side", etc. The AI edits the page's narrative
 * and the admin can apply or reject.
 *
 * This is different from the global command bar — it's page-scoped and edits
 * the page content directly.
 */
interface PageAIChatProps {
  pageTitle: string;
  dbPageId?: string;
  currentNarrative?: string;
  onNarrativeUpdate?: (newNarrative: string) => void;
}

const QUICK_PROMPTS = [
  "Make this more detailed",
  "Add urgency — this needs attention soon",
  "Simplify for a homeowner audience",
  "Add maintenance recommendations",
  "Make the tone more professional",
];

export function PageAIChat({
  pageTitle,
  dbPageId,
  currentNarrative,
  onNarrativeUpdate,
}: PageAIChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (instruction: string) => {
    if (!instruction.trim() || !dbPageId) return;
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-edit", {
        body: {
          currentContent: currentNarrative || "",
          instruction: instruction.trim(),
          contentType: "narrative",
        },
      });

      if (error) throw error;

      const edited = data?.editedContent;
      if (edited) {
        setResult(edited);
      } else {
        toast.error("AI returned an empty response. Try rephrasing.");
      }
    } catch (err: unknown) {
      console.error("PageAIChat error:", err);
      toast.error("AI edit failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result || !dbPageId) return;

    try {
      // Save the edited narrative to the DB
      const { error } = await supabase
        .from("report_pages")
        .update({ narrative: [result] })
        .eq("id", dbPageId);

      if (error) throw error;

      onNarrativeUpdate?.(result);
      toast.success("Narrative updated");
      setResult(null);
      setInput("");
    } catch (err) {
      console.error("Apply error:", err);
      toast.error("Failed to save. Try again.");
    }
  };

  const handleReject = () => {
    setResult(null);
  };

  return (
    <div className="border-t border-border pt-6 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          AI Edit — {pageTitle}
        </p>
      </div>

      {/* Quick prompt chips */}
      {!result && !isLoading && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSubmit(prompt)}
              className="px-2.5 py-1 rounded-full bg-muted text-[11px] font-sans text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors border-none cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      {!result && (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            placeholder={`Tell the AI how to edit this page — e.g., "Add details about the water staining near the chimney flashing"`}
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
          />
          <Button
            size="sm"
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 p-0 shrink-0 bg-accent hover:bg-accent/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <span className="font-sans text-sm text-muted-foreground">
            Editing {pageTitle}...
          </span>
        </div>
      )}

      {/* Result preview + apply/reject */}
      {result && (
        <div className="space-y-3">
          <div className="border border-accent/30 rounded-lg p-4 bg-accent/5 max-h-64 overflow-y-auto">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent mb-2">
              AI Suggestion
            </p>
            <SanitizedHtml
              html={result}
              className="text-sm text-foreground font-sans leading-relaxed prose prose-sm max-w-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApply}
              className="gap-1.5 text-xs bg-accent hover:bg-accent/90"
            >
              <Check className="h-3.5 w-3.5" /> Apply to page
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
