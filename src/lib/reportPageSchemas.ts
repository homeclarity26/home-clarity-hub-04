// Structured content contract for report pages (Master UX Rebuild Phase 1).
//
// This module is the single source of truth for what a page IS. The wizard
// publish flow, the publish QA gate, the portal read path, and (later) the
// MCP authoring bridge all validate against these schemas. Everything here
// is pure: no imports from React, Supabase, or component code, and no side
// effects. An `undefined` field always means "Not yet documented", never
// "empty string" or invented data.

import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────

// Word-based condition ratings only. Mirrors the ConditionRating union in
// src/components/wysiwyg/types.ts. No numeric health scores, ever.
export const conditionRatingSchema = z.enum([
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Critical",
]);
export type ConditionRatingValue = z.infer<typeof conditionRatingSchema>;

// One label/value row in a spec grid (make, capacity, filter size, ...).
export const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});
export type SpecItem = z.infer<typeof specItemSchema>;

// One investment tier. When a tier is present it must carry a real price
// range and description; partially-invented tiers are worse than none.
export const tierSchema = z.object({
  priceLow: z.number().nonnegative(),
  priceHigh: z.number().nonnegative(),
  description: z.string().min(1),
  recommended: z.boolean().optional(),
});
export type Tier = z.infer<typeof tierSchema>;

// The canonical Essential / Enhanced / Signature triple used by replacement
// briefings and vision projects. All three tiers are required when a tier
// set exists at all; a page without pricing simply omits the whole set.
export const tierSetSchema = z.object({
  essential: tierSchema,
  enhanced: tierSchema,
  signature: tierSchema,
});
export type TierSet = z.infer<typeof tierSetSchema>;

// Small reference chip from a room to a vision project. Full vision detail
// lives on the vision page itself.
export const linkedVisionProjectSchema = z.object({
  pageKey: z.string().optional(),
  title: z.string().min(1),
  priority: z.string().optional(), // e.g. "Year 1-2"
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
  dims: z.string().optional(), // "14 x 16"
  floorSqft: z.number().positive().optional(),
  ceiling: z.string().optional(), // "9ft tray"
  floorLevel: z.string().optional(), // "Main Floor"
  finishes: roomFinishesSchema.optional(),
  fixtures: roomFixturesSchema.optional(),
  // Walkthrough observations, one string per observation. Narrative prose
  // authored as paragraphs lands here, never as flat text blocks.
  observations: z.array(z.string().min(1)).default([]),
  conditionRating: conditionRatingSchema.optional(),
  specs: z.array(specItemSchema).default([]),
  linkedVisionProjects: z.array(linkedVisionProjectSchema).default([]),
});
export type RoomPageContent = z.infer<typeof roomPageContentSchema>;

// ─── System pages ─────────────────────────────────────────────────────────

// Pre-scoped replacement briefing details. All optional: the briefing is
// built up over visits; missing fields render as "Not yet documented".
export const replacementBriefingSchema = z.object({
  capacity: z.string().optional(), // "80,000 BTU"
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
  installDate: z.string().optional(), // ISO date or bare year "2009"
  lifespanYears: z.number().positive().optional(),
  currentAgeYears: z.number().nonnegative().optional(),
  conditionRating: conditionRatingSchema.optional(),
  // e.g. ["Approaching End-of-Life", "Needs briefing"]
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
  // The aspirational vision prose (paragraph text, not HTML).
  vision: z.string().optional(),
  // "Why design matters first" education prose.
  whyDesignFirst: z.string().optional(),
  designPhaseWeeks: z.number().positive().optional(),
  designPhaseCost: z.number().nonnegative().optional(),
  tiers: tierSetSchema.optional(),
  // Execution path prose. AKR disclosure language is required whenever AKR
  // is the recommended trade partner; the block renderer enforces display.
  executionPath: z.string().optional(),
  priorityWindow: z.string().optional(), // "Year 1-2"
  category: z.string().optional(), // "Lifestyle", "Critical", "Comfort"
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

// ─── Validation helpers ────────────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}

function runValidation<T>(
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

export function validateRoomPage(
  value: unknown,
): ValidationResult<RoomPageContent> {
  return runValidation(roomPageContentSchema, value);
}

export function validateSystemPage(
  value: unknown,
): ValidationResult<SystemPageContent> {
  return runValidation(systemPageContentSchema, value);
}

export function validateAppliancePage(
  value: unknown,
): ValidationResult<AppliancePageContent> {
  return runValidation(appliancePageContentSchema, value);
}

export function validateVisionPage(
  value: unknown,
): ValidationResult<VisionPageContent> {
  return runValidation(visionPageContentSchema, value);
}

export function validateTierSet(value: unknown): ValidationResult<TierSet> {
  return runValidation(tierSetSchema, value);
}

// Coerce an arbitrary string into a valid condition rating or undefined.
// Tolerates case drift from AI output ("good" → "Good") but never guesses.
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
