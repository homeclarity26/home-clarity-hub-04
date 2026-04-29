import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard, type IntakeFinding, type ClarifyingQuestion } from "@/contexts/WizardContext";
import { IntakeUploadCard } from "./IntakeUploadCard";
import { FieldChecklist } from "./FieldChecklist";
import { AIClarifyingQuestions } from "./AIClarifyingQuestions";
import { WizardNavigation } from "./WizardNavigation";

// Step 1 — Intake. Three zones per Master Spec 2.2:
//   A. Client & property
//   B. Multi-file intake cards (Transcript / Site Notes / Photos / Hover /
//      iGUIDE) + "Anything Else?" catchall + Field Checklist link
//   C. AI findings (6 cards) + clarifying questions
//
// Findings + clarifying questions come from seed-report-from-notes (E7).

const propertyTypes = [
  { value: "single_family", label: "Single-Family" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "other", label: "Other" },
];

const relationshipTypes = [
  { value: "premium", label: "Premium Membership" },
  { value: "standard", label: "Standard Membership" },
  { value: "trial", label: "Trial / One-time" },
];

const findingLabels: Record<IntakeFinding["category"], { title: string; helper: string }> = {
  spaces: {
    title: "Spaces",
    helper: "Rooms and exterior areas the AI heard discussed.",
  },
  systems_appliances: {
    title: "Systems & Appliances",
    helper: "HVAC, plumbing, electrical, water heater, appliances, etc.",
  },
  vision_projects: {
    title: "Vision Projects",
    helper: "Renovation or change-the-house ideas referenced.",
  },
  recurring_services: {
    title: "Recurring Services",
    helper: "Services the homeowner already pays for.",
  },
  family_priorities: {
    title: "Family Priorities",
    helper: "What matters most to the household right now.",
  },
  sequence_risk: {
    title: "Sequence Risk",
    helper: "Items the AI flagged as approaching end-of-life.",
  },
};

export function Step1Intake() {
  const {
    state,
    setClient,
    setIntakeUploads,
    setAnythingElse,
    setFindings,
    setClarifyingQuestions,
    answerClarifyingQuestion,
    setFieldChecklist,
    goToStep,
  } = useWizard();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Build a single block of "meeting notes" from all the freeform sources
  // we have in state. seed-report-from-notes (E7) takes a single string.
  const aggregatedNotes = useMemo(() => {
    const lines: string[] = [];
    if (state.client.discoveryNotes) {
      lines.push(`Discovery notes:\n${state.client.discoveryNotes}`);
    }
    if (state.anythingElse) {
      lines.push(`Anything else:\n${state.anythingElse}`);
    }
    const transcripts = state.intakeUploads.transcript
      .map((f) => `- ${f.name}`)
      .join("\n");
    if (transcripts) lines.push(`Transcript files:\n${transcripts}`);
    const siteNotes = state.intakeUploads.site_notes
      .map((f) => `- ${f.name}`)
      .join("\n");
    if (siteNotes) lines.push(`Site notes files:\n${siteNotes}`);
    return lines.join("\n\n");
  }, [state.client.discoveryNotes, state.anythingElse, state.intakeUploads]);

  const allClarifyingAnswered =
    state.clarifyingQuestions.length === 0 ||
    state.clarifyingQuestions.every((q) => Boolean(state.clarifyingAnswers[q.id]));

  const canContinue =
    Boolean(state.client.fullName) &&
    Boolean(state.client.email) &&
    allClarifyingAnswered &&
    !analyzing;

  const runAIAnalysis = async () => {
    if (!aggregatedNotes.trim()) {
      toast({
        title: "Add some intake first",
        description:
          "Drop a transcript, site notes, or write something in Anything Else.",
        variant: "destructive",
      });
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // Stage 1 — clarifying questions.
      const { data: qData, error: qErr } = await supabase.functions.invoke(
        "seed-report-from-notes",
        {
          body: {
            meeting_notes: aggregatedNotes,
            request_clarifying_questions: true,
          },
        },
      );
      if (qErr) throw qErr;
      const questions = parseQuestions(qData);
      setClarifyingQuestions(questions);

      // Stage 2 — full seed (page-level + 6 findings buckets when present).
      const { data: sData, error: sErr } = await supabase.functions.invoke(
        "seed-report-from-notes",
        {
          body: {
            meeting_notes: aggregatedNotes,
            clarifying_answers: state.clarifyingAnswers,
          },
        },
      );
      if (sErr) throw sErr;
      setFindings(parseFindings(sData));
      toast({
        title: "Intake analyzed",
        description: "Findings and clarifying questions are ready below.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAnalyzeError(message);
      toast({
        title: "AI analysis failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = async () => {
    await goToStep("toc");
  };

  return (
    <div className="space-y-6">
      {/* Zone A — Client & Property */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-base font-sans font-semibold text-foreground">
            Client & Property
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            Start with who and where. Everything else hangs off this row.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Full name *</Label>
            <Input
              value={state.client.fullName}
              onChange={(e) => setClient({ fullName: e.target.value })}
              placeholder="Mark and Jennifer Caldwell"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Email *</Label>
            <Input
              type="email"
              value={state.client.email}
              onChange={(e) => setClient({ email: e.target.value })}
              placeholder="jen@caldwell.com"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Phone</Label>
            <Input
              value={state.client.phone}
              onChange={(e) => setClient({ phone: e.target.value })}
              placeholder="(330) 555-0142"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Relationship type</Label>
            <Select
              value={state.client.relationshipType}
              onValueChange={(v) => setClient({ relationshipType: v })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-sans">Property address</Label>
            <Input
              value={state.client.address}
              onChange={(e) => setClient({ address: e.target.value })}
              placeholder="123 Maple Lane, Hudson, OH 44236"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Year built</Label>
            <Input
              value={state.client.yearBuilt}
              onChange={(e) => setClient({ yearBuilt: e.target.value })}
              placeholder="1998"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Sq ft</Label>
            <Input
              value={state.client.sqft}
              onChange={(e) => setClient({ sqft: e.target.value })}
              placeholder="3,400"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Bedrooms</Label>
            <Input
              value={state.client.bedrooms}
              onChange={(e) => setClient({ bedrooms: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Bathrooms</Label>
            <Input
              value={state.client.bathrooms}
              onChange={(e) => setClient({ bathrooms: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-sans">Property type</Label>
            <Select
              value={state.client.propertyType}
              onValueChange={(v) => setClient({ propertyType: v })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-sans">Discovery notes</Label>
            <Textarea
              value={state.client.discoveryNotes}
              onChange={(e) => setClient({ discoveryNotes: e.target.value })}
              rows={4}
              className="text-xs"
              placeholder="What you heard during the discovery call. The AI uses this when it seeds the report."
            />
          </div>
        </div>
      </Card>

      {/* Zone B — Multi-file intake cards */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-sans font-semibold text-foreground">
            Intake materials
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            Drop everything from the visit. Each card accepts multiple files,
            and we will sort by type later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IntakeUploadCard
            title="Transcript"
            description="Walkthrough recording or transcription. Any audio, video, document, or text source works."
            cardKey="transcript"
            files={state.intakeUploads.transcript}
            onChange={(files) => setIntakeUploads("transcript", files)}
          />
          <IntakeUploadCard
            title="Site notes"
            description="Field notes, scratch lists, voice memos. PDF, DOCX, MD, images, audio."
            cardKey="site_notes"
            files={state.intakeUploads.site_notes}
            onChange={(files) => setIntakeUploads("site_notes", files)}
          />
          <IntakeUploadCard
            title="Photos"
            description="Reference photos, condition shots, serial plates. JPG, PNG, HEIC."
            cardKey="photos"
            files={state.intakeUploads.photos}
            onChange={(files) => setIntakeUploads("photos", files)}
          />
          <IntakeUploadCard
            title="Hover"
            description="Hover capture exports and PDF reports."
            cardKey="hover"
            files={state.intakeUploads.hover}
            onChange={(files) => setIntakeUploads("hover", files)}
          />
          <IntakeUploadCard
            title="iGUIDE"
            description="iGUIDE walkthrough exports, floor plans."
            cardKey="iguide"
            files={state.intakeUploads.iguide}
            onChange={(files) => setIntakeUploads("iguide", files)}
          />
          <Card className="p-4 space-y-3">
            <div>
              <h4 className="text-sm font-sans font-semibold text-foreground">
                Anything else? Add more
              </h4>
              <p className="text-xs font-sans text-muted-foreground mt-0.5">
                Catchall for context that does not fit the cards above.
              </p>
            </div>
            <Textarea
              value={state.anythingElse}
              onChange={(e) => setAnythingElse(e.target.value)}
              rows={4}
              placeholder="Things the AI should know that did not land in a transcript or photo."
              className="text-xs"
            />
          </Card>
        </div>

        <FieldChecklist
          items={state.fieldChecklist}
          onChange={setFieldChecklist}
        />
      </Card>

      {/* Zone C — AI analysis */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-sans font-semibold text-foreground">
              AI analysis
            </h3>
            <p className="text-xs font-sans text-muted-foreground mt-1">
              When you have enough intake captured, run the analyzer. It
              returns six findings buckets plus clarifying questions.
            </p>
          </div>
          <Button
            type="button"
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="min-h-[44px]"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" aria-hidden />
            )}
            {analyzing ? "Analyzing..." : "Run AI analysis"}
          </Button>
        </div>

        {analyzeError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-sans text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>{analyzeError}</span>
          </div>
        )}

        {state.intakeFindings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.intakeFindings.map((finding) => {
              const meta = findingLabels[finding.category];
              return (
                <Card key={finding.category} className="p-4 space-y-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {meta?.title ?? finding.category}
                    </div>
                    <div className="text-sm font-sans font-semibold text-foreground">
                      {finding.title}
                    </div>
                    {meta?.helper && (
                      <p className="text-[11px] font-sans text-muted-foreground mt-1">
                        {meta.helper}
                      </p>
                    )}
                  </div>
                  {finding.bullets.length > 0 && (
                    <ul className="space-y-1 text-xs font-sans text-foreground">
                      {finding.bullets.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary" aria-hidden>
                            •
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <AIClarifyingQuestions
          questions={state.clarifyingQuestions}
          answers={state.clarifyingAnswers}
          onAnswer={answerClarifyingQuestion}
        />
      </Card>

      <WizardNavigation
        onNext={handleContinue}
        nextLabel="Approve and build TOC"
        nextDisabled={!canContinue}
        helperText={
          state.clarifyingQuestions.length > 0 && !allClarifyingAnswered
            ? "Answer or skip every clarifying question to continue."
            : null
        }
      />
    </div>
  );
}

// ─── Small parsers — keep schema-tolerant ────────────────────────────────

function parseQuestions(payload: unknown): ClarifyingQuestion[] {
  if (!payload || typeof payload !== "object") return [];
  const rec = payload as Record<string, unknown>;
  const raw = Array.isArray(rec.questions)
    ? rec.questions
    : Array.isArray((rec.data as Record<string, unknown> | undefined)?.questions)
      ? (rec.data as Record<string, unknown>).questions as unknown[]
      : [];
  const out: ClarifyingQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const id = typeof q.id === "string" ? q.id : null;
    const question = typeof q.question === "string" ? q.question : null;
    if (!id || !question) continue;
    const optionsRaw = Array.isArray(q.options) ? q.options : [];
    const options: { id: string; label: string }[] = [];
    for (const opt of optionsRaw) {
      if (!opt || typeof opt !== "object") continue;
      const oRec = opt as Record<string, unknown>;
      const oid = typeof oRec.id === "string" ? oRec.id : typeof oRec.value === "string" ? oRec.value : null;
      const label = typeof oRec.label === "string" ? oRec.label : typeof oRec.text === "string" ? oRec.text : null;
      if (oid && label) options.push({ id: oid, label });
    }
    if (options.length === 0) continue;
    out.push({ id, question, options, why: typeof q.why === "string" ? q.why : undefined });
  }
  return out;
}

function parseFindings(payload: unknown): IntakeFinding[] {
  if (!payload || typeof payload !== "object") return [];
  const rec = payload as Record<string, unknown>;
  const findingsRaw = (rec.findings ?? rec.summary ?? null) as Record<string, unknown> | null;
  const out: IntakeFinding[] = [];
  const categories: IntakeFinding["category"][] = [
    "spaces",
    "systems_appliances",
    "vision_projects",
    "recurring_services",
    "family_priorities",
    "sequence_risk",
  ];
  for (const cat of categories) {
    const entry = findingsRaw?.[cat];
    if (!entry) continue;
    if (typeof entry === "string") {
      out.push({ category: cat, title: entry, bullets: [] });
      continue;
    }
    if (typeof entry === "object") {
      const e = entry as Record<string, unknown>;
      const title = typeof e.title === "string" ? e.title : titleFor(cat);
      const bulletsRaw = Array.isArray(e.bullets)
        ? e.bullets
        : Array.isArray(e.items)
          ? e.items
          : [];
      const bullets = bulletsRaw.filter((b): b is string => typeof b === "string");
      out.push({ category: cat, title, bullets });
    }
  }
  return out;
}

function titleFor(cat: IntakeFinding["category"]): string {
  return findingLabels[cat]?.title ?? cat;
}
