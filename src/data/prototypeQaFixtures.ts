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
  RecurringServicesRegisterContent,
  RecurringServiceRow,
  CapitalPlanContent,
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

// ─── Phase 4 — QA photo placeholders ─────────────────────────────────────
// Tiny inline SVG data URIs so the harness renders hero + gallery photo
// areas with zero network fetches. Named SVG colors only; brand hex stays
// in src/index.css.

const qaPhotoDataUri = (label: string, bg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">` +
      `<rect width="640" height="400" fill="${bg}"/>` +
      `<rect x="16" y="16" width="608" height="368" fill="none" stroke="white" stroke-opacity="0.4" stroke-width="2"/>` +
      `<text x="32" y="212" font-family="monospace" font-size="30" fill="white">${label}</text>` +
      `</svg>`,
  )}`;

// Hero (index 0) + gallery (rest) for the client render check.
export const kitchenImages: string[] = [
  qaPhotoDataUri("Kitchen overview", "darkslategray"),
  qaPhotoDataUri("Range + hood detail", "sienna"),
  qaPhotoDataUri("Island + pendants", "steelblue"),
];

export const furnaceImages: string[] = [
  qaPhotoDataUri("Furnace unit", "midnightblue"),
  qaPhotoDataUri("Serial plate", "darkolivegreen"),
  qaPhotoDataUri("Install location", "saddlebrown"),
];

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

// ─── Strategy: Recurring Services (screens 29-30) ────────────────────────

// StrategyTemplatePage reads optional display fields beyond ReportPageData
// (eyebrow / prose H1 / intro paragraph), so the fixture type widens it.
export type QaStrategyPage = ReportPageData & {
  strategyEyebrow?: string;
  displayTitle?: string;
  intro?: string;
};

export const strategyGroup: PortalGroup = {
  id: "strategy",
  title: "Strategy",
  pages: ["recurring-services", "strategy-roadmap"],
};

export const servicesPage: QaStrategyPage = {
  id: "recurring-services",
  title: "Recurring Services",
  group: "strategy",
  narrative: [],
  strategyEyebrow: "Strategy · Recurring Services",
  displayTitle: "Everything you're paying for, in one place",
  intro:
    "We captured every recurring service the home consumes: what you have, who provides it, how often, and what's overdue. Most homeowners are working with 8-12 vendors and lose track. There's a better way.",
};

// 20 services · $1,918/mo total · 9 overdue (11 on track). First two rows
// are verbatim from the prototype table; the rest are plausible Caldwell
// vendors consistent with the stat cards.
const caldwellServices: RecurringServiceRow[] = [
  { id: "svc-01", category: "cleaning", serviceName: "House Cleaning", vendorName: "Spotless Pros", frequency: "Bi-weekly", nextDueDate: "2026-04-26", monthlyCost: 540, status: "current" },
  { id: "svc-02", category: "lawn_landscaping", serviceName: "Lawn Mowing & Edging", vendorName: "GreenScape Hudson", frequency: "Weekly (Apr-Oct)", nextDueDate: "2026-04-26", monthlyCost: 280, status: "current" },
  { id: "svc-03", category: "pest_control", serviceName: "Pest Control", vendorName: "Hudson Valley Pest", frequency: "Quarterly", nextDueDate: "2026-03-14", monthlyCost: 68, status: "overdue" },
  { id: "svc-04", category: "hvac", serviceName: "HVAC Service Plan", vendorName: "Airflow Mechanical", frequency: "Biannual", nextDueDate: "2026-04-01", monthlyCost: 38, status: "overdue" },
  { id: "svc-05", category: "roof_gutters", serviceName: "Gutter Cleaning", vendorName: "ClearFlow Exteriors", frequency: "Biannual", nextDueDate: "2026-05-15", monthlyCost: 50, status: "overdue" },
  { id: "svc-06", category: "cleaning", serviceName: "Window Washing", vendorName: "Crystal View", frequency: "Quarterly", nextDueDate: "2026-07-18", monthlyCost: 110, status: "current" },
  { id: "svc-07", category: "tree_care", serviceName: "Tree & Shrub Care", vendorName: "Arbor North", frequency: "Quarterly", nextDueDate: "2026-04-08", monthlyCost: 110, status: "overdue" },
  { id: "svc-08", category: "lawn_landscaping", serviceName: "Irrigation Startup & Winterize", vendorName: "GreenScape Hudson", frequency: "Biannual", nextDueDate: "2026-04-20", monthlyCost: 32, status: "overdue" },
  { id: "svc-09", category: "plumbing", serviceName: "Water Treatment Service", vendorName: "PureFlow Water", frequency: "Quarterly", nextDueDate: "2026-08-05", monthlyCost: 40, status: "current" },
  { id: "svc-10", category: "other", serviceName: "Chimney Sweep", vendorName: "Hearthside Chimney", frequency: "Annual", nextDueDate: "2025-11-30", monthlyCost: 27, status: "overdue" },
  { id: "svc-11", category: "snow_removal", serviceName: "Snow Plowing", vendorName: "GreenScape Hudson", frequency: "Per storm (Nov-Mar)", nextDueDate: "2026-11-15", monthlyCost: 120, status: "current" },
  { id: "svc-12", category: "security", serviceName: "Security Monitoring", vendorName: "SafeHaven Security", frequency: "Monthly", nextDueDate: "2026-07-01", monthlyCost: 85, status: "current" },
  { id: "svc-13", category: "electrical", serviceName: "Generator Service Plan", vendorName: "PowerGuard Standby", frequency: "Annual", nextDueDate: "2026-05-30", monthlyCost: 30, status: "overdue" },
  { id: "svc-14", category: "other", serviceName: "Trash & Recycling", vendorName: "County Waste", frequency: "Weekly", nextDueDate: "2026-07-10", monthlyCost: 62, status: "current" },
  { id: "svc-15", category: "hvac", serviceName: "Dryer Vent Cleaning", vendorName: "AirDuct Pros", frequency: "Annual", nextDueDate: "2026-01-15", monthlyCost: 18, status: "overdue" },
  { id: "svc-16", category: "plumbing", serviceName: "Plumbing Inspection", vendorName: "Hudson Plumbing Co", frequency: "Annual", nextDueDate: "2026-06-01", monthlyCost: 22, status: "overdue" },
  { id: "svc-17", category: "other", serviceName: "Driveway Sealing", vendorName: "BlackTop Bros", frequency: "Annual", nextDueDate: "2026-08-20", monthlyCost: 43, status: "current" },
  { id: "svc-18", category: "other", serviceName: "Deck Staining", vendorName: "ProFinish Painting", frequency: "Annual", nextDueDate: "2026-09-12", monthlyCost: 60, status: "current" },
  { id: "svc-19", category: "cleaning", serviceName: "House Soft Wash", vendorName: "ClearFlow Exteriors", frequency: "Annual", nextDueDate: "2026-08-28", monthlyCost: 33, status: "current" },
  { id: "svc-20", category: "other", serviceName: "Internet & Smart Home Support", vendorName: "HudsonTech", frequency: "Monthly", nextDueDate: "2026-07-15", monthlyCost: 150, status: "current" },
];

const servicesRegister: RecurringServicesRegisterContent = {
  services: caldwellServices,
  conciergeTier: "tier_600",
};

export const servicesBlocks: ReportBlock[] = [
  qaBlock("recurring_services_register", 0, { ...servicesRegister }),
];

// ─── Strategy: 10-Year Plan (screens 31-32) ──────────────────────────────

export const roadmapPage: QaStrategyPage = {
  id: "strategy-roadmap",
  title: "Strategy & Roadmap",
  group: "strategy",
  narrative: [],
  strategyEyebrow: "Strategy",
  displayTitle: "Your 10-Year Plan",
};

const caldwellCapitalPlan: CapitalPlanContent = {
  startYear: 2026,
  items: [
    { id: "cp-1", projectName: "Kitchen Refresh", phase: "offense", yearStart: 2027, yearEnd: 2028 },
    { id: "cp-2", projectName: "Primary Bath", phase: "offense", yearStart: 2026, yearEnd: 2027 },
    { id: "cp-3", projectName: "Screened Porch", phase: "expansion", yearStart: 2027, yearEnd: 2029 },
    { id: "cp-4", projectName: "Driveway Replacement", phase: "expansion", yearStart: 2028, yearEnd: 2030 },
    { id: "cp-5", projectName: "Roof Replacement", phase: "expansion", yearStart: 2029, yearEnd: 2030 },
    { id: "cp-6", projectName: "HVAC Replacement", phase: "defense", yearStart: 2026, yearEnd: 2028 },
  ],
  phaseCards: [
    {
      phase: "defense",
      yearLabel: "Year 1",
      title: "Defense",
      bullets: [
        "Catch up overdue maintenance",
        "Set up HBC Concierge",
        "Plan HVAC replacement (timing)",
      ],
    },
    {
      phase: "offense",
      yearLabel: "Year 1-3",
      title: "Offense",
      bullets: [
        "Primary bath spa conversion",
        "HVAC replacement (both zones)",
        "Kitchen counter & backsplash refresh",
      ],
    },
    {
      phase: "expansion",
      yearLabel: "Year 2-5",
      title: "Expansion",
      bullets: [
        "Screened porch 4-season",
        "Driveway replacement",
        "Roof replacement",
      ],
    },
  ],
  ganttHeading: "Capital plan",
  phaseFooter: [
    { label: "Defense Phase", value: "Maintenance catch-up only" },
    { label: "Offense Phase Range", value: "$148K - $196K mid-tier" },
    { label: "Expansion Phase Range", value: "$185K - $264K mid-tier" },
  ],
};

export const roadmapBlocks: ReportBlock[] = [
  qaBlock("capital_plan", 0, { ...caldwellCapitalPlan }),
];

// ─── Report Home ─────────────────────────────────────────────────────────

export const reportHomeProps = {
  propertyName: "The Caldwell Residence",
  propertyAddress: "The Caldwell Residence",
  completionPercent: 100,
};

// ─── Admin wizard (screens 1-20) ─────────────────────────────────────────
// In-memory state the /dev/prototype-qa harness pushes through the REAL
// WizardContext setters so the actual WizardShell + step components render
// with representative Caldwell data (qaMode suppresses network calls).

import type {
  ClientFormData,
  IntakeFileRef,
  IntakeUploads,
  IntakeFinding,
  PageSeed,
  PageStructuredData,
  TocSection,
  CapitalPlan,
  MaintenanceCalendar,
  RecurringServicePreview,
} from "@/contexts/WizardContext";

export const wizardQaClient: Partial<ClientFormData> = {
  fullName: "Mark and Jennifer Caldwell",
  email: "jen@caldwell.com",
  phone: "(330) 555-0142",
  address: "2847 Stoneybrook Lane, Hudson",
  city: "Hudson",
  state: "OH",
  zip: "44236",
  county: "Summit County",
  propertyName: "Caldwell Residence",
  propertyType: "single_family",
  relationshipType: "premium",
  yearBuilt: "1998",
  sqft: "5,240",
  bedrooms: "5",
  bathrooms: "4.5",
  discoveryNotes:
    "Two-plus hours on site with Mark and Jennifer. HVAC age is the top infrastructure concern; the primary bath and screened porch are the two highest-impact lifestyle upgrades. Kitchen was fully remodeled in 2017 and only needs refinement.",
};

const qaFile = (
  id: string,
  name: string,
  size: number,
  mime: string,
) => ({
  id,
  name,
  size,
  mime,
  storage_path: `qa/${id}/${name}`,
  bucket: "wizard-uploads",
});

// Phase 4 — shared intake photo refs so the Step 3 photo assignments below
// point at the same objects the intake Photos card lists (matches the
// prototype screen 10 slot filenames).
export const wizardQaPhotoFiles = {
  furnaceUnit: qaFile("p0", "furnace_main_2026-04-22.jpg", 2.6 * 1024 * 1024, "image/jpeg"),
  furnaceSerial: qaFile("p1", "furnace_main_serialplate.jpg", 2.1 * 1024 * 1024, "image/jpeg"),
  kitchenOverview: qaFile("p2", "kitchen_overview.jpg", 1.8 * 1024 * 1024, "image/jpeg"),
  roofSouth: qaFile("p3", "roof_south_face.jpg", 2.4 * 1024 * 1024, "image/jpeg"),
  utilityRoom: qaFile("p4", "utility_room_overview.jpg", 2.2 * 1024 * 1024, "image/jpeg"),
};

export const wizardQaUploads: IntakeUploads = {
  transcript: [
    qaFile("t1", "Caldwell_walkthrough_2026-04-22.txt", 32 * 1024, "text/plain"),
  ],
  site_notes: [qaFile("n1", "caldwell_notes.md", 8 * 1024, "text/markdown")],
  photos: [
    wizardQaPhotoFiles.furnaceUnit,
    wizardQaPhotoFiles.furnaceSerial,
    wizardQaPhotoFiles.kitchenOverview,
    wizardQaPhotoFiles.roofSouth,
    wizardQaPhotoFiles.utilityRoom,
  ],
  hover: [qaFile("h1", "hover_measurements_3246434.pdf", 4.2 * 1024 * 1024, "application/pdf")],
  iguide: [qaFile("g1", "iguide_caldwell_2847.pdf", 6.8 * 1024 * 1024, "application/pdf")],
};

export const wizardQaHoverUrl = "https://hover.to/model/3246434";
export const wizardQaIguideUrl = "https://youriguide.com/caldwell_2847";

export const wizardQaFindings: IntakeFinding[] = [
  {
    category: "spaces",
    title: "33 Spaces Identified",
    bullets: [
      "Kitchen, walk-in pantry, and breakfast nook discussed at length",
      "Primary suite: bedroom, bathroom, walk-in closet",
      "Finished basement with home gym and sauna",
    ],
  },
  {
    category: "systems_appliances",
    title: "11 Systems + 17 Appliances",
    bullets: [
      "Two Lennox furnaces, both installed 2009",
      "Sub-Zero refrigerator, Wolf range from 2017 remodel",
      "200-amp Square D QO panel, 1998 original",
    ],
  },
  {
    category: "vision_projects",
    title: "6 Vision Projects",
    bullets: [
      "Primary bath spa conversion (Jennifer's top ask)",
      "4-season screened porch",
      "Kitchen counter and backsplash refresh",
    ],
  },
  {
    category: "recurring_services",
    title: "9 Recurring Services",
    bullets: [
      "Lawn care, gutter cleaning, HVAC service plan",
      "Scattered across many vendors; consolidation opportunity",
    ],
  },
  {
    category: "family_priorities",
    title: "Family Priorities",
    bullets: [
      "Predictability over speed; no January furnace surprises",
      "Design-forward finishes in the primary bath",
    ],
  },
  {
    category: "sequence_risk",
    title: "2 Sequence Risks",
    bullets: [
      "Furnace: Main Floor Zone is 17 years old against a 20-year lifespan",
      "Roof approaching year 28 of a 30-year shingle",
    ],
  },
];

const tocPage = (
  page_key: string,
  title: string,
  group: string,
  reason?: string,
  is_featured = false,
) => ({
  page_key,
  title,
  group,
  selected: true,
  ai_recommended: true,
  is_custom: false,
  is_featured,
  reason,
});

export const wizardQaTocSections: TocSection[] = [
  {
    key: "information",
    label: "Information",
    pages: [
      tocPage("welcome-letter", "Welcome Letter from Adam", "Information", "Personal introduction"),
      tocPage("executive-summary", "Executive Summary", "Information", "Top priorities and themes"),
      tocPage("home-at-a-glance", "Your Home At-a-Glance", "Information", "Specs, permits, sales history"),
      tocPage("project-vision-inventory", "Project Vision Inventory", "Information", "Everything Mark and Jennifer mentioned"),
      tocPage("top-priorities", "Top Priorities", "Information", "3-5 highest-priority items"),
      tocPage("how-to-use", "How to Use This Report", "Information", "Navigation guide"),
    ],
  },
  {
    key: "spaces",
    label: "Spaces",
    pages: [
      tocPage("foyer", "Foyer", "Spaces"),
      tocPage("formal-living-room", "Formal Living Room", "Spaces"),
      tocPage("dining-room", "Dining Room", "Spaces"),
      tocPage("kitchen", "Kitchen", "Spaces", undefined, true),
      tocPage("walk-in-pantry", "Walk-in Pantry", "Spaces"),
      tocPage("breakfast-nook", "Breakfast Nook", "Spaces"),
      tocPage("family-room", "Family Room", "Spaces", undefined, true),
      tocPage("office-study", "Office / Study", "Spaces"),
      tocPage("mudroom", "Mudroom", "Spaces"),
      tocPage("laundry-room", "Laundry Room", "Spaces"),
      tocPage("powder-room", "Powder Room", "Spaces"),
      tocPage("primary-bedroom", "Primary Bedroom", "Spaces", undefined, true),
      tocPage("primary-bathroom", "Primary Bathroom", "Spaces", undefined, true),
      tocPage("home-gym-sauna", "Home Gym + Sauna", "Spaces"),
      tocPage("outdoor-kitchen", "Outdoor Kitchen", "Spaces"),
    ],
  },
  {
    key: "systems_appliances",
    label: "Systems & Appliances",
    pages: [
      tocPage("furnace-main", "Furnace: Main Floor Zone", "Systems"),
      tocPage("ac-condenser-main", "AC Condenser: Main Zone", "Systems"),
      tocPage("water-heater", "Water Heater", "Systems"),
      tocPage("electrical-panel", "Electrical Panel", "Systems"),
      tocPage("sump-pump", "Sump Pump", "Systems"),
      tocPage("roof-system", "Roof System", "Systems"),
      tocPage("refrigerator-subzero", "Refrigerator: Sub-Zero", "Appliances"),
      tocPage("range-wolf", "Range: Wolf", "Appliances"),
      tocPage("washer-dryer", "Washer + Dryer", "Appliances"),
    ],
  },
  {
    key: "strategy",
    label: "Strategy",
    pages: [
      tocPage("vision-primary-bath", "Vision: Primary Bath Spa Conversion", "Strategy"),
      tocPage("vision-hvac-replacement", "Vision: HVAC Replacement", "Strategy"),
      tocPage("vision-screened-porch", "Vision: 4-Season Screened Porch", "Strategy"),
      tocPage("recurring-services", "Recurring Services Register", "Strategy"),
      tocPage("capital-plan-10yr", "10-Year Capital Plan", "Strategy"),
    ],
  },
];

export const wizardQaPageSeeds: PageSeed[] = [
  {
    page_key: "kitchen",
    title: "Kitchen",
    group: "Spaces",
    suggested_condition: "Excellent",
    narrative_seed:
      "Your kitchen was fully remodeled in 2017 with a high-end Sub-Zero, Wolf, and Cove appliance package. The space is in excellent condition overall. Quartz counters show minor edge wear at the sink. The backsplash is small-format, and Jennifer mentioned wanting a counter and backsplash refresh rather than another full remodel.",
    key_observations: [
      "Quartz counters: minor edge wear at sink",
      "Sub-Zero, Wolf, Cove package from 2017 remodel",
      "Backsplash is small-format tile; refresh candidate",
    ],
    specs_seed: [
      { label: "Dimensions", value: "18 x 22" },
      { label: "Floor sqft", value: "396" },
      { label: "Ceiling", value: "10ft" },
    ],
  },
  {
    page_key: "primary-bathroom",
    title: "Primary Bathroom",
    group: "Spaces",
    suggested_condition: "Excellent",
    narrative_seed:
      "Room in good overall condition. No active issues. Jennifer brought up the spa conversion explicitly during the walkthrough; the linked vision project covers the wet-room shower, heated tile floors, and digital shower system.",
    key_observations: ["No active issues", "Linked vision project: spa conversion"],
    specs_seed: [
      { label: "Dimensions", value: "18 x 20" },
      { label: "Ceiling", value: "11ft tray" },
    ],
  },
  {
    page_key: "furnace-main",
    title: "Furnace: Main Floor Zone",
    group: "Systems",
    suggested_condition: "Fair",
    priority: true,
    narrative_seed:
      "This system is 17 years old, with a typical lifespan of 20 years. Now is the right time to start planning replacement on your terms, not on a January night when it fails. The Replacement Briefing below tells our HVAC partner exactly what to bring on the first visit.",
    key_observations: [
      "Lennox SLP99V-090, installed 2009-08",
      "Serial 5818H45821 photographed on site",
      "Approaching end-of-life: plan replacement in year 1-2",
    ],
    specs_seed: [
      { label: "Make", value: "Lennox" },
      { label: "Model", value: "SLP99V-090" },
      { label: "Installed", value: "2009-08" },
    ],
    replacement_briefing_stub: {
      required_capacity: "90,000 BTU input, 75,000 output",
      voltage: "120V available, 240V on adjacent circuit",
    },
  },
  {
    page_key: "roof-system",
    title: "Roof System",
    group: "Systems",
    suggested_condition: "Good",
    priority: true,
    narrative_seed:
      "30-year architectural shingle installed with the 1998 build. South face shows expected granule loss for its age. Budget for replacement inside the 10-year window.",
    key_observations: ["Granule loss on south face", "Flashing sound at chimney"],
    specs_seed: [{ label: "Age", value: "28 years" }],
  },
  {
    page_key: "vision-primary-bath",
    title: "Vision: Primary Bath Spa Conversion",
    group: "Strategy",
    suggested_condition: "Good",
    narrative_seed:
      "Remove dated soaking tub, expand shower to wet-room with linear drain, heated tile floors, digital shower system. Mark and Jennifer brought this up explicitly during the walkthrough; Jennifer especially. The vision is a more refined daily experience that fits how the family actually lives.",
    key_observations: ["Jennifer's top lifestyle ask", "Year 1-2 priority"],
  },
  {
    page_key: "vision-hvac-replacement",
    title: "Vision: HVAC Replacement",
    group: "Strategy",
    narrative_seed:
      "Both zones replaced on your schedule with high-efficiency variable-speed equipment, sized from the Hover measurements and the existing duct layout.",
    key_observations: ["Pair with furnace end-of-life window"],
  },
  {
    page_key: "vision-screened-porch",
    title: "Vision: 4-Season Screened Porch",
    group: "Strategy",
    narrative_seed:
      "Convert the rear screened porch to a true 4-season room with insulated glazing and a dedicated mini-split.",
    key_observations: ["Year 2-5 window"],
  },
];

export const wizardQaCapitalPlan: CapitalPlan = {
  years: [
    { year: 1, phase: "offense", project: "Primary Bath", ballpark_low: 78000, ballpark_high: 95000, rationale: "Jennifer's top lifestyle ask; design phase first." },
    { year: 1, phase: "defense", project: "HVAC Replacement", ballpark_low: 22000, ballpark_high: 28000, rationale: "Both furnaces at year 17 of a 20-year lifespan." },
    { year: 2, phase: "offense", project: "Kitchen Refresh", ballpark_low: 20000, ballpark_high: 35000, rationale: "Counters and backsplash only; 2017 remodel holds." },
    { year: 2, phase: "expansion", project: "Screened Porch", ballpark_low: 45000, ballpark_high: 65000, rationale: "4-season conversion with dedicated mini-split." },
    { year: 3, phase: "expansion", project: "Driveway Replacement", ballpark_low: 18000, ballpark_high: 25000, rationale: "Surface cracking; sequence after porch staging." },
    { year: 4, phase: "defense", project: "Roof Replacement", ballpark_low: 32000, ballpark_high: 45000, rationale: "30-year shingle reaches end-of-life." },
  ],
  total_low: 215000,
  total_high: 293000,
};

export const wizardQaMaintenanceCalendar: MaintenanceCalendar = {
  winter: [
    { task: "Furnace filter change", system: "HVAC", frequency: "Quarterly" },
    { task: "Sump pump test", system: "Plumbing", frequency: "Annual" },
  ],
  spring: [
    { task: "AC condenser service", system: "HVAC", frequency: "Annual" },
    { task: "Gutter cleaning", system: "Exterior", frequency: "Semi-annual" },
  ],
  summer: [
    { task: "Deck and porch inspection", system: "Exterior", frequency: "Annual" },
    { task: "Irrigation check", system: "Exterior", frequency: "Annual" },
  ],
  fall: [
    { task: "Furnace tune-up", system: "HVAC", frequency: "Annual" },
    { task: "Roof and flashing inspection", system: "Roof", frequency: "Annual" },
  ],
};

export const wizardQaRecurringServices: RecurringServicePreview[] = [
  { category: "Grounds", service_name: "Lawn Care", vendor_name: "GreenScape Hudson", frequency: "Weekly, Apr-Oct", cost_per_visit: 65, annual_cost: 1820, hbc_managed: true },
  { category: "HVAC", service_name: "HVAC Service Plan", vendor_name: "Summit Comfort", frequency: "Semi-annual", cost_per_visit: 189, annual_cost: 378, hbc_managed: true },
  { category: "Exterior", service_name: "Gutter Cleaning", vendor_name: null, frequency: "Semi-annual", cost_per_visit: 220, annual_cost: 440, hbc_managed: false },
  { category: "Pest", service_name: "Pest Control", vendor_name: "Buckeye Pest", frequency: "Quarterly", cost_per_visit: 110, annual_cost: 440, hbc_managed: false },
  { category: "Exterior", service_name: "Window Washing", vendor_name: null, frequency: "Annual", cost_per_visit: 380, annual_cost: 380, hbc_managed: false },
  { category: "Water", service_name: "Water Treatment Service", vendor_name: "ClearFlow", frequency: "Annual", cost_per_visit: 260, annual_cost: 260, hbc_managed: true },
];

// Default structured seeds for every spaces/systems page that doesn't have
// a hand-written one above, so the Step 5 structured-content audit reflects
// a report that was actually authored (matching prototype screen 20) rather
// than flooding the gate with 20 identical blocking questions. The
// project-vision-inventory page reads as a vision page to the audit, so it
// carries observations too.
const seededKeys = new Set(wizardQaPageSeeds.map((s) => s.page_key));
for (const section of wizardQaTocSections) {
  if (section.key !== "spaces" && section.key !== "systems_appliances") continue;
  for (const page of section.pages) {
    if (seededKeys.has(page.page_key)) continue;
    wizardQaPageSeeds.push({
      page_key: page.page_key,
      title: page.title,
      group: page.group,
      suggested_condition: "Good",
      key_observations: ["No active issues noted on the walkthrough"],
      narrative_seed: `${page.title} is in good overall condition. No active issues noted on the walkthrough.`,
      specs_seed: [{ label: "Reviewed", value: "2026 walkthrough" }],
    });
  }
}
wizardQaPageSeeds.push({
  page_key: "project-vision-inventory",
  title: "Project Vision Inventory",
  group: "Information",
  key_observations: [
    "Six vision projects captured from the walkthrough conversation",
  ],
  narrative_seed:
    "Every project idea Mark and Jennifer mentioned, captured in one inventory with rough sequencing.",
});

// ─── Phase 5b — structured authoring payloads (screens 8-15) ─────────────
// Applied through upsertAuthoring so the Step 3 per-type editors and the
// live client preview render fully populated Kitchen / Furnace / Vision /
// Exec Summary states matching the prototype.

export const wizardQaStructuredAuthoring: Record<string, PageStructuredData> = {
  kitchen: {
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
        windows: "3 double-hung, 36 x 60",
        doors: "2 swing + 1 pocket",
      },
      observations: [],
      conditionRating: "Excellent",
      specs: [],
      linkedVisionProjects: [],
    },
  },
  "furnace-main": {
    // Prototype screen 10 slot assignments (Unit / Serial Plate / Install
    // Location) so the Step 3 PHOTOS (REQUIRED) group renders populated.
    photoSlots: {
      unit: wizardQaPhotoFiles.furnaceUnit,
      serialPlate: wizardQaPhotoFiles.furnaceSerial,
      installLocation: wizardQaPhotoFiles.utilityRoom,
    },
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
        ductworkNotes: "Existing supply trunk 16x8, return 18x10. Both serviceable.",
        accessNotes: "Mechanical room is 12 x 18, full access from garage.",
        tiers: {
          essential: {
            priceLow: 14000,
            priceHigh: 18000,
            description:
              "Like-for-like replacement, single-stage 80% efficiency, reliable but no comfort upgrades",
          },
          enhanced: {
            priceLow: 22000,
            priceHigh: 28000,
            description:
              "2-stage 96% efficiency, variable speed blower, smart thermostat; quieter, lower bills",
            recommended: true,
          },
          signature: {
            priceLow: 32000,
            priceHigh: 42000,
            description:
              "Modulating gas valve, inverter-driven AC, MERV 13 filtration, room sensors; comfort suite",
          },
        },
      },
    },
  },
  "vision-primary-bath": {
    vision: {
      whyDesignFirst:
        "Every successful renovation begins with design. For a project of this scope, we recommend a design phase of 4-6 weeks at $4,500 - $8,500. This covers site measurement, design conversations, materials and finishes, lighting selection, and detailed construction drawings. Design fees protect your investment by surfacing every decision before construction starts.",
      designPhaseWeeks: 5,
      designPhaseCost: 4500,
      tiers: {
        essential: {
          priceLow: 48000,
          priceHigh: 62000,
          description:
            "The pragmatic version; solves the functional issues, keeps existing layout where possible.",
        },
        enhanced: {
          priceLow: 78000,
          priceHigh: 95000,
          description:
            "Recommended; full transformation, design-forward, premium materials throughout.",
          recommended: true,
        },
        signature: {
          priceLow: 120000,
          priceHigh: 145000,
          description:
            "The fully realized vision; every premium upgrade, design-led from start to finish.",
        },
      },
      priorityWindow: "Year 1-2",
      category: "Lifestyle",
      observations: [],
    },
  },
  "executive-summary": {
    executiveSummary: {
      topThemes: [
        "1. Your home is in excellent overall condition. The bones are solid.",
        "2. Your HVAC is the highest-priority infrastructure concern. Both furnaces are 17 years old.",
        "3. Your kitchen renovation in 2017 was excellent and doesn't need redoing; just refinement.",
        "4. The primary bath and the screened porch are the two highest-impact lifestyle upgrades.",
        "5. Recurring services are scattered across many vendors. There's a clear opportunity to consolidate.",
      ].join("\n"),
    },
  },
};

// Phase 4 — non-slot page photo assignments (PageAuthoring.images) so the
// Step 3 PHOTOS group renders assigned chips on room pages too.
export const wizardQaPageImages: Record<string, IntakeFileRef[]> = {
  kitchen: [wizardQaPhotoFiles.kitchenOverview],
};
