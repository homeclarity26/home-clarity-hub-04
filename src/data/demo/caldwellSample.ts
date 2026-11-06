// Small development sample of the Caldwell report: enough of every page
// type to build and verify the /demo shell before the full data modules
// land. Facts follow docs/demo/CALDWELL_DEMO_BIBLE.md. The full data lives
// in the caldwellRooms*, caldwellSystems, caldwellAppliances,
// caldwellInformation and caldwellStrategy modules; caldwellDemo.ts chooses
// which set feeds the builder.

import type { ReplacementBriefingTier, RecurringServiceRow } from "@/components/wysiwyg/types";
import type {
  DemoInfoPage,
  DemoRoom,
  DemoStrategy,
  DemoSystem,
  DemoVision,
} from "./caldwellTypes";

// ─── Rooms ───────────────────────────────────────────────────────────────

export const sampleInteriorRooms: DemoRoom[] = [
  {
    key: "kitchen",
    groupId: "interior-utility",
    title: "Kitchen",
    record: {
      roomName: "Kitchen",
      floorLabel: "Main Floor",
      dimensions: "18 x 22",
      floorSqft: 396,
      ceiling: "10ft",
      wallPaint: "Benjamin Moore Revere Pewter HC-172",
      trimPaint: "Benjamin Moore Simply White OC-117",
      ceilingPaint: "Benjamin Moore Simply White OC-117, flat",
      flooring: '3/4" solid oak, natural stain',
      lightFixtures: "2 glass pendants + 6 recessed LED",
      outlets: "9 total (2 GFCI)",
      windows: "3 double-hung, 36 x 60",
      doors: "2 swing + 1 pocket",
      conditionRating: "Excellent",
      observationsHtml:
        "Your kitchen was fully remodeled in 2017 with a Sub-Zero, Wolf and Cove appliance package, white shaker cabinetry and a quartz island. It is in excellent condition overall. The quartz shows minor edge wear at the sink, and the small-format backsplash is the one finish Jennifer told us she would change. The Sub-Zero water dispenser has been intermittent; a service visit is pending through Bobby.",
      linkedVisionProjects: [
        { id: "vision-kitchen-refresh", title: "Kitchen Refresh: Counters & Backsplash", priority: "Year 2-3" },
      ],
    },
    conciergeAction: {
      title: "Schedule the Sub-Zero service visit",
      body: "Bobby books the factory-certified tech and logs the visit on the Refrigerator page.",
      prompt: "Schedule the service visit for the Sub-Zero water dispenser.",
    },
  },
  {
    key: "primary-bathroom",
    groupId: "interior-bathrooms",
    title: "Primary Bathroom",
    record: {
      roomName: "Primary Bathroom",
      floorLabel: "Upper Floor",
      dimensions: "14 x 16",
      floorSqft: 224,
      ceiling: "10ft tray",
      wallPaint: "Benjamin Moore Pale Oak OC-20",
      trimPaint: "Benjamin Moore Simply White OC-117",
      ceilingPaint: "Flat white",
      flooring: "12 x 12 beige ceramic tile",
      lightFixtures: "2 vanity bars + 4 recessed",
      outlets: "4 total (all GFCI)",
      windows: "2 casement with plantation shutters",
      doors: "1 swing + 1 pocket to the closet",
      conditionRating: "Fair",
      observationsHtml:
        "Clean and fully working, but this is the most dated room in the house. The built-in corner soaking tub, honey-oak double vanity and framed glass shower are all original to 1998. Grout at the tub surround is discolored and the shower door sweep is worn. Nothing here is failing; it simply no longer matches the rest of the home, and Jennifer raised it herself during the walkthrough.",
      linkedVisionProjects: [
        { title: "Primary Bath: Spa Conversion", priority: "Year 1-2" },
      ],
    },
    conciergeAction: {
      title: "Start the spa conversion conversation",
      body: "Bobby sends Adam your wish list and the three scoped tiers.",
      prompt: "Tell Adam I want to start planning the primary bath spa conversion.",
    },
  },
  {
    key: "home-gym-sauna",
    groupId: "interior-additional",
    title: "Home Gym + Sauna",
    record: {
      roomName: "Home Gym + Sauna",
      floorLabel: "Lower Level",
      dimensions: "16 x 20",
      floorSqft: 320,
      ceiling: "9ft",
      wallPaint: "Sherwin-Williams Repose Gray SW 7015",
      trimPaint: "Benjamin Moore Simply White OC-117",
      ceilingPaint: "Flat white",
      flooring: "3/8 inch black rubber tile over slab",
      lightFixtures: "8 recessed LED",
      outlets: "6 total, plus a dedicated 20-amp sauna circuit",
      windows: "2 egress windows",
      doors: "1 swing",
      conditionRating: "Excellent",
      observationsHtml:
        "A well-finished lower-level gym with rubber flooring, good lighting and two egress windows. The Clearlight infrared sauna was added in 2022 on its own dedicated circuit and is in like-new condition. Humidity stays in range down here; keep the dehumidifier set point where it is.",
    },
  },
  {
    key: "mechanical-room",
    groupId: "interior-unfinished",
    title: "Mechanical / Utility Room",
    record: {
      roomName: "Mechanical / Utility Room",
      floorLabel: "Lower Level",
      dimensions: "12 x 18",
      floorSqft: 216,
      ceiling: "9ft",
      wallPaint: "Unpainted poured concrete",
      trimPaint: "",
      ceilingPaint: "Open joists",
      flooring: "Gray epoxy over slab",
      lightFixtures: "4 LED strip fixtures",
      outlets: "5 total (2 GFCI)",
      doors: "1 swing, plus full access from the garage",
      conditionRating: "Good",
      observationsHtml:
        "Tidy, dry and well lit, with clear working room around every piece of equipment. The main floor furnace, the Rinnai tankless water heater, the Kinetico softener and the sump basin all live here. No signs of water entry at the slab or the foundation walls. This room is a big reason future replacements will be simple and fast.",
    },
  },
];

export const sampleExteriorRooms: DemoRoom[] = [
  {
    key: "roof",
    groupId: "exterior",
    title: "Roof",
    record: {
      roomName: "Roof",
      floorLabel: "Exterior",
      dimensions: "5,157 sqft roof area",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      flooring: "",
      conditionRating: "Fair",
      observationsHtml:
        "The roof is the original 1998 architectural shingle, now 28 years old. Granule loss is visible across the south-facing field and the ridge caps are starting to curl. The step flashing at the brick chimney is intact but the sealant has dried out. It is not leaking today. Plan on replacement in the next four to five years, and have the chimney flashing resealed this season.",
      linkedVisionProjects: [
        { id: "vision-roof-replacement", title: "Roof Replacement with Ventilation Upgrade", priority: "Year 4-5" },
      ],
    },
  },
  {
    key: "outdoor-kitchen",
    groupId: "exterior-structures",
    title: "Outdoor Kitchen",
    record: {
      roomName: "Outdoor Kitchen",
      floorLabel: "Exterior",
      dimensions: "10 x 14",
      floorSqft: 140,
      ceiling: "Cedar pergola",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      flooring: "Flagstone patio",
      lightFixtures: "String lights + 2 task sconces",
      outlets: "4 GFCI, weather-rated covers",
      conditionRating: "Excellent",
      observationsHtml:
        "Built in 2020: a stacked-stone island with a Wolf built-in grill, an outdoor-rated Sub-Zero refrigerator and a Bull sink, all under a cedar pergola. Stonework and flagstone joints are tight. The pergola is due for a coat of sealer next spring, and the sink line needs to be winterized before the first hard freeze.",
    },
    conciergeAction: {
      title: "Winterize the outdoor kitchen",
      body: "Bobby schedules the sink shutoff and blowout before the first hard freeze.",
      prompt: "Schedule the outdoor kitchen winterization.",
    },
  },
];

// ─── Systems ─────────────────────────────────────────────────────────────

export const furnaceTiers: ReplacementBriefingTier[] = [
  {
    id: "essential",
    label: "Essential",
    priceLow: 8500,
    priceHigh: 11500,
    scopeHtml: "Like-for-like replacement: single-stage, 80% efficiency.",
    warranty: "Standard 10-year parts",
    recommended: false,
  },
  {
    id: "enhanced",
    label: "Enhanced",
    priceLow: 13500,
    priceHigh: 17500,
    scopeHtml:
      "Two-stage, 96% efficiency, variable-speed blower and a smart thermostat. Quieter, with more even temperatures.",
    recommended: true,
  },
  {
    id: "signature",
    label: "Signature",
    priceLow: 22000,
    priceHigh: 28000,
    scopeHtml: "Modulating gas valve, MERV 13 whole-home filtration and room sensors.",
    warranty: "12-year parts and labor",
    recommended: false,
  },
];

export const sampleSystems: DemoSystem[] = [
  {
    key: "furnace-main-zone",
    groupId: "systems-hvac",
    title: "Furnace: Main Floor Zone",
    ageYears: 17,
    record: {
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
      specifications: [
        { label: "Capacity", value: "90,000 BTU input" },
        { label: "Electrical", value: "120V at the unit, 240V on an adjacent circuit" },
        { label: "Gas Line", value: '3/4" black iron, in place' },
        { label: "Condensate", value: "Routes to a floor drain 8ft away" },
        { label: "Ductwork", value: "Supply trunk 16x8, return 18x10, both serviceable" },
        { label: "Access", value: "Mechanical room 12 x 18, full access from the garage" },
      ],
      routineCareItems: [
        { description: "Replace filter (MERV 11, 20x25x4)", frequencyMonths: 3, lastDoneDate: "2026-05-10" },
        { description: "Professional tune-up before heating season", frequencyMonths: 12, lastDoneDate: "2025-10-02" },
      ],
      maintenanceLog: [
        { date: "2025-10-02", description: "Fall tune-up, Airflow Mechanical. Flame sensor cleaned.", cost: 189 },
        { date: "2023-01-18", description: "Inducer motor replaced, Airflow Mechanical.", cost: 640 },
      ],
      photos: {},
    },
    observations: [
      "This Lennox has heated the main floor since 2009 and still runs cleanly, but at 17 years it is in the last stretch of a typical 20-year life.",
      "The inducer motor was replaced in 2023. That kind of repair is normal at this age and usually the first of several.",
      "The fall tune-up and the quarterly filter change are both overdue. Catching up on both is the cheapest way to get through this winter without a surprise.",
    ],
    briefingTiers: furnaceTiers,
    briefingSystemType: "Furnace",
  },
  {
    key: "tankless-water-heater",
    groupId: "systems-mechanical",
    title: "Tankless Water Heater",
    ageYears: 6,
    record: {
      systemName: "Tankless Water Heater",
      category: "Plumbing",
      isAppliance: false,
      status: "Healthy",
      make: "Rinnai",
      model: "RUR199iN",
      serial: "RUR2024031",
      installDate: "2020-04",
      typicalLifespanYears: 22,
      conditionRating: "Excellent",
      specifications: [
        { label: "Capacity", value: "199,000 BTU, 11 gallons per minute" },
        { label: "Fuel", value: "Natural gas" },
        { label: "Venting", value: "Concentric PVC through the rim joist" },
      ],
      routineCareItems: [
        { description: "Descale flush with isolation valves", frequencyMonths: 12, lastDoneDate: "2026-03-12" },
      ],
      maintenanceLog: [
        { date: "2026-03-12", description: "Annual descale flush. Inlet screen cleaned.", cost: 165 },
      ],
      photos: {},
    },
    observations: [
      "Six years into a typical 22-year life, this Rinnai is in excellent shape and sized correctly for a home with four and a half baths.",
      "The Kinetico softener upstream is doing its job: the heat exchanger shows no scale, which is what usually shortens the life of a tankless unit.",
      "Keep the annual descale flush on the calendar. It is the single habit that protects this system.",
    ],
  },
];

export const sampleAppliances: DemoSystem[] = [
  {
    key: "refrigerator",
    groupId: "appliances",
    title: "Refrigerator",
    ageYears: 9,
    record: {
      systemName: "Refrigerator",
      category: "Kitchen",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "BI-48S/O",
      serial: "SZ-2017-44291",
      installDate: "2017-04",
      typicalLifespanYears: 20,
      conditionRating: "Good",
      specifications: [
        { label: "Location", value: "Kitchen" },
        { label: "Type", value: '48" built-in side-by-side, panel ready' },
        { label: "Water Filter", value: "Sub-Zero 4204490, replace every 12 months" },
      ],
      routineCareItems: [
        { description: "Replace water filter", frequencyMonths: 12, lastDoneDate: "2025-11-20" },
        { description: "Vacuum the condenser grille", frequencyMonths: 6, lastDoneDate: "2026-04-05" },
      ],
      maintenanceLog: [
        { date: "2026-04-05", description: "Condenser cleaned during spring walkthrough." },
      ],
      photos: {},
    },
    observations: [
      "Installed with the 2017 kitchen remodel, this built-in Sub-Zero is nine years into a typical 20-year life and cooling evenly in both compartments.",
      "The water dispenser has been intermittent. That usually points to the inlet valve or an overdue filter, both simple fixes. A service visit is pending through Bobby.",
      "Door gaskets are clean and sealing well.",
    ],
  },
];

// ─── Vision ──────────────────────────────────────────────────────────────

export const sampleVisionProjects: DemoVision[] = [
  {
    key: "vision-primary-bath",
    title: "Primary Bath: Spa Conversion",
    project: {
      projectTitle: "Primary Bath: Spa Conversion",
      category: "Lifestyle",
      priority: "Year 1-2",
      visionNarrativeHtml:
        "Remove the dated corner soaking tub and expand the shower into a wet room with a linear drain, heated tile floors and a digital shower system. Jennifer raised this herself during the walkthrough. The goal is a calmer, more refined start and end to every day, in a room that finally matches the rest of the house.",
      designFeeEducationHtml:
        "Every successful renovation begins with design. For a project of this size we recommend a design phase of <strong>4-6 weeks at $4,500 - $8,500</strong>. It covers site measurement, design conversations, materials and finishes, lighting selection and detailed construction drawings. Design fees protect your investment by settling every decision before construction starts.",
      designFeeLow: 4500,
      designFeeHigh: 8500,
      scopeOfWorkHtml:
        "Demolish the tub deck, the framed shower and the existing tile. Reframe for a curbless wet room with a linear drain. New waterproofing, heated floor mat and large-format porcelain. Replace the honey-oak vanity with a furniture-style double vanity and stone top. New lighting, exhaust fan and a digital shower valve.",
      tiers: [
        {
          id: "essential",
          label: "Essential",
          priceLow: 32000,
          priceHigh: 42000,
          scopeHtml: "Pragmatic: new shower, vanity and tile in the existing layout. The tub stays out.",
          recommended: false,
        },
        {
          id: "enhanced",
          label: "Enhanced",
          priceLow: 52000,
          priceHigh: 68000,
          scopeHtml: "Recommended: full wet-room conversion, heated floors, digital shower, premium tile.",
          recommended: true,
        },
        {
          id: "signature",
          label: "Signature",
          priceLow: 85000,
          priceHigh: 105000,
          scopeHtml: "Fully realized: stone slab walls, steam, custom vanity and designer lighting.",
          recommended: false,
        },
      ],
      executionPathHtml:
        "When you're ready to start, we'll execute this through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you'd prefer a different contractor, we'll connect you with one of our trusted trade partners; the choice is always yours. Either way, you stay in the same conversation with HBC.",
      akrDisclosed: true,
      disruptionSummary: "About 7 weeks without the primary shower. The hall bathroom covers the gap.",
      dependenciesHtml: "None. This can start as soon as design is complete.",
    },
  },
];

// ─── Information ─────────────────────────────────────────────────────────

export const sampleInfoPages: DemoInfoPage[] = [
  {
    key: "welcome-letter",
    title: "Welcome from Adam",
    lede:
      "Mark, Jennifer, Olivia and Jack: thank you for inviting me into your home. What follows is the most complete picture of 2847 Stoneybrook Lane that exists anywhere.",
    sections: [
      {
        paragraphs: [
          "We spent a little over two hours walking every room together, and then I spent a good deal longer with the scans, the photos and the serial plates. I wrote this the way I would explain it to a neighbor at the kitchen island: plainly, with the reasons behind every recommendation.",
          "The short version is that you own a very well-kept 1998 Colonial. Most of what you will read is rated Excellent or Good. A handful of honest items need a plan, and none of them is an emergency.",
        ],
      },
      {
        heading: "What you will find inside",
        bullets: [
          "Every room, with its finishes, fixtures and condition on one page",
          "Every system and appliance, with model, serial, age and expected life",
          "Six vision projects, each scoped at three investment levels",
          "A 10-year plan and a register of every recurring service",
        ],
      },
    ],
    callout: {
      label: "How this report stays alive",
      body: "This is a living record. Every service call, every repair and every paint touch-up gets logged, and once a year we walk the home together and bring it all up to date.",
    },
    signature: "Adam Kilgore, founder, Hometown Builders Club",
  },
  {
    key: "home-at-a-glance",
    title: "Home at a Glance",
    lede: "The whole house on one page: what it is, what it is made of, and what has changed since 1998.",
    stats: [
      { label: "Built", value: "1998", subtitle: "Two-story Colonial" },
      { label: "Living Area", value: "5,240", subtitle: "square feet" },
      { label: "Bedrooms", value: "5", subtitle: "plus a bonus room" },
      { label: "Bathrooms", value: "4.5" },
      { label: "Lot", value: "1.4", subtitle: "wooded acres" },
      { label: "Garage", value: "3-car", subtitle: "attached" },
    ],
    sections: [
      {
        heading: "How it is built",
        bullets: [
          "Conventional 2x6 framing on a poured concrete foundation",
          "200-amp Square D QO electrical panel",
          "Dual-zone forced air: two Lennox furnaces and two Lennox condensers",
          "Architectural shingle roof, 5,157 sqft, original to the home",
        ],
      },
      {
        heading: "What has been updated",
        bullets: [
          "2009: both furnaces replaced",
          "2014: both AC condensers replaced",
          "2017: kitchen fully remodeled (Sub-Zero, Wolf, Cove)",
          "2018: radon mitigation system",
          "2020: outdoor kitchen; 2021: hot tub and whole-home generator; 2022: infrared sauna",
        ],
      },
    ],
  },
  {
    key: "top-priorities",
    title: "Top Priorities",
    lede: "If you only read one page, read this one. Five things, in the order we would handle them.",
    numbered: [
      {
        title: "Catch up the overdue maintenance",
        body: "Nine recurring services have slipped, including both furnace tune-ups, the chimney sweep and gutter cleaning. None is expensive. All of them prevent expensive.",
        tag: "This season",
      },
      {
        title: "Plan the furnace replacements on your terms",
        body: "Both Lennox furnaces are 17 years into a typical 20-year life. The Replacement Briefing on each furnace page is already scoped and priced.",
        tag: "Year 1-3",
      },
      {
        title: "Clear the dryer vent",
        body: "Airflow at the exterior hood is weak, which points to lint buildup in the run. It is a small job and a real fire-safety item.",
        tag: "This season",
      },
      {
        title: "Decide the pace for the primary bath",
        body: "It is dated, not failing. If the spa conversion is the project you want first, design can start whenever you are ready.",
        tag: "Year 1-2",
      },
      {
        title: "Put the roof and driveway on the calendar",
        body: "The 1998 roof has four to five years left and the driveway is past patching. Neither is urgent; both go better with a plan.",
        tag: "Year 3-5",
      },
    ],
    callout: {
      label: "A note on pace",
      body: "Nothing on this list is an emergency. The point of a plan is that you choose the timing, not the house.",
    },
  },
];

// ─── Strategy ────────────────────────────────────────────────────────────

const svc = (
  n: number,
  category: string,
  serviceName: string,
  vendorName: string,
  frequency: string,
  monthlyCost: number,
  nextDueDate: string,
  overdue = false,
): RecurringServiceRow => ({
  id: `svc-${String(n).padStart(2, "0")}`,
  category,
  serviceName,
  vendorName,
  frequency,
  monthlyCost,
  nextDueDate,
  status: overdue ? "overdue" : "current",
});

// 20 services, $1,918 per month, 9 overdue (bible table).
export const sampleServices: RecurringServiceRow[] = [
  svc(1, "cleaning", "House Cleaning", "Spotless Pros", "Bi-weekly", 540, "2026-11-17"),
  svc(2, "lawn_landscaping", "Lawn Mowing & Edging", "GreenScape Hudson", "Weekly (Apr-Oct)", 280, "2027-04-12"),
  svc(3, "lawn_landscaping", "Mulching & Bed Maintenance", "GreenScape Hudson", "Spring + Fall", 145, "2026-11-20"),
  svc(4, "lawn_landscaping", "Lawn Treatment Program", "Summit Turf Care", "6x per year", 95, "2026-11-24"),
  svc(5, "tree_care", "Tree & Shrub Care", "Arbor North", "Annual + as needed", 125, "2027-03-15"),
  svc(6, "snow_removal", "Snow Plowing", "GreenScape Hudson", "Per event (Nov-Mar)", 220, "2026-11-15"),
  svc(7, "pest_control", "Quarterly Pest Control", "Western Reserve Pest", "Quarterly", 65, "2026-09-15", true),
  svc(8, "pest_control", "Termite Bond", "Western Reserve Pest", "Annual inspection", 25, "2027-05-10"),
  svc(9, "hvac", "Furnace + AC Tune-Up (Both Zones)", "Airflow Mechanical", "Spring + Fall", 65, "2026-10-01", true),
  svc(10, "hvac", "Furnace Filter Replacements", "Self-managed", "Quarterly", 12, "2026-08-10", true),
  svc(11, "other", "Chimney Sweep & Inspection", "Brooks Chimney", "Annual", 30, "2026-09-30", true),
  svc(12, "plumbing", "Sump Pump Test", "Self-managed", "Twice per year", 0, "2026-10-15", true),
  svc(13, "cleaning", "Window Cleaning", "ClearView Window Co.", "Twice per year", 65, "2027-04-20"),
  svc(14, "roof_gutters", "Gutter Cleaning", "ClearFlow Exteriors", "Twice per year", 50, "2026-10-20", true),
  svc(15, "hvac", "Dryer Vent Cleaning", "Self-managed", "Annual", 8, "2026-06-15", true),
  svc(16, "hvac", "Duct Cleaning", "Hudson Air Duct", "Every 3-5 years", 18, "2028-05-01"),
  svc(17, "pool_spa", "Hot Tub Service", "Sundance Service", "Quarterly", 95, "2026-12-08"),
  svc(18, "electrical", "Generator Annual Service", "PowerGuard Standby", "Annual", 35, "2027-07-14"),
  svc(19, "cleaning", "Power Washing (deck, patio, walks)", "Self-managed", "Annual", 25, "2026-07-01", true),
  svc(20, "other", "Annual Home Walk-Through", "Hometown Builders Club", "Annual", 20, "2026-10-30", true),
];

export const sampleStrategy: DemoStrategy = {
  services: sampleServices,
  conciergeTier: "tier_600",
  capitalPlan: {
    startYear: 2026,
    items: [
      { id: "cp-1", projectName: "Primary Bath", phase: "offense", yearStart: 2026, yearEnd: 2027 },
      { id: "cp-2", projectName: "HVAC Replacement", phase: "offense", yearStart: 2026, yearEnd: 2028 },
      { id: "cp-3", projectName: "Kitchen Refresh", phase: "offense", yearStart: 2027, yearEnd: 2028 },
      { id: "cp-4", projectName: "Screened Porch", phase: "expansion", yearStart: 2027, yearEnd: 2029 },
      { id: "cp-5", projectName: "Driveway Replacement", phase: "expansion", yearStart: 2028, yearEnd: 2030 },
      { id: "cp-6", projectName: "Roof Replacement", phase: "expansion", yearStart: 2029, yearEnd: 2030 },
    ],
    phaseCards: [
      {
        phase: "defense",
        yearLabel: "Year 1",
        title: "Defense",
        bullets: [
          "Catch up overdue maintenance",
          "Set up HBC Concierge",
          "Plan HVAC replacement timing",
        ],
      },
      {
        phase: "offense",
        yearLabel: "Year 1-3",
        title: "Offense",
        bullets: [
          "Primary bath spa conversion",
          "HVAC replacement, both zones",
          "Kitchen counter and backsplash refresh",
        ],
      },
      {
        phase: "expansion",
        yearLabel: "Year 2-5",
        title: "Expansion",
        bullets: [
          "Screened porch four-season conversion",
          "Driveway replacement",
          "Roof replacement",
        ],
      },
    ],
    ganttHeading: "Capital plan",
    phaseFooter: [
      { label: "Defense Phase", value: "Maintenance catch-up only" },
      { label: "Offense Phase Range", value: "$108K - $144K mid-tier" },
      { label: "Expansion Phase Range", value: "$116K - $152K mid-tier" },
    ],
  },
  maintenanceCalendar: {
    eyebrow: "The annual cadence",
    title: "Maintenance Calendar",
    spring: [
      { description: "AC tune-up, both zones" },
      { description: "Gutter cleaning after the seed drop" },
      { description: "Sump pump test before the spring rains" },
      { description: "Mulch and bed cleanup" },
      { description: "Seal the pergola at the outdoor kitchen" },
    ],
    summer: [
      { description: "Power wash the deck, patio and walks" },
      { description: "Dryer vent cleaning" },
      { description: "Generator annual service" },
      { description: "Window cleaning" },
    ],
    fall: [
      { description: "Furnace tune-up, both zones" },
      { description: "Chimney sweep and inspection" },
      { description: "Gutter cleaning after leaf drop" },
      { description: "Winterize the outdoor kitchen sink" },
      { description: "Annual home walk-through with Adam" },
    ],
    winter: [
      { description: "Furnace filters, both zones" },
      { description: "Sump pump test" },
      { description: "Hot tub quarterly service" },
      { description: "Check the attic for frost after the first deep cold" },
    ],
  },
};
