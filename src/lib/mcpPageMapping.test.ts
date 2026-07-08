// Phase 6, MCP authoring bridge: shared mapping + schema tests.
//
// Three jobs:
//   1. PARITY: the edge-side port in supabase/functions/_shared must
//      produce byte-identical blocks and columns to the wizard's
//      buildStructuredPagePayload for equivalent content, and its copied
//      template defaults must match BLOCK_TEMPLATES. If either drifts,
//      these tests fail and the port gets re-synced.
//   2. GUARDRAILS: the MCP argument schemas physically reject walls of
//      text, em-dashes, partial tier pricing, and unconfirmed publishes.
//   3. QA: the server-side audit flags empty structured pages and
//      wall-of-text blocks the same way the wizard's gate does.

import { describe, it, expect } from "vitest";
import { BLOCK_TEMPLATES } from "@/components/wysiwyg/types";
import {
  buildStructuredPagePayload,
  cleanTierSet as wizardCleanTierSet,
} from "@/lib/wizardPublishMapping";
import { roomPageContentSchema as appRoomSchema } from "@/lib/reportPageSchemas";
import type { PageAuthoring, PageSeed } from "@/contexts/WizardContext";
import type { TierSet } from "@/lib/reportPageSchemas";
import {
  mcpRoomContentSchema,
  publishReportArgsSchema,
  roomPageContentSchema as sharedRoomSchema,
  upsertGenericPageArgsSchema,
  upsertRoomPageArgsSchema,
  upsertSystemPageArgsSchema,
  upsertVisionPageArgsSchema,
} from "../../supabase/functions/_shared/reportPageSchemas";
import {
  auditReportPageRows,
  buildCapitalPlanBlock,
  buildGenericPageBlocks,
  buildMaintenanceCalendarBlock,
  buildRecurringServicesBlock,
  buildRoomPagePayload,
  buildSystemPagePayload,
  buildVisionPagePayload,
  cleanTierSet as sharedCleanTierSet,
  makeBlock,
  REPLACEMENT_BRIEFING_DEFAULT_CONTENT,
  replaceBlockOfType,
  type ReportBlock,
  type ReportPageRowLike,
  summarizePageFields,
  VISION_PROJECT_DEFAULT_CONTENT,
} from "../../supabase/functions/_shared/reportPageMapping";

const NOW = "2026-07-07T00:00:00.000Z";

const PRICED_TIERS: TierSet = {
  essential: { priceLow: 6800, priceHigh: 8200, description: "Like-for-like replacement" },
  enhanced: {
    priceLow: 9500,
    priceHigh: 11500,
    description: "Two-stage unit with new thermostat",
    recommended: true,
  },
  signature: { priceLow: 14000, priceHigh: 17500, description: "Variable-speed with zoning" },
};

// Strips random ids and timestamps so block comparisons check what matters.
function normBlocks(blocks: ReportBlock[]) {
  return blocks.map((b) => ({
    type: b.type,
    content: b.content,
    colSpan: b.colSpan,
    order: b.order,
  }));
}

function wizardAuthoring(
  narrative: string,
  observations: string[],
  structured?: PageAuthoring["structured"],
): PageAuthoring {
  return {
    page_key: "test",
    status: "draft",
    is_featured: false,
    content: [
      { type: "narrative", value: narrative },
      { type: "observations", value: observations.join("\n") },
    ],
    structured,
  };
}

// ─── Template-default parity (copied constants cannot drift) ──────────────

describe("template default parity with BLOCK_TEMPLATES", () => {
  it("replacement_briefing defaults match the app template", () => {
    const template = BLOCK_TEMPLATES.find((t) => t.type === "replacement_briefing");
    expect(REPLACEMENT_BRIEFING_DEFAULT_CONTENT).toEqual(template?.defaultContent);
  });

  it("vision_project defaults match the app template", () => {
    const template = BLOCK_TEMPLATES.find((t) => t.type === "vision_project");
    expect(VISION_PROJECT_DEFAULT_CONTENT).toEqual(template?.defaultContent);
  });
});

// ─── Base schema parity ────────────────────────────────────────────────────

describe("shared schema parity with src/lib/reportPageSchemas", () => {
  it("parses the same room fixture to the same shape", () => {
    const fixture = {
      dims: "14 x 16",
      floorSqft: 224,
      finishes: { wallPaint: "SW 7029" },
      observations: ["South window seal fogged"],
      conditionRating: "Good",
      specs: [{ label: "Ceiling", value: "9ft tray" }],
    };
    const app = appRoomSchema.parse(fixture);
    const shared = sharedRoomSchema.parse(fixture);
    expect(shared).toEqual(app);
  });
});

// ─── Room parity ───────────────────────────────────────────────────────────

describe("room mapping parity (MCP vs wizard)", () => {
  const narrative =
    "A generous primary suite with morning light.\n\nThe tray ceiling adds volume without feeling formal.";
  const observations = ["South window seal fogged", "Carpet worn at doorway"];

  it("produces identical blocks and columns", () => {
    const mcp = buildRoomPagePayload({
      title: "Primary Suite",
      group: "Interior Spaces",
      content: mcpRoomContentSchema.parse({
        narrative,
        dims: "14 x 16",
        floorSqft: 224,
        ceiling: "9ft tray",
        floorLevel: "Upper Floor",
        finishes: { wallPaint: "SW 7029 Agreeable Gray", flooring: "Carpet" },
        fixtures: { lighting: "Ceiling fan with light kit", windows: "3 double-hung" },
        observations,
        conditionRating: "Good",
      }),
      now: NOW,
    });

    const wizard = buildStructuredPagePayload({
      page: { page_key: "primary-suite", title: "Primary Suite", group: "Interior Spaces" },
      sectionKey: "spaces",
      sectionLabel: "Interior Spaces",
      authoring: wizardAuthoring(narrative, observations, {
        room: {
          dims: "14 x 16",
          floorSqft: 224,
          ceiling: "9ft tray",
          floorLevel: "Upper Floor",
          finishes: { wallPaint: "SW 7029 Agreeable Gray", flooring: "Carpet" },
          fixtures: { lighting: "Ceiling fan with light kit", windows: "3 double-hung" },
          observations: [],
          conditionRating: "Good",
          specs: [],
          linkedVisionProjects: [],
        },
      }),
      now: NOW,
    });

    expect(wizard).not.toBeNull();
    expect(mcp.pageType).toBe(wizard?.pageType);
    expect(normBlocks(mcp.blocks)).toEqual(normBlocks(wizard!.blocks));
    expect(mcp.columns).toEqual(wizard!.columns);
  });
});

// ─── System parity ─────────────────────────────────────────────────────────

describe("system mapping parity (MCP vs wizard)", () => {
  const narrative = "The furnace runs, but it is deep into borrowed time.";
  const observations = ["Filter change overdue", "Surface rust on burner shroud"];

  it("produces identical blocks and columns including the briefing", () => {
    const briefing = {
      capacity: "80,000 BTU",
      voltage: "120V at unit",
      gasLine: "3/4 inch black iron, valve at unit",
      tiers: PRICED_TIERS,
    };
    const mcp = buildSystemPagePayload({
      title: "Furnace",
      group: "Systems and Appliances",
      isAppliance: false,
      content: {
        narrative,
        make: "Trane",
        model: "XR90",
        serial: "S1998-4471",
        installDate: "2009",
        lifespanYears: 20,
        currentAgeYears: 17,
        conditionRating: "Fair",
        statusFlags: ["Approaching End-of-Life"],
        specs: [{ label: "Efficiency", value: "92% AFUE" }],
        observations,
        replacementBriefing: briefing,
      },
      now: NOW,
    });

    // Wizard equivalent: identity fields in the structured editor, free
    // extras arriving as AI seed specs (the wizard ignores structured
    // system specs and reads seed.specs_seed).
    const seed: PageSeed = {
      page_key: "hvac-furnace",
      title: "Furnace",
      specs_seed: [{ label: "Efficiency", value: "92% AFUE" }],
    };
    const wizard = buildStructuredPagePayload({
      page: { page_key: "hvac-furnace", title: "Furnace", group: "Systems" },
      sectionKey: "systems_appliances",
      sectionLabel: "Systems and Appliances",
      authoring: wizardAuthoring(narrative, observations, {
        system: {
          make: "Trane",
          model: "XR90",
          serial: "S1998-4471",
          installDate: "2009",
          lifespanYears: 20,
          currentAgeYears: 17,
          conditionRating: "Fair",
          statusFlags: ["Approaching End-of-Life"],
          specs: [],
          observations: [],
          replacementBriefing: briefing,
        },
      }),
      seed,
      now: NOW,
    });

    expect(wizard).not.toBeNull();
    expect(mcp.pageType).toBe("system");
    expect(normBlocks(mcp.blocks)).toEqual(normBlocks(wizard!.blocks));
    expect(mcp.columns).toEqual(wizard!.columns);
    expect(mcp.columns.current_age_years).toBe(17);
    expect(mcp.columns.expected_lifespan_years).toBe(20);
    expect(mcp.columns.tiers).toEqual(PRICED_TIERS);
    expect(mcp.blocks[1]?.type).toBe("replacement_briefing");
  });

  it("appliance pages skip lifecycle columns and briefing", () => {
    const mcp = buildSystemPagePayload({
      title: "Refrigerator",
      group: "Appliances",
      isAppliance: true,
      content: {
        make: "Sub-Zero",
        model: "BI-36U",
        installDate: "2015",
        conditionRating: "Good",
        statusFlags: [],
        specs: [],
        observations: ["Door gasket soft at lower hinge"],
        needsBriefing: true, // ignored for appliances
      },
      now: NOW,
    });
    expect(mcp.pageType).toBe("appliance");
    expect(mcp.blocks).toHaveLength(1);
    expect(mcp.columns.current_age_years).toBeNull();
    expect(mcp.columns.expected_lifespan_years).toBeNull();
  });
});

// ─── Vision parity ─────────────────────────────────────────────────────────

describe("vision mapping parity (MCP vs wizard)", () => {
  const vision =
    "Picture the kitchen as the true center of the house.\n\nAn island with seating for four changes every morning.";

  it("produces identical blocks and columns", () => {
    const mcp = buildVisionPagePayload({
      title: "Kitchen Vision Project",
      content: {
        vision,
        whyDesignFirst: "Design first protects the budget before demolition begins.",
        designPhaseWeeks: 6,
        designPhaseCost: 4500,
        tiers: PRICED_TIERS,
        priorityWindow: "Year 1-2",
        category: "Lifestyle",
        observations: ["Cabinet boxes are sound; faces are dated"],
      },
      now: NOW,
    });

    const wizard = buildStructuredPagePayload({
      page: {
        page_key: "kitchen-vision-project",
        title: "Kitchen Vision Project",
        group: "Strategy",
      },
      sectionKey: "strategy",
      sectionLabel: "Strategy",
      authoring: wizardAuthoring(vision, ["Cabinet boxes are sound; faces are dated"], {
        vision: {
          vision: "",
          whyDesignFirst: "Design first protects the budget before demolition begins.",
          designPhaseWeeks: 6,
          designPhaseCost: 4500,
          tiers: PRICED_TIERS,
          priorityWindow: "Year 1-2",
          category: "Lifestyle",
          observations: [],
        },
      }),
      now: NOW,
    });

    expect(wizard).not.toBeNull();
    expect(mcp.pageType).toBe(wizard?.pageType);
    expect(normBlocks(mcp.blocks)).toEqual(normBlocks(wizard!.blocks));
    expect(mcp.columns).toEqual(wizard!.columns);
    const content = mcp.blocks[0].content;
    expect(content.akrDisclosed).toBe(true);
    expect(content.executionPathHtml).toContain("AK Renovations");
  });

  it("unpriced tiers fall back to scaffolding, matching the wizard rule", () => {
    const partial = {
      ...PRICED_TIERS,
      signature: { priceLow: 0, priceHigh: 0, description: "TBD" },
    };
    expect(sharedCleanTierSet(partial)).toBeNull();
    expect(wizardCleanTierSet(partial)).toBeNull();
    const mcp = buildVisionPagePayload({
      title: "Kitchen Vision Project",
      content: { vision, tiers: partial, observations: [] },
      now: NOW,
    });
    expect(mcp.columns.tiers).toBeNull();
    const tiers = mcp.blocks[0].content.tiers as Array<{ priceLow?: number }>;
    expect(tiers.every((t) => t.priceLow === undefined)).toBe(true);
  });
});

// ─── Generic pages ─────────────────────────────────────────────────────────

describe("generic page mapping", () => {
  it("maps sections to headed text blocks", () => {
    const blocks = buildGenericPageBlocks(
      [
        { heading: "Welcome", paragraphs: ["First paragraph.", "Second paragraph."] },
        { heading: "How to use this report", paragraphs: ["Start with the summary."] },
      ],
      NOW,
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("text");
    expect(blocks[0].content.html).toBe(
      "<h3>Welcome</h3><p>First paragraph.</p><p>Second paragraph.</p>",
    );
    expect(blocks[1].order).toBe(1);
  });

  it("escapes HTML in headings and paragraphs", () => {
    const blocks = buildGenericPageBlocks(
      [{ heading: "A <b>bold</b> claim", paragraphs: ["1 < 2 & 3 > 2"] }],
      NOW,
    );
    expect(blocks[0].content.html).toBe(
      "<h3>A &lt;b&gt;bold&lt;/b&gt; claim</h3><p>1 &lt; 2 &amp; 3 &gt; 2</p>",
    );
  });
});

// ─── Strategy blocks (must match Step5Publish injection) ──────────────────

describe("strategy block builders", () => {
  it("capital plan block matches the Step5Publish shape", () => {
    const block = buildCapitalPlanBlock(
      [
        { projectName: "Furnace replacement", phase: "defense", yearStart: 2027, costLow: 9500, costHigh: 11500 },
        { projectName: "Kitchen remodel", phase: "offense", yearStart: 2028, yearEnd: 2029 },
      ],
      NOW,
      0,
      2026,
    );
    expect(block.type).toBe("capital_plan");
    expect(block.content).toEqual({
      eyebrow: "Strategic Roadmap",
      title: "10-Year Capital Plan",
      startYear: 2026,
      items: [
        {
          projectName: "Furnace replacement",
          phase: "defense",
          yearStart: 2027,
          yearEnd: 2027,
          costLow: 9500,
          costHigh: 11500,
          displayOrder: 0,
        },
        {
          projectName: "Kitchen remodel",
          phase: "offense",
          yearStart: 2028,
          yearEnd: 2029,
          costLow: undefined,
          costHigh: undefined,
          displayOrder: 1,
        },
      ],
    });
  });

  it("recurring services block derives monthly cost like Step5Publish", () => {
    const block = buildRecurringServicesBlock(
      [
        {
          category: "hvac",
          serviceName: "Furnace tune-up",
          vendorName: "Verne & Ellsworth",
          frequency: "annual",
          costPerVisit: 180,
          annualCost: 180,
          hbcManaged: true,
        },
        { category: "lawn_landscaping", serviceName: "Mowing", frequency: "weekly", hbcManaged: false },
      ],
      NOW,
      0,
    );
    expect(block.type).toBe("recurring_services_register");
    const services = block.content.services as Array<Record<string, unknown>>;
    expect(block.content.title).toBe("Recurring Services Register");
    expect(services[0]).toEqual({
      category: "hvac",
      serviceName: "Furnace tune-up",
      vendorName: "Verne & Ellsworth",
      frequency: "annual",
      costPerVisit: 180,
      annualCost: 180,
      monthlyCost: 15,
      hbcManaged: true,
      status: "current",
    });
    expect(services[1].vendorName).toBeUndefined();
    expect(services[1].monthlyCost).toBeUndefined();
  });

  it("maintenance calendar block formats tasks as 'task (system)'", () => {
    const block = buildMaintenanceCalendarBlock(
      {
        spring: [{ task: "Service AC condenser", system: "HVAC" }],
        summer: [],
        fall: [{ task: "Clean gutters", system: "Roof & Drainage" }],
        winter: [],
      },
      NOW,
      0,
    );
    expect(block.type).toBe("maintenance_calendar");
    expect(block.content).toEqual({
      eyebrow: "The annual cadence",
      title: "Maintenance Calendar",
      spring: [{ description: "Service AC condenser (HVAC)" }],
      summer: [],
      fall: [{ description: "Clean gutters (Roof & Drainage)" }],
      winter: [],
    });
  });

  it("replaceBlockOfType swaps in place and appends when absent", () => {
    const existing = [
      makeBlock("text", 0, { html: "<p>hi</p>" }, NOW),
      makeBlock("capital_plan", 1, { items: [] }, NOW),
    ];
    const next = buildCapitalPlanBlock(
      [{ projectName: "Roof", phase: "defense", yearStart: 2030 }],
      NOW,
      0,
    );
    const replaced = replaceBlockOfType(existing, next);
    expect(replaced).toHaveLength(2);
    expect(replaced[1].type).toBe("capital_plan");
    expect(replaced[1].order).toBe(1); // keeps the original slot
    expect((replaced[1].content.items as unknown[]).length).toBe(1);

    const appended = replaceBlockOfType([existing[0]], next);
    expect(appended).toHaveLength(2);
    expect(appended[1].type).toBe("capital_plan");
  });
});

// ─── MCP argument guardrails ───────────────────────────────────────────────

describe("MCP schema guardrails", () => {
  const envelope = {
    report_id: "6f9619ff-8b86-4d01-b42d-00c04fc964ff",
    page_key: "primary-suite",
    title: "Primary Suite",
    group: "Interior Spaces",
  };

  it("rejects em-dashes in narrative prose", () => {
    const parsed = upsertRoomPageArgsSchema.safeParse({
      ...envelope,
      content: { narrative: "A fine room — truly fine." },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects observation entries beyond 400 chars", () => {
    const parsed = upsertRoomPageArgsSchema.safeParse({
      ...envelope,
      content: { observations: ["x".repeat(401)] },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects generic paragraphs beyond 900 chars and >6 per section", () => {
    const tooLong = upsertGenericPageArgsSchema.safeParse({
      ...envelope,
      sections: [{ heading: "Welcome", paragraphs: ["x".repeat(901)] }],
    });
    expect(tooLong.success).toBe(false);
    const tooMany = upsertGenericPageArgsSchema.safeParse({
      ...envelope,
      sections: [{ heading: "Welcome", paragraphs: Array(7).fill("Fine.") }],
    });
    expect(tooMany.success).toBe(false);
  });

  it("rejects invented-looking tier sets with missing prices", () => {
    const parsed = upsertSystemPageArgsSchema.safeParse({
      ...envelope,
      content: {
        replacementBriefing: {
          tiers: {
            essential: { priceLow: 0, priceHigh: 0, description: "TBD" },
            enhanced: PRICED_TIERS.enhanced,
            signature: PRICED_TIERS.signature,
          },
        },
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("requires vision prose on vision pages", () => {
    const parsed = upsertVisionPageArgsSchema.safeParse({
      ...envelope,
      content: { category: "Lifestyle" },
    });
    expect(parsed.success).toBe(false);
  });

  it("requires the literal PUBLISH confirmation", () => {
    expect(
      publishReportArgsSchema.safeParse({
        report_id: envelope.report_id,
        confirm: "publish",
      }).success,
    ).toBe(false);
    expect(
      publishReportArgsSchema.safeParse({
        report_id: envelope.report_id,
        confirm: "PUBLISH",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed page keys", () => {
    const parsed = upsertRoomPageArgsSchema.safeParse({
      ...envelope,
      page_key: "Primary Suite!",
      content: {},
    });
    expect(parsed.success).toBe(false);
  });
});

// ─── Server-side publish QA audit ──────────────────────────────────────────

function rowFrom(
  page_key: string,
  title: string,
  group_name: string,
  payload: { blocks: ReportBlock[]; columns: Record<string, unknown> },
): ReportPageRowLike {
  return {
    page_key,
    title,
    group_name,
    status: "draft",
    narrative: payload.blocks,
    condition_rating: (payload.columns.condition_rating as string | null) ?? null,
    specs: payload.columns.specs ?? null,
    key_observations: payload.columns.key_observations ?? null,
    tiers: payload.columns.tiers ?? null,
  };
}

describe("auditReportPageRows (run_publish_qa core)", () => {
  it("passes a well-authored room page", () => {
    const payload = buildRoomPagePayload({
      title: "Primary Suite",
      group: "Interior Spaces",
      content: mcpRoomContentSchema.parse({
        dims: "14 x 16",
        observations: ["Seal fogged"],
        conditionRating: "Good",
      }),
      now: NOW,
    });
    const issues = auditReportPageRows([
      rowFrom("primary-suite", "Primary Suite", "Interior Spaces", payload),
    ]);
    expect(issues).toEqual([]);
  });

  it("flags a structured page with zero structured fields", () => {
    const issues = auditReportPageRows([
      {
        page_key: "hvac-furnace",
        title: "Furnace",
        group_name: "Systems and Appliances",
        status: "draft",
        narrative: [],
        condition_rating: null,
        specs: null,
        key_observations: null,
        tiers: null,
      },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("missing_structured");
    expect(issues[0].missingFields).toContain("condition rating");
    expect(issues[0].missingFields).toContain("make, model, or install year");
  });

  it("flags flat prose blocks on structured pages as walls of text", () => {
    const issues = auditReportPageRows([
      {
        page_key: "hvac-furnace",
        title: "Furnace",
        group_name: "Systems and Appliances",
        status: "draft",
        narrative: [makeBlock("text", 0, { html: `<p>${"words ".repeat(80)}</p>` }, NOW)],
        condition_rating: "Fair",
        specs: [{ label: "Make", value: "Trane" }],
        key_observations: ["Runs fine"],
        tiers: null,
      },
    ]);
    expect(issues.some((i) => i.kind === "wall_of_text")).toBe(true);
  });

  it("flags long structureless generic text but allows sectioned pages", () => {
    const wall = auditReportPageRows([
      {
        page_key: "welcome",
        title: "Welcome",
        group_name: "Information",
        status: "draft",
        narrative: [makeBlock("text", 0, { html: `<p>${"words ".repeat(300)}</p>` }, NOW)],
        condition_rating: null,
        specs: null,
        key_observations: null,
        tiers: null,
      },
    ]);
    expect(wall).toHaveLength(1);
    expect(wall[0].kind).toBe("wall_of_text");

    const sectioned = auditReportPageRows([
      {
        page_key: "welcome",
        title: "Welcome",
        group_name: "Information",
        status: "draft",
        narrative: buildGenericPageBlocks(
          [{ heading: "Welcome", paragraphs: ["Short and warm."] }],
          NOW,
        ),
        condition_rating: null,
        specs: null,
        key_observations: null,
        tiers: null,
      },
    ]);
    expect(sectioned).toEqual([]);
  });

  it("flags vision pages missing narrative and priced tiers", () => {
    const issues = auditReportPageRows([
      {
        page_key: "kitchen-vision-project",
        title: "Kitchen Vision Project",
        group_name: "Strategy",
        status: "draft",
        narrative: [],
        condition_rating: null,
        specs: null,
        key_observations: null,
        tiers: null,
      },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].pageType).toBe("vision");
    expect(issues[0].missingFields).toEqual([
      "vision narrative",
      "priced investment tiers",
      "key observations",
    ]);
  });
});

describe("summarizePageFields (get_report TOC)", () => {
  it("reports populated and missing fields per page", () => {
    const payload = buildSystemPagePayload({
      title: "Furnace",
      group: "Systems and Appliances",
      isAppliance: false,
      content: {
        make: "Trane",
        installDate: "2009",
        conditionRating: "Fair",
        statusFlags: [],
        specs: [],
        observations: ["Runs, but aging"],
      },
      now: NOW,
    });
    const summary = summarizePageFields(
      rowFrom("hvac-furnace", "Furnace", "Systems and Appliances", payload),
    );
    expect(summary.pageType).toBe("system");
    expect(summary.populatedFields).toContain("condition_rating");
    expect(summary.populatedFields).toContain("block:system_record");
    expect(summary.missingFields).toEqual([]);
  });
});
