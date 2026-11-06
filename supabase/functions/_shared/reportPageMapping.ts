// MCP tool payload → report_pages row/blocks mapping (Phase 6).
//
// This is the edge-side port of the pure mapping logic in
// src/lib/wizardPublishMapping.ts. The wizard's Step 5 and the MCP bridge
// MUST produce identical blocks and structured columns for equivalent
// content; src/lib/mcpPageMapping.test.ts asserts that parity against the
// wizard module directly.
//
// Keep this module pure: no Deno.*, no Supabase, no React. The only
// runtime API used is crypto.randomUUID (available in Deno, browsers, and
// Node >= 19 / vitest).

import {
  type ConditionRatingValue,
  type McpCapitalPlanItem,
  type McpGenericSection,
  type McpMaintenanceTask,
  type McpRecurringService,
  type McpRoomContent,
  type McpSystemContent,
  type McpVisionContent,
  normalizeConditionRating,
  roomPageContentSchema,
  appliancePageContentSchema,
  systemPageContentSchema,
  visionPageContentSchema,
  tierSetSchema,
  type ReplacementBriefing,
  type SpecItem,
  type StructuredPageType,
  type TierSet,
} from "./reportPageSchemas.ts";

// ─── Block model (structural copy of src/components/wysiwyg/types.ts) ─────

export type ColSpan = 1 | 2 | 3 | 4 | 6 | 12;

export interface ReportBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  colSpan: ColSpan;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Default content for the two template-seeded block types the mapping
// needs. Mirrors BLOCK_TEMPLATES in src/components/wysiwyg/types.ts;
// src/lib/mcpPageMapping.test.ts asserts deep equality against the app's
// templates so the copies cannot drift silently.

export const REPLACEMENT_BRIEFING_DEFAULT_CONTENT: Record<string, unknown> = {
  systemType: "System",
  headline: "Pre-scoped, pre-priced, ready when you are",
  intro:
    "When you are ready to replace this system, tap below. We send our trade partner a complete briefing so they arrive with everything they need. No site visit. No re-measuring. No surprise change orders.",
  tiers: [
    { id: "essential", label: "Essential", recommended: false },
    { id: "enhanced", label: "Enhanced", recommended: true },
    { id: "signature", label: "Signature", recommended: false },
  ],
  photos: [],
  ctas: [
    {
      id: "emergency",
      label: "Help, this isn't working",
      style: "rust",
      action: "open_concierge",
      prompt: "My {systemType} just stopped working. I need help today.",
    },
    {
      id: "plan",
      label: "Plan my replacement",
      style: "gold",
      action: "open_concierge",
      prompt: "I want to start planning the replacement for my {systemType}.",
    },
  ],
};

export const VISION_PROJECT_DEFAULT_CONTENT: Record<string, unknown> = {
  projectTitle: "New Vision Project",
  tiers: [
    { id: "essential", label: "Essential", recommended: false },
    { id: "enhanced", label: "Enhanced", recommended: true },
    { id: "signature", label: "Signature", recommended: false },
  ],
  executionPathHtml:
    "When you are ready to start, this can be executed through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you would prefer a different contractor, we will connect you with a vetted HBC trade partner. The choice is always yours. Either way, you stay in the same conversation with HBC.",
  akrDisclosed: true,
};

function cloneContent(content: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
}

// ─── HTML helpers (ported from wizardPublishMapping) ──────────────────────

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

export function splitNarrative(narrative: string | undefined): string[] {
  return (narrative ?? "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);
}

function observationsToHtml(paragraphs: string[], lines: string[]): string {
  const parts: string[] = [];
  if (paragraphs.length > 0) parts.push(paragraphsToHtml(paragraphs));
  if (lines.length > 0) {
    parts.push(
      `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`,
    );
  }
  return parts.join("");
}

// ─── Block + cleanup helpers (ported) ─────────────────────────────────────

function makeBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeBlock(
  type: string,
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

// Only a fully-priced Essential/Enhanced/Signature triple publishes;
// partial tiers are worse than none (locked: no invented pricing).
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
  const priced = Object.values(parsed.data).every(
    (t) => t.priceLow > 0 && t.priceHigh > 0,
  );
  return priced ? parsed.data : null;
}

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

// ─── Structured payload (shared shape with the wizard) ────────────────────

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
  pageType: StructuredPageType | "generic";
  blocks: ReportBlock[];
  columns: StructuredPageColumns;
}

export const EMPTY_COLUMNS: StructuredPageColumns = {
  condition_rating: null,
  specs: null,
  key_observations: null,
  tiers: null,
  current_age_years: null,
  expected_lifespan_years: null,
  maintenance: null,
  images: null,
};

// ─── Room mapping ─────────────────────────────────────────────────────────

export interface RoomPageInput {
  title: string;
  group: string;
  content: McpRoomContent;
  now: string;
}

export function buildRoomPagePayload(input: RoomPageInput): StructuredPagePayload {
  const { title, group, content: raw, now } = input;
  const narrativeParagraphs = splitNarrative(raw.narrative);
  const bullets = (raw.observations ?? [])
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const dims = cleanString(raw.dims);
  const floorSqft = cleanPositive(raw.floorSqft);
  const ceiling = cleanString(raw.ceiling);
  const floorLevel = cleanString(raw.floorLevel);
  const finishes = {
    wallPaint: cleanString(raw.finishes?.wallPaint),
    trimPaint: cleanString(raw.finishes?.trimPaint),
    ceilingPaint: cleanString(raw.finishes?.ceilingPaint),
    flooring: cleanString(raw.finishes?.flooring),
  };
  const fixtures = {
    lighting: cleanString(raw.fixtures?.lighting),
    outlets: cleanString(raw.fixtures?.outlets),
    windows: cleanString(raw.fixtures?.windows),
    doors: cleanString(raw.fixtures?.doors),
  };

  // Metadata-strip specs derive from the structured dims when present,
  // matching the wizard's room mapping; caller-provided specs otherwise.
  const derivedSpecs: SpecItem[] = [];
  if (dims) derivedSpecs.push({ label: "Dimensions", value: dims });
  if (floorSqft) {
    derivedSpecs.push({ label: "Floor Area", value: `${floorSqft} sqft` });
  }
  if (ceiling) derivedSpecs.push({ label: "Ceiling", value: ceiling });
  if (floorLevel) derivedSpecs.push({ label: "Level", value: floorLevel });
  const specs = derivedSpecs.length > 0 ? derivedSpecs : (raw.specs ?? []);

  const observations = [...narrativeParagraphs, ...bullets];
  const content = roomPageContentSchema.parse({
    dims,
    floorSqft,
    ceiling,
    floorLevel,
    finishes,
    fixtures,
    observations,
    conditionRating: normalizeConditionRating(raw.conditionRating),
    specs,
    linkedVisionProjects: [],
  });
  const observationsHtml = observationsToHtml(narrativeParagraphs, bullets);
  const blocks: ReportBlock[] = [
    makeBlock(
      "room_record",
      0,
      {
        roomName: title,
        roomGroup: group,
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
        linkedVisionProjects: [],
      },
      now,
    ),
  ];
  return {
    pageType: "room",
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

// ─── System / appliance mapping ───────────────────────────────────────────

export interface SystemPageInput {
  title: string;
  group: string;
  isAppliance: boolean;
  content: McpSystemContent;
  now: string;
}

export function buildSystemPagePayload(
  input: SystemPageInput,
): StructuredPagePayload {
  const { title, isAppliance, content: raw, now } = input;
  const pageType: StructuredPageType = isAppliance ? "appliance" : "system";
  const narrativeParagraphs = splitNarrative(raw.narrative);
  const bullets = (raw.observations ?? [])
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const make = cleanString(raw.make);
  const model = cleanString(raw.model);
  const serial = cleanString(raw.serial);
  const installDate = cleanString(raw.installDate);
  const lifespanYears = cleanPositive(raw.lifespanYears);
  const installYear = installDate
    ? Number.parseInt(installDate.slice(0, 4), 10)
    : Number.NaN;
  const currentAgeYears =
    cleanNonNegative(raw.currentAgeYears) ??
    (Number.isFinite(installYear)
      ? Math.max(0, new Date().getFullYear() - installYear)
      : undefined);
  const statusFlags = (raw.statusFlags ?? [])
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
  const observations = [...narrativeParagraphs, ...bullets];

  const briefingIn = raw.replacementBriefing;
  const briefingTiers = !isAppliance ? cleanTierSet(briefingIn?.tiers) : null;
  const briefing: ReplacementBriefing | undefined =
    !isAppliance && briefingIn
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

  const derivedSpecs: SpecItem[] = [];
  if (make) derivedSpecs.push({ label: "Make", value: make });
  if (model) derivedSpecs.push({ label: "Model", value: model });
  if (serial) derivedSpecs.push({ label: "Serial Number", value: serial });
  if (installDate) {
    derivedSpecs.push({ label: "Installed", value: installDate });
  }
  if (!isAppliance && lifespanYears) {
    derivedSpecs.push({
      label: "Typical Lifespan",
      value: `${lifespanYears} years`,
    });
  }
  if (!isAppliance && typeof currentAgeYears === "number") {
    derivedSpecs.push({
      label: "Current Age",
      value: `${currentAgeYears} years`,
    });
  }
  const coveredLabels = /make|model|serial|install|lifespan|age/i;
  const providedSpecs = raw.specs ?? [];
  const extraSpecs = providedSpecs.filter((s) => !coveredLabels.test(s.label));
  const specs =
    derivedSpecs.length > 0 ? [...derivedSpecs, ...extraSpecs] : providedSpecs;

  const schema = isAppliance
    ? appliancePageContentSchema
    : systemPageContentSchema;
  const content = schema.parse({
    make,
    model,
    serial,
    installDate,
    ...(isAppliance
      ? {}
      : {
          lifespanYears,
          currentAgeYears,
          statusFlags,
          replacementBriefing: briefingHasContent ? briefing : undefined,
        }),
    conditionRating: normalizeConditionRating(raw.conditionRating),
    specs,
    observations,
  });

  const blocks: ReportBlock[] = [
    makeBlock(
      "system_record",
      0,
      {
        systemName: title,
        isAppliance,
        status: statusFlags[0],
        conditionRating: content.conditionRating,
        make: content.make,
        model: content.model,
        serial,
        installDate: content.installDate,
        typicalLifespanYears: !isAppliance ? lifespanYears : undefined,
        specifications: extraSpecs,
        maintenanceLog: [],
        routineCareItems: [],
        photos: {},
      },
      now,
    ),
  ];

  if (!isAppliance && (raw.needsBriefing || briefingHasContent)) {
    const briefingContent = cloneContent(REPLACEMENT_BRIEFING_DEFAULT_CONTENT);
    briefingContent.systemType = title;
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
        !isAppliance && typeof currentAgeYears === "number"
          ? currentAgeYears
          : null,
      expected_lifespan_years:
        !isAppliance && lifespanYears ? lifespanYears : null,
    },
  };
}

// ─── Vision mapping ───────────────────────────────────────────────────────

export interface VisionPageInput {
  title: string;
  content: McpVisionContent;
  now: string;
}

export function buildVisionPagePayload(
  input: VisionPageInput,
): StructuredPagePayload {
  const { title, content: raw, now } = input;
  const narrativeParagraphs = splitNarrative(raw.vision);
  const bullets = (raw.observations ?? [])
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const visionDefaults = cloneContent(VISION_PROJECT_DEFAULT_CONTENT);
  const defaultExecutionPathHtml =
    typeof visionDefaults.executionPathHtml === "string"
      ? visionDefaults.executionPathHtml
      : undefined;
  const whyDesignFirst = cleanString(raw.whyDesignFirst);
  const designPhaseWeeks = cleanPositive(raw.designPhaseWeeks);
  const designPhaseCost = cleanNonNegative(raw.designPhaseCost);
  const visionTiers = cleanTierSet(raw.tiers);
  const priorityWindow = cleanString(raw.priorityWindow);
  const category = cleanString(raw.category);
  const executionPathHtml =
    cleanString(raw.executionPath) ?? defaultExecutionPathHtml;

  const content = visionPageContentSchema.parse({
    vision: narrativeParagraphs.join("\n\n") || undefined,
    whyDesignFirst,
    designPhaseWeeks,
    designPhaseCost,
    tiers: visionTiers ?? undefined,
    executionPath: executionPathHtml,
    priorityWindow,
    category,
    observations: bullets,
  });

  const whyDesignFirstParagraphs = whyDesignFirst
    ? splitNarrative(whyDesignFirst)
    : [];
  const blocks: ReportBlock[] = [
    makeBlock(
      "vision_project",
      0,
      {
        projectTitle: title,
        category: content.category,
        priority: content.priorityWindow,
        visionNarrativeHtml:
          narrativeParagraphs.length > 0
            ? paragraphsToHtml(narrativeParagraphs)
            : undefined,
        designFeeEducationHtml:
          whyDesignFirstParagraphs.length > 0
            ? paragraphsToHtml(whyDesignFirstParagraphs)
            : undefined,
        designFeeLow: designPhaseCost,
        designPhaseWeeks,
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
    pageType: "vision",
    blocks,
    columns: {
      ...EMPTY_COLUMNS,
      condition_rating: null,
      key_observations:
        content.observations.length > 0 ? content.observations : null,
      tiers: visionTiers,
    },
  };
}

// ─── Generic (Information-chapter) mapping ────────────────────────────────

export function buildGenericPageBlocks(
  sections: McpGenericSection[],
  now: string,
): ReportBlock[] {
  return sections.map((section, idx) =>
    makeBlock(
      "text",
      idx,
      {
        html: `<h3>${escapeHtml(section.heading)}</h3>${paragraphsToHtml(section.paragraphs)}`,
      },
      now,
    ),
  );
}

// ─── Strategy block builders (match Step5Publish injection exactly) ───────

export function buildCapitalPlanBlock(
  items: McpCapitalPlanItem[],
  now: string,
  order: number,
  startYear?: number,
): ReportBlock {
  return makeBlock(
    "capital_plan",
    order,
    {
      eyebrow: "Strategic Roadmap",
      title: "10-Year Capital Plan",
      startYear: startYear ?? new Date().getFullYear(),
      items: items.map((item, idx) => ({
        projectName: item.projectName,
        phase: item.phase,
        yearStart: item.yearStart,
        yearEnd: item.yearEnd ?? item.yearStart,
        costLow: item.costLow,
        costHigh: item.costHigh,
        displayOrder: idx,
      })),
    },
    now,
  );
}

export function buildRecurringServicesBlock(
  services: McpRecurringService[],
  now: string,
  order: number,
): ReportBlock {
  return makeBlock(
    "recurring_services_register",
    order,
    {
      title: "Recurring Services Register",
      services: services.map((s) => ({
        category: s.category,
        serviceName: s.serviceName,
        vendorName: s.vendorName || undefined,
        frequency: s.frequency,
        costPerVisit: s.costPerVisit || undefined,
        annualCost: s.annualCost || undefined,
        monthlyCost: s.annualCost ? Math.round(s.annualCost / 12) : undefined,
        hbcManaged: s.hbcManaged,
        status: "current" as const,
      })),
    },
    now,
  );
}

export interface MaintenanceSeasonsInput {
  spring: McpMaintenanceTask[];
  summer: McpMaintenanceTask[];
  fall: McpMaintenanceTask[];
  winter: McpMaintenanceTask[];
}

export function buildMaintenanceCalendarBlock(
  seasons: MaintenanceSeasonsInput,
  now: string,
  order: number,
): ReportBlock {
  const mapSeason = (tasks: McpMaintenanceTask[]) =>
    tasks.map((t) => ({ description: `${t.task} (${t.system})` }));
  return makeBlock(
    "maintenance_calendar",
    order,
    {
      eyebrow: "The annual cadence",
      title: "Maintenance Calendar",
      spring: mapSeason(seasons.spring),
      summer: mapSeason(seasons.summer),
      fall: mapSeason(seasons.fall),
      winter: mapSeason(seasons.winter),
    },
    now,
  );
}

/** Replace the first block of `type` in-place (preserving its order slot)
 * or append when the page has none. Used by the set_* strategy tools so a
 * re-run updates the block instead of stacking duplicates. */
export function replaceBlockOfType(
  blocks: ReportBlock[],
  next: ReportBlock,
): ReportBlock[] {
  const idx = blocks.findIndex((b) => b?.type === next.type);
  if (idx === -1) {
    return [...blocks, { ...next, order: blocks.length }];
  }
  const out = [...blocks];
  out[idx] = { ...next, order: blocks[idx].order };
  return out;
}

// ─── Page-type inference (ported, driven by group_name) ───────────────────

export function sectionKeyFromGroup(groupName: string): string {
  const g = (groupName || "").toLowerCase();
  if (g.includes("system") || g.includes("appliance")) return "systems_appliances";
  if (g.includes("interior") || g.includes("exterior") || g.includes("space")) {
    return "spaces";
  }
  if (g.includes("strategy")) return "strategy";
  return "information";
}

export function inferStructuredPageType(
  page: { page_key: string; group: string },
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

// ─── Publish QA audit (server-side port of auditStructuredPages) ──────────
//
// Operates on report_pages rows instead of wizard state: same
// missing-structured-content rules, plus wall-of-text detection so legacy
// flattened prose cannot slip through the MCP publish gate.

export interface ReportPageRowLike {
  page_key: string;
  title: string;
  group_name: string;
  status?: string;
  narrative: unknown;
  condition_rating: string | null;
  specs: unknown;
  key_observations: unknown;
  tiers: unknown;
}

export interface PageQaIssue {
  page_key: string;
  title: string;
  pageType: StructuredPageType | "generic";
  kind: "missing_structured" | "wall_of_text";
  missingFields: string[];
  message: string;
}

function rowBlocks(row: ReportPageRowLike): Array<Record<string, unknown>> {
  if (!Array.isArray(row.narrative)) return [];
  return row.narrative.filter(
    (b): b is Record<string, unknown> => b != null && typeof b === "object",
  );
}

// A generic-page text block reads as a wall of text when it is long AND
// carries no structure (no heading, no list). Structured page types must
// not carry bare text blocks at all.
const WALL_OF_TEXT_CHARS = 1500;

function isUnstructuredWall(html: string): boolean {
  if (html.length <= WALL_OF_TEXT_CHARS) return false;
  return !/<(h[1-4]|ul|ol|table)\b/i.test(html);
}

export function auditReportPageRows(
  rows: ReportPageRowLike[],
): PageQaIssue[] {
  const issues: PageQaIssue[] = [];
  for (const row of rows) {
    const sectionKey = sectionKeyFromGroup(row.group_name);
    const pageType = inferStructuredPageType(
      { page_key: row.page_key, group: row.group_name },
      sectionKey,
    );
    const blocks = rowBlocks(row);

    if (pageType === "generic") {
      for (const block of blocks) {
        const content = (block.content ?? {}) as Record<string, unknown>;
        const html = typeof content.html === "string" ? content.html : "";
        if (
          (block.type === "text" || block.type === "ai_narrative") &&
          isUnstructuredWall(html)
        ) {
          issues.push({
            page_key: row.page_key,
            title: row.title,
            pageType,
            kind: "wall_of_text",
            missingFields: [],
            message: `"${row.title}" contains a ${html.length}-character text block with no headings or lists. Break it into sections with headings and short paragraphs (upsert_generic_page does this automatically).`,
          });
          break;
        }
      }
      continue;
    }

    // Structured pages: bare prose blocks are a wall-of-text violation.
    const proseBlock = blocks.find(
      (b) => b.type === "text" || b.type === "ai_narrative",
    );
    if (proseBlock) {
      issues.push({
        page_key: row.page_key,
        title: row.title,
        pageType,
        kind: "wall_of_text",
        missingFields: [],
        message: `"${row.title}" is a ${pageType} page but contains a flat ${String(proseBlock.type)} block. Re-author it through the structured upsert tool so it renders as a ${pageType} record, not paragraphs.`,
      });
    }

    const expectedPrimaryType =
      pageType === "vision" ? "vision_project" : pageType === "room" ? "room_record" : "system_record";
    const primaryBlock = blocks.find((b) => b.type === expectedPrimaryType);
    const primary = (primaryBlock?.content ?? {}) as Record<string, unknown>;

    const keyObservations = Array.isArray(row.key_observations)
      ? row.key_observations
      : [];
    const hasObservations = keyObservations.length > 0;
    const hasCondition = typeof row.condition_rating === "string";
    const specsArr = Array.isArray(row.specs) ? row.specs : [];
    const hasSpecs = specsArr.length > 0;
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
            typeof t?.priceLow === "number" || typeof t?.priceHigh === "number",
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
        page_key: row.page_key,
        title: row.title,
        pageType,
        kind: "missing_structured",
        missingFields,
        message: `"${row.title}" has no structured content and would publish as bare paragraphs or an empty page. Add at least one of the following before publishing: ${missingFields.join(", ")}.`,
      });
    }
  }
  return issues;
}

// ─── Populated/missing field summary for get_report ───────────────────────

export interface PageFieldSummary {
  page_key: string;
  title: string;
  group: string;
  status: string;
  pageType: StructuredPageType | "generic";
  populatedFields: string[];
  missingFields: string[];
}

export function summarizePageFields(row: ReportPageRowLike): PageFieldSummary {
  const sectionKey = sectionKeyFromGroup(row.group_name);
  const pageType = inferStructuredPageType(
    { page_key: row.page_key, group: row.group_name },
    sectionKey,
  );
  const blocks = rowBlocks(row);
  const populated: string[] = [];
  if (typeof row.condition_rating === "string") populated.push("condition_rating");
  if (Array.isArray(row.specs) && row.specs.length > 0) populated.push("specs");
  if (Array.isArray(row.key_observations) && row.key_observations.length > 0) {
    populated.push("key_observations");
  }
  if (row.tiers != null) populated.push("tiers");
  for (const b of blocks) {
    if (typeof b.type === "string" && !populated.includes(`block:${b.type}`)) {
      populated.push(`block:${b.type}`);
    }
  }
  const issues = auditReportPageRows([row]);
  const missing = issues.flatMap((i) => i.missingFields);
  return {
    page_key: row.page_key,
    title: row.title,
    group: row.group_name,
    status: row.status ?? "draft",
    pageType,
    populatedFields: populated,
    missingFields: missing,
  };
}
