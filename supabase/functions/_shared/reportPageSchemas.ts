// Structured content contract for report pages, edge-function side.
//
// This is a port of src/lib/reportPageSchemas.ts (Master UX Rebuild Phase 1)
// for the Deno edge runtime, extended with the MCP authoring guardrails
// (Phase 6). The base content schemas here MUST stay shape-identical to the
// src/lib module; src/lib/mcpPageMapping.test.ts enforces parity at test
// time by validating the same fixtures through both modules.
//
// The `zod` import is a bare specifier on purpose: Deno resolves it through
// supabase/functions/import_map.json (npm:zod pinned to the app's version)
// and vitest resolves it through node_modules, so one file serves both
// runtimes. Keep this module pure: no Deno.*, no React, no Supabase.

import { z } from "zod";

// ─── Shared primitives (ported verbatim from src/lib) ─────────────────────

export const conditionRatingSchema = z.enum([
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Critical",
]);
export type ConditionRatingValue = z.infer<typeof conditionRatingSchema>;

export const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});
export type SpecItem = z.infer<typeof specItemSchema>;

export const tierSchema = z.object({
  priceLow: z.number().nonnegative(),
  priceHigh: z.number().nonnegative(),
  description: z.string().min(1),
  recommended: z.boolean().optional(),
});
export type Tier = z.infer<typeof tierSchema>;

export const tierSetSchema = z.object({
  essential: tierSchema,
  enhanced: tierSchema,
  signature: tierSchema,
});
export type TierSet = z.infer<typeof tierSetSchema>;

export const linkedVisionProjectSchema = z.object({
  pageKey: z.string().optional(),
  title: z.string().min(1),
  priority: z.string().optional(),
});
export type LinkedVisionProject = z.infer<typeof linkedVisionProjectSchema>;

// ─── Room pages ───────────────────────────────────────────────────────────

export const roomFinishesSchema = z.object({
  wallPaint: z.string().optional(),
  trimPaint: z.string().optional(),
  ceilingPaint: z.string().optional(),
  flooring: z.string().optional(),
});
export type RoomFinishes = z.infer<typeof roomFinishesSchema>;

export const roomFixturesSchema = z.object({
  lighting: z.string().optional(),
  outlets: z.string().optional(),
  windows: z.string().optional(),
  doors: z.string().optional(),
});
export type RoomFixtures = z.infer<typeof roomFixturesSchema>;

export const roomPageContentSchema = z.object({
  dims: z.string().optional(),
  floorSqft: z.number().positive().optional(),
  ceiling: z.string().optional(),
  floorLevel: z.string().optional(),
  finishes: roomFinishesSchema.optional(),
  fixtures: roomFixturesSchema.optional(),
  observations: z.array(z.string().min(1)).default([]),
  conditionRating: conditionRatingSchema.optional(),
  specs: z.array(specItemSchema).default([]),
  linkedVisionProjects: z.array(linkedVisionProjectSchema).default([]),
});
export type RoomPageContent = z.infer<typeof roomPageContentSchema>;

// ─── System pages ─────────────────────────────────────────────────────────

export const replacementBriefingSchema = z.object({
  capacity: z.string().optional(),
  voltage: z.string().optional(),
  gasLine: z.string().optional(),
  condensate: z.string().optional(),
  ductworkNotes: z.string().optional(),
  accessNotes: z.string().optional(),
  tiers: tierSetSchema.optional(),
});
export type ReplacementBriefing = z.infer<typeof replacementBriefingSchema>;

export const systemPageContentSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  installDate: z.string().optional(),
  lifespanYears: z.number().positive().optional(),
  currentAgeYears: z.number().nonnegative().optional(),
  conditionRating: conditionRatingSchema.optional(),
  statusFlags: z.array(z.string().min(1)).default([]),
  specs: z.array(specItemSchema).default([]),
  observations: z.array(z.string().min(1)).default([]),
  replacementBriefing: replacementBriefingSchema.optional(),
});
export type SystemPageContent = z.infer<typeof systemPageContentSchema>;

// ─── Appliance pages (simplified system) ──────────────────────────────────

export const appliancePageContentSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  installDate: z.string().optional(),
  conditionRating: conditionRatingSchema.optional(),
  specs: z.array(specItemSchema).default([]),
  observations: z.array(z.string().min(1)).default([]),
});
export type AppliancePageContent = z.infer<typeof appliancePageContentSchema>;

// ─── Vision pages ─────────────────────────────────────────────────────────

export const visionPageContentSchema = z.object({
  vision: z.string().optional(),
  whyDesignFirst: z.string().optional(),
  designPhaseWeeks: z.number().positive().optional(),
  designPhaseCost: z.number().nonnegative().optional(),
  tiers: tierSetSchema.optional(),
  executionPath: z.string().optional(),
  priorityWindow: z.string().optional(),
  category: z.string().optional(),
  observations: z.array(z.string().min(1)).default([]),
});
export type VisionPageContent = z.infer<typeof visionPageContentSchema>;

// ─── Page-type registry ───────────────────────────────────────────────────

export type StructuredPageType = "room" | "system" | "appliance" | "vision";

export const STRUCTURED_PAGE_TYPES: readonly StructuredPageType[] = [
  "room",
  "system",
  "appliance",
  "vision",
];

// ─── Validation helpers (ported) ──────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}

export function runValidation<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  value: unknown,
): ValidationResult<T> {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return { success: true, data: parsed.data, errors: [] };
  }
  return {
    success: false,
    errors: parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    }),
  };
}

export function normalizeConditionRating(
  value: unknown,
): ConditionRatingValue | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const candidate =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  const parsed = conditionRatingSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}

// ═══ MCP authoring guardrails (Phase 6, edge-only additions) ══════════════
//
// Everything below layers on top of the base content schemas: hard caps on
// prose length, no em-dashes anywhere in client copy (locked principle),
// and per-tool argument envelopes. These make it structurally impossible
// for an MCP author to write a wall of text.

const NO_EM_DASH_MESSAGE =
  "Em-dashes are not permitted in client copy. Use a comma or semicolon.";

function noEmDash(max: number) {
  return z
    .string()
    .min(1)
    .max(max)
    .refine((v) => !v.includes("—"), NO_EM_DASH_MESSAGE);
}

/** Short free-text field (labels, spec values, status flags). */
export const mcpShortText = noEmDash(160);
/** One observation bullet: a sentence or two, never a paragraph dump. */
export const mcpObservation = noEmDash(400);
/** One body paragraph inside a generic-page section. */
export const mcpParagraph = noEmDash(900);
/** Narrative prose fields (room narrative, vision statement). Split into
 * paragraphs at blank lines by the mapping layer. */
export const mcpNarrative = noEmDash(2400);

export const pageKeySchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,79}$/,
    "page_key must be lowercase kebab-case (e.g. primary-suite, hvac-furnace)",
  );

export const reportIdSchema = z.string().uuid("report_id must be a UUID");

const pageEnvelope = {
  report_id: reportIdSchema,
  page_key: pageKeySchema,
  title: noEmDash(120),
  group: noEmDash(60),
};

export const mcpSpecItemSchema = z.object({
  label: mcpShortText,
  value: mcpShortText,
});

const mcpObservationsSchema = z.array(mcpObservation).max(12).default([]);

export const mcpTierSchema = z.object({
  priceLow: z.number().positive(),
  priceHigh: z.number().positive(),
  description: noEmDash(600),
  recommended: z.boolean().optional(),
});

export const mcpTierSetSchema = z.object({
  essential: mcpTierSchema,
  enhanced: mcpTierSchema,
  signature: mcpTierSchema,
});

// ── upsert_room_page ──────────────────────────────────────────────────────

export const mcpRoomContentSchema = z.object({
  narrative: mcpNarrative.optional(),
  dims: mcpShortText.optional(),
  floorSqft: z.number().positive().optional(),
  ceiling: mcpShortText.optional(),
  floorLevel: mcpShortText.optional(),
  finishes: z
    .object({
      wallPaint: mcpShortText.optional(),
      trimPaint: mcpShortText.optional(),
      ceilingPaint: mcpShortText.optional(),
      flooring: mcpShortText.optional(),
    })
    .optional(),
  fixtures: z
    .object({
      lighting: mcpShortText.optional(),
      outlets: mcpShortText.optional(),
      windows: mcpShortText.optional(),
      doors: mcpShortText.optional(),
    })
    .optional(),
  observations: mcpObservationsSchema,
  conditionRating: conditionRatingSchema.optional(),
  specs: z.array(mcpSpecItemSchema).max(12).default([]),
});
export type McpRoomContent = z.infer<typeof mcpRoomContentSchema>;

export const upsertRoomPageArgsSchema = z.object({
  ...pageEnvelope,
  content: mcpRoomContentSchema,
});
export type UpsertRoomPageArgs = z.infer<typeof upsertRoomPageArgsSchema>;

// ── upsert_system_page ────────────────────────────────────────────────────

export const mcpReplacementBriefingSchema = z.object({
  capacity: mcpShortText.optional(),
  voltage: mcpShortText.optional(),
  gasLine: mcpShortText.optional(),
  condensate: mcpShortText.optional(),
  ductworkNotes: noEmDash(400).optional(),
  accessNotes: noEmDash(400).optional(),
  tiers: mcpTierSetSchema.optional(),
});

export const mcpSystemContentSchema = z.object({
  narrative: mcpNarrative.optional(),
  make: mcpShortText.optional(),
  model: mcpShortText.optional(),
  serial: mcpShortText.optional(),
  installDate: mcpShortText.optional(),
  lifespanYears: z.number().positive().optional(),
  currentAgeYears: z.number().nonnegative().optional(),
  conditionRating: conditionRatingSchema.optional(),
  statusFlags: z.array(mcpShortText).max(4).default([]),
  specs: z.array(mcpSpecItemSchema).max(16).default([]),
  observations: mcpObservationsSchema,
  needsBriefing: z.boolean().optional(),
  replacementBriefing: mcpReplacementBriefingSchema.optional(),
});
export type McpSystemContent = z.infer<typeof mcpSystemContentSchema>;

export const upsertSystemPageArgsSchema = z.object({
  ...pageEnvelope,
  is_appliance: z.boolean().default(false),
  content: mcpSystemContentSchema,
});
export type UpsertSystemPageArgs = z.infer<typeof upsertSystemPageArgsSchema>;

// ── upsert_vision_page ────────────────────────────────────────────────────

export const mcpVisionContentSchema = z.object({
  vision: mcpNarrative,
  whyDesignFirst: noEmDash(1600).optional(),
  designPhaseWeeks: z.number().positive().optional(),
  designPhaseCost: z.number().nonnegative().optional(),
  tiers: mcpTierSetSchema.optional(),
  executionPath: noEmDash(1600).optional(),
  priorityWindow: mcpShortText.optional(),
  category: mcpShortText.optional(),
  observations: mcpObservationsSchema,
});
export type McpVisionContent = z.infer<typeof mcpVisionContentSchema>;

export const upsertVisionPageArgsSchema = z.object({
  ...pageEnvelope,
  content: mcpVisionContentSchema,
});
export type UpsertVisionPageArgs = z.infer<typeof upsertVisionPageArgsSchema>;

// ── upsert_generic_page (Information-chapter pages) ───────────────────────

export const mcpGenericSectionSchema = z.object({
  heading: noEmDash(120),
  paragraphs: z.array(mcpParagraph).min(1).max(6),
});
export type McpGenericSection = z.infer<typeof mcpGenericSectionSchema>;

export const upsertGenericPageArgsSchema = z.object({
  ...pageEnvelope,
  sections: z.array(mcpGenericSectionSchema).min(1).max(12),
});
export type UpsertGenericPageArgs = z.infer<typeof upsertGenericPageArgsSchema>;

// ── Strategy tools ────────────────────────────────────────────────────────

export const mcpCapitalPlanItemSchema = z.object({
  projectName: noEmDash(120),
  phase: z.enum(["defense", "offense", "expansion"]),
  yearStart: z.number().int().min(2000).max(2100),
  yearEnd: z.number().int().min(2000).max(2100).optional(),
  costLow: z.number().nonnegative().optional(),
  costHigh: z.number().nonnegative().optional(),
});
export type McpCapitalPlanItem = z.infer<typeof mcpCapitalPlanItemSchema>;

export const setCapitalPlanArgsSchema = z.object({
  report_id: reportIdSchema,
  startYear: z.number().int().min(2000).max(2100).optional(),
  items: z.array(mcpCapitalPlanItemSchema).min(1).max(30),
});
export type SetCapitalPlanArgs = z.infer<typeof setCapitalPlanArgsSchema>;

export const mcpRecurringServiceSchema = z.object({
  category: mcpShortText,
  serviceName: noEmDash(120),
  vendorName: noEmDash(120).optional(),
  frequency: mcpShortText,
  costPerVisit: z.number().nonnegative().optional(),
  annualCost: z.number().nonnegative().optional(),
  hbcManaged: z.boolean().default(false),
});
export type McpRecurringService = z.infer<typeof mcpRecurringServiceSchema>;

export const setRecurringServicesArgsSchema = z.object({
  report_id: reportIdSchema,
  services: z.array(mcpRecurringServiceSchema).min(1).max(40),
});
export type SetRecurringServicesArgs = z.infer<
  typeof setRecurringServicesArgsSchema
>;

export const mcpMaintenanceTaskSchema = z.object({
  task: mcpShortText,
  system: mcpShortText,
});
export type McpMaintenanceTask = z.infer<typeof mcpMaintenanceTaskSchema>;

const seasonTasks = z.array(mcpMaintenanceTaskSchema).max(20).default([]);

export const setMaintenanceCalendarArgsSchema = z.object({
  report_id: reportIdSchema,
  seasons: z.object({
    spring: seasonTasks,
    summer: seasonTasks,
    fall: seasonTasks,
    winter: seasonTasks,
  }),
});
export type SetMaintenanceCalendarArgs = z.infer<
  typeof setMaintenanceCalendarArgsSchema
>;

// ── Read + publish tools ──────────────────────────────────────────────────

export const listPropertiesArgsSchema = z.object({}).strict();

export const getReportArgsSchema = z.object({ report_id: reportIdSchema });

export const getPageArgsSchema = z.object({
  report_id: reportIdSchema,
  page_key: pageKeySchema,
});

export const runPublishQaArgsSchema = z.object({ report_id: reportIdSchema });

export const publishReportArgsSchema = z.object({
  report_id: reportIdSchema,
  confirm: z.literal("PUBLISH", {
    errorMap: () => ({
      message:
        'publish_report requires confirm to be the literal string "PUBLISH"',
    }),
  }),
});
export type PublishReportArgs = z.infer<typeof publishReportArgsSchema>;
