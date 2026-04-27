import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  reportId: string | null;
  propertyId: string | null;
  currentStep: WizardStepKey;

  // Step 1
  client: ClientFormData;
  intakeUploads: IntakeUploads;
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
  reportId: null,
  propertyId: null,
  currentStep: "intake",
  client: emptyClient,
  intakeUploads: emptyUploads,
  anythingElse: "",
  intakeFindings: [],
  clarifyingQuestions: [],
  clarifyingAnswers: {},
  fieldChecklist: [],
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

interface WizardContextValue {
  state: WizardState;
  setClient: (next: Partial<ClientFormData>) => void;
  setIntakeUploads: (key: keyof IntakeUploads, files: IntakeFileRef[]) => void;
  setAnythingElse: (next: string) => void;
  setFindings: (next: IntakeFinding[]) => void;
  setClarifyingQuestions: (next: ClarifyingQuestion[]) => void;
  answerClarifyingQuestion: (id: string, optionId: string) => void;
  setFieldChecklist: (next: ChecklistItem[]) => void;
  setTocSections: (next: TocSection[]) => void;
  setTocReasoning: (next: string | null) => void;
  togglePage: (page_key: string) => void;
  upsertAuthoring: (page_key: string, patch: Partial<PageAuthoring>) => void;
  setActivePageKey: (next: string | null) => void;
  setStrategy: (patch: Partial<StrategyState>) => void;
  acknowledgeQuestion: (ack: QualityGateAck) => void;
  goToStep: (next: WizardStepKey) => Promise<void>;
  setReportId: (next: string | null) => void;
  setPropertyId: (next: string | null) => void;
  resumeFromReportId: (reportId: string) => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<WizardState>(initialState);

  // Persists the lightweight wizard envelope to the reports row whenever
  // we move between steps. Heavy step-specific writes (report_pages,
  // recurring_services, etc.) live in their own step components — this
  // helper just keeps the enclosing draft fresh.
  const persistEnvelope = useCallback(
    async (snapshot: WizardState) => {
      if (!snapshot.reportId) return;
      const intelligenceSummary = {
        client: snapshot.client,
        anything_else: snapshot.anythingElse,
        clarifying_answers: snapshot.clarifyingAnswers,
        field_checklist: snapshot.fieldChecklist,
        findings: snapshot.intakeFindings,
        toc_sections: snapshot.tocSections,
      } as const;
      await supabase
        .from("reports")
        .update({
          client_intelligence_summary: intelligenceSummary as never,
          updated_at: new Date().toISOString(),
        })
        .eq("id", snapshot.reportId);
    },
    [],
  );

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
      // Best-effort persist on transition. Failures don't block navigation
      // — the user can keep working and we'll retry on the next transition.
      try {
        await persistEnvelope(snapshot);
      } catch (err) {
        console.warn("WizardContext persistEnvelope failed", err);
      }
    },
    [state, persistEnvelope],
  );

  const resumeFromReportId = useCallback(async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, property_id, client_intelligence_summary, status")
        .eq("id", reportId)
        .maybeSingle();
      if (error || !data) return;
      const summary =
        (data.client_intelligence_summary as Record<string, unknown> | null) ??
        null;
      setState((prev) => {
        const next: WizardState = { ...prev, reportId: data.id };
        if (data.property_id) next.propertyId = data.property_id;
        if (summary) {
          if (summary.client) next.client = summary.client as ClientFormData;
          if (typeof summary.anything_else === "string") {
            next.anythingElse = summary.anything_else;
          }
          if (summary.clarifying_answers) {
            next.clarifyingAnswers = summary.clarifying_answers as Record<
              string,
              string
            >;
          }
          if (Array.isArray(summary.field_checklist)) {
            next.fieldChecklist = summary.field_checklist as ChecklistItem[];
          }
          if (Array.isArray(summary.findings)) {
            next.intakeFindings = summary.findings as IntakeFinding[];
          }
          if (Array.isArray(summary.toc_sections)) {
            next.tocSections = summary.toc_sections as TocSection[];
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
      setClient,
      setIntakeUploads,
      setAnythingElse,
      setFindings,
      setClarifyingQuestions,
      answerClarifyingQuestion,
      setFieldChecklist,
      setTocSections,
      setTocReasoning,
      togglePage,
      upsertAuthoring,
      setActivePageKey,
      setStrategy,
      acknowledgeQuestion,
      goToStep,
      setReportId,
      setPropertyId,
      resumeFromReportId,
    }),
    [
      state,
      setClient,
      setIntakeUploads,
      setAnythingElse,
      setFindings,
      setClarifyingQuestions,
      answerClarifyingQuestion,
      setFieldChecklist,
      setTocSections,
      setTocReasoning,
      togglePage,
      upsertAuthoring,
      setActivePageKey,
      setStrategy,
      acknowledgeQuestion,
      goToStep,
      setReportId,
      setPropertyId,
      resumeFromReportId,
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
