import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard, type IntakeFinding, type ClarifyingQuestion, type PageSeed } from "@/contexts/WizardContext";
import { IntakeUploadCard } from "./IntakeUploadCard";
import { FieldChecklist } from "./FieldChecklist";
import { AIClarifyingQuestions } from "./AIClarifyingQuestions";
import { WizardNavigation } from "./WizardNavigation";
import { WizardStepHeader } from "./WizardShell";
import AddressAutocomplete, { type PropertyData } from "@/components/admin/AddressAutocomplete";

// Step 1 — Intake, prototype screens 1-4. Zones:
//   A. Client & property form (functional prerequisite; the prototype
//      assumes the client is already picked)
//   B. Six upload cards in a 2-col grid (Meeting Transcript / Site Notes /
//      Photos / Hover 3D Model / iGUIDE 360 Tour / Property Records)
//   C. Anything else + Field Checklist
//   D. Analysis band: READY TO ANALYZE → ANALYZING checklist →
//      REVIEW & APPROVE findings with the Approve & Build TOC CTA
//
// Each upload card maps 1:1 to its WizardContext bucket
// (transcript/site_notes/photos/hover/iguide); intakeFilesPayload spreads
// all five buckets so any file from any card reaches the AI.
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

const ANALYZING_CHECKLIST = [
  "Reading meeting transcript",
  "Parsing site notes",
  "Identifying spaces and rooms",
  "Cataloging systems and appliances",
  "Extracting vision projects",
  "Drafting findings",
];

interface Step1IntakeProps {
  /** Dev-only (QA harness): suppress on-mount network calls. */
  qaMode?: boolean;
}

export function Step1Intake({ qaMode = false }: Step1IntakeProps) {
  const {
    state,
    setClient,
    setIntakeUploads,
    setAnythingElse,
    setHoverUrl,
    setIguideUrl,
    setFindings,
    setPageSeeds,
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
    if (qaMode) return;
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
  }, [state.client.address, qaMode]);

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
  // Spreads ALL five buckets so uploads from every card reach the AI.
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
      // Save the per-page seeds (narrative + observations) so Step 3
      // Authoring can pre-populate matching pages. Without this, the
      // AI's draft narratives are silently dropped and consultants
      // see empty pages.
      const rawSeeds = (sData as Record<string, unknown> | null)?.page_seeds;
      const seeds: PageSeed[] = Array.isArray(rawSeeds)
        ? (rawSeeds as PageSeed[]).filter((s) => s && typeof s.page_key === "string")
        : [];
      setPageSeeds(seeds);
      toast({
        title: "Intake analyzed",
        description: seeds.length > 0
          ? `Findings ready, plus ${seeds.length} page draft${seeds.length === 1 ? "" : "s"} prepared for Step 3.`
          : "Findings and clarifying questions are ready below.",
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
        description: "Drop the discovery transcript or notes into a card below, then try again.",
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

  // Property Records card content (auto-fetched via RentCast when the
  // address resolves; never fabricated).
  const hasPropertyRecords = Boolean(
    state.client.yearBuilt || state.client.sqft || state.client.bedrooms,
  );
  const propertyRecordsSummary = [
    state.client.yearBuilt ? `Built ${state.client.yearBuilt}` : null,
    state.client.sqft ? `${state.client.sqft} sqft` : null,
    state.client.bedrooms && state.client.bathrooms
      ? `${state.client.bedrooms}/${state.client.bathrooms}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <WizardStepHeader
        step={1}
        title="Intake"
        description="Drop in everything from the on-site visit. The AI ingests transcripts, photos, the Hover scan, and the iGUIDE tour and tells you what it found before any pages are drafted."
      />

      {/* Zone A — Client & Property */}
      <section className="rounded-lg border border-hbc-border bg-white p-6 space-y-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
            Client & Property
          </div>
          <p className="text-xs font-sans text-hbc-grey mt-1">
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
      </section>

      {/* Zone B — Six upload cards, 2-col grid (prototype screens 1-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IntakeUploadCard
          title="Meeting Transcript"
          description="Otter.ai transcript from the walkthrough"
          cardKey="transcript"
          files={state.intakeUploads.transcript}
          onChange={(files) => setIntakeUploads("transcript", files)}
        />
        <IntakeUploadCard
          title="Site Notes"
          description="Your iPhone notes, scribbled observations"
          cardKey="site_notes"
          files={state.intakeUploads.site_notes}
          onChange={(files) => setIntakeUploads("site_notes", files)}
        />
        <IntakeUploadCard
          title="Photos"
          description="Serial plates, key findings, evidence"
          cardKey="photos"
          files={state.intakeUploads.photos}
          onChange={(files) => setIntakeUploads("photos", files)}
        />
        <IntakeUploadCard
          title="Hover 3D Model"
          description="Exterior measurements + 3D walkthrough"
          cardKey="hover"
          accept="application/pdf,.pdf"
          files={state.intakeUploads.hover}
          onChange={(files) => setIntakeUploads("hover", files)}
          url={{
            value: state.hoverUrl,
            onChange: setHoverUrl,
            label: "Hover share URL",
            placeholder: "https://hover.to/...",
          }}
        />
        <IntakeUploadCard
          title="iGUIDE 360° Tour"
          description="Interior immersive tour + 2D floor plans"
          cardKey="iguide"
          accept="application/pdf,.pdf"
          files={state.intakeUploads.iguide}
          onChange={(files) => setIntakeUploads("iguide", files)}
          url={{
            value: state.iguideUrl,
            onChange: setIguideUrl,
            label: "iGUIDE share URL",
            placeholder: "https://youriguide.com/...",
          }}
        />
        {/* Property Records — auto-fetched, no upload control */}
        <div
          className={`rounded-lg border bg-white p-5 space-y-3 ${
            hasPropertyRecords
              ? "border-hbc-gold"
              : "border-hbc-border"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-sans font-semibold text-hbc-navy">
                Property Records
              </h4>
              <p className="text-xs font-sans text-hbc-grey mt-0.5">
                Auto-pulled from county records + RentCast
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-sm bg-hbc-gold px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
              Auto-fetched
            </span>
          </div>
          {hasPropertyRecords ? (
            <div className="rounded-sm border-l-2 border-hbc-gold bg-hbc-surface px-3 py-2">
              <div className="text-xs font-sans font-semibold text-hbc-navy">
                {propertyRecordsSummary}
              </div>
              {(state.client.county || state.client.propertyType) && (
                <div className="text-[10px] font-sans text-hbc-grey mt-0.5">
                  {[state.client.county, state.client.propertyType.replace("_", "-")]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs font-sans text-hbc-grey">
              Not yet fetched. Add the property address above and records
              fill in automatically.
            </p>
          )}
        </div>
      </div>

      {/* Zone C — Anything else + Field Checklist */}
      <section className="rounded-lg border border-hbc-border bg-white p-6 space-y-4">
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
      </section>

      {/* Zone D — Analysis band */}
      {analyzing ? (
        <section className="rounded-lg border border-hbc-border bg-white p-6 space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
            Analyzing...
          </div>
          <ul className="space-y-2.5">
            {ANALYZING_CHECKLIST.map((label, i) => (
              <li key={label} className="flex items-center gap-2.5 text-sm font-sans text-hbc-grey">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--hbc-gold))] animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>
        </section>
      ) : state.intakeFindings.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
                Review & Approve
              </div>
              <h3 className="font-display text-2xl text-hbc-navy mt-1">
                What the AI Found
              </h3>
            </div>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="min-h-[44px] bg-hbc-navy text-white hover:bg-[hsl(var(--hbc-navy)/0.92)]"
            >
              Approve & Build TOC →
            </Button>
          </div>
          {analyzeError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-sans text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              <span>{analyzeError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.intakeFindings.map((finding) => {
              const meta = findingLabels[finding.category];
              return (
                <div
                  key={finding.category}
                  className="rounded-lg border border-hbc-border bg-white p-5 space-y-2"
                >
                  <div>
                    <div className="text-sm font-sans font-semibold text-hbc-navy">
                      {finding.title}
                    </div>
                    {meta?.helper && (
                      <p className="text-[11px] font-sans text-hbc-grey mt-0.5">
                        {meta.helper}
                      </p>
                    )}
                  </div>
                  {finding.bullets.length > 0 && (
                    <ul className="space-y-1 text-xs font-sans text-foreground">
                      {finding.bullets.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-hbc-gold-readable" aria-hidden>
                            ·
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <AIClarifyingQuestions
            questions={state.clarifyingQuestions}
            answers={state.clarifyingAnswers}
            onAnswer={answerClarifyingQuestion}
          />
        </section>
      ) : (
        <section className="rounded-lg border border-hbc-border bg-white p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
                {hasAnyIntake ? "Ready to Analyze" : "Waiting on Intake"}
              </div>
              <h3 className="font-display text-2xl text-hbc-navy mt-1">
                {hasAnyIntake ? "All inputs received" : "Add intake materials above"}
              </h3>
              <p className="text-xs font-sans text-hbc-grey mt-1">
                {hasAnyIntake
                  ? "Click to extract everything the AI can see."
                  : "Drop at least one file or write discovery notes, then run the analyzer."}
              </p>
              {analyzeError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-sans text-destructive mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <span>{analyzeError}</span>
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={runAIAnalysis}
              disabled={!hasAnyIntake}
              className="min-h-[44px] bg-hbc-gold text-white hover:bg-[hsl(var(--hbc-gold)/0.92)]"
            >
              Run AI Analysis →
            </Button>
          </div>
        </section>
      )}

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
