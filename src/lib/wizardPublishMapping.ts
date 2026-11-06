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
  TocSection,
} from "@/contexts/WizardContext";
import {
  appliancePageContentSchema,
  normalizeConditionRating,
  roomPageContentSchema,
  specItemSchema,
  systemPageContentSchema,
  tierSetSchema,
  visionPageContentSchema,
  type ReplacementBriefing,
  type RoomPageContent,
  type SpecItem,
  type StructuredPageType,
  type SystemPageContent,
  type TierSet,
  type VisionPageContent,
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

// ─── Structured-editor value cleanup (Phase 5b) ───────────────────────────
// The Step 3 editors keep empty strings while the consultant types; publish
// treats those as "Not yet documented" (undefined), never empty strings.

function cleanString(value: string | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanPositive(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function cleanNonNegative(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

// Validates an in-progress tier set. Only a fully-priced, fully-described
// Essential/Enhanced/Signature triple publishes; partial tiers are worse
// than none (locked principle: no invented pricing). Returns null when the
// set isn't complete yet.
export function cleanTierSet(tiers: TierSet | undefined): TierSet | null {
  if (!tiers) return null;
  const trim = (t: TierSet[keyof TierSet]) => ({
    ...t,
    description: (t?.description ?? "").trim(),
  });
  const candidate = {
    essential: trim(tiers.essential),
    enhanced: trim(tiers.enhanced),
    signature: trim(tiers.signature),
  };
  const parsed = tierSetSchema.safeParse(candidate);
  if (!parsed.success) return null;
  // priceLow/priceHigh of 0 means "not priced yet" in the editor.
  const priced = Object.values(parsed.data).every(
    (t) => t.priceLow > 0 && t.priceHigh > 0,
  );
  return priced ? parsed.data : null;
}

// Maps the schema TierSet onto the block-level tier array shape shared by
// replacement_briefing and vision_project (ReplacementBriefingTier).
export function tierSetToBlockTiers(
  tiers: TierSet,
): Array<Record<string, unknown>> {
  const entries: Array<[string, string]> = [
    ["essential", "Essential"],
    ["enhanced", "Enhanced"],
    ["signature", "Signature"],
  ];
  return entries.map(([id, label]) => {
    const tier = tiers[id as keyof TierSet];
    return {
      id,
      label,
      priceLow: tier.priceLow,
      priceHigh: tier.priceHigh,
      scopeHtml: escapeHtml(tier.description),
      recommended: Boolean(tier.recommended),
    };
  });
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
  const structured = authoring.structured;
  const { narrativeParagraphs, observationLines } = extractAuthoredText(authoring);
  const bullets =
    observationLines.length > 0 ? observationLines : seedObservations(seed);
  const conditionRating = normalizeConditionRating(seed?.suggested_condition);
  const seedSpecs = cleanSpecs(seed);

  if (pageType === "room") {
    const room: Partial<RoomPageContent> = structured?.room ?? {};
    const dims = cleanString(room.dims);
    const floorSqft = cleanPositive(room.floorSqft);
    const ceiling = cleanString(room.ceiling);
    const floorLevel = cleanString(room.floorLevel);
    const finishes = {
      wallPaint: cleanString(room.finishes?.wallPaint),
      trimPaint: cleanString(room.finishes?.trimPaint),
      ceilingPaint: cleanString(room.finishes?.ceilingPaint),
      flooring: cleanString(room.finishes?.flooring),
    };
    const fixtures = {
      lighting: cleanString(room.fixtures?.lighting),
      outlets: cleanString(room.fixtures?.outlets),
      windows: cleanString(room.fixtures?.windows),
      doors: cleanString(room.fixtures?.doors),
    };

    // Room → vision links authored in Step 3 (LINKED VISION PROJECT
    // select). Only links with a real title survive; the room template's
    // callout renders title + priority window.
    const linkedVisionProjects = (room.linkedVisionProjects ?? [])
      .map((vp) => ({
        pageKey: cleanString(vp.pageKey),
        title: cleanString(vp.title) ?? "",
        priority: cleanString(vp.priority),
      }))
      .filter((vp) => vp.title.length > 0);

    // Metadata-strip specs derive from the structured dims when present
    // (Dimensions / Floor Area / Ceiling / Level, matching the room
    // template's plain-value strip); otherwise the AI seed specs stand.
    const derivedSpecs: SpecItem[] = [];
    if (dims) derivedSpecs.push({ label: "Dimensions", value: dims });
    if (floorSqft) {
      derivedSpecs.push({ label: "Floor Area", value: `${floorSqft} sqft` });
    }
    if (ceiling) derivedSpecs.push({ label: "Ceiling", value: ceiling });
    if (floorLevel) derivedSpecs.push({ label: "Level", value: floorLevel });
    const specs = derivedSpecs.length > 0 ? derivedSpecs : seedSpecs;

    // Narrative prose becomes the observations array, never a text block.
    const observations = [...narrativeParagraphs, ...bullets];
    const content = roomPageContentSchema.parse({
      dims,
      floorSqft,
      ceiling,
      floorLevel,
      finishes,
      fixtures,
      observations,
      conditionRating:
        normalizeConditionRating(room.conditionRating) ?? conditionRating,
      specs,
      linkedVisionProjects,
    });
    const observationsHtml = observationsToHtml(narrativeParagraphs, bullets);
    const blocks: ReportBlock[] = [
      makeBlock(
        "room_record",
        0,
        {
          roomName: page.title,
          roomGroup: sectionLabel,
          floorLabel: content.floorLevel,
          dimensions: content.dims,
          floorSqft: content.floorSqft,
          ceiling: content.ceiling,
          wallPaint: content.finishes?.wallPaint,
          trimPaint: content.finishes?.trimPaint,
          ceilingPaint: content.finishes?.ceilingPaint,
          flooring: content.finishes?.flooring,
          lightFixtures: content.fixtures?.lighting,
          outlets: content.fixtures?.outlets,
          windows: content.fixtures?.windows,
          doors: content.fixtures?.doors,
          conditionRating: content.conditionRating,
          observationsHtml: observationsHtml || undefined,
          // Block rows carry pageKey as the row id so the portal can
          // deep-link to the vision page later.
          linkedVisionProjects: content.linkedVisionProjects.map((vp) => ({
            id: vp.pageKey,
            title: vp.title,
            priority: vp.priority,
          })),
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
    const system: Partial<SystemPageContent> = structured?.system ?? {};
    const stub = readBriefingStub(seed);
    const stubInstallYear =
      typeof stub?.install_year === "number" && Number.isFinite(stub.install_year)
        ? stub.install_year
        : undefined;

    // Structured editor values win; the Step 1 stub backfills anything the
    // consultant hasn't touched.
    const make = cleanString(system.make) ?? cleanString(stub?.unit_make ?? undefined);
    const model =
      cleanString(system.model) ?? cleanString(stub?.unit_model ?? undefined);
    const serial = cleanString(system.serial);
    const installDate =
      cleanString(system.installDate) ??
      (stubInstallYear ? String(stubInstallYear) : undefined);
    const lifespanYears = cleanPositive(system.lifespanYears);
    const installYear = installDate
      ? Number.parseInt(installDate.slice(0, 4), 10)
      : Number.NaN;
    const currentAgeYears =
      cleanNonNegative(system.currentAgeYears) ??
      (Number.isFinite(installYear)
        ? Math.max(0, new Date().getFullYear() - installYear)
        : undefined);
    const statusFlags = (system.statusFlags ?? [])
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const observations = [...narrativeParagraphs, ...bullets];

    // Replacement briefing (systems only): cleaned structured fields +
    // a fully-priced tier set when one exists.
    const briefingIn = system.replacementBriefing;
    const briefingTiers =
      pageType === "system" ? cleanTierSet(briefingIn?.tiers) : null;
    const briefing: ReplacementBriefing | undefined =
      pageType === "system" && briefingIn
        ? {
            capacity: cleanString(briefingIn.capacity),
            voltage: cleanString(briefingIn.voltage),
            gasLine: cleanString(briefingIn.gasLine),
            condensate: cleanString(briefingIn.condensate),
            ductworkNotes: cleanString(briefingIn.ductworkNotes),
            accessNotes: cleanString(briefingIn.accessNotes),
            tiers: briefingTiers ?? undefined,
          }
        : undefined;
    const briefingHasContent = Boolean(
      briefing &&
        (briefing.capacity ||
          briefing.voltage ||
          briefing.gasLine ||
          briefing.condensate ||
          briefing.ductworkNotes ||
          briefing.accessNotes ||
          briefing.tiers),
    );

    // Spec grid rows derive from the structured identity fields (matching
    // the system template's mono-label grid); seed specs fill any labels
    // the structured data doesn't cover.
    const derivedSpecs: SpecItem[] = [];
    if (make) derivedSpecs.push({ label: "Make", value: make });
    if (model) derivedSpecs.push({ label: "Model", value: model });
    if (serial) derivedSpecs.push({ label: "Serial Number", value: serial });
    if (installDate) {
      derivedSpecs.push({ label: "Installed", value: installDate });
    }
    if (pageType === "system" && lifespanYears) {
      derivedSpecs.push({
        label: "Typical Lifespan",
        value: `${lifespanYears} years`,
      });
    }
    if (pageType === "system" && typeof currentAgeYears === "number") {
      derivedSpecs.push({
        label: "Current Age",
        value: `${currentAgeYears} years`,
      });
    }
    const coveredLabels =
      /make|model|serial|install|lifespan|age/i;
    // Free-form extras (capacity, efficiency, filter size, ...) that the
    // identity fields don't cover. The system template owns the identity
    // spec grid (page.specs); the system_record block renders only these.
    const extraSpecs = seedSpecs.filter((s) => !coveredLabels.test(s.label));
    const specs =
      derivedSpecs.length > 0 ? [...derivedSpecs, ...extraSpecs] : seedSpecs;

    const schema =
      pageType === "appliance"
        ? appliancePageContentSchema
        : systemPageContentSchema;
    const content = schema.parse({
      make,
      model,
      serial,
      installDate,
      ...(pageType === "system"
        ? {
            lifespanYears,
            currentAgeYears,
            statusFlags,
            replacementBriefing: briefingHasContent ? briefing : undefined,
          }
        : {}),
      conditionRating:
        normalizeConditionRating(system.conditionRating) ?? conditionRating,
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
          status: statusFlags[0],
          conditionRating: content.conditionRating,
          make: content.make,
          model: content.model,
          serial,
          installDate: content.installDate,
          typicalLifespanYears:
            pageType === "system" ? lifespanYears : undefined,
          specifications: extraSpecs,
          maintenanceLog: [],
          routineCareItems: [],
          photos: {},
        },
        now,
      ),
    ];

    if (pageType === "system" && (stub?.needs_briefing || briefingHasContent)) {
      // Template defaults carry the locked headline/intro/CTA copy; the
      // structured briefing overlays real tier pricing plus the trade-
      // partner detail fields (capacity, voltage, gas, condensate,
      // ductwork, access). No invented prices: tiers only publish when
      // the full Essential/Enhanced/Signature triple is priced.
      const briefingContent = templateDefaultContent("replacement_briefing");
      briefingContent.systemType =
        prettifySystemType(stub?.system_type) ?? page.title;
      if (briefingTiers) {
        briefingContent.tiers = tierSetToBlockTiers(briefingTiers);
      }
      if (briefing?.capacity) briefingContent.requiredCapacity = briefing.capacity;
      if (briefing?.voltage) briefingContent.voltageAvailable = briefing.voltage;
      if (briefing?.gasLine) briefingContent.gasLine = briefing.gasLine;
      if (briefing?.condensate) briefingContent.condensate = briefing.condensate;
      if (briefing?.ductworkNotes) {
        briefingContent.ductworkNotes = briefing.ductworkNotes;
      }
      if (briefing?.accessNotes) briefingContent.accessNotes = briefing.accessNotes;
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
        tiers: briefingTiers,
        current_age_years:
          pageType === "system" && typeof currentAgeYears === "number"
            ? currentAgeYears
            : null,
        expected_lifespan_years:
          pageType === "system" && lifespanYears ? lifespanYears : null,
      },
    };
  }

  // Vision
  const vision: Partial<VisionPageContent> = structured?.vision ?? {};
  const visionText = narrativeParagraphs.join("\n\n");
  const visionDefaults = templateDefaultContent("vision_project");
  const defaultExecutionPathHtml =
    typeof visionDefaults.executionPathHtml === "string"
      ? visionDefaults.executionPathHtml
      : undefined;
  const whyDesignFirst = cleanString(vision.whyDesignFirst);
  const designPhaseWeeks = cleanPositive(vision.designPhaseWeeks);
  const designPhaseCost = cleanNonNegative(vision.designPhaseCost);
  const visionTiers = cleanTierSet(vision.tiers);
  const priorityWindow = cleanString(vision.priorityWindow);
  const category = cleanString(vision.category);
  const executionPathHtml =
    cleanString(vision.executionPath) ?? defaultExecutionPathHtml;

  const content = visionPageContentSchema.parse({
    vision: cleanString(vision.vision) ?? (visionText || undefined),
    whyDesignFirst,
    designPhaseWeeks,
    designPhaseCost,
    tiers: visionTiers ?? undefined,
    executionPath: executionPathHtml,
    priorityWindow,
    category,
    observations: bullets,
  });

  // whyDesignFirst prose carries the design-phase range inline per the
  // prototype; when it's absent, designFeeLow lets the block render its
  // factual "Design phase: from $X" fallback line instead.
  const whyDesignFirstParagraphs = whyDesignFirst
    ? whyDesignFirst
        .split(/\n{2,}/)
        .map((p) => p.replace(/\n/g, " ").trim())
        .filter((p) => p.length > 0)
    : [];
  const blocks: ReportBlock[] = [
    makeBlock(
      "vision_project",
      0,
      {
        projectTitle: page.title,
        category: content.category,
        priority: content.priorityWindow,
        visionNarrativeHtml:
          narrativeParagraphs.length > 0
            ? paragraphsToHtml(narrativeParagraphs)
            : content.vision
              ? paragraphsToHtml([content.vision])
              : undefined,
        designFeeEducationHtml:
          whyDesignFirstParagraphs.length > 0
            ? paragraphsToHtml(whyDesignFirstParagraphs)
            : undefined,
        designFeeLow: designPhaseCost,
        designPhaseWeeks,
        // Priced tiers when the full triple exists; otherwise the template
        // scaffolding (ids + labels only, no prices).
        tiers: visionTiers
          ? tierSetToBlockTiers(visionTiers)
          : (visionDefaults.tiers ?? []),
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
      tiers: visionTiers,
    },
  };
}

// ─── Page photo publish (Phase 4) ──────────────────────────────────────────
// Maps the wizard's page-assigned photos (plus system photo slots) onto the
// publish shapes: report_pages.images (ordered URL array; images[0] is the
// hero the templates render full-bleed) and a photo_gallery block whenever
// the page carries more than one photo. Slots publish first in the locked
// prototype order (unit, serial plate, install location) so a system page's
// hero is always the unit photo; slot photos carry factual captions.

export type PublishPhotoSlotKey = "unit" | "serialPlate" | "installLocation";

export interface PublishPagePhoto {
  url: string;
  caption?: string;
}

const SLOT_ORDER: PublishPhotoSlotKey[] = [
  "unit",
  "serialPlate",
  "installLocation",
];

const SLOT_CAPTIONS: Record<PublishPhotoSlotKey, string> = {
  unit: "Unit photo",
  serialPlate: "Serial plate",
  installLocation: "Install location",
};

export interface PagePhotoPublishInput {
  /** Page-assigned photos in assignment order (non-slot). */
  photos: PublishPagePhoto[];
  /** System photo slots; omit for rooms / vision / generic pages. */
  slots?: Partial<Record<PublishPhotoSlotKey, PublishPagePhoto>>;
  /** Block order for the gallery block within the page's block list. */
  order?: number;
  now?: string;
}

export interface PagePhotoPublishResult {
  /** Ordered URLs for report_pages.images; index 0 is the hero. */
  images: string[];
  /** photo_gallery block when the page has 2+ photos, else null. */
  galleryBlock: ReportBlock | null;
}

export function buildPagePhotoPublish(
  input: PagePhotoPublishInput,
): PagePhotoPublishResult {
  const now = input.now ?? new Date().toISOString();
  const ordered: PublishPagePhoto[] = [];
  const seen = new Set<string>();

  const push = (photo: PublishPagePhoto | undefined, caption?: string) => {
    const url = photo?.url?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    ordered.push({ url, caption: photo?.caption ?? caption });
  };

  for (const key of SLOT_ORDER) {
    push(input.slots?.[key], SLOT_CAPTIONS[key]);
  }
  for (const photo of input.photos) {
    push(photo);
  }

  const images = ordered.map((p) => p.url);
  const galleryBlock =
    ordered.length > 1
      ? makeBlock(
          "photo_gallery",
          input.order ?? 0,
          {
            photos: ordered.map((p) =>
              p.caption ? { url: p.url, caption: p.caption } : { url: p.url },
            ),
          },
          now,
        )
      : null;

  return { images, galleryBlock };
}

// ─── Executive Summary blocks (Phase 5b, prototype screen 15) ─────────────
// The exec summary is a "generic" page type (no structured schema), but its
// Step 3 editor captures a welcome personal note (narrative row) and 3-5 top
// themes. Publish renders those as real content: a welcome paragraph block
// plus an ordered theme list, instead of one flat text dump.

export function buildExecutiveSummaryBlocks(
  authoring: PageAuthoring,
  nowIn?: string,
): ReportBlock[] {
  const now = nowIn ?? new Date().toISOString();
  const { narrativeParagraphs } = extractAuthoredText(authoring);
  const themesRaw = authoring.structured?.executiveSummary?.topThemes ?? "";
  const themes = themesRaw
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-•*]\s*)/, "").trim())
    .filter((line) => line.length > 0);

  const blocks: ReportBlock[] = [];
  if (narrativeParagraphs.length > 0) {
    blocks.push(
      makeBlock(
        "text",
        blocks.length,
        { html: paragraphsToHtml(narrativeParagraphs) },
        now,
      ),
    );
  }
  if (themes.length > 0) {
    blocks.push(
      makeBlock(
        "text",
        blocks.length,
        {
          html: `<h3>Top themes</h3><ol>${themes
            .map((t) => `<li>${escapeHtml(t)}</li>`)
            .join("")}</ol>`,
        },
        now,
      ),
    );
  }
  return blocks;
}

// ─── Publish QA audit (Phase 1, commit 3) ─────────────────────────────────
// Flags any structured-type page that would publish with zero structured
// fields, meaning it would render as bare paragraphs or an empty shell.
// The message lists the missing fields so the fix is actionable.

export interface StructuredContentIssue {
  page_key: string;
  title: string;
  pageType: StructuredPageType;
  missingFields: string[];
  message: string;
}

export interface AuditStructuredPagesInput {
  tocSections: Array<Pick<TocSection, "key" | "label" | "pages">>;
  authoring: Record<string, PageAuthoring>;
  pageSeeds: PageSeed[];
}

export function auditStructuredPages(
  input: AuditStructuredPagesInput,
): StructuredContentIssue[] {
  const issues: StructuredContentIssue[] = [];
  for (const section of input.tocSections) {
    for (const page of section.pages) {
      if (!page.selected) continue;
      const authoring: PageAuthoring = input.authoring[page.page_key] ?? {
        page_key: page.page_key,
        status: "draft",
        is_featured: false,
        content: [],
      };
      const seed = input.pageSeeds.find((s) => s.page_key === page.page_key);
      let payload: StructuredPagePayload | null = null;
      try {
        payload = buildStructuredPagePayload({
          page,
          sectionKey: section.key,
          sectionLabel: section.label,
          authoring,
          seed,
        });
      } catch {
        // A payload that fails schema validation is itself a blocking issue.
        issues.push({
          page_key: page.page_key,
          title: page.title,
          pageType: inferStructuredPageType(page, section.key) as StructuredPageType,
          missingFields: [],
          message: `"${page.title}" has content that fails the structured page schema. Review this page in Step 3 before publishing.`,
        });
        continue;
      }
      if (!payload) continue; // generic pages keep the block path

      const { columns, blocks, pageType } = payload;
      const primary = (blocks[0]?.content ?? {}) as Record<string, unknown>;
      const hasObservations =
        Array.isArray(columns.key_observations) &&
        columns.key_observations.length > 0;
      const hasCondition = typeof columns.condition_rating === "string";
      const hasSpecs = Array.isArray(columns.specs) && columns.specs.length > 0;
      const missingFields: string[] = [];
      let hasAnyStructuredField = false;

      if (pageType === "vision") {
        const hasVision =
          typeof primary.visionNarrativeHtml === "string" &&
          primary.visionNarrativeHtml.length > 0;
        const tiers = primary.tiers as
          | Array<{ priceLow?: unknown; priceHigh?: unknown }>
          | undefined;
        const hasPricedTiers = Boolean(
          tiers?.some(
            (t) =>
              typeof t?.priceLow === "number" ||
              typeof t?.priceHigh === "number",
          ),
        );
        if (!hasVision) missingFields.push("vision narrative");
        if (!hasPricedTiers) missingFields.push("priced investment tiers");
        if (!hasObservations) missingFields.push("key observations");
        hasAnyStructuredField = hasVision || hasPricedTiers || hasObservations;
      } else {
        if (!hasCondition) missingFields.push("condition rating");
        if (!hasObservations) missingFields.push("key observations");
        if (!hasSpecs) missingFields.push("specs");
        let hasIdentity = false;
        if (pageType === "system" || pageType === "appliance") {
          hasIdentity = [primary.make, primary.model, primary.installDate].some(
            (v) => typeof v === "string" && v.length > 0,
          );
          if (!hasIdentity) missingFields.push("make, model, or install year");
        }
        hasAnyStructuredField =
          hasCondition || hasObservations || hasSpecs || hasIdentity;
      }

      if (!hasAnyStructuredField) {
        issues.push({
          page_key: page.page_key,
          title: page.title,
          pageType,
          missingFields,
          message: `"${page.title}" has no structured content and would publish as bare paragraphs or an empty page. Add at least one of the following before publishing: ${missingFields.join(", ")}.`,
        });
      }
    }
  }
  return issues;
}
