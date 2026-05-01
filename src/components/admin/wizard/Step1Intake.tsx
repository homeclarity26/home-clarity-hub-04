import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle, Link as LinkIcon, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard, type IntakeFinding, type ClarifyingQuestion } from "@/contexts/WizardContext";
import { IntakeUploadCard } from "./IntakeUploadCard";
import { FieldChecklist } from "./FieldChecklist";
import { AIClarifyingQuestions } from "./AIClarifyingQuestions";
import { WizardNavigation } from "./WizardNavigation";
import AddressAutocomplete, { type PropertyData } from "@/components/admin/AddressAutocomplete";

// Step 1 — Intake. Three zones:
//   A. Client & property
//   B. Brain dump — one drop zone for any file type, two URL inputs for
//      Hover/iGUIDE share links, "Anything else?" textarea, Field Checklist
//   C. AI findings (6 cards) + clarifying questions
//
// All file uploads land in `intakeUploads.transcript` regardless of type;
// the legacy bucketed shape (transcript/site_notes/photos/hover/iguide) is
// preserved in WizardContext so existing drafts hydrate without loss.
// intakeFilesPayload spreads all five buckets so any file from any source
// reaches the AI.
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
    setHoverUrl,
    setIguideUrl,
    setFindings,
    setClarifyingQuestions,
    answerClarifyingQuestion,
    setFieldChecklist,
    goToStep,
  } = useWizard();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftingNotes, setDraftingNotes] = useState(false);

  // RentCast PropertyType strings → our dropdown values. RentCast surfaces
  // human-readable strings ("Single Family", "Condominium") whereas the
  // dropdown stores snake_case keys. Anything we don't recognize falls
  // through to "other" so the user can override manually.
  const mapRentCastPropertyType = (raw?: string): string => {
    if (!raw) return "";
    const s = raw.toLowerCase();
    if (s.includes("single") && s.includes("family")) return "single_family";
    if (s.includes("multi") && s.includes("family")) return "multi_family";
    if (s.includes("condo")) return "condo";
    if (s.includes("town")) return "townhouse";
    return "other";
  };

  // Debounced check: warn if a published report already exists at this address
  useEffect(() => {
    const address = state.client.address.trim();
    if (address.length < 5) { setDuplicateWarning(false); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, reports(id, status)")
        .ilike("address", address);
      const found = data?.some(
        (p) => Array.isArray(p.reports) && p.reports.some((r: { id: string; status: string }) => r.status === "published")
      );
      setDuplicateWarning(Boolean(found));
    }, 600);
    return () => clearTimeout(timer);
  }, [state.client.address]);

  // Build a single block of "meeting notes" from all the freeform sources
  // we have in state. seed-report-from-notes (E7) takes a single string for
  // free-form text plus an optional `intake_files` array of upload refs that
  // the edge function downloads from storage so Claude reads them inline.
  const aggregatedNotes = useMemo(() => {
    const lines: string[] = [];
    if (state.client.discoveryNotes) {
      lines.push(`Discovery notes:\n${state.client.discoveryNotes}`);
    }
    if (state.anythingElse) {
      lines.push(`Anything else:\n${state.anythingElse}`);
    }
    return lines.join("\n\n");
  }, [state.client.discoveryNotes, state.anythingElse]);

  // Storage refs the edge function will fetch + base64 inline for Claude.
  // Spreads ALL five legacy buckets so brain-dump uploads (which land in
  // `transcript`) plus anything still sitting in older draft buckets all
  // reach the AI. Hover/iGuide file exports were previously dropped on the
  // floor here — fixed as part of the brain-dump consolidation.
  const intakeFilesPayload = useMemo(() => {
    const refs = [
      ...state.intakeUploads.transcript,
      ...state.intakeUploads.site_notes,
      ...state.intakeUploads.photos,
      ...state.intakeUploads.hover,
      ...state.intakeUploads.iguide,
    ];
    return refs
      .filter((f) => Boolean(f.storage_path) && Boolean(f.bucket))
      .map((f) => ({
        name: f.name,
        storage_path: f.storage_path,
        bucket: f.bucket,
        mime: f.mime,
      }));
  }, [state.intakeUploads]);

  // MIME-bucketed counts for the type-pill summary above the drop zone.
  // Display-only; the underlying file list stays a single flat array.
  const fileTypeCounts = useMemo(() => {
    const counts = { documents: 0, photos: 0, audio: 0, video: 0, other: 0 };
    for (const f of intakeFilesPayload) {
      if (f.mime.startsWith("image/")) counts.photos++;
      else if (f.mime.startsWith("audio/")) counts.audio++;
      else if (f.mime.startsWith("video/")) counts.video++;
      else if (
        f.mime === "application/pdf" ||
        f.mime.includes("document") ||
        f.mime.includes("msword") ||
        f.mime.startsWith("text/")
      ) counts.documents++;
      else counts.other++;
    }
    return counts;
  }, [intakeFilesPayload]);

  const hasAnyIntake = aggregatedNotes.trim().length > 0 || intakeFilesPayload.length > 0;

  const allClarifyingAnswered =
    state.clarifyingQuestions.length === 0 ||
    state.clarifyingQuestions.every((q) => Boolean(state.clarifyingAnswers[q.id]));

  const canContinue =
    Boolean(state.client.fullName) &&
    Boolean(state.client.email) &&
    allClarifyingAnswered &&
    !analyzing;

  const runAIAnalysis = async () => {
    if (!hasAnyIntake) {
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
      // The edge function takes a non-empty `meeting_notes` string. When a
      // consultant uploads files only (no freeform notes), we still need to
      // satisfy that contract — the actual content comes from intake_files.
      const notesForAI =
        aggregatedNotes.trim().length > 0
          ? aggregatedNotes
          : `Read the attached documents. They contain the discovery and walkthrough notes for this client.`;

      // Stage 1 — clarifying questions.
      const { data: qData, error: qErr } = await supabase.functions.invoke(
        "seed-report-from-notes",
        {
          body: {
            meeting_notes: notesForAI,
            intake_files: intakeFilesPayload,
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
            meeting_notes: notesForAI,
            intake_files: intakeFilesPayload,
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

  // Google Places resolved a structured address. Save the city/state/zip/
  // county fields the wizard will need at publish time so the property row
  // gets clean data instead of a free-typed string.
  const handleAddressParsed = (parsed: {
    address: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    lat?: number;
    lng?: number;
  }) => {
    setClient({
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      county: parsed.county,
    });
  };

  // RentCast returned property facts. Fill any field that isn't already set
  // by the consultant — never overwrite a value they typed in. Skips empty
  // RentCast fields silently.
  const handlePropertyDataFetched = (data: PropertyData) => {
    const patch: Partial<typeof state.client> = {};
    if (data.yearBuilt && !state.client.yearBuilt) patch.yearBuilt = String(data.yearBuilt);
    if (data.sqft && !state.client.sqft) patch.sqft = String(data.sqft);
    if (data.bedrooms && !state.client.bedrooms) patch.bedrooms = String(data.bedrooms);
    if (data.bathrooms && !state.client.bathrooms) patch.bathrooms = String(data.bathrooms);
    const mappedType = mapRentCastPropertyType(data.propertyType);
    if (mappedType && !state.client.propertyType) patch.propertyType = mappedType;
    if (Object.keys(patch).length === 0) {
      toast({ title: "Already filled in", description: "Every field RentCast knows is already set." });
      return;
    }
    setClient(patch);
    toast({ title: "Property data filled", description: `Populated ${Object.keys(patch).length} field${Object.keys(patch).length !== 1 ? "s" : ""} from RentCast.` });
  };

  // "Draft from transcript" button — reads the uploaded transcripts via
  // seed-report-from-notes (draft_notes_only mode) and fills or appends to
  // the Discovery notes textarea. Empty textarea gets the draft as-is;
  // existing text gets the AI draft appended below a divider so the
  // consultant can keep what they wrote.
  const draftDiscoveryNotes = async () => {
    if (intakeFilesPayload.length === 0) {
      toast({
        title: "Upload a transcript first",
        description: "Drop the discovery transcript or notes into the Files zone, then try again.",
        variant: "destructive",
      });
      return;
    }
    setDraftingNotes(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "seed-report-from-notes",
        {
          body: {
            meeting_notes: "Draft a discovery notes summary from the attached materials.",
            intake_files: intakeFilesPayload,
            draft_notes_only: true,
          },
        },
      );
      if (error) throw error;
      const draft = typeof data?.discovery_notes_draft === "string" ? data.discovery_notes_draft.trim() : "";
      if (!draft) {
        toast({ title: "AI returned an empty draft", description: "Try again, or write the notes yourself.", variant: "destructive" });
        return;
      }
      const existing = state.client.discoveryNotes.trim();
      const next = existing.length === 0
        ? draft
        : `${existing}\n\n---\nAI draft from transcript:\n${draft}`;
      setClient({ discoveryNotes: next });
      toast({ title: "Discovery notes drafted", description: "Edit freely; the AI saw the same files you uploaded." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Draft failed", description: message, variant: "destructive" });
    } finally {
      setDraftingNotes(false);
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
            <AddressAutocomplete
              value={state.client.address}
              onChange={(address) => setClient({ address })}
              onAddressParsed={handleAddressParsed}
              onPropertyDataFetched={handlePropertyDataFetched}
            />
            {duplicateWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>A report already exists for this address. Starting a new one will create a separate record.</span>
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <Label className="text-xs font-sans">Discovery notes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={draftDiscoveryNotes}
                disabled={draftingNotes || intakeFilesPayload.length === 0}
                className="h-8 text-[11px] gap-1.5"
                title={
                  intakeFilesPayload.length === 0
                    ? "Upload a transcript first"
                    : "Draft notes from the transcript"
                }
              >
                {draftingNotes ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" aria-hidden />
                )}
                {draftingNotes ? "Drafting..." : "Draft from transcript"}
              </Button>
            </div>
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

      {/* Zone B — Brain dump */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-sans font-semibold text-foreground">
            Intake materials
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            Drop everything here. Transcripts, site notes, photos, voice
            memos, Hover or iGUIDE exports — any file type. We will sort
            them when the AI runs.
          </p>
        </div>

        {(fileTypeCounts.documents +
          fileTypeCounts.photos +
          fileTypeCounts.audio +
          fileTypeCounts.video +
          fileTypeCounts.other) > 0 && (
          <div className="flex flex-wrap gap-2">
            {fileTypeCounts.documents > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                {fileTypeCounts.documents} document{fileTypeCounts.documents !== 1 ? "s" : ""}
              </Badge>
            )}
            {fileTypeCounts.photos > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                {fileTypeCounts.photos} photo{fileTypeCounts.photos !== 1 ? "s" : ""}
              </Badge>
            )}
            {fileTypeCounts.audio > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                {fileTypeCounts.audio} audio
              </Badge>
            )}
            {fileTypeCounts.video > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                {fileTypeCounts.video} video
              </Badge>
            )}
            {fileTypeCounts.other > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                {fileTypeCounts.other} other
              </Badge>
            )}
          </div>
        )}

        <IntakeUploadCard
          title="Files"
          description="Drag in any file type. We auto-detect documents vs photos vs audio."
          cardKey="transcript"
          files={state.intakeUploads.transcript}
          onChange={(files) => setIntakeUploads("transcript", files)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              Hover share URL
            </Label>
            <Input
              type="url"
              value={state.hoverUrl}
              onChange={(e) => setHoverUrl(e.target.value)}
              placeholder="https://hover.to/..."
              className="text-xs"
            />
            {state.hoverUrl && (
              <a
                href={state.hoverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-accent hover:underline break-all"
              >
                Open link →
              </a>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              iGUIDE share URL
            </Label>
            <Input
              type="url"
              value={state.iguideUrl}
              onChange={(e) => setIguideUrl(e.target.value)}
              placeholder="https://youriguide.com/..."
              className="text-xs"
            />
            {state.iguideUrl && (
              <a
                href={state.iguideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-accent hover:underline break-all"
              >
                Open link →
              </a>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-sans">Anything else?</Label>
          <Textarea
            value={state.anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            rows={3}
            placeholder="Things the AI should know that did not land in a file or URL above."
            className="text-xs"
          />
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
