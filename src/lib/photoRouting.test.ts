import { describe, it, expect } from "vitest";
import {
  suggestPhotoAssignments,
  type RoutablePage,
  type RoutablePhoto,
} from "@/lib/photoRouting";

// Phase 4 — pure photo → page routing heuristics.

const PAGES: RoutablePage[] = [
  { page_key: "kitchen", title: "Kitchen", group: "Spaces" },
  { page_key: "outdoor-kitchen", title: "Outdoor Kitchen", group: "Spaces" },
  {
    page_key: "primary-bathroom",
    title: "Primary Bathroom",
    group: "Spaces",
  },
  {
    page_key: "furnace-main",
    title: "Furnace: Main Floor Zone",
    group: "Systems",
  },
  {
    page_key: "ac-condenser",
    title: "AC Condenser: Main Zone",
    group: "Systems",
  },
  {
    page_key: "water-heater",
    title: "Water Heater",
    group: "Systems",
  },
  {
    page_key: "refrigerator-subzero",
    title: "Refrigerator: Sub-Zero",
    group: "Appliances",
  },
  {
    page_key: "vision-primary-bath",
    title: "Vision: Primary Bath Spa Conversion",
    group: "Strategy",
  },
];

const photo = (filename: string, aiCategory?: string): RoutablePhoto => ({
  url: `file:${filename}`,
  filename,
  aiCategory,
});

function suggestOne(p: RoutablePhoto, pages: RoutablePage[] = PAGES) {
  return suggestPhotoAssignments([p], pages)[0];
}

describe("suggestPhotoAssignments", () => {
  it("routes a serial-plate filename to the system page with the serialPlate slot", () => {
    const s = suggestOne(photo("furnace_main_serialplate.jpg"));
    expect(s.page_key).toBe("furnace-main");
    expect(s.slot).toBe("serialPlate");
  });

  it("routes a room overview filename to the room page with no slot", () => {
    const s = suggestOne(photo("kitchen_overview.jpg"));
    expect(s.page_key).toBe("kitchen");
    expect(s.slot).toBeUndefined();
  });

  it("leaves a photo unassigned when no page matches", () => {
    const s = suggestOne(photo("roof_south_face.jpg"));
    expect(s.page_key).toBeNull();
    expect(s.slot).toBeUndefined();
    expect(s.matchedTokens).toEqual([]);
  });

  it("routes via aiCategory when the filename is uninformative", () => {
    const s = suggestOne(
      photo("IMG_2044.jpg", "Furnace / Install Location"),
    );
    expect(s.page_key).toBe("furnace-main");
    expect(s.slot).toBe("installLocation");
  });

  it("bridges an HVAC aiCategory to an HVAC system page via synonyms", () => {
    // Bare "HVAC" is ambiguous between furnace and AC; the routing picks
    // the page whose tokens the category explains best (AC + condenser)
    // rather than leaving the photo unassigned.
    const s = suggestOne(photo("IMG_0001.jpg", "HVAC"));
    expect(s.page_key).toBe("ac-condenser");
    expect(s.slot).toBe("unit");
  });

  it("routes a qualified HVAC aiCategory to the named system", () => {
    const s = suggestOne(photo("IMG_0002.jpg", "HVAC / Furnace"));
    expect(s.page_key).toBe("furnace-main");
    expect(s.slot).toBe("unit");
  });

  it("defaults a system photo without slot keywords to the unit slot", () => {
    const s = suggestOne(photo("furnace_main_2026-04-22.jpg"));
    expect(s.page_key).toBe("furnace-main");
    expect(s.slot).toBe("unit");
  });

  it("prefers the more specific page on tied token matches", () => {
    // "kitchen" matches both kitchen and outdoor-kitchen; coverage
    // tie-breaks to the page the photo tokens fully explain.
    const s = suggestOne(photo("kitchen_overview.jpg"));
    expect(s.page_key).toBe("kitchen");
  });

  it("routes multi-token filenames to the page sharing the most tokens", () => {
    const s = suggestOne(photo("primary_bathroom_vanity.jpg"));
    expect(s.page_key).toBe("primary-bathroom");
    expect(s.slot).toBeUndefined();
  });

  it("routes a water heater serial shot to the right system + slot", () => {
    const s = suggestOne(photo("water_heater_serial.jpg"));
    expect(s.page_key).toBe("water-heater");
    expect(s.slot).toBe("serialPlate");
  });

  it("routes an AC condenser unit shot with the unit slot", () => {
    const s = suggestOne(photo("ac_condenser_unit.jpg"));
    expect(s.page_key).toBe("ac-condenser");
    expect(s.slot).toBe("unit");
  });

  it("suggests slots for appliance pages too", () => {
    const s = suggestOne(photo("sub_zero_refrigerator_serial.jpg"));
    expect(s.page_key).toBe("refrigerator-subzero");
    expect(s.slot).toBe("serialPlate");
  });

  it("ignores pure-numeric and stopword tokens (dates, IMG prefixes)", () => {
    const s = suggestOne(photo("IMG_20260422_143011.jpg"));
    expect(s.page_key).toBeNull();
  });

  it("is case-insensitive", () => {
    const s = suggestOne(photo("Kitchen_Overview.JPG"));
    expect(s.page_key).toBe("kitchen");
  });

  it("returns all photos unassigned when there are no pages", () => {
    const out = suggestPhotoAssignments(
      [photo("kitchen_overview.jpg"), photo("furnace_main_serialplate.jpg")],
      [],
    );
    expect(out.map((s) => s.page_key)).toEqual([null, null]);
  });

  it("passes url and filename through untouched", () => {
    const s = suggestOne(photo("kitchen_overview.jpg"));
    expect(s.url).toBe("file:kitchen_overview.jpg");
    expect(s.filename).toBe("kitchen_overview.jpg");
  });

  it("never slots a room match even with slot-ish keywords", () => {
    const s = suggestOne(photo("kitchen_install_location.jpg"));
    expect(s.page_key).toBe("kitchen");
    expect(s.slot).toBeUndefined();
  });

  it("reports the tokens the match was based on", () => {
    const s = suggestOne(photo("furnace_main_serialplate.jpg"));
    expect(s.matchedTokens).toContain("furnace");
    expect(s.matchedTokens).toContain("main");
  });
});
