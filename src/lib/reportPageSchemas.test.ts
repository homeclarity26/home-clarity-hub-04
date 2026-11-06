import { describe, it, expect } from "vitest";
import {
  validateRoomPage,
  validateSystemPage,
  validateAppliancePage,
  validateVisionPage,
  validateTierSet,
  normalizeConditionRating,
} from "./reportPageSchemas";

describe("roomPageContentSchema", () => {
  it("accepts a fully documented room", () => {
    const result = validateRoomPage({
      dims: "14 x 16",
      floorSqft: 224,
      ceiling: "9ft",
      floorLevel: "Main Floor",
      finishes: { wallPaint: "SW 7029 Agreeable Gray", flooring: "Red oak" },
      fixtures: { lighting: "Recessed LED x6", outlets: "8" },
      observations: ["Paint in good shape", "Window seal fogged on north wall"],
      conditionRating: "Good",
      specs: [{ label: "Dimensions", value: "14 x 16" }],
      linkedVisionProjects: [{ title: "Kitchen refresh", priority: "Year 1-2" }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.observations).toHaveLength(2);
  });

  it("accepts a sparse room and applies array defaults", () => {
    const result = validateRoomPage({});
    expect(result.success).toBe(true);
    expect(result.data?.observations).toEqual([]);
    expect(result.data?.specs).toEqual([]);
    expect(result.data?.linkedVisionProjects).toEqual([]);
    expect(result.data?.finishes).toBeUndefined();
  });

  it("rejects an invalid condition rating", () => {
    const result = validateRoomPage({ conditionRating: "Great" });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.startsWith("conditionRating"))).toBe(true);
  });

  it("rejects empty-string observations", () => {
    const result = validateRoomPage({ observations: [""] });
    expect(result.success).toBe(false);
  });
});

describe("systemPageContentSchema", () => {
  it("accepts a documented system with a replacement briefing", () => {
    const result = validateSystemPage({
      make: "Carrier",
      model: "59TP6B",
      installDate: "2009",
      lifespanYears: 20,
      currentAgeYears: 17,
      conditionRating: "Fair",
      statusFlags: ["Approaching End-of-Life"],
      specs: [{ label: "Fuel", value: "Natural gas" }],
      observations: ["Heat exchanger inspected, no cracks"],
      replacementBriefing: {
        capacity: "80,000 BTU",
        gasLine: "3/4 inch existing",
        tiers: {
          essential: { priceLow: 6500, priceHigh: 8000, description: "Like-for-like 80% AFUE swap" },
          enhanced: { priceLow: 9000, priceHigh: 11000, description: "96% AFUE two-stage", recommended: true },
          signature: { priceLow: 13000, priceHigh: 16000, description: "Modulating + zoning" },
        },
      },
    });
    expect(result.success).toBe(true);
    expect(result.data?.replacementBriefing?.tiers?.enhanced.recommended).toBe(true);
  });

  it("accepts a sparse system record", () => {
    const result = validateSystemPage({ conditionRating: "Good" });
    expect(result.success).toBe(true);
    expect(result.data?.statusFlags).toEqual([]);
    expect(result.data?.replacementBriefing).toBeUndefined();
  });

  it("rejects a negative current age", () => {
    const result = validateSystemPage({ currentAgeYears: -3 });
    expect(result.success).toBe(false);
  });
});

describe("appliancePageContentSchema", () => {
  it("accepts a simplified appliance record", () => {
    const result = validateAppliancePage({
      make: "Bosch",
      model: "SHPM88Z75N",
      conditionRating: "Excellent",
      observations: ["Installed 2023, under warranty"],
    });
    expect(result.success).toBe(true);
  });
});

describe("visionPageContentSchema", () => {
  it("accepts a scoped vision project", () => {
    const result = validateVisionPage({
      vision: "A chef's kitchen that opens to the family room.",
      whyDesignFirst: "Design first locks scope before demolition.",
      designPhaseWeeks: 6,
      designPhaseCost: 4500,
      tiers: {
        essential: { priceLow: 45000, priceHigh: 60000, description: "Refresh in place" },
        enhanced: { priceLow: 75000, priceHigh: 95000, description: "Full remodel", recommended: true },
        signature: { priceLow: 120000, priceHigh: 150000, description: "Wall removal + addition" },
      },
      executionPath: "Executed through AK Renovations, openly owned by Adam.",
      priorityWindow: "Year 2-3",
      category: "Lifestyle",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a vision with no pricing yet", () => {
    const result = validateVisionPage({ vision: "Finished basement gym." });
    expect(result.success).toBe(true);
    expect(result.data?.tiers).toBeUndefined();
  });
});

describe("tierSetSchema", () => {
  it("requires all three tiers", () => {
    const result = validateTierSet({
      essential: { priceLow: 1000, priceHigh: 2000, description: "Base" },
    });
    expect(result.success).toBe(false);
    expect(result.errors.join(" ")).toContain("enhanced");
  });

  it("requires a description on each tier", () => {
    const result = validateTierSet({
      essential: { priceLow: 1, priceHigh: 2, description: "a" },
      enhanced: { priceLow: 1, priceHigh: 2, description: "" },
      signature: { priceLow: 1, priceHigh: 2, description: "c" },
    });
    expect(result.success).toBe(false);
  });
});

describe("normalizeConditionRating", () => {
  it("passes through valid ratings", () => {
    expect(normalizeConditionRating("Good")).toBe("Good");
  });

  it("normalizes case drift", () => {
    expect(normalizeConditionRating("critical")).toBe("Critical");
    expect(normalizeConditionRating("EXCELLENT")).toBe("Excellent");
  });

  it("returns undefined for junk", () => {
    expect(normalizeConditionRating("7/10")).toBeUndefined();
    expect(normalizeConditionRating("")).toBeUndefined();
    expect(normalizeConditionRating(42)).toBeUndefined();
    expect(normalizeConditionRating(null)).toBeUndefined();
  });
});
