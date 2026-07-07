// Wizard authoring state → structured publish payload (Phase 1, commit 2).
//
// The wizard's Step 3 editor captures per-page prose as
// `content: [{type: "narrative", value}, {type: "observations", value}]`
// and Step 1's AI seed pass captures structured hints per page
// (suggested_condition, specs_seed, key_observations,
// replacement_briefing_stub). Before this module, Step 5 flattened all of
// that into bare `text` ReportBlocks, which is the wall-of-text root cause.
//
// This module maps that state into (a) typed blocks (room_record /
// system_record / replacement_briefing / vision_project) for
// `report_pages.narrative`, and (b) structured column values for the
// report_pages row, validated through the Phase 1 zod schemas. Fields the
// wizard does not capture stay undefined; nothing is invented.

import type { ReportBlock, BlockType } from "@/components/wysiwyg/types";
import { BLOCK_TEMPLATES } from "@/components/wysiwyg/types";
import type {
  PageAuthoring,
  PageSeed,
  TocPage,
} from "@/contexts/WizardContext";
import {
  appliancePageContentSchema,
  normalizeConditionRating,
  roomPageContentSchema,
  specItemSchema,
  systemPageContentSchema,
  visionPageContentSchema,
  type SpecItem,
  type StructuredPageType,
  type TierSet,
} from "@/lib/reportPageSchemas";

// ─── Page-type inference ──────────────────────────────────────────────────
// Mirrors Step3Authoring.inferPageType, extended with the Step 2 TOC
// section key so publish-time inference works for custom pages too.

export function inferStructuredPageType(
  page: Pick<TocPage, "page_key" | "group">,
  sectionKey: string,
): StructuredPageType | "generic" {
  const k = page.page_key.toLowerCase();
  const g = (page.group || "").toLowerCase();
  if (k === "executive-summary") return "generic";
  if (g === "appliances" || g.startsWith("appliance")) return "appliance";
  if (
    g.startsWith("system") ||
    g.startsWith("safety") ||
    sectionKey === "systems_appliances"
  ) {
    return "system";
  }
  if (k.includes("vision") || k.includes("project")) return "vision";
  if (
    g === "spaces" ||
    g.startsWith("interior") ||
    g.startsWith("exterior") ||
    sectionKey === "spaces"
  ) {
    return "room";
  }
  return "generic";
}

// ─── Authored-text extraction ─────────────────────────────────────────────

export interface AuthoredText {
  narrativeParagraphs: string[];
  observationLines: string[];
}

export function extractAuthoredText(authoring: PageAuthoring): AuthoredText {
  const items =
    (authoring.content as Array<{ type?: string; value?: string }> | undefined) ??
    [];
  const narrativeRaw =
    items.find((b) => b?.type === "narrative")?.value?.trim() ?? "";
  const observationsRaw =
    items.find((b) => b?.type === "observations")?.value?.trim() ?? "";

  const narrativeParagraphs = narrativeRaw
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);

  const observationLines = observationsRaw
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);

  return { narrativeParagraphs, observationLines };
}

// ─── HTML helpers (escape-first; matches TextBlock expectations) ──────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function observationsToHtml(
  paragraphs: string[],
  lines: string[],
): string {
  const parts: string[] = [];
  if (paragraphs.length > 0) parts.push(paragraphsToHtml(paragraphs));
  if (lines.length > 0) {
    parts.push(
      `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`,
    );
  }
  return parts.join("");
}

// ─── Block + seed helpers ─────────────────────────────────────────────────

function makeBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeBlock(
  type: BlockType,
  order: number,
  content: Record<string, unknown>,
  now: string,
): ReportBlock {
  return {
    id: makeBlockId(),
    type,
    content,
    colSpan: 12,
    order,
    createdAt: now,
    updatedAt: now,
  };
}

// Deep-copied default content for a block type. BLOCK_TEMPLATES holds a
// shared object; cloning prevents accidental template mutation.
function templateDefaultContent(type: BlockType): Record<string, unknown> {
  const template = BLOCK_TEMPLATES.find((t) => t.type === type);
  return template
    ? (JSON.parse(JSON.stringify(template.defaultContent)) as Record<
        string,
        unknown
      >)
    : {};
}

function cleanSpecs(seed: PageSeed | undefined): SpecItem[] {
  const raw = seed?.specs_seed ?? [];
  const out: SpecItem[] = [];
  for (const item of raw) {
    const parsed = specItemSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

function seedObservations(seed: PageSeed | undefined): string[] {
  return (seed?.key_observations ?? [])
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

// Shape of seed-report-from-notes' replacement_briefing_stub (E7 rules).
interface ReplacementBriefingStub {
  system_type?: string;
  unit_make?: string | null;
  unit_model?: string | null;
  install_year?: number | null;
  needs_briefing?: boolean;
}

function readBriefingStub(
  seed: PageSeed | undefined,
): ReplacementBriefingStub | null {
  const stub = seed?.replacement_briefing_stub;
  if (!stub || typeof stub !== "object") return null;
  return stub as ReplacementBriefingStub;
}

function prettifySystemType(systemType: string | undefined): string | undefined {
  if (!systemType) return undefined;
  const cleaned = systemType.replace(/_/g, " ").trim();
  if (cleaned.length === 0) return undefined;
  return cleaned
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// ─── Structured payload ───────────────────────────────────────────────────

export interface StructuredPageColumns {
  condition_rating: string | null;
  specs: SpecItem[] | null;
  key_observations: string[] | null;
  tiers: TierSet | null;
  current_age_years: number | null;
  expected_lifespan_years: number | null;
  maintenance: { frequency?: string; tasks: string[] } | null;
  images: string[] | null;
}

export interface StructuredPagePayload {
  pageType: StructuredPageType;
  blocks: ReportBlock[];
  columns: StructuredPageColumns;
}

export interface BuildStructuredPageInput {
  page: Pick<TocPage, "page_key" | "title" | "group">;
  sectionKey: string;
  sectionLabel: string;
  authoring: PageAuthoring;
  seed?: PageSeed;
  now?: string;
}

const EMPTY_COLUMNS: StructuredPageColumns = {
  condition_rating: null,
  specs: null,
  key_observations: null,
  tiers: null,
  current_age_years: null,
  expected_lifespan_years: null,
  maintenance: null,
  images: null,
};

// Builds typed blocks + structured columns for a room / system / appliance
// / vision page. Returns null for generic pages, which keep the existing
// pageAuthoringToBlocks path. Throws on schema violation so a bad payload
// never reaches the database silently.
export function buildStructuredPagePayload(
  input: BuildStructuredPageInput,
): StructuredPagePayload | null {
  const { page, sectionKey, sectionLabel, authoring, seed } = input;
  const pageType = inferStructuredPageType(page, sectionKey);
  if (pageType === "generic") return null;

  const now = input.now ?? new Date().toISOString();
  const { narrativeParagraphs, observationLines } = extractAuthoredText(authoring);
  const bullets =
    observationLines.length > 0 ? observationLines : seedObservations(seed);
  const conditionRating = normalizeConditionRating(seed?.suggested_condition);
  const specs = cleanSpecs(seed);

  if (pageType === "room") {
    // Narrative prose becomes the observations array, never a text block.
    const observations = [...narrativeParagraphs, ...bullets];
    const content = roomPageContentSchema.parse({
      observations,
      conditionRating,
      specs,
      linkedVisionProjects: [],
    });
    const observationsHtml = observationsToHtml(narrativeParagraphs, bullets);
    const blocks: ReportBlock[] = [
      makeBlock(
        "room_record",
        0,
        {
          roomName: page.title,
          roomGroup: sectionLabel,
          conditionRating: content.conditionRating,
          observationsHtml: observationsHtml || undefined,
          linkedVisionProjects: [],
        },
        now,
      ),
    ];
    return {
      pageType,
      blocks,
      columns: {
        ...EMPTY_COLUMNS,
        condition_rating: content.conditionRating ?? null,
        specs: content.specs.length > 0 ? content.specs : null,
        key_observations:
          content.observations.length > 0 ? content.observations : null,
      },
    };
  }

  if (pageType === "system" || pageType === "appliance") {
    const stub = readBriefingStub(seed);
    const make = stub?.unit_make?.trim() || undefined;
    const model = stub?.unit_model?.trim() || undefined;
    const installYear =
      typeof stub?.install_year === "number" && Number.isFinite(stub.install_year)
        ? stub.install_year
        : undefined;
    const installDate = installYear ? String(installYear) : undefined;
    const currentAgeYears = installYear
      ? Math.max(0, new Date().getFullYear() - installYear)
      : undefined;
    const observations = [...narrativeParagraphs, ...bullets];

    const schema =
      pageType === "appliance"
        ? appliancePageContentSchema
        : systemPageContentSchema;
    const content = schema.parse({
      make,
      model,
      installDate,
      ...(pageType === "system" ? { currentAgeYears, statusFlags: [] } : {}),
      conditionRating,
      specs,
      observations,
    });

    const blocks: ReportBlock[] = [
      makeBlock(
        "system_record",
        0,
        {
          systemName: page.title,
          isAppliance: pageType === "appliance",
          conditionRating: content.conditionRating,
          make: content.make,
          model: content.model,
          installDate: content.installDate,
          specifications: content.specs,
          maintenanceLog: [],
          routineCareItems: [],
          photos: {},
        },
        now,
      ),
    ];

    if (pageType === "system" && stub?.needs_briefing) {
      // Scaffold only: labels and locked copy from the block template, no
      // invented prices. Tier pricing is Phase 5 admin-form work.
      const briefingContent = templateDefaultContent("replacement_briefing");
      briefingContent.systemType =
        prettifySystemType(stub.system_type) ?? page.title;
      blocks.push(makeBlock("replacement_briefing", 1, briefingContent, now));
    }

    return {
      pageType,
      blocks,
      columns: {
        ...EMPTY_COLUMNS,
        condition_rating: content.conditionRating ?? null,
        specs: content.specs.length > 0 ? content.specs : null,
        key_observations:
          content.observations.length > 0 ? content.observations : null,
        current_age_years:
          pageType === "system" && typeof currentAgeYears === "number"
            ? currentAgeYears
            : null,
      },
    };
  }

  // Vision
  const visionText = narrativeParagraphs.join("\n\n");
  const visionDefaults = templateDefaultContent("vision_project");
  const executionPathHtml =
    typeof visionDefaults.executionPathHtml === "string"
      ? visionDefaults.executionPathHtml
      : undefined;
  const content = visionPageContentSchema.parse({
    vision: visionText || undefined,
    executionPath: executionPathHtml,
    observations: bullets,
  });
  const blocks: ReportBlock[] = [
    makeBlock(
      "vision_project",
      0,
      {
        projectTitle: page.title,
        visionNarrativeHtml:
          narrativeParagraphs.length > 0
            ? paragraphsToHtml(narrativeParagraphs)
            : undefined,
        // Tier scaffolding from the template (ids + labels only, no prices).
        tiers: visionDefaults.tiers ?? [],
        executionPathHtml,
        akrDisclosed: true,
      },
      now,
    ),
  ];
  return {
    pageType,
    blocks,
    columns: {
      ...EMPTY_COLUMNS,
      condition_rating: conditionRating ?? null,
      key_observations:
        content.observations.length > 0 ? content.observations : null,
    },
  };
}
