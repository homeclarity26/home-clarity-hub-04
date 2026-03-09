export interface TierData {
  price: string;
  description: string;
}

export interface ReportPageData {
  id: string;
  title: string;
  group: string;
  conditionRating?: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  narrative: string[];
  healthBar?: { label: string; current: number; total: number; unit: string };
  specs?: { label: string; value: string }[];
  tiers?: { essential: TierData; enhanced: TierData; signature: TierData };
  timing?: string;
  recommendations?: string[];
  images?: string[];
}

export const reportGroups = [
  {
    id: "information",
    title: "Information",
    pages: ["executive-summary"],
  },
  {
    id: "exterior",
    title: "Exterior Spaces",
    pages: ["roof-system", "windows", "landscaping"],
  },
  {
    id: "interior",
    title: "Interior Spaces",
    pages: ["kitchen", "primary-bathroom"],
  },
  {
    id: "systems",
    title: "Systems",
    pages: ["primary-furnace", "electrical-panel"],
  },
  {
    id: "strategy",
    title: "Strategy",
    pages: ["financial-roadmap", "action-plan"],
  },
];

export const reportPages: Record<string, ReportPageData> = {
  "executive-summary": {
    id: "executive-summary",
    title: "Executive Summary",
    group: "information",
    narrative: [
      "Your home at 742 Evergreen Terrace is a well-built 1987 colonial that has been thoughtfully maintained over its 39-year life. The overall structural integrity is strong, with a solid foundation and well-framed construction that will serve your family for decades to come.",
      "However, several key systems are approaching or have passed their expected service life. The roof system, installed in 2009, is entering its final years. The primary furnace, original to the home, is operating on borrowed time. The electrical panel, while functional, lacks modern safety features and capacity for today's electrical demands.",
      "The strategic priority is clear: address the furnace and electrical panel within the next 12-18 months, plan for roof replacement within 2-3 years, and use the kitchen and bathroom renovations as opportunities to modernize plumbing and improve energy efficiency.",
      "Your total investment range across all recommended improvements spans from $47,000 (Essential tier) to $185,000 (Signature tier) over a 5-year horizon. The recommended sequencing prioritizes safety, prevents cascading damage, and maximizes the value of each dollar spent.",
    ],
    recommendations: [
      "Replace primary furnace before next heating season (Priority: Urgent)",
      "Upgrade electrical panel to 200-amp service (Priority: High)",
      "Plan roof replacement within 2-3 years (Priority: High)",
      "Kitchen renovation in Year 3-5 window (Priority: Medium)",
      "Bathroom updates can follow kitchen work (Priority: Medium)",
    ],
  },
  "kitchen": {
    id: "kitchen",
    title: "Kitchen",
    group: "interior",
    conditionRating: "Fair",
    narrative: [
      "The kitchen is the heart of your home, and it shows both the love it's received and the years it has served. The layout is functional with a classic work triangle, but the space doesn't reflect the way modern families use their kitchens — as gathering spaces, homework stations, and entertainment hubs.",
      "The cabinetry is original 1987 oak with visible wear on high-traffic doors and drawers. Hardware is dated but functional. The countertops are laminate with minor chips along the front edge near the sink. The backsplash is 4-inch ceramic tile showing grout discoloration.",
      "Appliances are a mix of ages: the refrigerator (2019) and dishwasher (2021) are relatively new and in good condition. The range/oven (2008) is approaching replacement age. The microwave (2015) functions but the door seal is weakening.",
      "Plumbing under the sink shows minor corrosion at supply line connections. The garbage disposal is functional but loud, suggesting bearing wear. Lighting is limited to a single overhead fluorescent fixture — inadequate for modern kitchen tasks.",
    ],
    healthBar: { label: "Kitchen Overall Condition", current: 55, total: 100, unit: "%" },
    specs: [
      { label: "Cabinets", value: "Original oak, 1987" },
      { label: "Countertops", value: "Laminate, 1987" },
      { label: "Refrigerator", value: "Samsung, 2019" },
      { label: "Range/Oven", value: "GE Profile, 2008" },
      { label: "Dishwasher", value: "Bosch, 2021" },
    ],
    tiers: {
      essential: {
        price: "$8,500 – $12,000",
        description: "Cabinet refacing, new hardware, laminate countertop replacement, updated lighting, fresh paint. Keeps existing layout and plumbing.",
      },
      enhanced: {
        price: "$25,000 – $45,000",
        description: "New cabinetry, quartz countertops, tile backsplash, under-cabinet lighting, new range/oven, updated plumbing fixtures. Same footprint.",
      },
      signature: {
        price: "$55,000 – $85,000",
        description: "Full gut renovation: custom cabinetry, stone countertops, designer backsplash, all new appliances, recessed lighting, possible layout changes, island addition.",
      },
    },
    timing: "Year 3-5",
    recommendations: [
      "Replace range/oven before major renovation",
      "Address under-sink plumbing corrosion promptly",
      "Consider LED lighting upgrade as standalone project",
    ],
  },
  "roof-system": {
    id: "roof-system",
    title: "Roof System",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The roof was last replaced in 2009 with architectural asphalt shingles rated for 25-30 years. At 17 years old, it is past the midpoint of its expected life and entering the monitoring phase where annual inspections become critical.",
      "Visual inspection reveals granule loss on south-facing slopes — the areas receiving the most UV exposure. Several shingles on the north slope show early curling at edges. Flashing around the chimney appears intact but sealant is showing age-related cracking.",
      "The ridge vent system is functioning properly with no visible blockage. Soffit vents are partially obstructed by insulation displacement in two areas, reducing attic ventilation efficiency. Proper ventilation extends roof life significantly — addressing this is a low-cost, high-impact maintenance item.",
      "No active leaks were observed, and attic inspection showed no water staining on decking. However, two areas of the decking showed slight waviness suggesting possible moisture exposure in the past.",
    ],
    healthBar: { label: "Roof System Lifespan", current: 17, total: 28, unit: "years" },
    specs: [
      { label: "Material", value: "Architectural Asphalt Shingles" },
      { label: "Installed", value: "2009" },
      { label: "Expected Life", value: "25-30 years" },
      { label: "Manufacturer", value: "CertainTeed Landmark" },
      { label: "Ventilation", value: "Ridge + Soffit" },
    ],
    tiers: {
      essential: {
        price: "$12,000 – $16,000",
        description: "Standard architectural shingle replacement, basic flashing, standard ventilation. Industry-standard materials with manufacturer warranty.",
      },
      enhanced: {
        price: "$18,000 – $25,000",
        description: "Premium shingles (50-year rated), upgraded ice & water shield, new flashing throughout, improved ventilation system, gutter integration.",
      },
      signature: {
        price: "$30,000 – $45,000",
        description: "Standing seam metal roof or premium designer shingles, full deck inspection/repair, complete ventilation redesign, integrated gutter system, extended warranty.",
      },
    },
    timing: "Year 2-3",
  },
  "primary-furnace": {
    id: "primary-furnace",
    title: "Primary Furnace",
    group: "systems",
    conditionRating: "Poor",
    narrative: [
      "The primary furnace is the original 1987 unit — a Carrier 58SX gas furnace that has provided 39 years of service, well beyond the typical 15-20 year expected lifespan for equipment of this era. While it continues to operate, it is running on borrowed time.",
      "The unit's AFUE (Annual Fuel Utilization Efficiency) rating is approximately 80%, meaning 20 cents of every heating dollar is lost up the flue. Modern high-efficiency furnaces achieve 95-98% AFUE, representing significant energy savings.",
      "The heat exchanger was visually inspected and no cracks were observed, but at this age, annual inspection is critical — a cracked heat exchanger poses carbon monoxide risks. The blower motor runs louder than normal, suggesting bearing wear. The ignition system was updated to electronic ignition at some point (no longer standing pilot), which is positive.",
      "This is the highest priority replacement in your home. Failure during winter is not just an inconvenience — it's an emergency. Proactive replacement allows you to choose the right system, schedule installation during off-peak pricing, and avoid the premium costs of emergency replacement.",
    ],
    healthBar: { label: "Furnace Lifespan", current: 39, total: 20, unit: "years" },
    specs: [
      { label: "Manufacturer", value: "Carrier" },
      { label: "Model", value: "58SX080" },
      { label: "Serial", value: "1687A23456" },
      { label: "Installed", value: "1987" },
      { label: "AFUE Rating", value: "~80%" },
      { label: "BTU Output", value: "80,000" },
      { label: "Expected Life", value: "15-20 years" },
    ],
    tiers: {
      essential: {
        price: "$4,500 – $6,500",
        description: "Standard efficiency (80% AFUE) gas furnace replacement. New unit, proper sizing, code-compliant installation, standard warranty.",
      },
      enhanced: {
        price: "$7,000 – $10,000",
        description: "High-efficiency (95%+ AFUE) furnace, variable-speed blower, improved filtration, smart thermostat integration, extended warranty.",
      },
      signature: {
        price: "$12,000 – $18,000",
        description: "Premium modulating furnace (98% AFUE), zoned heating capability, whole-home air quality system, smart controls, 10-year parts & labor warranty.",
      },
    },
    timing: "Immediate — Before Next Heating Season",
    recommendations: [
      "Schedule replacement before September for best pricing",
      "Combine with AC condenser evaluation for system matching",
      "Consider ductwork inspection/sealing during installation",
    ],
  },
  "primary-bathroom": {
    id: "primary-bathroom",
    title: "Primary Bathroom",
    group: "interior",
    conditionRating: "Fair",
    narrative: [
      "The primary bathroom retains its original 1987 layout with a combination tub/shower, single vanity, and water closet. The space is functional but dated, and several elements are showing their age in ways that affect both aesthetics and performance.",
      "The tile surround in the tub/shower area shows grout deterioration in multiple areas, particularly along the tub ledge and in corners. This is not merely cosmetic — compromised grout allows moisture penetration behind the tile, which can lead to substrate damage and mold growth. Immediate re-grouting or caulking is recommended as a maintenance item.",
      "The vanity and countertop are original cultured marble with surface crazing and staining. The faucet shows mineral buildup and occasional dripping. The toilet is a standard 3.5-gallon model — replacing with a modern 1.28-gallon unit saves approximately 16,000 gallons annually for a family of four.",
      "Ventilation is provided by a builder-grade exhaust fan that is audibly struggling and likely not moving its rated CFM. Inadequate bathroom ventilation is a leading cause of mold and moisture damage in homes.",
    ],
    healthBar: { label: "Bathroom Condition", current: 45, total: 100, unit: "%" },
    specs: [
      { label: "Vanity", value: "Original cultured marble, 1987" },
      { label: "Toilet", value: "Standard 3.5 GPF, 1987" },
      { label: "Tub/Shower", value: "Fiberglass with tile surround" },
      { label: "Exhaust Fan", value: "Builder grade, ~50 CFM" },
    ],
    tiers: {
      essential: {
        price: "$3,500 – $6,000",
        description: "Re-grout tile, new faucet, new toilet (1.28 GPF), replace exhaust fan, fresh paint. Addresses function and efficiency without layout changes.",
      },
      enhanced: {
        price: "$15,000 – $25,000",
        description: "New vanity and countertop, retile tub surround, new fixtures throughout, improved lighting, upgraded exhaust fan, fresh paint and accessories.",
      },
      signature: {
        price: "$35,000 – $55,000",
        description: "Full renovation: walk-in shower conversion, dual vanity, heated floors, custom tile, frameless glass, premium fixtures, built-in storage, spa-like design.",
      },
    },
    timing: "Year 3-5",
  },
  "electrical-panel": {
    id: "electrical-panel",
    title: "Electrical Panel",
    group: "systems",
    conditionRating: "Fair",
    narrative: [
      "The main electrical panel is the original 1987 installation — a 150-amp Square D QO series panel located in the basement utility area. While the QO series is a quality product line, the panel's age and capacity present both safety and practical concerns.",
      "At 150 amps, this panel was adequate for 1987 electrical demands but is undersized for modern usage patterns. If you plan any significant renovation (kitchen, bathroom, HVAC upgrade), you'll likely need a panel upgrade to 200 amps to accommodate new circuits and increased load.",
      "The panel is full — all breaker slots are occupied with no room for additional circuits. This means any new electrical work requires either tandem breakers (not ideal) or panel replacement. Several breakers show signs of frequent tripping, suggesting circuit overloading.",
      "No AFCI (Arc-Fault Circuit Interrupter) or GFCI breakers are present, as these were not required in 1987 construction. Modern code requires AFCI protection in most living spaces — a significant safety upgrade that protects against electrical fires.",
    ],
    healthBar: { label: "Panel Service Life", current: 39, total: 40, unit: "years" },
    specs: [
      { label: "Manufacturer", value: "Square D" },
      { label: "Model", value: "QO Series" },
      { label: "Capacity", value: "150 Amp" },
      { label: "Installed", value: "1987" },
      { label: "Available Slots", value: "0 (full)" },
    ],
    tiers: {
      essential: {
        price: "$2,500 – $4,000",
        description: "Panel inspection, breaker replacements as needed, add GFCI protection to kitchen/bath/exterior circuits. Maintains existing 150A service.",
      },
      enhanced: {
        price: "$5,000 – $8,000",
        description: "200-amp panel upgrade, new main breaker, AFCI/GFCI breakers throughout, proper labeling, surge protection, whole-home grounding inspection.",
      },
      signature: {
        price: "$10,000 – $15,000",
        description: "200-amp service upgrade (including utility coordination), smart panel with energy monitoring, whole-home surge protection, sub-panel for future expansion, EV charger prep.",
      },
    },
    timing: "Year 1 — Before Major Renovations",
    recommendations: [
      "Upgrade before kitchen or HVAC projects",
      "Add whole-home surge protection regardless of panel decision",
      "Consider EV charger circuit for future-proofing",
    ],
  },
  "windows": {
    id: "windows",
    title: "Windows",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The home has a mix of window types and ages. The majority are original 1987 double-hung aluminum-frame windows with dual-pane glass. These windows were standard for the era but fall well short of modern energy performance standards.",
      "Several windows on the north and west facades show visible condensation between panes — a telltale sign of seal failure. Once the seal fails, the insulating gas escapes, and the window's thermal performance drops significantly. These units should be prioritized for replacement.",
      "The window hardware (locks, balances, operators) is functional on most units but several second-floor windows are difficult to operate, creating both a convenience and safety issue (egress in an emergency).",
      "Energy loss through these windows is substantial. Modern low-E, argon-filled windows can reduce heating/cooling costs by 15-25% — a meaningful factor in your ongoing utility expenses and comfort.",
    ],
    healthBar: { label: "Window Condition", current: 50, total: 100, unit: "%" },
    specs: [
      { label: "Type", value: "Double-hung, aluminum frame" },
      { label: "Glass", value: "Dual-pane, no low-E coating" },
      { label: "Count", value: "22 windows total" },
      { label: "Failed Seals", value: "5 units identified" },
      { label: "Installed", value: "1987 (original)" },
    ],
    tiers: {
      essential: {
        price: "$4,000 – $6,500",
        description: "Replace 5 failed-seal units with energy-efficient vinyl windows. Address worst performers first for immediate comfort and efficiency gains.",
      },
      enhanced: {
        price: "$15,000 – $22,000",
        description: "Replace all 22 windows with mid-range vinyl, low-E glass, argon-filled. Consistent appearance, significant energy savings, improved comfort.",
      },
      signature: {
        price: "$30,000 – $45,000",
        description: "Premium fiberglass or wood-clad windows throughout, triple-pane option for north-facing, custom grille patterns, professional interior/exterior trim work.",
      },
    },
    timing: "Year 2-3 (phased approach possible)",
  },
  "landscaping": {
    id: "landscaping",
    title: "Landscaping",
    group: "exterior",
    conditionRating: "Good",
    narrative: [
      "The landscaping has been well-maintained with mature plantings that add significant curb appeal and property value. The front yard features established ornamental trees, foundation shrubs, and perennial beds that are attractive and appropriately scaled for the home.",
      "The primary concern is drainage. Grading along the east side of the home directs water toward the foundation rather than away from it. This is a common issue in homes of this era and should be addressed to prevent potential water infiltration in the basement. Regrading and extending downspout drainage would resolve this.",
      "The rear yard has a mature shade tree canopy that is mostly beneficial but one large silver maple has surface roots that are lifting a section of the patio pavers. Arborist consultation is recommended to assess root management options versus tree removal.",
      "Irrigation is manual (hose and sprinkler). The lawn areas show stress during summer months — a drip irrigation system for beds and a smart controller would improve plant health while actually reducing water usage.",
    ],
    healthBar: { label: "Landscape Health", current: 72, total: 100, unit: "%" },
    tiers: {
      essential: {
        price: "$2,000 – $4,000",
        description: "Regrading along east foundation, extend downspout drainage, mulch beds, prune overgrowth. Addresses the critical drainage concern.",
      },
      enhanced: {
        price: "$8,000 – $15,000",
        description: "Drainage correction plus new bed design, drip irrigation system, smart controller, patio paver releveling, seasonal planting plan.",
      },
      signature: {
        price: "$25,000 – $40,000",
        description: "Complete landscape redesign: hardscape, softscape, lighting, irrigation, outdoor living space integration, retaining walls, professional landscape architecture.",
      },
    },
    timing: "Year 1-2 (drainage is priority)",
    recommendations: [
      "Address east-side drainage immediately — low cost, high impact",
      "Consult arborist about silver maple root management",
      "Consider landscape lighting for security and aesthetics",
    ],
  },
  "financial-roadmap": {
    id: "financial-roadmap",
    title: "Financial Roadmap",
    group: "strategy",
    narrative: [
      "This financial roadmap sequences your recommended improvements over a 5-year horizon, organized by priority and construction logic. The goal is not to do everything at once — it's to invest strategically in the right order to protect your home's value and your family's comfort.",
      "Year 1 focuses on life-safety and infrastructure: furnace replacement and electrical panel upgrade. These projects are foundational — they must happen before cosmetic renovations, and they prevent the most serious risks (equipment failure in winter, electrical safety).",
      "Years 2-3 address the building envelope: roof replacement and window upgrades. These protect every other investment you'll make. There's no point in renovating a kitchen if the roof is leaking or windows are hemorrhaging energy.",
      "Years 3-5 are the quality-of-life improvements: kitchen renovation, bathroom updates, and landscape enhancements. By this point, your systems are modern and reliable, your envelope is tight, and these renovations will perform as intended without hidden surprises.",
    ],
    recommendations: [
      "Year 1: Furnace ($7,000-$10,000) + Electrical Panel ($5,000-$8,000) = $12,000-$18,000",
      "Year 1-2: Landscaping drainage ($2,000-$4,000)",
      "Year 2-3: Roof replacement ($18,000-$25,000)",
      "Year 2-3: Window replacement phased ($15,000-$22,000)",
      "Year 3-5: Kitchen renovation ($25,000-$45,000)",
      "Year 3-5: Primary bathroom ($15,000-$25,000)",
      "5-Year Total (Enhanced tier): $97,000-$148,000",
    ],
  },
  "action-plan": {
    id: "action-plan",
    title: "Action Plan",
    group: "strategy",
    narrative: [
      "This action plan translates your Home Clarity Report findings into concrete next steps. Think of this as your getting-started guide — the bridge between 'here's what we found' and 'here's what to do about it.'",
      "Step 1: Review this report with your family. Discuss priorities, timeline preferences, and budget comfort levels. There's no single right answer — the Essential, Enhanced, and Signature tiers give you flexibility to choose what fits your situation.",
      "Step 2: Schedule a strategic planning session with Adam. We'll walk through the sequencing, discuss contractor options, and create a timeline that works with your family's schedule and budget. This session is included in your HBC membership.",
      "Step 3: Begin with the furnace. This is the one project with a hard deadline (before next heating season) and the highest consequence of delay. We'll help you select a contractor, review bids, and ensure quality installation.",
      "Step 4: While the furnace project is underway, get the electrical panel evaluation scheduled. These two projects can often be coordinated for efficiency — the HVAC contractor and electrician frequently work together.",
      "Your HBC membership means you're never navigating this alone. Every project gets our oversight, contractor vetting, and quality assurance. Think of us as your home's advisory board.",
    ],
    recommendations: [
      "This week: Review report with family, note questions",
      "Within 2 weeks: Schedule planning session with Adam",
      "Within 30 days: Get furnace replacement bids (we'll help)",
      "Within 60 days: Schedule electrical panel evaluation",
      "Ongoing: Use this portal to track progress and ask questions",
    ],
  },
};
