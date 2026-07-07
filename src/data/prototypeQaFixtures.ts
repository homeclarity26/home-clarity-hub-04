// Static Caldwell demo fixtures for the /dev/prototype-qa harness.
// Dev-only: feeds the REAL report template components (RoomTemplatePage,
// SystemTemplatePage, VisionTemplatePage, ReportHome) with the Caldwell
// prototype content so we can visually diff against the locked prototype
// without logging in. No Supabase, no auth, no network.

import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type {
  BlockType,
  ReportBlock,
  RoomRecordContent,
  SystemRecordContent,
  ReplacementBriefingContent,
  VisionProjectContent,
} from "@/components/wysiwyg/types";

const QA_TS = "2026-07-06T00:00:00.000Z";

function qaBlock(
  type: BlockType,
  order: number,
  content: Record<string, unknown>,
): ReportBlock {
  return {
    id: `qa-${type}-${order}`,
    type,
    content,
    colSpan: 12,
    order,
    createdAt: QA_TS,
    updatedAt: QA_TS,
  };
}

// ─── Room: Kitchen ───────────────────────────────────────────────────────

export const kitchenGroup: PortalGroup = {
  id: "interior-utility",
  title: "Kitchen & Pantry",
  pages: ["kitchen"],
};

export const kitchenPage: ReportPageData = {
  id: "kitchen",
  title: "Kitchen",
  group: "interior-utility",
  conditionRating: "Excellent",
  narrative: [],
  specs: [
    { label: "Dimensions", value: "18 × 22" },
    { label: "Floor Area", value: "396 sqft" },
    { label: "Ceiling", value: "10ft" },
    { label: "Level", value: "Floor 1" },
  ],
};

const kitchenRoomRecord: RoomRecordContent = {
  roomName: "Kitchen",
  roomGroup: "Kitchen & Pantry",
  floorLabel: "Floor 1",
  dimensions: "18 × 22",
  floorSqft: 396,
  ceiling: "10ft",
  wallPaint: "Benjamin Moore Revere Pewter HC-172",
  trimPaint: "Benjamin Moore Simply White OC-117",
  ceilingPaint: "",
  flooring: '3/4" Solid Oak, Natural Stain',
  lightFixtures: "2× pendant + 6× recessed LED",
  outlets: "9 total (2 GFCI)",
  windows: "3 double-hung, 36 × 60",
  doors: "2 swing + 1 pocket",
  conditionRating: "Excellent",
  observationsHtml:
    "Your kitchen was fully remodeled in 2017 with a high-end Sub-Zero, Wolf, and Cove appliance package. The space is in excellent condition overall. Quartz counters show minor edge wear at the sink. The backsplash is small-format, and Jennifer mentioned wanting a more substantial treatment. The Sub-Zero refrigerator's water dispenser has been intermittent; we'll schedule a service visit through your Concierge.",
  linkedVisionProjects: [
    { title: "Kitchen Refresh: Counters & Backsplash", priority: "Year 2-3" },
  ],
};

export const kitchenBlocks: ReportBlock[] = [
  qaBlock("room_record", 0, { ...kitchenRoomRecord }),
];

// ─── System: Furnace ─────────────────────────────────────────────────────

export const furnaceGroup: PortalGroup = {
  id: "systems-hvac",
  title: "HVAC System",
  pages: ["primary-furnace"],
};

// SystemTemplatePage reads expected_lifespan_years / current_age_years off
// the page object for its lifecycle bar, so the fixture type widens
// ReportPageData with those two fields.
export type QaSystemPage = ReportPageData & {
  expected_lifespan_years: number;
  current_age_years: number;
};

export const furnacePage: QaSystemPage = {
  id: "primary-furnace",
  title: "Furnace: Main Floor Zone",
  group: "systems-hvac",
  conditionRating: "Fair",
  narrative: [],
  specs: [
    { label: "Make", value: "Lennox" },
    { label: "Model", value: "SLP99V-090" },
    { label: "Serial Number", value: "5818H45821" },
    { label: "Installed", value: "2009-08" },
    { label: "Typical Lifespan", value: "20 years" },
    { label: "Current Age", value: "17 years" },
  ],
  expected_lifespan_years: 20,
  current_age_years: 17,
};

const furnaceSystemRecord: SystemRecordContent = {
  systemName: "Furnace: Main Floor Zone",
  category: "HVAC",
  isAppliance: false,
  status: "Approaching End-of-Life",
  make: "Lennox",
  model: "SLP99V-090",
  serial: "5818H45821",
  installDate: "2009-08",
  typicalLifespanYears: 20,
  conditionRating: "Fair",
  specifications: [],
  maintenanceLog: [],
  routineCareItems: [],
  photos: {},
};

// NOTE: no separate text-block alert — SystemRecordBlock derives and renders
// its own "Proactive lifecycle alert" from age/lifespan, so adding one here
// would duplicate it.

const furnaceBriefing: ReplacementBriefingContent = {
  systemType: "Furnace",
  headline: "Pre-scoped, pre-priced, ready when you are",
  intro:
    "When you're ready to replace this system, tap below. We'll send our HVAC partner a complete briefing: your model, capacity, install location photos, ductwork specs, electrical, gas line, and condensate. They arrive with everything they need to install. No site visit. No re-measuring. No surprise change orders.",
  tiers: [
    {
      id: "essential",
      label: "Essential",
      priceLow: 14000,
      priceHigh: 18000,
      scopeHtml:
        "Like-for-like replacement, single-stage 80% efficiency, reliable but no comfort upgrades",
      recommended: false,
    },
    {
      id: "enhanced",
      label: "Enhanced",
      priceLow: 22000,
      priceHigh: 28000,
      scopeHtml:
        "2-stage 96% efficiency, variable speed blower, smart thermostat; quieter, lower bills",
      recommended: true,
    },
    {
      id: "signature",
      label: "Signature",
      priceLow: 32000,
      priceHigh: 42000,
      scopeHtml:
        "Modulating gas valve, inverter-driven AC, MERV 13 filtration, room sensors; comfort suite",
      recommended: false,
    },
  ],
  photos: [],
  ctas: [
    {
      id: "emergency",
      label: "Help, this isn't working",
      style: "rust",
      action: "open_concierge",
      prompt: "My furnace just stopped working. I need help today.",
    },
    {
      id: "plan",
      label: "Plan my replacement",
      style: "gold",
      action: "open_concierge",
      prompt: "I want to start planning the replacement for my furnace.",
    },
  ],
};

export const furnaceBlocks: ReportBlock[] = [
  qaBlock("system_record", 0, { ...furnaceSystemRecord }),
  qaBlock("replacement_briefing", 1, { ...furnaceBriefing }),
];

// ─── Vision: Primary Bath ────────────────────────────────────────────────

export const visionBathGroup: PortalGroup = {
  id: "strategy",
  title: "Vision Projects",
  pages: ["vision-primary-bath"],
};

export const visionBathPage: ReportPageData = {
  id: "vision-primary-bath",
  title: "Primary Bath: Spa Conversion",
  group: "strategy",
  narrative: [],
  timing: "Year 1-2",
  tiers: {
    essential: {
      price: "$48,000 - $62,000",
      description: "Pragmatic; solves functional issues, keeps existing layout.",
    },
    enhanced: {
      price: "$78,000 - $95,000",
      description: "Recommended; full transformation, premium materials.",
    },
    signature: {
      price: "$120,000 - $145,000",
      description: "Fully realized; every premium upgrade, design-led.",
    },
  },
};

const visionBathProject: VisionProjectContent = {
  projectTitle: "Primary Bath: Spa Conversion",
  category: "Lifestyle",
  priority: "Year 1-2",
  visionNarrativeHtml:
    "Remove the dated soaking tub, expand the shower to a wet-room with linear drain, heated tile floors, and a digital shower system. Mark and Jennifer brought this up explicitly during the walkthrough, Jennifer especially. The vision is a more refined daily experience that fits how the family actually lives.",
  designFeeEducationHtml:
    "Every successful renovation begins with design. For a project of this scope, we recommend a design phase of <strong>4-6 weeks at $4,500 - $8,500</strong>. This covers site measurement, design conversations, materials and finishes, lighting selection, and detailed construction drawings. Design fees protect your investment by surfacing every decision before construction starts.",
  designFeeLow: 4500,
  designFeeHigh: 8500,
  tiers: [
    {
      id: "essential",
      label: "Essential",
      priceLow: 48000,
      priceHigh: 62000,
      scopeHtml: "Pragmatic; solves functional issues, keeps existing layout.",
      recommended: false,
    },
    {
      id: "enhanced",
      label: "Enhanced",
      priceLow: 78000,
      priceHigh: 95000,
      scopeHtml: "Recommended; full transformation, premium materials.",
      recommended: true,
    },
    {
      id: "signature",
      label: "Signature",
      priceLow: 120000,
      priceHigh: 145000,
      scopeHtml: "Fully realized; every premium upgrade, design-led.",
      recommended: false,
    },
  ],
  executionPathHtml:
    "When you're ready to start, we'll execute this through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you'd prefer a different contractor, we'll connect you with one of our trusted trade partners; the choice is always yours. Either way, you stay in the same conversation with HBC.",
  akrDisclosed: true,
};

export const visionBathBlocks: ReportBlock[] = [
  qaBlock("vision_project", 0, { ...visionBathProject }),
];

// ─── Report Home ─────────────────────────────────────────────────────────

export const reportHomeProps = {
  propertyName: "The Caldwell Residence",
  propertyAddress: "The Caldwell Residence",
  completionPercent: 100,
};
