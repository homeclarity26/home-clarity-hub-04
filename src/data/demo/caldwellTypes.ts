// Source types for the public Caldwell demo report (/demo).
//
// The demo is a fully static, no-auth, no-network rendering of the real
// client portal. Data modules in this folder author the Caldwell Residence
// in these shapes; caldwellBuilder turns them into the exact
// { groups, pages, pageImages } props the real ReportTab consumes, using the
// same typed blocks a published report carries.
//
// Record fields reuse the real block content types on purpose: if it
// type-checks here, the production renderers can draw it.

import type {
  RoomRecordContent,
  SystemRecordContent,
  ReplacementBriefingTier,
  VisionProjectContent,
  RecurringServiceRow,
  CapitalPlanContent,
  MaintenanceCalendarContent,
} from "@/components/wysiwyg/types";

/** Report group ids. Each must stay inside ReportChapterNav's CHAPTERS list. */
export type DemoGroupId =
  | "information"
  | "interior-living"
  | "interior-utility"
  | "interior-bedrooms"
  | "interior-bathrooms"
  | "interior-additional"
  | "interior-unfinished"
  | "exterior"
  | "exterior-structures"
  | "systems-hvac"
  | "systems-mechanical"
  | "systems-additional"
  | "safety-detection"
  | "appliances"
  | "strategy";

export interface DemoPhoto {
  /** Public path, e.g. "/demo/caldwell/kitchen.jpg". */
  src: string;
  caption?: string;
}

/** A contextual Bobby prompt shown as a callout at the foot of a page. */
export interface DemoConciergeAction {
  title: string;
  body: string;
  /** The message Bobby receives when the homeowner taps the callout. */
  prompt: string;
}

/** Interior room or exterior space (Room template). */
export interface DemoRoom {
  /** Page key, kebab-case, from docs/demo/CALDWELL_DEMO_BIBLE.md. */
  key: string;
  groupId: DemoGroupId;
  /** Page title. No em-dashes. */
  title: string;
  record: RoomRecordContent;
  conciergeAction?: DemoConciergeAction;
}

/** Mechanical system or appliance (System template). */
export interface DemoSystem {
  key: string;
  groupId: DemoGroupId;
  title: string;
  /** Age in whole years as of the report date (November 2026). */
  ageYears: number;
  record: SystemRecordContent;
  /** Two to four short plain-language observations. */
  observations: string[];
  /**
   * Replacement Briefing tiers. Provide all three (essential, enhanced,
   * signature) or omit entirely. Exactly one tier is `recommended`.
   */
  briefingTiers?: ReplacementBriefingTier[];
  /** e.g. "Furnace", "AC Condenser". Used in the briefing copy. */
  briefingSystemType?: string;
}

/** Vision project (Vision template). Lives in the Strategy chapter. */
export interface DemoVision {
  /** Must start with "vision-". */
  key: string;
  title: string;
  project: VisionProjectContent;
}

/**
 * Information chapter page. These are the first pages a reader opens, so
 * they are designed pages, not prose dumps: a short lede, optional stat
 * tiles, short headed sections (paragraphs and/or bullets), an optional
 * numbered list, an optional callout and an optional signature.
 */
export interface DemoInfoPage {
  key: string;
  title: string;
  /** One or two sentences under the title. */
  lede?: string;
  /** Stat tiles, e.g. { label: "Built", value: "1998" }. */
  stats?: { label: string; value: string; subtitle?: string }[];
  sections?: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
  /** Numbered items, e.g. the five themes or the top priorities. */
  numbered?: { title: string; body: string; tag?: string }[];
  /** Highlighted box, e.g. "How this report stays alive". */
  callout?: { label: string; body: string };
  /** e.g. "Adam Kilgore, founder, Hometown Builders Club" */
  signature?: string;
}

/** Standing Strategy pages. */
export interface DemoStrategy {
  services: RecurringServiceRow[];
  /** "tier_200" | "tier_400" | "tier_600" */
  conciergeTier: string;
  capitalPlan: CapitalPlanContent;
  maintenanceCalendar: MaintenanceCalendarContent;
}

/** Whole-house facts shown on Portal Home and the report cover. */
export interface DemoHome {
  familyName: string;
  propertyName: string;
  addressLine: string;
  cityLine: string;
  yearBuilt: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: string;
  style: string;
  reportDate: string;
  heroImage: string;
  hoverImage: string;
  hoverMeta: string;
  iguideImage: string;
  iguideMeta: string;
}
