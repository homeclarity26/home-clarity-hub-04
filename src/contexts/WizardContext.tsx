import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ReportBlock } from "@/components/wysiwyg/types";
import { buildDefaultFieldChecklist } from "@/components/admin/wizard/field-checklist-defaults";

// ─── Wizard state shape (covers all 5 steps) ─────────────────────────────
//
// Per Master Spec Section 2.1 the state holds intake, TOC selections,
// page authoring, strategy, and publish acknowledgments. The reducer-shaped
// API below avoids per-step prop drilling. Persistence is incremental:
// reportId is created on first save and re-used for the rest of the run.

export type WizardStepKey =
  | "intake"
  | "toc"
  | "authoring"
  | "strategy"
  | "publish";

export const WIZARD_STEPS: { key: WizardStepKey; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "toc", label: "TOC Proposal" },
  { key: "authoring", label: "Authoring" },
  { key: "strategy", label: "Strategy" },
  { key: "publish", label: "Publish" },
];

export interface ClientFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyName: string;
  propertyType: string;
  relationshipType: string;
  yearBuilt: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  discoveryNotes: string;
}

// File entry per intake card.
export interface IntakeFileRef {
  id: string;
  name: string;
  size: number;
  mime: string;
  // Local-only object URL until upload finishes; real path filled in later.
  storage_path?: string;
  bucket?: string;
}

export type IntakeCardKey =
  | "transcript"
  | "site_notes"
  | "photos"
  | "hover"
  | "iguide"
  | "anything_else";

export interface IntakeUploads {
  transcript: IntakeFileRef[];
  site_notes: IntakeFileRef[];
  photos: IntakeFileRef[];
  hover: IntakeFileRef[];
  iguide: IntakeFileRef[];
  // anything_else freeform text only
}

// 6 AI findings cards from seed-report-from-notes (E7).
export interface IntakeFinding {
  category:
    | "spaces"
    | "systems_appliances"
    | "vision_projects"
    | "recurring_services"
    | "family_priorities"
    | "sequence_risk";
  title: string;
  bullets: string[];
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  // optional rationale shown beneath the question
  why?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
}

// W2 — TOC Proposal grouping (4 sections per Master Spec 2.3 + E8).
export interface TocPage {
  page_key: string;
  title: string;
  group: string;
  selected: boolean;
  ai_recommended: boolean;
  is_custom?: boolean;
  is_featured?: boolean;
  reason?: string;
}

export type TocSectionKey =
  | "information"
  | "spaces"
  | "systems_appliances"
  | "strategy";

export interface TocSection {
  key: TocSectionKey;
  label: string;
  pages: TocPage[];
}

// W3 — Authoring state per page.
export type PageAuthoringStatus = "draft" | "reviewed" | "complete";

export interface PageAuthoring {
  page_key: string;
  status: PageAuthoringStatus;
  is_featured: boolean;
  // arbitrary blocks shape (rendered by SharedBlockRenderer downstream)
  content: unknown[];
  notes_for_next_visit?: string;
}

// W4 — Strategy (light wrapper; child blocks own deep state).
export interface StrategyState {
  defense_project_ids: string[];
  offense_project_ids: string[];
  expansion_project_ids: string[];
  recurring_register_built: boolean;
}

// W5 — Publish acknowledgments.
export interface QualityGateAck {
  question_id: string;
  acknowledged_at: string;
  note?: string;
}

export interface WizardState {
  draftId: string | null;
  reportId: string | null;
  propertyId: string | null;
  currentStep: WizardStepKey;

  // Step 1
  client: ClientFormData;
  intakeUploads: IntakeUploads;
  /**
   * Hover and iGuide are typically linked to as third-party scan URLs the
   * consultant pastes in. They survive in the draft and ship to
   * properties.hover_url / iguide_url at publish time so EmbedBlocks can
   * render them across admin + portal.
   */
  hoverUrl: string;
  iguideUrl: string;
  anythingElse: string;
  intakeFindings: IntakeFinding[];
  clarifyingQuestions: ClarifyingQuestion[];
  clarifyingAnswers: Record<string, string>;
  fieldChecklist: ChecklistItem[];

  // Step 2
  tocSections: TocSection[];
  tocReasoning: string | null;

  // Step 3
  authoring: Record<string, PageAuthoring>;
  activePageKey: string | null;

  // Step 4
  strategy: StrategyState;

  // Step 5
  qaAcknowledgments: QualityGateAck[];
  publishedAt: string | null;
}

const emptyClient: ClientFormData = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  county: "",
  propertyName: "",
  propertyType: "",
  relationshipType: "",
  yearBuilt: "",
  sqft: "",
  bedrooms: "",
  bathrooms: "",
  discoveryNotes: "",
};

const emptyUploads: IntakeUploads = {
  transcript: [],
  site_notes: [],
  photos: [],
  hover: [],
  iguide: [],
};

const initialState: WizardState = {
  draftId: null,
  reportId: null,
  propertyId: null,
  currentStep: "intake",
  client: emptyClient,
  intakeUploads: emptyUploads,
  hoverUrl: "",
  iguideUrl: "",
  anythingElse: "",
  intakeFindings: [],
  clarifyingQuestions: [],
  clarifyingAnswers: {},
  fieldChecklist: buildDefaultFieldChecklist(),
  tocSections: [],
  tocReasoning: null,
  authoring: {},
  activePageKey: null,
  strategy: {
    defense_project_ids: [],
    offense_project_ids: [],
    expansion_project_ids: [],
    recurring_register_built: false,
  },
  qaAcknowledgments: [],
  publishedAt: null,
};

// Lightweight summary returned to WizardShell so it can render a "resume?"
// prompt without hydrating the whole envelope.
export interface WizardDraftSummary {
  id: string;
  current_step: WizardStepKey;
  client_full_name: string;
  property_address: string;
  updated_at: string;
}

interface WizardContextValue {
  state: WizardState;
  isSaving: boolean;
  lastSavedAt: Date | null;
  setClient: (next: Partial<ClientFormData>) => void;
  setIntakeUploads: (key: keyof IntakeUploads, files: IntakeFileRef[]) => void;
  setAnythingElse: (next: string) => void;
  setHoverUrl: (next: string) => void;
  setIguideUrl: (next: string) => void;
  setFindings: (next: IntakeFinding[]) => void;
  setClarifyingQuestions: (next: ClarifyingQuestion[]) => void;
  answerClarifyingQuestion: (id: string, optionId: string) => void;
  setFieldChecklist: (next: ChecklistItem[]) => void;
  setTocSections: (next: TocSection[]) => void;
  setTocReasoning: (next: string | null) => void;
  togglePage: (page_key: string) => void;
  toggleFeatured: (page_key: string) => void;
  addCustomPage: (sectionKey: string, page: TocPage) => void;
  addCustomSection: (section: TocSection) => void;
  upsertAuthoring: (page_key: string, patch: Partial<PageAuthoring>) => void;
  setActivePageKey: (next: string | null) => void;
  setStrategy: (patch: Partial<StrategyState>) => void;
  acknowledgeQuestion: (ack: QualityGateAck) => void;
  goToStep: (next: WizardStepKey) => Promise<void>;
  setReportId: (next: string | null) => void;
  setPropertyId: (next: string | null) => void;
  resumeFromReportId: (reportId: string) => Promise<void>;
  resumeFromDraftId: (draftId: string) => Promise<void>;
  abandonDraft: (draftId: string) => Promise<void>;
  findResumableDraft: () => Promise<WizardDraftSummary | null>;
  markPublished: () => Promise<void>;
  draftId: string | null;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<WizardState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Track the latest in-flight save so a fresh edit can supersede an
  // earlier save's response without racing the local state.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<WizardState>(initialState);
  stateRef.current = state;

  // Serializes only the parts of state we need to round-trip on resume.
  // Heavy ephemeral things like clarifyingQuestions are excluded; the
  // analyzer regenerates those on demand.
  const buildEnvelope = useCallback((s: WizardState) => {
    return {
      client: s.client,
      anything_else: s.anythingElse,
      hover_url: s.hoverUrl,
      iguide_url: s.iguideUrl,
      intake_uploads: s.intakeUploads,
      clarifying_questions: s.clarifyingQuestions,
      clarifying_answers: s.clarifyingAnswers,
      field_checklist: s.fieldChecklist,
      findings: s.intakeFindings,
      toc_sections: s.tocSections,
      toc_reasoning: s.tocReasoning,
      authoring: s.authoring,
      active_page_key: s.activePageKey,
      strategy: s.strategy,
      qa_acknowledgments: s.qaAcknowledgments,
      published_at: s.publishedAt,
    } as Record<string, unknown>;
  }, []);

  // Collapses every IntakeFileRef.storage_path into a flat string[] for
  // wizard_drafts.uploaded_file_paths so abandoned drafts can be cleaned
  // up later without re-walking the JSON envelope.
  const collectUploadedPaths = useCallback((s: WizardState): string[] => {
    const paths: string[] = [];
    for (const refs of Object.values(s.intakeUploads)) {
      for (const r of refs) {
        if (r.storage_path) paths.push(r.storage_path);
      }
    }
    return paths;
  }, []);

  // Upserts the draft row. Returns the draft id (creating one on first
  // call). Best-effort: failures don't block navigation — we'll retry on
  // the next transition.
  const persistDraft = useCallback(
    async (snapshot: WizardState): Promise<string | null> => {
      if (!user?.id) return null;
      const envelope = buildEnvelope(snapshot);
      const uploadedPaths = collectUploadedPaths(snapshot);
      setIsSaving(true);
      try {
        if (snapshot.draftId) {
          const { error } = await supabase
            .from("wizard_drafts")
            .update({
              property_id: snapshot.propertyId,
              report_id: snapshot.reportId,
              current_step: snapshot.currentStep,
              step_data: envelope as never,
              uploaded_file_paths: uploadedPaths,
            })
            .eq("id", snapshot.draftId);
          if (error) throw error;
          setLastSavedAt(new Date());
          return snapshot.draftId;
        }
        const { data, error } = await supabase
          .from("wizard_drafts")
          .insert({
            creator_id: user.id,
            property_id: snapshot.propertyId,
            report_id: snapshot.reportId,
            current_step: snapshot.currentStep,
            step_data: envelope as never,
            uploaded_file_paths: uploadedPaths,
            status: "in_progress",
          })
          .select("id")
          .single();
        if (error) throw error;
        const newId = data?.id ?? null;
        if (newId) {
          setState((prev) => ({ ...prev, draftId: newId }));
        }
        setLastSavedAt(new Date());
        return newId;
      } catch (err) {
        console.warn("WizardContext persistDraft failed", err);
        return snapshot.draftId;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, buildEnvelope, collectUploadedPaths],
  );

  // Debounced autosave on every state change. Fires 800ms after the last
  // edit so rapid keystrokes don't hammer the DB but a step transition
  // still flushes (goToStep awaits a fresh persistDraft).
  useEffect(() => {
    if (!user?.id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistDraft(stateRef.current);
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, user?.id, persistDraft]);

  const setClient = useCallback((next: Partial<ClientFormData>) => {
    setState((prev) => ({ ...prev, client: { ...prev.client, ...next } }));
  }, []);

  const setIntakeUploads = useCallback(
    (key: keyof IntakeUploads, files: IntakeFileRef[]) => {
      setState((prev) => ({
        ...prev,
        intakeUploads: { ...prev.intakeUploads, [key]: files },
      }));
    },
    [],
  );

  const setHoverUrl = useCallback((next: string) => {
    setState((prev) => ({ ...prev, hoverUrl: next }));
  }, []);

  const setIguideUrl = useCallback((next: string) => {
    setState((prev) => ({ ...prev, iguideUrl: next }));
  }, []);

  const setAnythingElse = useCallback((next: string) => {
    setState((prev) => ({ ...prev, anythingElse: next }));
  }, []);

  const setFindings = useCallback((next: IntakeFinding[]) => {
    setState((prev) => ({ ...prev, intakeFindings: next }));
  }, []);

  const setClarifyingQuestions = useCallback((next: ClarifyingQuestion[]) => {
    setState((prev) => ({ ...prev, clarifyingQuestions: next }));
  }, []);

  const answerClarifyingQuestion = useCallback(
    (id: string, optionId: string) => {
      setState((prev) => ({
        ...prev,
        clarifyingAnswers: { ...prev.clarifyingAnswers, [id]: optionId },
      }));
    },
    [],
  );

  const setFieldChecklist = useCallback((next: ChecklistItem[]) => {
    setState((prev) => ({ ...prev, fieldChecklist: next }));
  }, []);

  const setTocSections = useCallback((next: TocSection[]) => {
    setState((prev) => ({ ...prev, tocSections: next }));
  }, []);

  const setTocReasoning = useCallback((next: string | null) => {
    setState((prev) => ({ ...prev, tocReasoning: next }));
  }, []);

  const togglePage = useCallback((page_key: string) => {
    setState((prev) => ({
      ...prev,
      tocSections: prev.tocSections.map((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.page_key === page_key ? { ...p, selected: !p.selected } : p,
        ),
      })),
    }));
  }, []);

  const toggleFeatured = useCallback((page_key: string) => {
    setState((prev) => ({
      ...prev,
      tocSections: prev.tocSections.map((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.page_key === page_key
            ? { ...p, is_featured: !p.is_featured }
            : p,
        ),
      })),
    }));
  }, []);

  const addCustomPage = useCallback(
    (sectionKey: string, page: TocPage) => {
      setState((prev) => ({
        ...prev,
        tocSections: prev.tocSections.map((s) =>
          s.key === sectionKey ? { ...s, pages: [...s.pages, page] } : s,
        ),
      }));
    },
    [],
  );

  const addCustomSection = useCallback((section: TocSection) => {
    setState((prev) => ({
      ...prev,
      tocSections: [...prev.tocSections, section],
    }));
  }, []);

  const upsertAuthoring = useCallback(
    (page_key: string, patch: Partial<PageAuthoring>) => {
      setState((prev) => {
        const existing = prev.authoring[page_key] ?? {
          page_key,
          status: "draft" as const,
          is_featured: false,
          content: [],
        };
        return {
          ...prev,
          authoring: {
            ...prev.authoring,
            [page_key]: { ...existing, ...patch, page_key },
          },
        };
      });
    },
    [],
  );

  const setActivePageKey = useCallback((next: string | null) => {
    setState((prev) => ({ ...prev, activePageKey: next }));
  }, []);

  const setStrategy = useCallback((patch: Partial<StrategyState>) => {
    setState((prev) => ({ ...prev, strategy: { ...prev.strategy, ...patch } }));
  }, []);

  const acknowledgeQuestion = useCallback((ack: QualityGateAck) => {
    setState((prev) => {
      const without = prev.qaAcknowledgments.filter(
        (a) => a.question_id !== ack.question_id,
      );
      return { ...prev, qaAcknowledgments: [...without, ack] };
    });
  }, []);

  const setReportId = useCallback((next: string | null) => {
    setState((prev) => ({ ...prev, reportId: next }));
  }, []);

  const setPropertyId = useCallback((next: string | null) => {
    setState((prev) => ({ ...prev, propertyId: next }));
  }, []);

  const goToStep = useCallback(
    async (next: WizardStepKey) => {
      // Capture latest state for the persistence call.
      let snapshot: WizardState = state;
      setState((prev) => {
        snapshot = { ...prev, currentStep: next };
        return snapshot;
      });
      // Flush the autosave debouncer immediately so the step transition
      // commits before the user moves on.
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      try {
        await persistDraft(snapshot);
      } catch (err) {
        console.warn("WizardContext persistDraft on goToStep failed", err);
      }
    },
    [state, persistDraft],
  );

  const hydrateFromEnvelope = useCallback(
    (
      envelope: Record<string, unknown>,
      base: Partial<WizardState> = {},
    ): WizardState => {
      const next: WizardState = { ...stateRef.current, ...base };
      if (envelope.client) next.client = envelope.client as ClientFormData;
      if (typeof envelope.anything_else === "string") {
        next.anythingElse = envelope.anything_else;
      }
      if (typeof envelope.hover_url === "string") {
        next.hoverUrl = envelope.hover_url;
      }
      if (typeof envelope.iguide_url === "string") {
        next.iguideUrl = envelope.iguide_url;
      }
      if (envelope.intake_uploads && typeof envelope.intake_uploads === "object") {
        next.intakeUploads = {
          ...emptyUploads,
          ...(envelope.intake_uploads as IntakeUploads),
        };
      }
      if (Array.isArray(envelope.clarifying_questions)) {
        next.clarifyingQuestions =
          envelope.clarifying_questions as ClarifyingQuestion[];
      }
      if (envelope.clarifying_answers) {
        next.clarifyingAnswers = envelope.clarifying_answers as Record<
          string,
          string
        >;
      }
      if (Array.isArray(envelope.field_checklist)) {
        const persisted = envelope.field_checklist as ChecklistItem[];
        // Pre-checklist-defaults drafts have an empty list. Seed defaults
        // on resume so the consultant gets the same prompts every visit.
        next.fieldChecklist =
          persisted.length > 0 ? persisted : buildDefaultFieldChecklist();
      }
      if (Array.isArray(envelope.findings)) {
        next.intakeFindings = envelope.findings as IntakeFinding[];
      }
      if (Array.isArray(envelope.toc_sections)) {
        next.tocSections = envelope.toc_sections as TocSection[];
      }
      if (
        typeof envelope.toc_reasoning === "string" ||
        envelope.toc_reasoning === null
      ) {
        next.tocReasoning = envelope.toc_reasoning as string | null;
      }
      if (envelope.authoring && typeof envelope.authoring === "object") {
        next.authoring = envelope.authoring as Record<string, PageAuthoring>;
      }
      if (
        typeof envelope.active_page_key === "string" ||
        envelope.active_page_key === null
      ) {
        next.activePageKey = envelope.active_page_key as string | null;
      }
      if (envelope.strategy && typeof envelope.strategy === "object") {
        next.strategy = {
          ...next.strategy,
          ...(envelope.strategy as Partial<StrategyState>),
        };
      }
      if (Array.isArray(envelope.qa_acknowledgments)) {
        next.qaAcknowledgments =
          envelope.qa_acknowledgments as QualityGateAck[];
      }
      if (
        typeof envelope.published_at === "string" ||
        envelope.published_at === null
      ) {
        next.publishedAt = envelope.published_at as string | null;
      }
      return next;
    },
    [],
  );

  const resumeFromDraftId = useCallback(
    async (draftId: string) => {
      try {
        const { data, error } = await supabase
          .from("wizard_drafts")
          .select(
            "id, property_id, report_id, current_step, step_data, status",
          )
          .eq("id", draftId)
          .maybeSingle();
        if (error || !data) return;
        if (data.status !== "in_progress") return;
        const envelope =
          data.step_data && typeof data.step_data === "object"
            ? (data.step_data as Record<string, unknown>)
            : {};
        setState(() =>
          hydrateFromEnvelope(envelope, {
            draftId: data.id,
            propertyId: data.property_id,
            reportId: data.report_id,
            currentStep: (data.current_step as WizardStepKey) ?? "intake",
          }),
        );
      } catch (err) {
        console.warn("WizardContext resumeFromDraftId failed", err);
      }
    },
    [hydrateFromEnvelope],
  );

  const findResumableDraft = useCallback(async (): Promise<
    WizardDraftSummary | null
  > => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from("wizard_drafts")
        .select("id, current_step, step_data, updated_at")
        .eq("creator_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      const envelope =
        data.step_data && typeof data.step_data === "object"
          ? (data.step_data as Record<string, unknown>)
          : {};
      const client = (envelope.client as ClientFormData | undefined) ?? null;
      return {
        id: data.id,
        current_step: (data.current_step as WizardStepKey) ?? "intake",
        client_full_name: client?.fullName ?? "",
        property_address: client?.address ?? "",
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.warn("WizardContext findResumableDraft failed", err);
      return null;
    }
  }, [user?.id]);

  const abandonDraft = useCallback(async (draftId: string) => {
    try {
      await supabase
        .from("wizard_drafts")
        .update({ status: "abandoned" })
        .eq("id", draftId);
    } catch (err) {
      console.warn("WizardContext abandonDraft failed", err);
    }
  }, []);

  const markPublished = useCallback(async () => {
    const id = stateRef.current.draftId;
    if (!id) return;
    try {
      await supabase
        .from("wizard_drafts")
        .update({ status: "published" })
        .eq("id", id);
    } catch (err) {
      console.warn("WizardContext markPublished failed", err);
    }
  }, []);

  const resumeFromReportId = useCallback(async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, property_id, status")
        .eq("id", reportId)
        .maybeSingle();
      if (error || !data) return;
      let envelope: Record<string, unknown> | null = null;
      if (data.property_id) {
        const { data: propRow } = await supabase
          .from("properties")
          .select("client_intelligence_summary")
          .eq("id", data.property_id)
          .maybeSingle();
        const summaryText = propRow?.client_intelligence_summary;
        if (summaryText && typeof summaryText === "string") {
          try {
            envelope = JSON.parse(summaryText) as Record<string, unknown>;
          } catch {
            envelope = null;
          }
        }
      }
      setState((prev) => {
        const next: WizardState = { ...prev, reportId: data.id };
        if (data.property_id) next.propertyId = data.property_id;
        if (envelope) {
          if (envelope.client) next.client = envelope.client as ClientFormData;
          if (typeof envelope.anything_else === "string") {
            next.anythingElse = envelope.anything_else;
          }
          if (envelope.clarifying_answers) {
            next.clarifyingAnswers = envelope.clarifying_answers as Record<
              string,
              string
            >;
          }
          if (Array.isArray(envelope.field_checklist)) {
            next.fieldChecklist = envelope.field_checklist as ChecklistItem[];
          }
          if (Array.isArray(envelope.findings)) {
            next.intakeFindings = envelope.findings as IntakeFinding[];
          }
          if (Array.isArray(envelope.toc_sections)) {
            next.tocSections = envelope.toc_sections as TocSection[];
          }
        }
        return next;
      });
    } catch (err) {
      console.warn("WizardContext resumeFromReportId failed", err);
    }
  }, []);

  // If a returning admin lands without an existing draft, no resume happens
  // — they'll create a new report on first save.
  useEffect(() => {
    if (!user) return;
    // Hook reserved for future auto-restore-from-most-recent-draft logic.
  }, [user]);

  const value = useMemo<WizardContextValue>(
    () => ({
      state,
      isSaving,
      lastSavedAt,
      setClient,
      setIntakeUploads,
      setAnythingElse,
      setHoverUrl,
      setIguideUrl,
      setFindings,
      setClarifyingQuestions,
      answerClarifyingQuestion,
      setFieldChecklist,
      setTocSections,
      setTocReasoning,
      togglePage,
      toggleFeatured,
      addCustomPage,
      addCustomSection,
      upsertAuthoring,
      setActivePageKey,
      setStrategy,
      acknowledgeQuestion,
      goToStep,
      setReportId,
      setPropertyId,
      resumeFromReportId,
      resumeFromDraftId,
      abandonDraft,
      findResumableDraft,
      markPublished,
      draftId: state.draftId,
    }),
    [
      state,
      isSaving,
      lastSavedAt,
      setClient,
      setIntakeUploads,
      setAnythingElse,
      setHoverUrl,
      setIguideUrl,
      setFindings,
      setClarifyingQuestions,
      answerClarifyingQuestion,
      setFieldChecklist,
      setTocSections,
      setTocReasoning,
      togglePage,
      toggleFeatured,
      addCustomPage,
      addCustomSection,
      upsertAuthoring,
      setActivePageKey,
      setStrategy,
      acknowledgeQuestion,
      goToStep,
      setReportId,
      setPropertyId,
      resumeFromReportId,
      resumeFromDraftId,
      abandonDraft,
      findResumableDraft,
      markPublished,
    ],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used inside <WizardProvider>");
  }
  return ctx;
}

// W2.5 — Wizard authoring → SharedBlockRenderer bridge.
//
// Step 3's textareas write content as a flat list of `{type, value}` rows
// (`narrative`, `observations`). That shape is wizard-internal — neither
// SharedBlockRenderer nor PortalBlockViewer know how to consume it. At
// publish time we materialize that into the canonical ReportBlock array
// shape so it can land in `report_pages.narrative` (per-page) and
// `reports.blocks_json` (whole-report union) and render through the v2
// surface end-to-end.
export function pageAuthoringToBlocks(
  authoring: PageAuthoring,
  startOrder = 0,
): ReportBlock[] {
  const items =
    (authoring.content as Array<{ type?: string; value?: string }> | undefined) ??
    [];
  const narrative =
    items.find((b) => b.type === "narrative")?.value?.trim() ?? "";
  const observations =
    items.find((b) => b.type === "observations")?.value?.trim() ?? "";

  const blocks: ReportBlock[] = [];
  const now = new Date().toISOString();
  let order = startOrder;

  if (narrative) {
    blocks.push({
      id: makeBlockId(order),
      type: "text",
      content: { html: textareaToHtml(narrative) },
      colSpan: 12,
      order: order++,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (observations) {
    blocks.push({
      id: makeBlockId(order),
      type: "text",
      content: { html: `<h3>Observations</h3>${textareaToHtml(observations)}` },
      colSpan: 12,
      order: order++,
      createdAt: now,
      updatedAt: now,
    });
  }
  return blocks;
}

// Newline-respecting plain-text → safe HTML. Mirrors what TextBlock expects
// (an html string it pipes through SanitizedHtml). Double-newline = paragraph
// break, single-newline = <br/>.
function textareaToHtml(value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n{2,}/).map((p) => p.replace(/\n/g, "<br/>"));
  return paragraphs
    .filter((p) => p.length > 0)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

function makeBlockId(order: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b-${Date.now().toString(36)}-${order}`;
}

// Runtime detector for whether a `report_pages.narrative` jsonb cell is the
// new ReportBlock array shape (W2.5+) vs the legacy `string[]` (pre-rebuild).
// Used by ReportTab to decide between SharedBlockRenderer and ReportPage.
export function isReportBlockArray(value: unknown): value is ReportBlock[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  return (
    typeof first === "object" &&
    first !== null &&
    typeof (first as { id?: unknown }).id === "string" &&
    typeof (first as { type?: unknown }).type === "string" &&
    typeof (first as { content?: unknown }).content === "object" &&
    (first as { content: unknown }).content !== null
  );
}
