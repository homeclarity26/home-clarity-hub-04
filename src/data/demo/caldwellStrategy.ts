// Strategy chapter of the Caldwell demo report: the six vision projects
// and the standing Strategy pages (recurring services, capital plan,
// maintenance calendar). Names, prices, service rows and plan years are
// locked in docs/demo/CALDWELL_DEMO_BIBLE.md.
//
// Prices are ranges only. Nothing here is ever summed into a grand total.

import type { ReplacementBriefingTier } from "@/components/wysiwyg/types";
import type { DemoStrategy, DemoVision } from "./caldwellTypes";

type TierInput = [low: number, high: number, scope: string];

/** Three ascending tiers; Enhanced is the recommended one. */
function tiers(
  essential: TierInput,
  enhanced: TierInput,
  signature: TierInput,
): ReplacementBriefingTier[] {
  return [
    {
      id: "essential",
      label: "Essential",
      priceLow: essential[0],
      priceHigh: essential[1],
      scopeHtml: essential[2],
      recommended: false,
    },
    {
      id: "enhanced",
      label: "Enhanced",
      priceLow: enhanced[0],
      priceHigh: enhanced[1],
      scopeHtml: enhanced[2],
      recommended: true,
    },
    {
      id: "signature",
      label: "Signature",
      priceLow: signature[0],
      priceHigh: signature[1],
      scopeHtml: signature[2],
      recommended: false,
    },
  ];
}

// Locked execution-path wording for projects built by AK Renovations.
const AKR_EXECUTION_PATH =
  "When you're ready to start, we'll execute this through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you'd prefer a different contractor, we'll connect you with one of our trusted trade partners; the choice is always yours. Either way, you stay in the same conversation with HBC.";

// Trade-led projects go to a vetted HBC trade partner, with HBC managing
// the job. AK Renovations is still named so the disclosure stays plain.
function tradePartnerExecutionPath(partner: string, work: string): string {
  return `When you're ready to start, this work goes to our vetted ${partner}, with HBC managing the job from the first briefing to the final walkthrough. This is not an <strong>AK Renovations</strong> project: AK Renovations is openly owned by Adam and handles remodeling, and ${work} belongs with a specialist. If you'd prefer a different contractor, the choice is always yours. Either way, you stay in the same conversation with HBC.`;
}

export const caldwellVisionProjects: DemoVision[] = [
  {
    key: "vision-primary-bath",
    title: "Primary Bath: Spa Conversion",
    project: {
      projectTitle: "Primary Bath: Spa Conversion",
      category: "Lifestyle",
      priority: "Year 1-2",
      visionNarrativeHtml:
        "Jennifer raised this one herself, standing in the doorway of your primary bath. The room has a lot going for it: 224 square feet, a tray ceiling and plantation shutters worth keeping. What dates it is the built-in corner soaking tub, the honey-oak vanity and the framed shower. The vision is to remove the tub, expand the shower into a wet room with a linear drain, warm the tile underfoot and add a digital shower system that remembers each of your settings. You end up with a room that feels like a spa every morning.",
      designFeeEducationHtml:
        "Every successful renovation begins with design. For a project of this size, we recommend a design phase of <strong>4 to 6 weeks at $4,500 - $8,500</strong>. That covers site measurement, layout options for the wet room, tile, stone and fixture selections, lighting, and detailed construction drawings. Design protects your investment by settling every decision before anything is torn out.",
      designFeeLow: 4500,
      designFeeHigh: 8500,
      scopeOfWorkHtml:
        "<ul><li>Remove the corner soaking tub, its tile surround and the framed shower enclosure</li><li>Build a curbless wet-room shower with a linear drain and frameless glass</li><li>Install electric radiant heat under new porcelain floor tile</li><li>Add a digital shower system with rain head, hand shower and saved presets</li><li>Replace the honey-oak vanity with a new double vanity, stone top and plumbing fixtures</li><li>Update lighting and ventilation, including a quiet humidity-sensing exhaust fan</li><li>Keep the tray ceiling and the plantation shutters</li></ul>",
      tiers: tiers(
        [
          32000,
          42000,
          "Keeps the current layout: new floor and shower tile, a frameless shower enclosure, a new double vanity and updated fixtures and lighting.",
        ],
        [
          52000,
          68000,
          "The full spa conversion: tub removed, curbless wet-room shower with linear drain, heated tile floors, digital shower system and a custom double vanity.",
        ],
        [
          85000,
          105000,
          "Everything in Enhanced, plus steam, stone slab shower walls, furniture-grade custom cabinetry and layered lighting designed for the room.",
        ],
      ),
      executionPathHtml: AKR_EXECUTION_PATH,
      akrDisclosed: true,
      disruptionSummary:
        "Plan on five to six weeks without the primary bath; the hall bath covers you.",
      dependenciesHtml:
        "Nothing has to happen first: the heated floor and digital shower each need a dedicated circuit, and your 200-amp panel can support them.",
    },
  },
  {
    key: "vision-hvac-replacement",
    title: "HVAC Replacement: Both Zones",
    project: {
      projectTitle: "HVAC Replacement: Both Zones",
      category: "Critical",
      priority: "Year 1-3",
      visionNarrativeHtml:
        "Both of your Lennox furnaces were installed in August 2009, which puts them 17 years into a typical 20-year life. They are running today, and that is exactly why now is the time to plan: a furnace replaced on your schedule is a calm two-day job, and one replaced during a cold snap is not. The vision is two modulating, variable-speed systems, sealed ductwork and smart zoning, so the main floor and the upper floor each hold the temperature you set. Mark asked for fewer surprises from the mechanical room. This is the project that delivers that.",
      designFeeEducationHtml:
        "This project is trade-led, so there is no design phase. It starts with a short planning visit: our HVAC partner confirms the heating load for each zone, checks the ductwork and walks you through equipment choices. Your furnace pages already hold the model, serial, gas line, electrical and duct sizes, so the partner arrives briefed and you are not asked the same questions twice.",
      scopeOfWorkHtml:
        "<ul><li>Replace both 2009 Lennox furnaces, main floor zone and upper floor zone</li><li>Match the new furnaces to your 2014 AC condensers, which are mid-life and stay in place</li><li>Seal the supply and return ductwork at the trunks and accessible joints</li><li>Install smart zoning controls and thermostats on both zones</li><li>Reconnect the gas, venting and condensate lines to current code</li><li>Commission both systems and record the new model and serial numbers in this report</li></ul>",
      tiers: tiers(
        [
          18000,
          24000,
          "Like-for-like replacement of both furnaces with single-stage 80% units and a standard 10-year parts warranty.",
        ],
        [
          28000,
          38000,
          "Two-stage 96% furnaces with variable-speed blowers on both zones, duct sealing and smart thermostats; quieter, with more even temperatures.",
        ],
        [
          45000,
          58000,
          "Modulating furnaces on both zones with MERV 13 whole-home filtration, room sensors, smart zoning controls and a 12-year parts and labor warranty.",
        ],
      ),
      executionPathHtml: tradePartnerExecutionPath(
        "HVAC partner",
        "furnace replacement",
      ),
      akrDisclosed: true,
      disruptionSummary:
        "Each zone is a one-day swap, so plan on two days with one floor at a time without heat or cooling; we schedule it in mild weather.",
      dependenciesHtml:
        "Do this before the screened porch conversion, so the porch mini-split and your new zoning controls are planned together.",
    },
  },
  {
    key: "vision-kitchen-refresh",
    title: "Kitchen Refresh: Counters & Backsplash",
    project: {
      projectTitle: "Kitchen Refresh: Counters & Backsplash",
      category: "Lifestyle",
      priority: "Year 2-3",
      visionNarrativeHtml:
        "Your 2017 kitchen was done right, and none of it needs redoing. The white shaker cabinetry, the layout and the Sub-Zero, Wolf and Cove appliances all stay. What Jennifer wants is for the finishes to catch up with the rest of the room: the quartz shows minor edge wear at the sink, and the small-format backsplash is the one thing she would change tomorrow. The vision is elevated stone counters, a full-height backsplash, the island refinished in a contrasting color and new hardware. Same kitchen, noticeably more refined.",
      designFeeEducationHtml:
        "Every successful renovation begins with design. For a project of this size, we recommend a design phase of <strong>2 to 3 weeks at $1,500 - $3,500</strong>. That covers slab selection at the stone yard, backsplash layout, the island color, hardware and a measured drawing for the fabricator. Design protects your investment by settling every decision before the old counters come off.",
      designFeeLow: 1500,
      designFeeHigh: 3500,
      scopeOfWorkHtml:
        "<ul><li>Remove the existing quartz counters and the small-format backsplash</li><li>Fabricate and install new stone counters on the perimeter and the island</li><li>Install a full-height backsplash, including the range wall behind the Wolf hood</li><li>Refinish the island in a contrasting color with a factory-grade sprayed finish</li><li>Replace cabinet hardware throughout</li><li>Reconnect the sink, faucet and disposal; the cabinetry and appliances stay</li></ul>",
      tiers: tiers(
        [
          18000,
          24000,
          "New quartz counters on the perimeter and island, a full tile backsplash and new hardware.",
        ],
        [
          28000,
          38000,
          "Elevated stone counters, a full-height backsplash, the island refinished in a contrasting color and new hardware throughout.",
        ],
        [
          45000,
          58000,
          "Natural stone slabs with a matched slab backsplash, waterfall island ends, a new sink and faucet, and updated island lighting.",
        ],
      ),
      executionPathHtml: AKR_EXECUTION_PATH,
      akrDisclosed: true,
      disruptionSummary:
        "Plan on about two weeks of limited kitchen use, including five to seven days without the sink and counters; the lower level wet bar covers you.",
      dependenciesHtml:
        "Your dishwasher and microwave drawer are both nearing end of life, so replace them in the same window while the counters are off.",
    },
  },
  {
    key: "vision-screened-porch",
    title: "Screened Porch: Four-Season Conversion",
    project: {
      projectTitle: "Screened Porch: Four-Season Conversion",
      category: "Expansion",
      priority: "Year 2-4",
      visionNarrativeHtml:
        "Mark lit up when we reached the screened porch, and it is easy to see why: a 12 x 18 room with a vaulted ceiling that looks straight into your wooded lot. Today it is a warm-weather room. The vision is to insulate it, replace the screens with retractable glass and add a quiet mini-split, so the porch works in February as well as it does in June. Open the glass on a summer evening and it is still a screened porch.",
      designFeeEducationHtml:
        "Every successful renovation begins with design. For a project of this size, we recommend a design phase of <strong>4 to 6 weeks at $4,500 - $8,500</strong>. That covers structural review of the existing porch framing, glass system selection, insulation and heating design, finishes, and the permit drawings Hudson requires. Design protects your investment by settling every decision before construction starts.",
      designFeeLow: 4500,
      designFeeHigh: 8500,
      scopeOfWorkHtml:
        "<ul><li>Insulate the floor, the knee walls and the vaulted ceiling</li><li>Replace the screen panels with a retractable glass system that keeps screens for summer</li><li>Install a ductless mini-split for heating and cooling</li><li>Add outlets, lighting and a ceiling fan on new circuits</li><li>Finish the interior walls, ceiling and floor for year-round use</li><li>Flash and tie the porch roof into the main roof</li><li>Handle permit drawings, permits and inspections</li></ul>",
      tiers: tiers(
        [
          35000,
          45000,
          "Insulated floor and ceiling with fixed insulated windows and electric heat; a comfortable three-season room that stretches into winter.",
        ],
        [
          58000,
          75000,
          "A true four-season room: fully insulated, retractable glass with screens, a ductless mini-split and a finished interior.",
        ],
        [
          95000,
          120000,
          "Everything in Enhanced, plus a folding glass wall system, radiant floor heat, a gas fireplace and a wood-plank vaulted ceiling.",
        ],
      ),
      executionPathHtml: AKR_EXECUTION_PATH,
      akrDisclosed: true,
      disruptionSummary:
        "Plan on eight to ten weeks of work outside; the porch and part of the rear deck are closed off, and the house itself stays fully livable.",
      dependenciesHtml:
        "Schedule this after the HVAC replacement so the mini-split is planned alongside your new zoning, and before the roof so the porch tie-in is finished when new shingles go on.",
    },
  },
  {
    key: "vision-driveway",
    title: "Driveway Replacement & Front Walkway",
    project: {
      projectTitle: "Driveway Replacement & Front Walkway",
      category: "Maintenance",
      priority: "Year 3-5",
      visionNarrativeHtml:
        "The driveway is the one part of your home we rated Poor. It is the original 1998 asphalt, and after 28 winters it is past the point where sealing or patching buys you much. It is also the first thing anyone sees when they pull in. The vision is to replace it with stamped concrete or pavers on a properly rebuilt base, and to rebuild the front walkway to match, so the approach finally suits the house behind it.",
      designFeeEducationHtml:
        "This project is trade-led, so there is no design phase. It starts with a short planning visit: our paving partner measures the drive and the walk, checks the base and the drainage, and brings material samples so you can compare stamped concrete and pavers against your brick and siding. You get a clear scope and a firm price from that one visit.",
      scopeOfWorkHtml:
        "<ul><li>Remove the existing asphalt driveway and the front walkway</li><li>Regrade and rebuild the stone base, correcting drainage away from the garage</li><li>Install the new driveway surface from the street apron to the three-car garage</li><li>Rebuild the front walkway to the columned entry in a matching material</li><li>Restore the lawn and bed edges along both sides</li></ul>",
      tiers: tiers(
        [
          14000,
          19000,
          "New asphalt on a rebuilt base, with a new poured concrete front walkway.",
        ],
        [
          26000,
          35000,
          "A concrete driveway with stamped borders and apron, and a stamped concrete front walkway to match.",
        ],
        [
          48000,
          62000,
          "A full paver driveway and front walkway with stone edging, drainage improvements and low-voltage path lighting.",
        ],
      ),
      executionPathHtml: tradePartnerExecutionPath(
        "paving partner",
        "driveway and flatwork",
      ),
      akrDisclosed: true,
      disruptionSummary:
        "Plan on about a week of work, then seven to ten days of parking on the street while new concrete cures.",
      dependenciesHtml:
        "Do the driveway after the heavy projects, so the porch deliveries and the roofing dumpster never sit on the new surface.",
    },
  },
  {
    key: "vision-roof-replacement",
    title: "Roof Replacement with Ventilation Upgrade",
    project: {
      projectTitle: "Roof Replacement with Ventilation Upgrade",
      category: "Critical",
      priority: "Year 4-5",
      visionNarrativeHtml:
        "Your roof is the original 1998 architectural shingle, 5,157 square feet of it, and at 28 years it is showing honest age. The granule wear is visible from the ground, though we found no active leaks, which is why we rated it Fair and not worse. The vision is to replace it on a plan in the next four to five years: full tear-off, new underlayment, ice-and-water shield, a ridge vent the house never had, and new gutters. Done once and done right, it is a roof you will not think about again while you own this home.",
      designFeeEducationHtml:
        "This project is trade-led, so there is no design phase. It starts with a short planning visit: our roofing partner inspects the deck from the attic, checks the soffit intake and the chimney flashing, and brings shingle samples in daylight. Your Hover scan already gives exact roof measurements, so the price you see is based on your roof, not an estimate from the driveway.",
      scopeOfWorkHtml:
        "<ul><li>Tear off the original shingles down to the roof deck and replace any soft decking</li><li>Install full synthetic underlayment with ice-and-water shield at eaves and valleys</li><li>Install new architectural shingles with matching hip and ridge caps</li><li>Retrofit a continuous ridge vent and confirm clear soffit intake</li><li>Reflash the brick chimney with new step and counter flashing</li><li>Replace the aluminum gutters and downspouts</li></ul>",
      tiers: tiers(
        [
          22000,
          28000,
          "Full tear-off with new underlayment, ice-and-water shield, architectural shingles and new chimney flashing; existing gutters stay.",
        ],
        [
          32000,
          42000,
          "Everything in Essential, plus a ridge vent retrofit, upgraded impact-rated shingles, new seamless gutters and an extended system warranty.",
        ],
        [
          52000,
          68000,
          "A designer-grade shingle with copper chimney flashing, oversized gutters with guards and attic insulation topped up after the ventilation work.",
        ],
      ),
      executionPathHtml: tradePartnerExecutionPath(
        "roofing partner",
        "roof replacement",
      ),
      akrDisclosed: true,
      disruptionSummary:
        "Plan on three to four noisy days with a dumpster in the driveway; you stay in the house throughout.",
      dependenciesHtml:
        "Replace the roof before any attic insulation work and before the new driveway goes in.",
    },
  },
];

export const caldwellStrategy: DemoStrategy = {
  // 20 services, $1,918 per month in total, 9 overdue and 11 on track.
  // Overdue rows carry due dates from June to October 2026; on-track rows
  // are due from mid-November 2026 onward (the report is dated November 2026).
  services: [
    { id: "svc-01", category: "cleaning", serviceName: "House Cleaning", vendorName: "Spotless Pros", frequency: "Bi-weekly", nextDueDate: "2026-11-17", monthlyCost: 540, status: "current" },
    { id: "svc-02", category: "lawn_landscaping", serviceName: "Lawn Mowing & Edging", vendorName: "GreenScape Hudson", frequency: "Weekly (Apr-Oct)", nextDueDate: "2027-04-12", monthlyCost: 280, status: "current" },
    { id: "svc-03", category: "lawn_landscaping", serviceName: "Mulching & Bed Maintenance", vendorName: "GreenScape Hudson", frequency: "Spring + Fall", nextDueDate: "2026-11-19", monthlyCost: 145, status: "current" },
    { id: "svc-04", category: "lawn_landscaping", serviceName: "Lawn Treatment Program", vendorName: "Summit Turf Care", frequency: "6x per year", nextDueDate: "2026-11-18", monthlyCost: 95, status: "current" },
    { id: "svc-05", category: "tree_care", serviceName: "Tree & Shrub Care", vendorName: "Arbor North", frequency: "Annual + as needed", nextDueDate: "2027-03-15", monthlyCost: 125, status: "current" },
    { id: "svc-06", category: "snow_removal", serviceName: "Snow Plowing", vendorName: "GreenScape Hudson", frequency: "Per event (Nov-Mar)", nextDueDate: "2026-11-16", monthlyCost: 220, status: "current" },
    { id: "svc-07", category: "pest_control", serviceName: "Quarterly Pest Control", vendorName: "Western Reserve Pest", frequency: "Quarterly", nextDueDate: "2026-09-15", monthlyCost: 65, status: "overdue" },
    { id: "svc-08", category: "pest_control", serviceName: "Termite Bond", vendorName: "Western Reserve Pest", frequency: "Annual inspection", nextDueDate: "2027-05-10", monthlyCost: 25, status: "current" },
    { id: "svc-09", category: "hvac", serviceName: "Furnace + AC Tune-Up (Both Zones)", vendorName: "Airflow Mechanical", frequency: "Spring + Fall", nextDueDate: "2026-10-01", monthlyCost: 65, status: "overdue" },
    { id: "svc-10", category: "hvac", serviceName: "Furnace Filter Replacements", vendorName: "Self-managed", frequency: "Quarterly", nextDueDate: "2026-09-01", monthlyCost: 12, status: "overdue" },
    { id: "svc-11", category: "other", serviceName: "Chimney Sweep & Inspection", vendorName: "Brooks Chimney", frequency: "Annual", nextDueDate: "2026-10-15", monthlyCost: 30, status: "overdue" },
    { id: "svc-12", category: "plumbing", serviceName: "Sump Pump Test", vendorName: "Self-managed", frequency: "Twice per year", nextDueDate: "2026-09-20", monthlyCost: 0, status: "overdue" },
    { id: "svc-13", category: "cleaning", serviceName: "Window Cleaning", vendorName: "ClearView Window Co.", frequency: "Twice per year", nextDueDate: "2027-04-22", monthlyCost: 65, status: "current" },
    { id: "svc-14", category: "roof_gutters", serviceName: "Gutter Cleaning", vendorName: "ClearFlow Exteriors", frequency: "Twice per year", nextDueDate: "2026-10-20", monthlyCost: 50, status: "overdue" },
    { id: "svc-15", category: "hvac", serviceName: "Dryer Vent Cleaning", vendorName: "Self-managed", frequency: "Annual", nextDueDate: "2026-08-15", monthlyCost: 8, status: "overdue" },
    { id: "svc-16", category: "hvac", serviceName: "Duct Cleaning", vendorName: "Hudson Air Duct", frequency: "Every 3-5 years", nextDueDate: "2028-05-01", monthlyCost: 18, status: "current" },
    { id: "svc-17", category: "other", serviceName: "Hot Tub Service", vendorName: "Sundance Service", frequency: "Quarterly", nextDueDate: "2026-12-16", monthlyCost: 95, status: "current" },
    { id: "svc-18", category: "electrical", serviceName: "Generator Annual Service", vendorName: "PowerGuard Standby", frequency: "Annual", nextDueDate: "2027-07-12", monthlyCost: 35, status: "current" },
    { id: "svc-19", category: "cleaning", serviceName: "Power Washing (deck, patio, walks)", vendorName: "Self-managed", frequency: "Annual", nextDueDate: "2026-06-30", monthlyCost: 25, status: "overdue" },
    { id: "svc-20", category: "other", serviceName: "Annual Home Walk-Through", vendorName: "Hometown Builders Club", frequency: "Annual", nextDueDate: "2026-10-01", monthlyCost: 20, status: "overdue" },
  ],

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
    spring: [
      { description: "AC tune-up on both zones before the first hot week (Airflow Mechanical)", recurringServiceId: "svc-09" },
      { description: "Replace the furnace filters on both zones", recurringServiceId: "svc-10" },
      { description: "Test the primary sump pump and the battery backup before the spring rains", recurringServiceId: "svc-12" },
      { description: "Gutter cleaning once the tree seeds have dropped", recurringServiceId: "svc-14" },
      { description: "Power wash the rear deck, the flagstone patio and the walks", recurringServiceId: "svc-19" },
      { description: "Window cleaning, inside and out, all 68 windows", recurringServiceId: "svc-13" },
      { description: "Turn the outdoor kitchen back on: water to the sink, grill start-up and leak check" },
    ],
    summer: [
      { description: "Replace the furnace filters on both zones", recurringServiceId: "svc-10" },
      { description: "Hot tub drain and refill, with the filters cleaned", recurringServiceId: "svc-17" },
      { description: "Generator annual service; confirm the weekly exercise run is logging", recurringServiceId: "svc-18" },
      { description: "Dryer vent cleaning, from the laundry room to the exterior hood", recurringServiceId: "svc-15" },
      { description: "Clean the rear deck and apply deck stain while the weather is dry" },
      { description: "Vacuum the Sub-Zero condensers in the kitchen and the wet bar" },
    ],
    fall: [
      { description: "Furnace tune-up on both zones before the first cold snap (Airflow Mechanical)", recurringServiceId: "svc-09" },
      { description: "Replace the furnace filters on both zones", recurringServiceId: "svc-10" },
      { description: "Chimney sweep and inspection before the first fire (Brooks Chimney)", recurringServiceId: "svc-11" },
      { description: "Gutter cleaning after the leaves are down", recurringServiceId: "svc-14" },
      { description: "Test both sump pumps again before the ground freezes", recurringServiceId: "svc-12" },
      { description: "Winterize the outdoor kitchen: drain the sink line, shut down the refrigerator, cover the grill" },
      { description: "Annual home walk-through with Hometown Builders Club", recurringServiceId: "svc-20" },
    ],
    winter: [
      { description: "Replace the furnace filters on both zones", recurringServiceId: "svc-10" },
      { description: "Descale the Rinnai tankless water heater and clean its inlet screen" },
      { description: "Check the softener salt and top off the Kinetico brine tank" },
      { description: "Confirm the generator's weekly exercise run and keep snow clear of the enclosure", recurringServiceId: "svc-18" },
      { description: "Radon fan check: read the gauge on the vent pipe and listen for the fan" },
      { description: "Hot tub quarterly service; check that the cover seals tight", recurringServiceId: "svc-17" },
    ],
  },
};
