import { describe, expect, it } from "vitest";
import { CHAPTERS } from "@/components/report/ReportChapterNav";
import { isReportBlockArray } from "@/contexts/WizardContext";
import { buildCaldwellDemo, DEMO_GROUPS, formatInstallDate, formatRange } from "./caldwellBuilder";
import { caldwellDemo } from "./caldwellDemo";
import { caldwellHome, caldwellPhotos } from "./caldwellHome";
import {
  sampleAppliances,
  sampleExteriorRooms,
  sampleInfoPages,
  sampleInteriorRooms,
  sampleStrategy,
  sampleSystems,
  sampleVisionProjects,
} from "./caldwellSample";

const sampleInput = {
  home: caldwellHome,
  photos: caldwellPhotos,
  interiorRooms: sampleInteriorRooms,
  exteriorRooms: sampleExteriorRooms,
  systems: sampleSystems,
  appliances: sampleAppliances,
  infoPages: sampleInfoPages,
  visionProjects: sampleVisionProjects,
  strategy: sampleStrategy,
};

function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.push(k);
      allStrings(v, out);
    }
  }
  return out;
}

const CHAPTER_GROUP_IDS = new Set(CHAPTERS.flatMap((c) => c.groupIds));
const BIBLE_GROUP_IDS = new Set(DEMO_GROUPS.map((g) => g.id as string));

// Runs against whatever caldwellDemo.ts is wired to (sample today, the full
// 81-page data once it is rewired), so the checks carry over unchanged.
describe("caldwellDemo (as wired)", () => {
  const demo = caldwellDemo;
  const pageKeys = Object.keys(demo.pages);

  it("builds without data warnings", () => {
    expect(demo.warnings).toEqual([]);
  });

  it("has pages, and every grouped page exists exactly once", () => {
    expect(pageKeys.length).toBeGreaterThanOrEqual(15);
    const grouped = demo.groups.flatMap((g) => g.pages);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...pageKeys].sort());
  });

  it("uses only valid group ids, in bible order", () => {
    for (const g of demo.groups) {
      expect(BIBLE_GROUP_IDS.has(g.id), g.id).toBe(true);
      expect(CHAPTER_GROUP_IDS.has(g.id), g.id).toBe(true);
      expect(g.pages.length).toBeGreaterThan(0);
    }
    const order = DEMO_GROUPS.map((g) => g.id as string);
    const positions = demo.groups.map((g) => order.indexOf(g.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const page of Object.values(demo.pages)) {
      expect(demo.groups.find((g) => g.id === page.group)?.pages).toContain(page.id);
    }
  });

  it("gives every page real blocks", () => {
    for (const page of Object.values(demo.pages)) {
      expect(page.narrative.length, page.id).toBeGreaterThan(0);
      expect(isReportBlockArray(page.narrative), page.id).toBe(true);
      const ids = page.narrative.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("carries no em-dash or en-dash anywhere", () => {
    const offenders = allStrings(demo).filter((s) => /[–—]|&mdash;|&ndash;/.test(s));
    expect(offenders).toEqual([]);
  });

  it("maps each page type to the blocks its template reads", () => {
    for (const page of Object.values(demo.pages)) {
      const types = page.narrative.map((b) => b.type);
      if (page.group.startsWith("interior-") || page.group.startsWith("exterior")) {
        expect(types, page.id).toEqual(["room_record"]);
      } else if (
        page.group.startsWith("systems-") ||
        page.group === "safety-detection" ||
        page.group === "appliances"
      ) {
        expect(types[0], page.id).toBe("system_record");
        expect(page.current_age_years, page.id).toBeTypeOf("number");
        expect(page.key_observations?.length ?? 0, page.id).toBeGreaterThan(0);
      } else if (page.id.startsWith("vision-")) {
        expect(types, page.id).toEqual(["vision_project"]);
        expect(page.tiers?.enhanced.price, page.id).toMatch(/^\$[\d,]+ - \$[\d,]+$/);
        expect(page.timing, page.id).toBeTruthy();
      } else if (page.group === "information") {
        expect(page.info, page.id).toBeTruthy();
      }
    }
  });

  it("builds the three standing strategy pages", () => {
    expect(demo.pages["strategy-roadmap"].narrative[0].type).toBe("capital_plan");
    expect(demo.pages["recurring-services"].narrative[0].type).toBe("recurring_services_register");
    expect(demo.pages["maintenance-calendar"].narrative[0].type).toBe("maintenance_calendar");
    for (const key of ["strategy-roadmap", "recurring-services", "maintenance-calendar"]) {
      expect(demo.pages[key].displayTitle).toBeTruthy();
      expect(demo.pages[key].strategyEyebrow).toBeTruthy();
    }
    const strategy = demo.groups.find((g) => g.id === "strategy");
    expect(strategy?.pages[0]).toBe("strategy-roadmap");
  });

  it("keeps the recurring services register on the locked numbers", () => {
    const content = demo.pages["recurring-services"].narrative[0].content as {
      services: { monthlyCost?: number; status?: string }[];
    };
    expect(content.services).toHaveLength(20);
    expect(content.services.reduce((s, x) => s + (x.monthlyCost ?? 0), 0)).toBe(1918);
    expect(content.services.filter((s) => s.status === "overdue")).toHaveLength(9);
  });

  it("only attaches photos to pages that exist, with a caption map per page", () => {
    for (const [key, images] of Object.entries(demo.pageImages)) {
      expect(demo.pages[key], key).toBeTruthy();
      expect(images.length).toBeGreaterThan(0);
      for (const src of images) expect(src.startsWith("/demo/caldwell/"), src).toBe(true);
      expect(demo.photoCaptions[key]).toBeTruthy();
    }
  });

  it("resolves linked vision projects to pages that exist, or leaves them unlinked", () => {
    for (const page of Object.values(demo.pages)) {
      for (const b of page.narrative) {
        if (b.type !== "room_record") continue;
        const linked = (b.content.linkedVisionProjects ?? []) as { id?: string }[];
        for (const vp of linked) {
          if (vp.id) expect(demo.pages[vp.id], `${page.id} to ${vp.id}`).toBeTruthy();
        }
      }
    }
  });
});

describe("buildCaldwellDemo (sample input)", () => {
  const demo = buildCaldwellDemo(sampleInput);

  it("builds the 16 sample pages", () => {
    expect(Object.keys(demo.pages)).toHaveLength(16);
    expect(demo.warnings).toEqual([]);
  });

  it("adds a replacement briefing with photos and two CTAs when tiers are given", () => {
    const furnace = demo.pages["furnace-main-zone"];
    expect(furnace.narrative.map((b) => b.type)).toEqual(["system_record", "replacement_briefing"]);
    expect(furnace.expected_lifespan_years).toBe(20);
    expect(furnace.current_age_years).toBe(17);
    expect(furnace.specs?.find((s) => s.label === "Installed")?.value).toBe("August 2009");
    const briefing = furnace.narrative[1].content as {
      tiers: unknown[];
      ctas: { prompt: string }[];
      photos: { role: string }[];
    };
    expect(briefing.tiers).toHaveLength(3);
    expect(briefing.ctas).toHaveLength(2);
    expect(briefing.photos.map((p) => p.role)).toEqual(["unit", "serial_plate"]);
    expect(demo.pages["tankless-water-heater"].narrative).toHaveLength(1);
  });

  it("carries the room concierge action and flags exterior pages to omit blank finishes", () => {
    const kitchen = demo.pages.kitchen.narrative[0].content as {
      conciergeAction?: { title: string; prompt: string };
      omitEmptyFinishes?: boolean;
    };
    expect(kitchen.conciergeAction?.title).toBe("Schedule the Sub-Zero service visit");
    expect(kitchen.omitEmptyFinishes).toBeFalsy();
    expect(demo.pages.roof.narrative[0].content.omitEmptyFinishes).toBe(true);
    expect(demo.pages.kitchen.specs?.map((s) => s.value)).toEqual([
      "18 x 22",
      "396 sqft",
      "10ft",
      "Main Floor",
    ]);
  });

  it("links a room to its vision page by title, and drops links to missing pages", () => {
    const bath = demo.pages["primary-bathroom"].narrative[0].content as {
      linkedVisionProjects: { id?: string }[];
    };
    expect(bath.linkedVisionProjects[0].id).toBe("vision-primary-bath");
    const kitchen = demo.pages.kitchen.narrative[0].content as {
      linkedVisionProjects: { id?: string }[];
    };
    // vision-kitchen-refresh is not in the sample, so the chip stays unlinked.
    expect(kitchen.linkedVisionProjects[0].id).toBeUndefined();
  });

  it("hides the end-of-life alert on a healthy late-life system with no briefing", () => {
    const panel = buildCaldwellDemo({
      ...sampleInput,
      systems: [
        {
          key: "electrical-panel",
          groupId: "systems-additional",
          title: "Main Electrical Panel",
          ageYears: 28,
          record: { systemName: "Main Electrical Panel", status: "Healthy", typicalLifespanYears: 40 },
          observations: ["Clean, labeled and with room to grow."],
        },
      ],
    }).pages["electrical-panel"];
    expect(panel.hide_lifecycle_alert).toBe(true);
    expect(demo.pages["furnace-main-zone"].hide_lifecycle_alert).toBeUndefined();
  });

  it("scrubs stray dashes from authored copy", () => {
    const dirty = buildCaldwellDemo({
      ...sampleInput,
      infoPages: [
        { key: "welcome-letter", title: "Welcome", lede: "A home — well kept, Year 1–2." },
      ],
    });
    expect(dirty.pages["welcome-letter"].info?.lede).toBe("A home, well kept, Year 1-2.");
  });

  it("warns instead of throwing on bad group ids and unknown page keys", () => {
    const odd = buildCaldwellDemo({
      ...sampleInput,
      interiorRooms: [
        { ...sampleInteriorRooms[0], groupId: "not-a-group" as never },
        { ...sampleInteriorRooms[1], key: "mystery-room" },
      ],
    });
    expect(odd.pages.kitchen.group).toBe("interior-utility");
    expect(odd.pages["mystery-room"]).toBeTruthy();
    expect(odd.warnings.length).toBe(2);
  });
});

describe("format helpers", () => {
  it("formats ranges with a spaced hyphen", () => {
    expect(formatRange(14000, 18000)).toBe("$14,000 - $18,000");
  });
  it("formats install dates", () => {
    expect(formatInstallDate("2009-08")).toBe("August 2009");
    expect(formatInstallDate("1998-09-01")).toBe("September 1998");
    expect(formatInstallDate("2017")).toBe("2017");
  });
});
