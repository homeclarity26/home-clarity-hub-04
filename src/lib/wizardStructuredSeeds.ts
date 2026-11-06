// Phase 5b — initial structured-editor values from Step 1 page seeds.
//
// Step 3's per-page-type editors (Room / System / Vision) bind to
// `PageAuthoring.structured`. On first activation of a page that has no
// structured payload yet, these helpers derive starting values from the
// AI seed captured in Step 1 (specs_seed label heuristics,
// replacement_briefing_stub, suggested_condition). Nothing is invented:
// a field the seed doesn't carry stays undefined and renders as
// "Not yet documented, client can add later".
//
// Pure module: no React, no Supabase, no side effects.

import type { PageSeed, PageStructuredData } from "@/contexts/WizardContext";
import {
  normalizeConditionRating,
  type RoomPageContent,
  type SystemPageContent,
  type VisionPageContent,
} from "@/lib/reportPageSchemas";
import type { StructuredPageType } from "@/lib/reportPageSchemas";

// ─── Seed-spec label lookup ────────────────────────────────────────────────

function findSpecValue(
  seed: PageSeed | undefined,
  matcher: RegExp,
): string | undefined {
  const specs = seed?.specs_seed ?? [];
  for (const item of specs) {
    if (item?.label && matcher.test(item.label)) {
      const value = (item.value ?? "").trim();
      if (value.length > 0) return value;
    }
  }
  return undefined;
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const numeric = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

// Shape of seed-report-from-notes' replacement_briefing_stub (E7 rules).
interface BriefingStubShape {
  system_type?: string;
  unit_make?: string | null;
  unit_model?: string | null;
  install_year?: number | null;
  required_capacity?: string | null;
  voltage?: string | null;
  needs_briefing?: boolean;
}

function readStub(seed: PageSeed | undefined): BriefingStubShape {
  const stub = seed?.replacement_briefing_stub;
  if (!stub || typeof stub !== "object") return {};
  return stub as BriefingStubShape;
}

function stubString(value: string | null | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

// ─── Per-type seeds ────────────────────────────────────────────────────────

export function seedRoomStructured(seed?: PageSeed): RoomPageContent {
  return {
    dims: findSpecValue(seed, /dimension/i),
    floorSqft: parsePositiveNumber(
      findSpecValue(seed, /sqft|square\s*feet|floor\s*area/i),
    ),
    ceiling: findSpecValue(seed, /ceiling/i),
    floorLevel: findSpecValue(seed, /^level$|floor\s*level/i),
    finishes: {},
    fixtures: {},
    observations: [],
    conditionRating: normalizeConditionRating(seed?.suggested_condition),
    specs: [],
    linkedVisionProjects: [],
  };
}

export function seedSystemStructured(seed?: PageSeed): SystemPageContent {
  const stub = readStub(seed);
  const installYear =
    typeof stub.install_year === "number" && Number.isFinite(stub.install_year)
      ? String(stub.install_year)
      : undefined;
  const capacity = stubString(stub.required_capacity);
  const voltage = stubString(stub.voltage);
  return {
    make: stubString(stub.unit_make) ?? findSpecValue(seed, /^make$/i),
    model: stubString(stub.unit_model) ?? findSpecValue(seed, /^model$/i),
    serial: findSpecValue(seed, /serial/i),
    installDate: findSpecValue(seed, /install/i) ?? installYear,
    lifespanYears: parsePositiveNumber(findSpecValue(seed, /lifespan/i)),
    currentAgeYears: undefined,
    conditionRating: normalizeConditionRating(seed?.suggested_condition),
    statusFlags: [],
    specs: [],
    observations: [],
    replacementBriefing:
      capacity || voltage ? { capacity, voltage } : undefined,
  };
}

export function seedVisionStructured(seed?: PageSeed): VisionPageContent {
  return {
    vision: undefined,
    whyDesignFirst: undefined,
    designPhaseWeeks: undefined,
    designPhaseCost: undefined,
    tiers: undefined,
    executionPath: undefined,
    priorityWindow: undefined,
    category: undefined,
    observations: [],
  };
}

// Builds the initial `PageAuthoring.structured` payload for a page of the
// given structured type. Appliance pages share the system editor (their
// schema is a subset; publish maps through appliancePageContentSchema).
export function seedStructuredForType(
  pageType: StructuredPageType | "executive_summary",
  seed?: PageSeed,
): PageStructuredData {
  if (pageType === "room") return { room: seedRoomStructured(seed) };
  if (pageType === "system" || pageType === "appliance") {
    return { system: seedSystemStructured(seed) };
  }
  if (pageType === "vision") return { vision: seedVisionStructured(seed) };
  return { executiveSummary: {} };
}
