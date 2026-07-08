import { describe, it, expect } from "vitest";
import {
  buildExecutiveSummaryBlocks,
  buildPagePhotoPublish,
  buildStructuredPagePayload,
  cleanTierSet,
  tierSetToBlockTiers,
} from "@/lib/wizardPublishMapping";
import type { PageAuthoring } from "@/contexts/WizardContext";
import type { TierSet } from "@/lib/reportPageSchemas";

// Phase 5b — structured authoring payload → publish mapping.

const NOW = "2026-07-07T00:00:00.000Z";

function authoringWith(
  structured: PageAuthoring["structured"],
  content: PageAuthoring["content"] = [],
): PageAuthoring {
  return {
    page_key: "test-page",
    status: "reviewed",
    is_featured: false,
    content,
    structured,
  };
}

const pricedTiers: TierSet = {
  essential: {
    priceLow: 14000,
    priceHigh: 18000,
    description: "Like-for-like replacement.",
  },
  enhanced: {
    priceLow: 22000,
    priceHigh: 28000,
    description: "2-stage 96% efficiency, variable speed.",
    recommended: true,
  },
  signature: {
    priceLow: 32000,
    priceHigh: 42000,
    description: "Modulating valve, comfort suite.",
  },
};

describe("cleanTierSet", () => {
  it("accepts a fully priced + described tier set", () => {
    expect(cleanTierSet(pricedTiers)).not.toBeNull();
  });

  it("rejects unpriced tiers (0 means not priced yet)", () => {
    const partial: TierSet = {
      ...pricedTiers,
      signature: { priceLow: 0, priceHigh: 0, description: "TBD scope." },
    };
    expect(cleanTierSet(partial)).toBeNull();
  });

  it("rejects tiers with an empty description", () => {
    const partial: TierSet = {
      ...pricedTiers,
      essential: { priceLow: 1000, priceHigh: 2000, description: "   " },
    };
    expect(cleanTierSet(partial)).toBeNull();
  });

  it("returns null when no tiers exist", () => {
    expect(cleanTierSet(undefined)).toBeNull();
  });
});

describe("tierSetToBlockTiers", () => {
  it("maps the triple onto block tiers in canonical order with escaping", () => {
    const withHtml: TierSet = {
      ...pricedTiers,
      essential: {
        priceLow: 1,
        priceHigh: 2,
        description: "Cheap <b>&</b> cheerful",
      },
    };
    const blockTiers = tierSetToBlockTiers(withHtml);
    expect(blockTiers.map((t) => t.id)).toEqual([
      "essential",
      "enhanced",
      "signature",
    ]);
    expect(blockTiers[0].scopeHtml).toBe(
      "Cheap &lt;b&gt;&amp;&lt;/b&gt; cheerful",
    );
    expect(blockTiers[1].recommended).toBe(true);
    expect(blockTiers[2].priceHigh).toBe(42000);
  });
});

describe("buildStructuredPagePayload — room structured fields", () => {
  const payload = buildStructuredPagePayload({
    page: { page_key: "kitchen", title: "Kitchen", group: "Spaces" },
    sectionKey: "spaces",
    sectionLabel: "Kitchen & Pantry",
    authoring: authoringWith(
      {
        room: {
          dims: "18 x 22",
          floorSqft: 396,
          ceiling: "10ft",
          floorLevel: "Floor 1",
          finishes: {
            wallPaint: "Benjamin Moore Revere Pewter HC-172",
            trimPaint: "Benjamin Moore Simply White OC-117",
            ceilingPaint: "",
            flooring: '3/4" Solid Oak, Natural Stain',
          },
          fixtures: {
            lighting: "2x pendant + 6x recessed LED",
            outlets: "9 total (2 GFCI)",
            windows: "",
            doors: "2 swing + 1 pocket",
          },
          observations: [],
          conditionRating: "Excellent",
          specs: [],
          linkedVisionProjects: [],
        },
      },
      [{ type: "narrative", value: "Fully remodeled in 2017." }],
    ),
    now: NOW,
  });

  it("fills the room_record block with finishes, fixtures, and dims", () => {
    expect(payload).not.toBeNull();
    const block = payload!.blocks[0];
    expect(block.type).toBe("room_record");
    expect(block.content.dimensions).toBe("18 x 22");
    expect(block.content.floorSqft).toBe(396);
    expect(block.content.floorLabel).toBe("Floor 1");
    expect(block.content.wallPaint).toBe(
      "Benjamin Moore Revere Pewter HC-172",
    );
    expect(block.content.flooring).toBe('3/4" Solid Oak, Natural Stain');
    expect(block.content.lightFixtures).toBe("2x pendant + 6x recessed LED");
    expect(block.content.doors).toBe("2 swing + 1 pocket");
    // Empty strings mean "Not yet documented", never publish as "".
    expect(block.content.ceilingPaint).toBeUndefined();
    expect(block.content.windows).toBeUndefined();
    expect(block.content.conditionRating).toBe("Excellent");
  });

  it("derives the metadata-strip specs from structured dims", () => {
    expect(payload!.columns.specs).toEqual([
      { label: "Dimensions", value: "18 x 22" },
      { label: "Floor Area", value: "396 sqft" },
      { label: "Ceiling", value: "10ft" },
      { label: "Level", value: "Floor 1" },
    ]);
    expect(payload!.columns.condition_rating).toBe("Excellent");
  });
});

describe("buildStructuredPagePayload — system structured fields", () => {
  const payload = buildStructuredPagePayload({
    page: {
      page_key: "furnace-main",
      title: "Furnace: Main Floor Zone",
      group: "Systems",
    },
    sectionKey: "systems_appliances",
    sectionLabel: "Systems & Appliances",
    authoring: authoringWith({
      system: {
        make: "Lennox",
        model: "SLP99V-090",
        serial: "5818H45821",
        installDate: "2009-08",
        lifespanYears: 20,
        currentAgeYears: 17,
        conditionRating: "Fair",
        statusFlags: ["Approaching End-of-Life"],
        specs: [],
        observations: [],
        replacementBriefing: {
          capacity: "90,000 BTU input, 75,000 output",
          voltage: "120V available, 240V on adjacent circuit",
          gasLine: '3/4" black iron, in place',
          condensate: "Routes to floor drain 8ft away",
          ductworkNotes: "Existing supply trunk 16x8, return 18x10.",
          accessNotes: "Mechanical room is 12 x 18, full access.",
          tiers: pricedTiers,
        },
      },
    }),
    now: NOW,
  });

  it("fills the system_record block with serial + lifespan", () => {
    const record = payload!.blocks[0];
    expect(record.type).toBe("system_record");
    expect(record.content.serial).toBe("5818H45821");
    expect(record.content.typicalLifespanYears).toBe(20);
    expect(record.content.status).toBe("Approaching End-of-Life");
    expect(record.content.make).toBe("Lennox");
    // Identity rows live in the page-level spec grid; the block's free-form
    // specifications list must not duplicate them.
    expect(record.content.specifications).toEqual([]);
  });

  it("publishes a replacement_briefing block with priced tiers + details", () => {
    const briefing = payload!.blocks[1];
    expect(briefing.type).toBe("replacement_briefing");
    const tiers = briefing.content.tiers as Array<Record<string, unknown>>;
    expect(tiers).toHaveLength(3);
    expect(tiers[1]).toMatchObject({
      id: "enhanced",
      priceLow: 22000,
      priceHigh: 28000,
      recommended: true,
    });
    expect(briefing.content.requiredCapacity).toBe(
      "90,000 BTU input, 75,000 output",
    );
    expect(briefing.content.accessNotes).toBe(
      "Mechanical room is 12 x 18, full access.",
    );
  });

  it("writes lifecycle + tier columns", () => {
    expect(payload!.columns.expected_lifespan_years).toBe(20);
    expect(payload!.columns.current_age_years).toBe(17);
    expect(payload!.columns.tiers).not.toBeNull();
    expect(payload!.columns.condition_rating).toBe("Fair");
    expect(payload!.columns.specs).toEqual(
      expect.arrayContaining([
        { label: "Make", value: "Lennox" },
        { label: "Serial Number", value: "5818H45821" },
        { label: "Typical Lifespan", value: "20 years" },
        { label: "Current Age", value: "17 years" },
      ]),
    );
  });

  it("omits the briefing block when nothing was captured", () => {
    const bare = buildStructuredPagePayload({
      page: { page_key: "sump-pump", title: "Sump Pump", group: "Systems" },
      sectionKey: "systems_appliances",
      sectionLabel: "Systems & Appliances",
      authoring: authoringWith({
        system: {
          make: "Zoeller",
          statusFlags: [],
          specs: [],
          observations: [],
        },
      }),
      now: NOW,
    });
    expect(bare!.blocks).toHaveLength(1);
    expect(bare!.columns.tiers).toBeNull();
  });
});

describe("buildStructuredPagePayload — vision structured fields", () => {
  const payload = buildStructuredPagePayload({
    page: {
      page_key: "vision-primary-bath",
      title: "Vision: Primary Bath Spa Conversion",
      group: "Strategy",
    },
    sectionKey: "strategy",
    sectionLabel: "Strategy",
    authoring: authoringWith(
      {
        vision: {
          whyDesignFirst:
            "Every successful renovation begins with design. For a project of this scope, we recommend a design phase of 4-6 weeks.",
          designPhaseWeeks: 5,
          designPhaseCost: 4500,
          tiers: {
            essential: {
              priceLow: 48000,
              priceHigh: 62000,
              description: "Pragmatic; keeps existing layout.",
            },
            enhanced: {
              priceLow: 78000,
              priceHigh: 95000,
              description: "Full transformation, premium materials.",
              recommended: true,
            },
            signature: {
              priceLow: 120000,
              priceHigh: 145000,
              description: "Every premium upgrade, design-led.",
            },
          },
          priorityWindow: "Year 1-2",
          category: "Lifestyle",
          observations: [],
        },
      },
      [{ type: "narrative", value: "Remove dated soaking tub, expand shower." }],
    ),
    now: NOW,
  });

  it("fills the vision_project block with priced tiers + identity", () => {
    const block = payload!.blocks[0];
    expect(block.type).toBe("vision_project");
    expect(block.content.category).toBe("Lifestyle");
    expect(block.content.priority).toBe("Year 1-2");
    const tiers = block.content.tiers as Array<Record<string, unknown>>;
    expect(tiers[0]).toMatchObject({ id: "essential", priceLow: 48000 });
    expect(tiers[1]).toMatchObject({ recommended: true, priceHigh: 95000 });
    expect(block.content.designFeeEducationHtml).toContain(
      "Every successful renovation begins with design.",
    );
    expect(block.content.visionNarrativeHtml).toContain(
      "Remove dated soaking tub",
    );
    expect(block.content.akrDisclosed).toBe(true);
    expect(block.content.executionPathHtml).toBeTruthy();
  });

  it("writes the tier column", () => {
    expect(payload!.columns.tiers).toMatchObject({
      enhanced: { priceLow: 78000, priceHigh: 95000 },
    });
  });

  it("keeps unpriced tier scaffolding when the triple is incomplete", () => {
    const partial = buildStructuredPagePayload({
      page: {
        page_key: "vision-screened-porch",
        title: "Vision: 4-Season Screened Porch",
        group: "Strategy",
      },
      sectionKey: "strategy",
      sectionLabel: "Strategy",
      authoring: authoringWith({
        vision: {
          tiers: {
            essential: { priceLow: 45000, priceHigh: 0, description: "" },
            enhanced: { priceLow: 0, priceHigh: 0, description: "" },
            signature: { priceLow: 0, priceHigh: 0, description: "" },
          },
          observations: [],
        },
      }),
      now: NOW,
    });
    expect(partial!.columns.tiers).toBeNull();
    const tiers = partial!.blocks[0].content.tiers as Array<
      Record<string, unknown>
    >;
    // Template scaffolding (labels only), never partially-invented prices.
    expect(tiers.map((t) => t.id)).toEqual([
      "essential",
      "enhanced",
      "signature",
    ]);
    expect(tiers.every((t) => t.priceLow === undefined)).toBe(true);
  });
});

describe("buildExecutiveSummaryBlocks", () => {
  it("renders welcome paragraphs + an ordered theme list", () => {
    const blocks = buildExecutiveSummaryBlocks(
      authoringWith(
        {
          executiveSummary: {
            topThemes:
              "1. Your home is in excellent overall condition.\n2. Your HVAC is the highest-priority concern.\n- Recurring services are scattered.",
          },
        },
        [
          {
            type: "narrative",
            value: "Mark, Jennifer, Olivia, and Jack: thank you.",
          },
        ],
      ),
      NOW,
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0].content.html).toContain("thank you");
    expect(blocks[1].content.html).toContain("<ol>");
    expect(blocks[1].content.html).toContain(
      "<li>Your home is in excellent overall condition.</li>",
    );
    expect(blocks[1].content.html).toContain(
      "<li>Recurring services are scattered.</li>",
    );
  });

  it("returns no blocks for an empty page", () => {
    expect(buildExecutiveSummaryBlocks(authoringWith(undefined), NOW)).toEqual(
      [],
    );
  });
});

// ─── Phase 4 — page photo publish mapping ──────────────────────────────────

describe("buildPagePhotoPublish", () => {
  const photo = (n: number) => ({ url: `https://cdn.example.com/p${n}.jpg` });

  it("returns empty images and no gallery for a page with no photos", () => {
    const result = buildPagePhotoPublish({ photos: [], now: NOW });
    expect(result.images).toEqual([]);
    expect(result.galleryBlock).toBeNull();
  });

  it("publishes a single photo as the hero with no gallery block", () => {
    const result = buildPagePhotoPublish({ photos: [photo(1)], now: NOW });
    expect(result.images).toEqual(["https://cdn.example.com/p1.jpg"]);
    expect(result.galleryBlock).toBeNull();
  });

  it("emits a photo_gallery block when a page has 2+ photos", () => {
    const result = buildPagePhotoPublish({
      photos: [photo(1), photo(2)],
      now: NOW,
    });
    expect(result.images).toHaveLength(2);
    expect(result.galleryBlock?.type).toBe("photo_gallery");
    const content = result.galleryBlock?.content as {
      photos: { url: string; caption?: string }[];
    };
    expect(content.photos.map((p) => p.url)).toEqual([
      "https://cdn.example.com/p1.jpg",
      "https://cdn.example.com/p2.jpg",
    ]);
  });

  it("orders system slots first: unit photo becomes the hero", () => {
    const result = buildPagePhotoPublish({
      photos: [photo(9)],
      slots: {
        installLocation: photo(3),
        serialPlate: photo(2),
        unit: photo(1),
      },
      now: NOW,
    });
    expect(result.images).toEqual([
      "https://cdn.example.com/p1.jpg",
      "https://cdn.example.com/p2.jpg",
      "https://cdn.example.com/p3.jpg",
      "https://cdn.example.com/p9.jpg",
    ]);
  });

  it("captions slot photos factually in the gallery block", () => {
    const result = buildPagePhotoPublish({
      photos: [],
      slots: { unit: photo(1), serialPlate: photo(2) },
      now: NOW,
    });
    const content = result.galleryBlock?.content as {
      photos: { url: string; caption?: string }[];
    };
    expect(content.photos[0].caption).toBe("Unit photo");
    expect(content.photos[1].caption).toBe("Serial plate");
  });

  it("keeps an explicit caption over the slot default", () => {
    const result = buildPagePhotoPublish({
      photos: [],
      slots: {
        unit: { url: "https://cdn.example.com/p1.jpg", caption: "Furnace" },
        serialPlate: photo(2),
      },
      now: NOW,
    });
    const content = result.galleryBlock?.content as {
      photos: { url: string; caption?: string }[];
    };
    expect(content.photos[0].caption).toBe("Furnace");
  });

  it("dedupes a photo that is both slotted and in the assigned list", () => {
    const result = buildPagePhotoPublish({
      photos: [photo(1), photo(2)],
      slots: { serialPlate: photo(1) },
      now: NOW,
    });
    expect(result.images).toEqual([
      "https://cdn.example.com/p1.jpg",
      "https://cdn.example.com/p2.jpg",
    ]);
    const content = result.galleryBlock?.content as {
      photos: { url: string; caption?: string }[];
    };
    // The slot occurrence (with its caption) wins.
    expect(content.photos[0].caption).toBe("Serial plate");
  });

  it("skips blank URLs instead of publishing empty strings", () => {
    const result = buildPagePhotoPublish({
      photos: [{ url: "  " }, photo(1)],
      now: NOW,
    });
    expect(result.images).toEqual(["https://cdn.example.com/p1.jpg"]);
    expect(result.galleryBlock).toBeNull();
  });

  it("stamps the gallery block with the given order and timestamp", () => {
    const result = buildPagePhotoPublish({
      photos: [photo(1), photo(2)],
      order: 5,
      now: NOW,
    });
    expect(result.galleryBlock?.order).toBe(5);
    expect(result.galleryBlock?.createdAt).toBe(NOW);
  });
});
