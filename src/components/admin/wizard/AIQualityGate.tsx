import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard, type QualityGateAck } from "@/contexts/WizardContext";

// AI quality gate that fronts Step 5 — Publish. Runs consistency-check on
// mount, renders pre_publish_questions; severity:high questions block
// Publish until acknowledged. Acknowledgments persist on
// properties.qa_acknowledgments JSONB (per Master Spec 5.4.4).

type Severity = "high" | "medium" | "low";

interface PrePublishQuestion {
  id: string;
  severity: Severity;
  question: string;
  page_key?: string;
  actions: { id: string; label: string }[];
}

const SEVERITY_META: Record<Severity, { label: string; tone: string; Icon: typeof AlertCircle }> = {
  high: {
    label: "Blocking",
    tone: "text-destructive",
    Icon: AlertTriangle,
  },
  medium: {
    label: "Recommended",
    tone: "text-[hsl(var(--hbc-gold-readable))]",
    Icon: AlertCircle,
  },
  low: {
    label: "Optional",
    tone: "text-muted-foreground",
    Icon: AlertCircle,
  },
};

interface AIQualityGateProps {
  onAllHighsAcknowledged: (ok: boolean) => void;
}

export function AIQualityGate({
  onAllHighsAcknowledged,
}: AIQualityGateProps) {
  const { state, acknowledgeQuestion } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PrePublishQuestion[]>([]);
  const [noteByQuestion, setNoteByQuestion] = useState<Record<string, string>>({});

  // Run consistency-check on mount.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build a lightweight pages payload from the wizard's authoring map.
        const pages = Object.values(state.authoring).map((a) => {
          const blocks = (a.content as Array<Record<string, unknown>>) ?? [];
          const narrative = blocks
            .filter((b) => b.type === "narrative")
            .map((b) => String(b.value ?? ""))
            .join("\n\n");
          return {
            page_key: a.page_key,
            title: a.page_key,
            narrative,
            specs: {},
            photos: [],
          };
        });
        const { data, error: cErr } = await supabase.functions.invoke(
          "consistency-check",
          { body: { pages } },
        );
        if (cErr) throw cErr;
        if (cancelled) return;
        const raw = (data?.pre_publish_questions ?? []) as unknown[];
        const parsed = raw
          .filter(
            (q): q is PrePublishQuestion =>
              typeof q === "object" &&
              q !== null &&
              typeof (q as PrePublishQuestion).id === "string" &&
              typeof (q as PrePublishQuestion).question === "string",
          )
          .map((q) => ({
            ...q,
            severity: (["high", "medium", "low"] as Severity[]).includes(
              q.severity,
            )
              ? q.severity
              : ("medium" as Severity),
          }));
        setQuestions(parsed);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Run-once on entry; the wizard never re-enters this without a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acknowledgedIds = new Set(
    state.qaAcknowledgments.map((a) => a.question_id),
  );
  const highQuestions = questions.filter((q) => q.severity === "high");
  const allHighsOk =
    highQuestions.length === 0 ||
    highQuestions.every((q) => acknowledgedIds.has(q.id));

  // Surface the gate state up to the parent (Step5Publish) so Publish
  // can be enabled/disabled.
  useEffect(() => {
    onAllHighsAcknowledged(allHighsOk);
  }, [allHighsOk, onAllHighsAcknowledged]);

  const persistAck = async (ack: QualityGateAck) => {
    if (!state.propertyId) return;
    try {
      const next = [
        ...state.qaAcknowledgments.filter((a) => a.question_id !== ack.question_id),
        ack,
      ];
      const { error: pErr } = await supabase
        .from("properties")
        .update({ qa_acknowledgments: next as never })
        .eq("id", state.propertyId);
      if (pErr) throw pErr;
    } catch (err) {
      // Non-fatal — local state still has the ack so the gate can pass.
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Could not persist acknowledgment",
        description: message,
        variant: "destructive",
      });
    }
  };

  const onAcknowledge = async (q: PrePublishQuestion) => {
    const ack: QualityGateAck = {
      question_id: q.id,
      acknowledged_at: new Date().toISOString(),
      note: noteByQuestion[q.id]?.trim() || undefined,
    };
    acknowledgeQuestion(ack);
    await persistAck(ack);
  };

  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-3 text-xs font-sans text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Running AI quality check...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-2 text-xs font-sans text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>Quality check failed: {error}</span>
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
          <span className="text-sm font-sans font-medium text-foreground">
            No pre-publish questions. You can publish.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-3">
      <div>
        <h4 className="text-sm font-sans font-semibold text-foreground">
          Pre-publish questions
        </h4>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          High-severity items block Publish until acknowledged.
        </p>
      </div>
      <ul className="space-y-3">
        {questions.map((q) => {
          const meta = SEVERITY_META[q.severity];
          const Icon = meta.Icon;
          const isAck = acknowledgedIds.has(q.id);
          return (
            <li
              key={q.id}
              className="rounded-md border border-border bg-background px-4 py-3 space-y-2"
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.tone}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    {q.page_key && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {q.page_key}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-foreground">{q.question}</p>
                </div>
                {isAck && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3 h-3" aria-hidden />
                    Acknowledged
                  </span>
                )}
              </div>
              {!isAck && (
                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Optional note for the record"
                    value={noteByQuestion[q.id] ?? ""}
                    onChange={(e) =>
                      setNoteByQuestion((m) => ({ ...m, [q.id]: e.target.value }))
                    }
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void onAcknowledge(q)}
                      className="min-h-[40px]"
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
