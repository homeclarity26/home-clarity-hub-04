import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Edge-function modes per Master Spec 5.4.3 / Master Plan B14 + E3.
// E3 extends ai-edit to handle these. If E3 hasn't shipped yet the call
// returns an error and the user sees a toast — non-fatal.
type AiMode = "expand" | "tighten" | "match_brand_voice";

interface AIExpandTightenFieldProps {
  /** Current value (HTML or plain text) */
  value: string;
  /** Called with the new value when AI returns or user undoes */
  onChange: (next: string) => void;
  /** Number of textarea rows to render */
  rows?: number;
  /** Placeholder when empty */
  placeholder?: string;
  /** Optional label / eyebrow above the textarea */
  label?: string;
  /** Show the optional Match brand voice button (default true) */
  showMatchBrandVoice?: boolean;
  /** Optional className applied to the wrapper */
  className?: string;
}

const wordCount = (s: string) =>
  s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;

const UNDO_WINDOW_MS = 10_000;

const AIExpandTightenField = ({
  value,
  onChange,
  rows = 5,
  placeholder = "Write a seed sentence, then click Expand to grow it.",
  label,
  showMatchBrandVoice = true,
  className,
}: AIExpandTightenFieldProps) => {
  const [working, setWorking] = useState<AiMode | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear undo state when component unmounts
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const armUndo = (priorValue: string) => {
    setPreviousValue(priorValue);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setPreviousValue(null);
      undoTimerRef.current = null;
    }, UNDO_WINDOW_MS);
  };

  const callAi = async (mode: AiMode) => {
    if (working) return; // already running
    if (!value.trim()) {
      toast({
        title: "Nothing to adjust",
        description: "Add some text first, then click " + mode + ".",
      });
      return;
    }

    setWorking(mode);
    const priorValue = value;

    try {
      const { data, error } = await supabase.functions.invoke("ai-edit", {
        body: { mode, text: value },
      });

      if (error) throw error;
      if (!data || typeof data.text !== "string") {
        throw new Error("AI response missing 'text' field");
      }

      let nextText = data.text as string;

      // Em-dash sanity check on match_brand_voice — non-negotiable per
      // Master Plan B14. If the model returns text with an em-dash, do
      // NOT auto-replace; show toast and bail (user can retry).
      if (mode === "match_brand_voice" && nextText.includes("—")) {
        toast({
          title: "Match brand voice produced an em-dash",
          description: "Brand voice forbids em-dashes. Click again to retry.",
          variant: "destructive",
        });
        return;
      }

      onChange(nextText);
      armUndo(priorValue);

      const before = wordCount(priorValue);
      const after = wordCount(nextText);
      toast({
        title: mode === "expand"
          ? "Expanded"
          : mode === "tighten"
          ? "Tightened"
          : "Brand voice applied",
        description: `Replaced ${before} words with ${after} words. Undo within 10 seconds.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI call failed";
      toast({
        title: "AI " + mode + " failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  const undo = () => {
    if (previousValue == null) return;
    onChange(previousValue);
    setPreviousValue(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    toast({ title: "Reverted to previous text" });
  };

  return (
    <div className={className}>
      {label && (
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground block mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-card border border-border rounded-md p-3 text-sm text-foreground outline-none focus:border-foreground resize-y ${
          working ? "opacity-60 cursor-wait" : ""
        }`}
        rows={rows}
        value={value}
        readOnly={!!working}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="mt-2 flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={() => callAi("expand")}
          disabled={!!working}
          className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working === "expand" ? "Expanding..." : "Expand"}
        </button>
        <button
          type="button"
          onClick={() => callAi("tighten")}
          disabled={!!working}
          className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working === "tighten" ? "Tightening..." : "Tighten"}
        </button>
        {showMatchBrandVoice && (
          <button
            type="button"
            onClick={() => callAi("match_brand_voice")}
            disabled={!!working}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {working === "match_brand_voice" ? "Adjusting..." : "Match brand voice"}
          </button>
        )}
        {previousValue != null && !working && (
          <button
            type="button"
            onClick={undo}
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground"
          >
            ← Undo
          </button>
        )}
        {working && (
          <span className="text-xs italic text-muted-foreground">Adjusting...</span>
        )}
      </div>
    </div>
  );
};

export default AIExpandTightenField;
