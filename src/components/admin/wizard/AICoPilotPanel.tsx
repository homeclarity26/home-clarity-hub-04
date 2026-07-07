// AI Co-Pilot panel for the Step 3 authoring surface. Quick actions rewrite
// the active page narrative in place via ai-edit (expand / tighten / match
// brand voice) with a 10-second undo window. The free-form input sends a
// message to hbc-agent with the current page as enrichment context, and the
// reply lands in a preview the editor can append, replace, or discard.

import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getDraftObservationsPrompt } from "./copilot-prompts";

type AiMode = "expand" | "tighten" | "match_brand_voice";

// Loose typing for the Web Speech API — TS lib doesn't ship its types,
// and the only fields we touch are these.
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<{ readonly 0: { transcript: string }; readonly isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

interface AICoPilotPanelProps {
  pageType: "room" | "system" | "vision" | "executive_summary" | "generic";
  pageTitle?: string;
  /** Granular page key (e.g. "roof-system", "kitchen") for smart prompt selection. */
  pageKey?: string;
  /** Current narrative text for the active page (sourced from authoring blocks). */
  narrative: string;
  /** Optional observations text for richer co-pilot context. */
  observations?: string;
  /** Replaces the narrative in the active page authoring blocks. */
  onUpdateNarrative: (next: string) => void;
  /** Property id (used as enrichment context for hbc-agent). */
  propertyId?: string | null;
}

const QUICK_ACTIONS: Array<{ mode: AiMode; label: string; doingLabel: string }> = [
  { mode: "expand", label: "Expand narrative", doingLabel: "Expanding..." },
  { mode: "tighten", label: "Tighten narrative", doingLabel: "Tightening..." },
  { mode: "match_brand_voice", label: "Match brand voice", doingLabel: "Adjusting voice..." },
];

const UNDO_WINDOW_MS = 10_000;

export function AICoPilotPanel({
  pageType,
  pageTitle,
  pageKey,
  narrative,
  observations,
  onUpdateNarrative,
  propertyId,
}: AICoPilotPanelProps) {
  const { user } = useAuth();
  const [working, setWorking] = useState<AiMode | "freeform" | null>(null);
  const [previousNarrative, setPreviousNarrative] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  // Web Speech API state for voice-to-text on the prompt textarea.
  // Browser-only, no backend needed. Chrome and Edge support out of
  // the box; Safari/Firefox surface an empty constructor and we toast
  // a helpful message.
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Stop any in-flight voice recognition on unmount so it doesn't keep
  // running after the consultant navigates to a different page.
  useEffect(
    () => () => {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    },
    [],
  );

  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast({
        title: "Voice input not supported",
        description: "Try Chrome or Edge for voice input on this textarea.",
        variant: "destructive",
      });
      return;
    }
    if (listening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = 0; i < e.results.length; i += 1) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript + " ";
      }
      if (chunk.trim()) {
        setPrompt((p) => (p ? p + " " + chunk.trim() : chunk.trim()));
      }
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.onerror = (e) => {
      setListening(false);
      recognitionRef.current = null;
      // "no-speech" fires routinely when the user pauses; don't bother them.
      if (e.error && e.error !== "no-speech" && e.error !== "aborted") {
        toast({ title: "Voice input error", description: e.error, variant: "destructive" });
      }
    };
    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      // start() throws "InvalidStateError" if already running — surface
      // gracefully so a double-click doesn't crash the panel.
      setListening(false);
      recognitionRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
    [],
  );

  // Reset transient panel state when the active page changes.
  useEffect(() => {
    setReply(null);
    setPrompt("");
    setPreviousNarrative(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [pageTitle]);

  const armUndo = (prior: string) => {
    setPreviousNarrative(prior);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setPreviousNarrative(null);
      undoTimerRef.current = null;
    }, UNDO_WINDOW_MS);
  };

  const runMode = async (mode: AiMode) => {
    if (working) return;
    if (!narrative.trim()) {
      toast({
        title: "Add a narrative first",
        description: "Write a sentence or two in the narrative, then try " + mode + " again.",
      });
      return;
    }
    setWorking(mode);
    const prior = narrative;
    try {
      const { data, error } = await supabase.functions.invoke("ai-edit", {
        body: { mode, text: narrative },
      });
      if (error) throw error;
      const nextText = typeof data?.text === "string" ? data.text : null;
      if (!nextText) throw new Error("AI response missing 'text' field");

      // Em-dash sanity check on match_brand_voice per Master Plan B14.
      if (mode === "match_brand_voice" && nextText.includes("—")) {
        toast({
          title: "Brand voice produced an em-dash",
          description: "Brand voice forbids em-dashes. Click again to retry.",
          variant: "destructive",
        });
        return;
      }

      onUpdateNarrative(nextText);
      armUndo(prior);
      toast({
        title:
          mode === "expand"
            ? "Narrative expanded"
            : mode === "tighten"
            ? "Narrative tightened"
            : "Brand voice applied",
        description: "Click Undo within 10 seconds to revert.",
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

  const undoNarrative = () => {
    if (previousNarrative == null) return;
    onUpdateNarrative(previousNarrative);
    setPreviousNarrative(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    toast({ title: "Reverted to previous narrative" });
  };

  const askCoPilot = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || working) return;
    setWorking("freeform");
    setReply(null);
    try {
      const enrichmentParts: string[] = [];
      if (pageTitle) enrichmentParts.push(`Page title: ${pageTitle}`);
      enrichmentParts.push(`Page type: ${pageType}`);
      if (narrative) enrichmentParts.push(`Current narrative:\n${narrative}`);
      if (observations) enrichmentParts.push(`Observations:\n${observations}`);
      const enrichment = enrichmentParts.join("\n\n");

      const { data, error } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: trimmed,
          history: [],
          context: {
            userId: user?.id || "",
            role: "creator",
            currentPage: typeof window !== "undefined" ? window.location.pathname : "/admin/clients/new",
            currentEntityType: "report_page",
            currentEntityName: pageTitle || "",
            propertyId: propertyId || "",
            enrichment,
          },
          confirm_action: false,
        },
      });
      if (error) throw error;
      const replyText = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!replyText) {
        toast({
          title: "Co-pilot completed",
          description: "No text reply. Try a more specific question.",
        });
        return;
      }
      setReply(replyText);
    } catch (err: unknown) {
      let detail = err instanceof Error ? err.message : "Unknown error";
      try {
        const resp = (err as { context?: { response?: { text?: () => Promise<string> } } })
          ?.context?.response;
        if (resp && typeof resp.text === "function") {
          const bodyText = await resp.text();
          if (bodyText) {
            try {
              const parsed = JSON.parse(bodyText);
              detail = parsed.error || parsed.reply || parsed.message || bodyText.slice(0, 300);
            } catch {
              detail = bodyText.slice(0, 300);
            }
          }
        }
      } catch {
        /* fall back to err.message */
      }
      toast({
        title: "Co-pilot request failed",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  const appendReply = () => {
    if (!reply) return;
    const prior = narrative;
    const next = narrative.trim() ? narrative.trim() + "\n\n" + reply : reply;
    onUpdateNarrative(next);
    armUndo(prior);
    setReply(null);
    setPrompt("");
    toast({
      title: "Appended to narrative",
      description: "Click Undo within 10 seconds to revert.",
    });
  };

  const replaceWithReply = () => {
    if (!reply) return;
    const prior = narrative;
    onUpdateNarrative(reply);
    armUndo(prior);
    setReply(null);
    setPrompt("");
    toast({
      title: "Narrative replaced",
      description: "Click Undo within 10 seconds to revert.",
    });
  };

  const isWorking = working !== null;

  // Dark navy co-pilot panel per prototype screen 12: gold eyebrow, white
  // question line, gold WATCHING YOUR EDITS chip, one-tap action chips
  // (first chip gold-highlighted as the primary), and a RESULT area for
  // the freeform reply.
  const darkChip =
    "min-h-[40px] rounded-sm border border-white/25 bg-white/5 px-3 text-xs font-sans text-white/90 hover:bg-white/10 hover:text-white";
  const goldChip =
    "min-h-[40px] rounded-sm border border-transparent bg-hbc-gold px-3 text-xs font-sans text-white hover:bg-[hsl(var(--hbc-gold)/0.92)]";

  return (
    <div className="rounded-lg bg-hbc-navy p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold">
            AI Co-Pilot
          </div>
          <h4 className="text-sm font-sans font-semibold text-white mt-1">
            What can I do for this page?
          </h4>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-sm bg-hbc-gold px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
          Watching Your Edits
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ mode, label, doingLabel }, i) => (
          <button
            key={mode}
            type="button"
            onClick={() => void runMode(mode)}
            disabled={isWorking || !narrative.trim()}
            className={`${i === 0 ? goldChip : darkChip} disabled:opacity-50 disabled:pointer-events-none`}
          >
            {working === mode && (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 inline animate-spin" aria-hidden />
            )}
            {working === mode ? doingLabel : label}
          </button>
        ))}
        {pageType !== "executive_summary" && (
          <button
            type="button"
            onClick={() => setPrompt(getDraftObservationsPrompt(pageKey ?? ""))}
            disabled={isWorking}
            className={`${darkChip} disabled:opacity-50 disabled:pointer-events-none`}
          >
            Draft observations
          </button>
        )}
        {previousNarrative != null && !isWorking && (
          <button
            type="button"
            onClick={undoNarrative}
            className={darkChip}
          >
            Undo
          </button>
        )}
      </div>
      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Ask the co-pilot something specific (it can see this page's title and narrative)..."
          className="text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40"
          disabled={isWorking}
        />
        <div className="flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            disabled={isWorking}
            className={`${listening ? "min-h-[40px] rounded-sm bg-destructive px-3 text-xs font-sans text-white" : darkChip} disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5`}
            title={listening ? "Stop listening" : "Talk to the co-pilot"}
            aria-pressed={listening}
          >
            {listening ? (
              <MicOff className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Mic className="w-3.5 h-3.5" aria-hidden />
            )}
            {listening ? "Listening..." : "Voice"}
          </button>
          <button
            type="button"
            disabled={!prompt.trim() || isWorking}
            onClick={() => void askCoPilot()}
            className={`${goldChip} disabled:opacity-50 disabled:pointer-events-none inline-flex items-center`}
          >
            {working === "freeform" && (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden />
            )}
            {working === "freeform" ? "Asking..." : "Send"}
          </button>
        </div>
      </div>
      {reply && (
        <div className="space-y-2 rounded-md border border-white/15 bg-white/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold">
            Result
          </div>
          <p className="text-xs font-sans text-white/90 whitespace-pre-line leading-relaxed">
            {reply}
          </p>
          <div className="flex justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setReply(null)}
              className="min-h-[36px] px-2 text-xs font-sans text-white/60 hover:text-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={replaceWithReply}
              className={`${darkChip} min-h-[36px]`}
            >
              Replace narrative
            </button>
            <button
              type="button"
              onClick={appendReply}
              className={`${goldChip} min-h-[36px]`}
            >
              Append to narrative
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
