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
    title: "Exterior",
    pages: ["roof-system", "siding-cladding", "windows", "exterior-doors", "gutters-downspouts", "deck-patio", "driveway-walkways", "landscaping"],
  },
  {
    id: "interior-living",
    title: "Living Spaces",
    pages: ["living-room", "dining-room", "family-room", "home-office", "bonus-room"],
  },
  {
    id: "interior-bedrooms",
    title: "Bedrooms",
    pages: ["primary-bedroom", "bedroom-2", "bedroom-3", "bedroom-4"],
  },
  {
    id: "interior-bathrooms",
    title: "Bathrooms",
    pages: ["primary-bathroom", "hall-bathroom", "powder-room"],
  },
  {
    id: "interior-utility",
    title: "Utility & Service",
    pages: ["kitchen", "laundry-room", "mudroom-entry", "pantry-storage", "stairways-hallways"],
  },
  {
    id: "interior-unfinished",
    title: "Unfinished Spaces",
    pages: ["basement", "attic", "garage"],
  },
  {
    id: "systems-hvac",
    title: "HVAC Systems",
    pages: ["primary-furnace", "air-conditioning", "insulation-ventilation"],
  },
  {
    id: "systems-mechanical",
    title: "Mechanical & Safety",
    pages: ["electrical-panel", "plumbing-system", "water-heater", "fireplace-chimney", "foundation"],
  },
  {
    id: "strategy",
    title: "Strategy",
    pages: ["financial-roadmap", "action-plan"],
  },
];

export const reportPages: Record<string, ReportPageData> = {
  // ────────────────────────────────────────────
  // INFORMATION
  // ────────────────────────────────────────────
  "executive-summary": {
    id: "executive-summary",
    title: "Executive Summary",
    group: "information",
    narrative: [
      "Your home at 742 Evergreen Terrace is a well-built 1987 colonial that has been thoughtfully maintained over its 39-year life. The overall structural integrity is strong, with a solid foundation and well-framed construction that will serve your family for decades to come.",
      "However, several key systems are approaching or have passed their expected service life. The roof system, installed in 2009, is entering its final years. The primary furnace, original to the home, is operating on borrowed time. The electrical panel, while functional, lacks modern safety features and capacity for today's electrical demands.",
      "The strategic priority is clear: address the furnace and electrical panel within the next 12–18 months, plan for roof replacement within 2–3 years, and use the kitchen and bathroom renovations as opportunities to modernize plumbing and improve energy efficiency.",
      "Your total investment range across all recommended improvements spans from $72,000 (Essential tier) to $285,000 (Signature tier) over a 5-year horizon. The recommended sequencing prioritizes safety, prevents cascading damage, and maximizes the value of each dollar spent.",
    ],
    recommendations: [
      "Replace primary furnace before next heating season (Priority: Urgent)",
      "Upgrade electrical panel to 200-amp service (Priority: High)",
      "Plan roof replacement within 2–3 years (Priority: High)",
      "Kitchen renovation in Year 3–5 window (Priority: Medium)",
      "Bathroom updates can follow kitchen work (Priority: Medium)",
    ],
  },

  // ────────────────────────────────────────────
  // EXTERIOR
  // ────────────────────────────────────────────
  "roof-system": {
    id: "roof-system",
    title: "Roof System",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The roof was last replaced in 2009 with architectural asphalt shingles rated for 25–30 years. At 17 years old, it is past the midpoint of its expected life and entering the monitoring phase where annual inspections become critical.",
      "Visual inspection reveals granule loss on south-facing slopes — the areas receiving the most UV exposure. Several shingles on the north slope show early curling at edges. Flashing around the chimney appears intact but sealant is showing age-related cracking.",
      "The ridge vent system is functioning properly with no visible blockage. Soffit vents are partially obstructed by insulation displacement in two areas, reducing attic ventilation efficiency.",
      "No active leaks were observed, and attic inspection showed no water staining on decking. However, two areas of the decking showed slight waviness suggesting possible moisture exposure in the past.",
    ],
    healthBar: { label: "Roof System Lifespan", current: 17, total: 28, unit: "years" },
    specs: [
      { label: "Material", value: "Architectural Asphalt Shingles" },
      { label: "Installed", value: "2009" },
      { label: "Expected Life", value: "25–30 years" },
      { label: "Manufacturer", value: "CertainTeed Landmark" },
      { label: "Ventilation", value: "Ridge + Soffit" },
    ],
    tiers: {
      essential: { price: "$12,000 – $16,000", description: "Standard architectural shingle replacement, basic flashing, standard ventilation." },
      enhanced: { price: "$18,000 – $25,000", description: "Premium 50-year shingles, upgraded ice & water shield, new flashing, improved ventilation, gutter integration." },
      signature: { price: "$30,000 – $45,000", description: "Standing seam metal or designer shingles, full deck repair, ventilation redesign, integrated gutter system." },
    },
    timing: "Year 2–3",
  },

  "siding-cladding": {
    id: "siding-cladding",
    title: "Siding & Cladding",
    group: "exterior",
    conditionRating: "Good",
    narrative: [
      "The home is clad in vinyl siding installed during a 2004 renovation. The material is mid-grade quality with a 40-year limited warranty. Overall, the siding is performing well — color retention is acceptable with only modest fading on the south and west exposures.",
      "A detailed walk-around inspection identified three areas where siding panels have pulled away from the J-channel, leaving gaps that could allow moisture and insect intrusion behind the envelope. These are simple re-clips that any siding contractor can address in under an hour.",
      "The trim around windows and soffits is aluminum with a baked-on finish. Minor oxidation is visible on the west-facing fascia boards but no structural deterioration. The band board between the first and second floors shows a slight bow in one 8-foot section — likely a settling deflection rather than structural concern, but worth monitoring.",
      "Behind the siding, the home has OSB sheathing with house wrap. Where visible at penetrations, the house wrap appears intact. No moisture staining or rot was observed at any accessible point behind the cladding.",
    ],
    healthBar: { label: "Siding Condition", current: 75, total: 100, unit: "%" },
    specs: [
      { label: "Material", value: "Vinyl siding, mid-grade" },
      { label: "Installed", value: "2004" },
      { label: "Warranty", value: "40-year limited (transferable)" },
      { label: "Sheathing", value: "OSB with house wrap" },
      { label: "Trim", value: "Aluminum with baked finish" },
    ],
    tiers: {
      essential: { price: "$800 – $1,500", description: "Re-clip loose panels, seal gaps, touch-up caulking at penetrations. Addresses immediate maintenance items." },
      enhanced: { price: "$8,000 – $14,000", description: "Replace faded south/west sections, upgrade to insulated vinyl, new trim wrapping, fresh caulking throughout." },
      signature: { price: "$25,000 – $40,000", description: "Full re-side with fiber cement (James Hardie) or engineered wood. Premium trim, architectural details, 50-year warranty." },
    },
    timing: "Year 3–5 (maintenance items immediate)",
    recommendations: [
      "Re-clip three loose siding panels immediately — prevents moisture intrusion",
      "Monitor band board bow annually for progression",
      "Consider re-siding when roof is replaced for scaffold efficiency",
    ],
  },

  "windows": {
    id: "windows",
    title: "Windows",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The home has a mix of window types and ages. The majority are original 1987 double-hung aluminum-frame windows with dual-pane glass. These windows were standard for the era but fall well short of modern energy performance standards.",
      "Several windows on the north and west facades show visible condensation between panes — a telltale sign of seal failure. Once the seal fails, the insulating gas escapes, and the window's thermal performance drops significantly.",
      "Window hardware (locks, balances, operators) is functional on most units but several second-floor windows are difficult to operate, creating both a convenience and safety issue (egress in an emergency).",
      "Energy loss through these windows is substantial. Modern low-E, argon-filled windows can reduce heating/cooling costs by 15–25%.",
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
      essential: { price: "$4,000 – $6,500", description: "Replace 5 failed-seal units with energy-efficient vinyl windows." },
      enhanced: { price: "$15,000 – $22,000", description: "Replace all 22 windows with mid-range vinyl, low-E glass, argon-filled." },
      signature: { price: "$30,000 – $45,000", description: "Premium fiberglass or wood-clad windows, triple-pane option for north-facing, custom grilles, professional trim." },
    },
    timing: "Year 2–3 (phased approach possible)",
  },

  "exterior-doors": {
    id: "exterior-doors",
    title: "Exterior Doors",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The home has four exterior doors: front entry, rear sliding patio door, side entry to garage, and a basement walkout door. The front entry door is a solid wood 6-panel door, original to the home. It shows signs of weathering — minor warping along the bottom rail and deteriorated weather stripping that allows visible daylight gaps.",
      "The rear sliding patio door is a 2012 replacement — a double-pane vinyl unit in generally good condition. The track shows some debris accumulation and the rollers occasionally stick, but cleaning and lubrication should restore smooth operation. The screen door is torn in one corner.",
      "The side entry door to the garage is a hollow-core unit that provides virtually no thermal or security benefit. This door should be upgraded to an insulated, fire-rated door — a code requirement in most jurisdictions for the garage-to-house connection.",
      "The basement walkout door is a steel unit showing surface rust at the bottom where it meets the threshold. Weather stripping is compressed and no longer sealing effectively. Water staining on the interior side suggests past moisture entry during heavy rain.",
    ],
    healthBar: { label: "Door Condition", current: 55, total: 100, unit: "%" },
    specs: [
      { label: "Front Entry", value: "Solid wood 6-panel, 1987" },
      { label: "Rear Patio", value: "Vinyl sliding, 2012" },
      { label: "Side (Garage)", value: "Hollow-core, 1987" },
      { label: "Basement Walkout", value: "Steel, 1987" },
    ],
    tiers: {
      essential: { price: "$1,200 – $2,500", description: "Replace weather stripping on all doors, replace garage-to-house door with fire-rated insulated unit, address rust on basement door." },
      enhanced: { price: "$4,000 – $7,000", description: "New front entry door (fiberglass), fire-rated garage door, new basement door, new hardware throughout, professional installation." },
      signature: { price: "$8,000 – $14,000", description: "Custom front entry (solid mahogany or premium fiberglass with sidelights), French patio door conversion, all new doors with smart locks." },
    },
    timing: "Year 1–2",
    recommendations: [
      "Replace garage-to-house door with fire-rated unit immediately — safety priority",
      "Address basement door rust and weather stripping before next rain season",
      "Front entry door replacement improves curb appeal significantly",
    ],
  },

  "gutters-downspouts": {
    id: "gutters-downspouts",
    title: "Gutters & Downspouts",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The home has 5-inch aluminum K-style gutters installed in 2009 during the roof replacement. The gutter system is generally intact but showing several maintenance needs and one area of concern.",
      "Downspouts discharge at grade level with no splash blocks or extensions on three of six locations. Water is pooling at the foundation base — a contributing factor to the drainage issues noted in the landscaping section and a potential source of basement moisture.",
      "Two gutter sections on the north side have pulled away from the fascia, likely from ice loading. The spikes are pulling through the aluminum — a common failure mode. Re-hanging with modern hidden hangers (screwed to rafters) would be a permanent fix.",
      "Leaf guards are not installed. Given the mature tree canopy, the gutters require cleaning 3–4 times per year to function properly. Gutter guards would reduce this to annual inspections.",
    ],
    healthBar: { label: "Gutter System", current: 60, total: 100, unit: "%" },
    specs: [
      { label: "Type", value: "5\" aluminum K-style" },
      { label: "Installed", value: "2009" },
      { label: "Downspouts", value: "6 total, 2×3\" aluminum" },
      { label: "Guards", value: "None installed" },
    ],
    tiers: {
      essential: { price: "$600 – $1,200", description: "Re-hang pulled sections, add splash blocks and downspout extensions, full cleaning. Critical drainage fix." },
      enhanced: { price: "$2,500 – $4,500", description: "Re-hang all gutters with hidden hangers, gutter guards, downspout extensions to 6 feet, underground drain lines at problem areas." },
      signature: { price: "$6,000 – $10,000", description: "Seamless 6\" aluminum gutters, premium micro-mesh guards, full underground drainage system, rain barrel integration." },
    },
    timing: "Year 1 (maintenance items immediate)",
  },

  "deck-patio": {
    id: "deck-patio",
    title: "Deck & Patio",
    group: "exterior",
    conditionRating: "Fair",
    narrative: [
      "The rear deck is a pressure-treated pine structure built in 2005, approximately 320 square feet with a single staircase to grade. The decking boards show moderate weathering with surface checking (splitting along the grain) on approximately 30% of boards. The stain/seal has worn off most of the walking surface.",
      "Structurally, the ledger board connection to the house was inspected and appears properly flashed and bolted — the most critical detail in deck construction. The posts are set on concrete piers above grade, which is proper technique. No signs of rot at post bases.",
      "The railing system meets current height requirements (36 inches) but the baluster spacing exceeds the modern 4-inch maximum in two sections — a safety concern if small children use the space. Railing post connections show some wobble, indicating loosening fasteners.",
      "The adjacent patio is paver-on-sand construction, approximately 200 square feet. As noted in the landscaping section, tree root heave has displaced several pavers, creating a trip hazard. Overall, the paver material is in good condition and releveling is straightforward.",
    ],
    healthBar: { label: "Deck & Patio Condition", current: 55, total: 100, unit: "%" },
    specs: [
      { label: "Deck Material", value: "Pressure-treated pine" },
      { label: "Deck Size", value: "~320 sq ft" },
      { label: "Built", value: "2005" },
      { label: "Patio Material", value: "Concrete pavers on sand" },
      { label: "Patio Size", value: "~200 sq ft" },
    ],
    tiers: {
      essential: { price: "$1,500 – $3,000", description: "Sand, stain, and seal deck boards. Tighten railings, correct baluster spacing. Relevel heaved pavers." },
      enhanced: { price: "$8,000 – $15,000", description: "Composite decking overlay (Trex/TimberTech), new composite railings, relevel and extend patio, LED stair lights." },
      signature: { price: "$25,000 – $45,000", description: "Full tear-off and rebuild with premium composite, multi-level design, built-in seating, outdoor kitchen prep area, pergola." },
    },
    timing: "Year 2–3",
    recommendations: [
      "Correct baluster spacing immediately — child safety concern",
      "Stain/seal deck before winter to prevent further deterioration",
      "Relevel patio pavers to eliminate trip hazard",
    ],
  },

  "driveway-walkways": {
    id: "driveway-walkways",
    title: "Driveway & Walkways",
    group: "exterior",
    conditionRating: "Good",
    narrative: [
      "The driveway is poured concrete, approximately 40 feet long and 18 feet wide (two-car width). The original 1987 pour shows typical aging — three hairline control-joint cracks and two areas of surface spalling near the garage apron. No heaving or significant settling was observed.",
      "The front walkway from the driveway to the entry is flagstone-on-mortar, added during a 2010 landscaping project. It is in excellent condition with tight mortar joints and proper slope away from the front entry. This is a quality installation that enhances curb appeal.",
      "The side concrete walkway to the rear yard has one area of significant settling (approximately 1.5 inches) where it passes alongside the garage. This creates a trip hazard and a low point where water pools. Mudjacking (slab lifting) is a cost-effective repair option.",
      "Overall, the hardscape infrastructure is solid. The concrete driveway has many years of service remaining with basic sealing and crack repair. The side walkway settling should be addressed for safety.",
    ],
    healthBar: { label: "Hardscape Condition", current: 72, total: 100, unit: "%" },
    specs: [
      { label: "Driveway", value: "Poured concrete, 1987" },
      { label: "Front Walk", value: "Flagstone on mortar, 2010" },
      { label: "Side Walk", value: "Poured concrete, 1987" },
      { label: "Total Area", value: "~950 sq ft" },
    ],
    tiers: {
      essential: { price: "$500 – $1,200", description: "Crack sealing, mudjack settled walkway section, concrete sealer application. Addresses safety and preservation." },
      enhanced: { price: "$4,000 – $8,000", description: "Resurface spalled areas, mudjack all settled sections, add border pavers, concrete coating system, new edging." },
      signature: { price: "$15,000 – $28,000", description: "Full driveway replacement with stamped concrete or paver system, heated driveway option, coordinated walkway design." },
    },
    timing: "Year 2–4",
  },

  "landscaping": {
    id: "landscaping",
    title: "Landscaping",
    group: "exterior",
    conditionRating: "Good",
    narrative: [
      "The landscaping has been well-maintained with mature plantings that add significant curb appeal and property value. The front yard features established ornamental trees, foundation shrubs, and perennial beds that are attractive and appropriately scaled for the home.",
      "The primary concern is drainage. Grading along the east side of the home directs water toward the foundation rather than away from it. Regrading and extending downspout drainage would resolve this.",
      "The rear yard has a mature shade tree canopy that is mostly beneficial but one large silver maple has surface roots lifting a section of the patio pavers. Arborist consultation is recommended.",
      "Irrigation is manual (hose and sprinkler). A drip irrigation system for beds and a smart controller would improve plant health while reducing water usage.",
    ],
    healthBar: { label: "Landscape Health", current: 72, total: 100, unit: "%" },
    tiers: {
      essential: { price: "$2,000 – $4,000", description: "Regrading along east foundation, extend downspout drainage, mulch beds, prune overgrowth." },
      enhanced: { price: "$8,000 – $15,000", description: "Drainage correction, new bed design, drip irrigation, smart controller, patio paver releveling." },
      signature: { price: "$25,000 – $40,000", description: "Complete landscape redesign: hardscape, softscape, lighting, irrigation, outdoor living integration." },
    },
    timing: "Year 1–2 (drainage is priority)",
    recommendations: [
      "Address east-side drainage immediately — low cost, high impact",
      "Consult arborist about silver maple root management",
      "Consider landscape lighting for security and aesthetics",
    ],
  },

  // ────────────────────────────────────────────
  // LIVING SPACES
  // ────────────────────────────────────────────
  "living-room": {
    id: "living-room",
    title: "Living Room",
    group: "interior-living",
    conditionRating: "Good",
    narrative: [
      "The formal living room is a well-proportioned 14×18-foot space at the front of the home with a large picture window providing excellent natural light. The room retains its original hardwood flooring — red oak — which is in remarkably good condition with only minor surface wear in traffic paths.",
      "Crown molding, chair rail, and baseboards are original and in excellent condition, reflecting quality 1987 craftsmanship. These details add character and value that modern homes rarely replicate at this quality level.",
      "The ceiling shows two fine hairline cracks running parallel to the joists — typical of seasonal expansion and contraction in drywall. These are cosmetic, not structural, and can be addressed with tape and texture during the next paint cycle.",
      "The room has three duplex outlets on two walls, which is adequate but not generous by modern standards. No USB outlets, no floor outlets for center-room furniture placement. The overhead light is controlled by a single switch — no dimmer capability.",
    ],
    healthBar: { label: "Living Room Condition", current: 78, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "14 × 18 ft (252 sq ft)" },
      { label: "Flooring", value: "Red oak hardwood, original" },
      { label: "Ceiling Height", value: "8 ft" },
      { label: "Windows", value: "1 picture, 2 double-hung" },
      { label: "Outlets", value: "3 duplex (2 walls)" },
    ],
    tiers: {
      essential: { price: "$1,200 – $2,500", description: "Sand and refinish hardwood floors, repair ceiling cracks, fresh paint, add dimmer switches." },
      enhanced: { price: "$5,000 – $10,000", description: "Floor refinish, crown molding restoration, recessed lighting, add outlets with USB, new window treatments." },
      signature: { price: "$12,000 – $22,000", description: "Full refresh: custom built-in bookshelves, gas fireplace insert, designer lighting, automated shades, premium finishes." },
    },
    timing: "Year 3–5",
  },

  "dining-room": {
    id: "dining-room",
    title: "Dining Room",
    group: "interior-living",
    conditionRating: "Good",
    narrative: [
      "The formal dining room is 12×14 feet, adjacent to the kitchen and living room — a classic colonial floor plan. The room features the same red oak hardwood as the living room, in slightly better condition due to lighter traffic patterns.",
      "The ceiling has a decorative medallion and chandelier hook centered in the room. The chandelier electrical box is properly rated for fixture weight. Wainscoting or chair rail treatment on three walls adds period-appropriate formality.",
      "One wall shows a slight outward bow near the floor — approximately 1/4 inch over 8 feet. This is within normal tolerances for a home of this age and shows no signs of progression. A baseline measurement has been recorded for future comparison.",
      "The room has adequate natural light from two east-facing windows but artificial lighting is limited to the chandelier. Wall sconces or recessed lighting would improve versatility for this space.",
    ],
    healthBar: { label: "Dining Room Condition", current: 80, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "12 × 14 ft (168 sq ft)" },
      { label: "Flooring", value: "Red oak hardwood, original" },
      { label: "Windows", value: "2 double-hung, east-facing" },
      { label: "Trim", value: "Chair rail / wainscoting" },
    ],
    tiers: {
      essential: { price: "$800 – $1,500", description: "Fresh paint, touch-up trim, clean and polish floors, update chandelier." },
      enhanced: { price: "$3,000 – $6,000", description: "Refinish floors, add recessed lighting, update wainscoting, new window treatments." },
      signature: { price: "$8,000 – $15,000", description: "Custom millwork, designer wallcovering, premium lighting, built-in sideboard, refinished floors." },
    },
    timing: "Year 4–5",
  },

  "family-room": {
    id: "family-room",
    title: "Family Room",
    group: "interior-living",
    conditionRating: "Good",
    narrative: [
      "The family room is the largest living space at 16×20 feet, located at the rear of the home with sliding door access to the deck. This is clearly the most-used room in the home, and the wear patterns reflect that — which is exactly as it should be.",
      "The flooring is wall-to-wall carpet, likely installed around 2015 based on condition and style. It shows moderate traffic wear in the main walkway but is generally in fair-to-good condition. Carpet padding appears adequate based on feel.",
      "The room features a wood-burning fireplace with a brick surround and wood mantel. The firebox interior shows heavy creosote buildup — a professional chimney sweep is overdue. The damper operates but is stiff. The mantel has a minor separation from the wall that could be re-secured with finish nails and caulk.",
      "This room has the most electrical demand — TV, gaming systems, sound bar, lamps — and it shows. Two power strips are in use, daisy-chained in one case. Additional dedicated circuits and outlets would improve safety and convenience.",
    ],
    healthBar: { label: "Family Room Condition", current: 68, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "16 × 20 ft (320 sq ft)" },
      { label: "Flooring", value: "Wall-to-wall carpet, ~2015" },
      { label: "Ceiling Height", value: "8 ft" },
      { label: "Fireplace", value: "Wood-burning, brick surround" },
      { label: "Outlets", value: "4 duplex (overloaded)" },
    ],
    tiers: {
      essential: { price: "$1,500 – $3,000", description: "Professional carpet cleaning, chimney sweep, add 2 outlets, secure mantel, patch and paint." },
      enhanced: { price: "$6,000 – $12,000", description: "LVP flooring, fireplace gas insert conversion, recessed lighting, additional circuits, fresh paint." },
      signature: { price: "$18,000 – $30,000", description: "Full renovation: premium flooring, stone fireplace surround, built-in entertainment center, smart home wiring, accent lighting." },
    },
    timing: "Year 2–4",
    recommendations: [
      "Schedule chimney sweep immediately — fire safety priority",
      "Address daisy-chained power strips — electrical hazard",
      "Consider gas fireplace insert for convenience and efficiency",
    ],
  },

  "home-office": {
    id: "home-office",
    title: "Home Office",
    group: "interior-living",
    conditionRating: "Good",
    narrative: [
      "The home office is a converted bedroom (11×12 feet) on the main floor. The conversion was done simply — no structural changes, just repurposed as workspace. The room has two windows providing good natural light and ventilation.",
      "Flooring is the same red oak hardwood found throughout the main level, in good condition under a large area rug. Walls are in good condition with standard drywall and paint. One wall has been fitted with wall-mounted shelving.",
      "The room has a single overhead light and two wall outlets — insufficient for a modern home office. A dedicated circuit, additional outlets (including USB-C), and improved lighting would significantly improve functionality.",
      "Internet connectivity is via Wi-Fi. The room is on the opposite end of the home from the router, and signal strength may be limited. Consider a hardwired ethernet drop or mesh Wi-Fi extender for reliable video conferencing.",
    ],
    healthBar: { label: "Office Condition", current: 75, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "11 × 12 ft (132 sq ft)" },
      { label: "Flooring", value: "Red oak hardwood" },
      { label: "Windows", value: "2 double-hung" },
      { label: "Outlets", value: "2 duplex" },
      { label: "Data", value: "Wi-Fi only (no ethernet)" },
    ],
    tiers: {
      essential: { price: "$500 – $1,000", description: "Add outlets, install task lighting, ethernet drop, fresh paint. Minimal disruption, maximum productivity gain." },
      enhanced: { price: "$3,000 – $6,000", description: "Built-in desk/shelving, dedicated circuit, recessed lighting with dimmer, ethernet, sound dampening on shared wall." },
      signature: { price: "$8,000 – $15,000", description: "Custom cabinetry, premium built-in desk, integrated cable management, accent lighting, soundproofing, premium finishes." },
    },
    timing: "Year 2–3",
  },

  "bonus-room": {
    id: "bonus-room",
    title: "Bonus Room / Flex Space",
    group: "interior-living",
    conditionRating: "Good",
    narrative: [
      "The bonus room above the garage is a 15×20-foot space that serves as a secondary family area. The room was finished as part of the original construction but has the characteristics typical of above-garage spaces — lower insulation value and some temperature differential from the main living areas.",
      "Flooring is carpet over plywood subfloor. The carpet is older (likely original or first replacement) and showing significant wear. The subfloor has a slight bounce in the center span, suggesting potential need for additional bracing — though this is common in above-garage construction.",
      "The room has its own HVAC register but temperature consistency is noticeably different from the main house — warmer in summer, cooler in winter. This is primarily an insulation issue. The floor above the unheated garage needs R-30 or better insulation, and the current batts appear to be R-19 at best.",
      "This is excellent space with good potential. With proper insulation and flooring upgrades, it can function comfortably as a media room, playroom, guest suite, or gym.",
    ],
    healthBar: { label: "Bonus Room Condition", current: 62, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "15 × 20 ft (300 sq ft)" },
      { label: "Flooring", value: "Carpet over plywood" },
      { label: "Insulation", value: "R-19 (below standard)" },
      { label: "HVAC", value: "Single register, shared zone" },
    ],
    tiers: {
      essential: { price: "$2,000 – $4,000", description: "Upgrade floor insulation to R-30, new carpet, fresh paint. Addresses comfort and energy loss." },
      enhanced: { price: "$6,000 – $12,000", description: "Insulation upgrade, LVP flooring, add dedicated HVAC zone, recessed lighting, fresh drywall and paint." },
      signature: { price: "$15,000 – $25,000", description: "Full conversion: premium finishes, mini-split HVAC, entertainment wiring, soundproofing, built-in storage, wet bar option." },
    },
    timing: "Year 3–5",
  },

  // ────────────────────────────────────────────
  // BEDROOMS
  // ────────────────────────────────────────────
  "primary-bedroom": {
    id: "primary-bedroom",
    title: "Primary Bedroom",
    group: "interior-bedrooms",
    conditionRating: "Good",
    narrative: [
      "The primary bedroom is 14×16 feet with a walk-in closet (5×8 feet) and direct access to the primary bathroom. The room is positioned at the rear of the home for privacy and benefits from morning light through two east-facing windows.",
      "Flooring is wall-to-wall carpet installed approximately 2018 and in good condition. The padding feels adequate. One area near the closet door shows a ripple that could be re-stretched to prevent a trip hazard.",
      "The ceiling fan is operational but wobbles noticeably at higher speeds — likely a balance or mounting issue. The light kit flickers intermittently, suggesting a wiring connection issue in the canopy. The walk-in closet has a single overhead light and a basic wire shelf system.",
      "Two windows have operational locks and balances. The north-facing window has a failed seal (condensation between panes) as noted in the Windows section. Overall, this is a comfortable, well-proportioned primary suite that would benefit from cosmetic updates and closet organization.",
    ],
    healthBar: { label: "Primary Bedroom Condition", current: 74, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "14 × 16 ft (224 sq ft)" },
      { label: "Closet", value: "Walk-in, 5 × 8 ft" },
      { label: "Flooring", value: "Carpet, ~2018" },
      { label: "Windows", value: "2 double-hung, east-facing" },
      { label: "Ceiling Fan", value: "52\", needs balancing" },
    ],
    tiers: {
      essential: { price: "$800 – $1,500", description: "Re-stretch carpet, fix ceiling fan, repair closet light, fresh paint. Simple maintenance refresh." },
      enhanced: { price: "$4,000 – $8,000", description: "New flooring (LVP or hardwood), custom closet system, new ceiling fan, recessed lighting, accent wall." },
      signature: { price: "$12,000 – $20,000", description: "Full suite renovation: premium flooring, designer closet system, ensuite entry upgrade, automated shades, ambient lighting." },
    },
    timing: "Year 3–5",
  },

  "bedroom-2": {
    id: "bedroom-2",
    title: "Bedroom 2",
    group: "interior-bedrooms",
    conditionRating: "Good",
    narrative: [
      "Bedroom 2 is 11×13 feet, located adjacent to the hall bathroom. Currently used as a child's bedroom. The room has two windows providing good cross-ventilation and adequate natural light.",
      "Flooring is the original red oak hardwood, hidden under carpet until a recent (within 5 years) carpet removal. The hardwood is in surprisingly good condition — the carpet actually protected it from decades of wear. Minor refinishing would bring it to excellent condition.",
      "Walls and ceiling are in good condition with standard paint. The closet is a standard reach-in with a single rod and shelf — functional but not optimized. The door is a hollow-core original that transmits sound easily.",
      "Two outlets serve the room — minimum for current code but light for modern usage with devices, chargers, and lamps. The overhead light is a basic flush-mount fixture.",
    ],
    healthBar: { label: "Bedroom 2 Condition", current: 76, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "11 × 13 ft (143 sq ft)" },
      { label: "Flooring", value: "Red oak hardwood (exposed)" },
      { label: "Closet", value: "Reach-in, single rod" },
      { label: "Windows", value: "2 double-hung" },
    ],
    tiers: {
      essential: { price: "$600 – $1,200", description: "Refinish hardwood, fresh paint, update light fixture, add outlet." },
      enhanced: { price: "$2,500 – $5,000", description: "Floor refinish, closet organizer system, solid-core door, updated lighting, fresh paint." },
      signature: { price: "$6,000 – $10,000", description: "Full refresh: premium floor finish, custom closet, designer lighting, accent wall, built-in desk/shelving." },
    },
    timing: "Year 4–5",
  },

  "bedroom-3": {
    id: "bedroom-3",
    title: "Bedroom 3",
    group: "interior-bedrooms",
    conditionRating: "Good",
    narrative: [
      "Bedroom 3 is 10×12 feet, the smallest of the upper bedrooms. Currently configured as a guest room. The room has one window — a single double-hung on the south wall providing good light but limited ventilation options.",
      "Flooring is carpet, likely original or very old, and showing its age — matting, some staining, and compressed padding. Replacement is recommended regardless of other upgrades. The subfloor appears solid based on feel.",
      "The closet is a small reach-in (approximately 2×4 feet) with a bi-fold door that sticks on the upper track. Interior storage is a single shelf and rod. For a guest room this is adequate; if converted to regular use, a closet organizer would maximize the limited space.",
      "The room is on the south side of the house and tends to run warm in summer — consistent with the window orientation and the HVAC system's limitations in balancing temperatures across zones.",
    ],
    healthBar: { label: "Bedroom 3 Condition", current: 65, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "10 × 12 ft (120 sq ft)" },
      { label: "Flooring", value: "Carpet, aging" },
      { label: "Closet", value: "Small reach-in, 2 × 4 ft" },
      { label: "Windows", value: "1 double-hung, south-facing" },
    ],
    tiers: {
      essential: { price: "$800 – $1,500", description: "New carpet, fix bi-fold door, fresh paint, update light fixture." },
      enhanced: { price: "$2,500 – $5,000", description: "LVP flooring, closet organizer, solid-core door, ceiling fan, fresh paint." },
      signature: { price: "$5,000 – $9,000", description: "Premium flooring, custom closet, designer finishes, automated shade, mini-split for temperature control." },
    },
    timing: "Year 4–5",
  },

  "bedroom-4": {
    id: "bedroom-4",
    title: "Bedroom 4",
    group: "interior-bedrooms",
    conditionRating: "Good",
    narrative: [
      "Bedroom 4 is 10×11 feet on the main floor, currently serving as the home office (detailed separately). If converted back to bedroom use, the room meets code requirements for egress (two windows), has a closet, and is properly heated.",
      "The room shares a wall with the family room, and sound transmission is noticeable. If used as a bedroom, sound attenuation measures (insulation in the shared wall, solid-core door) would be worthwhile improvements.",
      "This room offers flexibility — it can credibly serve as a bedroom, office, nursery, or hobby room. Its main-floor location makes it particularly valuable for aging-in-place scenarios or guests with mobility limitations.",
      "The closet is a standard reach-in with bi-fold doors in good operating condition. The room has adequate lighting and outlets for bedroom use.",
    ],
    healthBar: { label: "Bedroom 4 Condition", current: 75, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "10 × 11 ft (110 sq ft)" },
      { label: "Location", value: "Main floor" },
      { label: "Flooring", value: "Red oak hardwood" },
      { label: "Windows", value: "2 double-hung (egress compliant)" },
      { label: "Current Use", value: "Home office" },
    ],
    tiers: {
      essential: { price: "$400 – $800", description: "Fresh paint, refinish floor, update fixtures. Ready for any use." },
      enhanced: { price: "$2,000 – $4,000", description: "Solid-core door, closet organizer, sound dampening on shared wall, updated lighting." },
      signature: { price: "$5,000 – $8,000", description: "Full flex-room conversion: Murphy bed, built-in desk, closet system, soundproofing, premium finishes." },
    },
    timing: "Year 4–5",
  },

  // ────────────────────────────────────────────
  // BATHROOMS
  // ────────────────────────────────────────────
  "primary-bathroom": {
    id: "primary-bathroom",
    title: "Primary Bathroom",
    group: "interior-bathrooms",
    conditionRating: "Fair",
    narrative: [
      "The primary bathroom retains its original 1987 layout with a combination tub/shower, single vanity, and water closet. The space is functional but dated, and several elements are showing their age.",
      "The tile surround in the tub/shower area shows grout deterioration in multiple areas, particularly along the tub ledge and corners. Compromised grout allows moisture penetration behind the tile, leading to substrate damage and mold growth. Immediate re-grouting is recommended.",
      "The vanity and countertop are original cultured marble with surface crazing and staining. The faucet shows mineral buildup and occasional dripping. The toilet is a standard 3.5-gallon model — replacing with a 1.28-gallon unit saves approximately 16,000 gallons annually.",
      "Ventilation is provided by a builder-grade exhaust fan that is audibly struggling and likely not moving its rated CFM. Inadequate bathroom ventilation is a leading cause of mold and moisture damage.",
    ],
    healthBar: { label: "Bathroom Condition", current: 45, total: 100, unit: "%" },
    specs: [
      { label: "Vanity", value: "Original cultured marble, 1987" },
      { label: "Toilet", value: "Standard 3.5 GPF, 1987" },
      { label: "Tub/Shower", value: "Fiberglass with tile surround" },
      { label: "Exhaust Fan", value: "Builder grade, ~50 CFM" },
    ],
    tiers: {
      essential: { price: "$3,500 – $6,000", description: "Re-grout tile, new faucet, new toilet (1.28 GPF), replace exhaust fan, fresh paint." },
      enhanced: { price: "$15,000 – $25,000", description: "New vanity and countertop, retile tub surround, new fixtures, improved lighting, upgraded exhaust fan." },
      signature: { price: "$35,000 – $55,000", description: "Full renovation: walk-in shower, dual vanity, heated floors, custom tile, frameless glass, spa-like design." },
    },
    timing: "Year 3–5",
  },

  "hall-bathroom": {
    id: "hall-bathroom",
    title: "Hall Bathroom",
    group: "interior-bathrooms",
    conditionRating: "Fair",
    narrative: [
      "The hall bathroom serves Bedrooms 2 and 3 and is the primary bathroom for children and guests. It is a standard 5×8-foot full bath with tub/shower combo, single vanity, and toilet.",
      "The floor tile is 1-inch hex mosaic, original to the home and in fair condition. Grout is dark and stained but intact. The tile itself has no cracks or loose pieces — a testament to the quality of 1980s tile installation.",
      "The tub is cast iron with a porcelain finish showing wear marks and minor surface roughness. Re-glazing is an option for 5–7 more years of service; full replacement would be part of a larger renovation. The shower valve is a single-handle unit with inconsistent temperature — the cartridge likely needs replacement.",
      "The medicine cabinet above the vanity is surface-mounted with a mirrored door. It's functional but dated. The vanity is a 24-inch builder-grade unit with a cultured marble top. Storage is minimal.",
    ],
    healthBar: { label: "Hall Bath Condition", current: 50, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "5 × 8 ft (40 sq ft)" },
      { label: "Floor", value: "1\" hex mosaic tile, 1987" },
      { label: "Tub", value: "Cast iron, porcelain finish" },
      { label: "Vanity", value: "24\" builder-grade" },
      { label: "Toilet", value: "Standard 3.5 GPF" },
    ],
    tiers: {
      essential: { price: "$1,500 – $3,000", description: "Replace shower cartridge, re-grout floor, new toilet, replace exhaust fan, fresh paint." },
      enhanced: { price: "$8,000 – $15,000", description: "New vanity, re-glaze tub, retile floor, new fixtures and accessories, updated lighting." },
      signature: { price: "$20,000 – $35,000", description: "Full gut renovation: new tub or walk-in shower, tiled walls and floor, floating vanity, heated floor, premium fixtures." },
    },
    timing: "Year 3–5",
  },

  "powder-room": {
    id: "powder-room",
    title: "Powder Room",
    group: "interior-bathrooms",
    conditionRating: "Good",
    narrative: [
      "The main-floor powder room is a compact half-bath tucked under the staircase. It contains a pedestal sink and toilet in a 4×5-foot space. While small, it's an essential convenience and the bathroom guests use most frequently.",
      "The pedestal sink is a classic white porcelain piece in good condition — no chips or cracks. The faucet is a basic chrome two-handle design that functions properly but looks dated. The toilet is a more recent replacement (likely 2010s) with a 1.6 GPF flush.",
      "Flooring is sheet vinyl in a tile pattern. It shows some curling at the edges where it meets the baseboard and a small tear near the toilet base. The subfloor beneath feels solid. A luxury vinyl tile replacement would be a quick, high-impact upgrade.",
      "The room has a small exhaust fan and a single vanity light. Both function adequately. The wall-mounted mirror is plain glass — a framed mirror would dress the space up considerably.",
    ],
    healthBar: { label: "Powder Room Condition", current: 70, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "4 × 5 ft (20 sq ft)" },
      { label: "Sink", value: "White pedestal" },
      { label: "Toilet", value: "1.6 GPF, ~2010s" },
      { label: "Flooring", value: "Sheet vinyl" },
    ],
    tiers: {
      essential: { price: "$400 – $800", description: "New vinyl flooring, new faucet, framed mirror, fresh paint. Quick facelift." },
      enhanced: { price: "$2,000 – $4,000", description: "LVT flooring, new vanity (replacing pedestal), updated fixtures, accent wallpaper, new lighting." },
      signature: { price: "$5,000 – $8,000", description: "Designer renovation: custom vanity, statement wallcovering, vessel sink, premium fixtures, upgraded everything." },
    },
    timing: "Year 2–3",
  },

  // ────────────────────────────────────────────
  // UTILITY & SERVICE
  // ────────────────────────────────────────────
  "kitchen": {
    id: "kitchen",
    title: "Kitchen",
    group: "interior-utility",
    conditionRating: "Fair",
    narrative: [
      "The kitchen is the heart of your home, and it shows both the love it's received and the years it has served. The layout is functional with a classic work triangle, but the space doesn't reflect the way modern families use their kitchens.",
      "The cabinetry is original 1987 oak with visible wear. Hardware is dated but functional. Countertops are laminate with minor chips along the front edge near the sink.",
      "Appliances are mixed ages: the refrigerator (2019) and dishwasher (2021) are relatively new. The range/oven (2008) is approaching replacement. The microwave (2015) door seal is weakening.",
      "Plumbing under the sink shows minor corrosion at supply line connections. Lighting is limited to a single overhead fluorescent — inadequate for modern tasks.",
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
      essential: { price: "$8,500 – $12,000", description: "Cabinet refacing, new hardware, laminate replacement, updated lighting, fresh paint." },
      enhanced: { price: "$25,000 – $45,000", description: "New cabinetry, quartz countertops, tile backsplash, under-cabinet lighting, new range/oven." },
      signature: { price: "$55,000 – $85,000", description: "Full gut: custom cabinetry, stone countertops, designer backsplash, all new appliances, island addition." },
    },
    timing: "Year 3–5",
    recommendations: [
      "Replace range/oven before major renovation",
      "Address under-sink plumbing corrosion promptly",
      "Consider LED lighting upgrade as standalone project",
    ],
  },

  "laundry-room": {
    id: "laundry-room",
    title: "Laundry Room",
    group: "interior-utility",
    conditionRating: "Good",
    narrative: [
      "The laundry room is located on the main floor adjacent to the kitchen — a convenient and desirable layout. The space is 6×8 feet with a front-loading washer and dryer, utility sink, and overhead cabinetry.",
      "The washer is a Samsung front-loader from 2020, in good condition with no notable issues. The dryer is a matching Samsung unit. The dryer vent runs approximately 12 feet to an exterior wall — within acceptable length. The vent connection at the dryer appears secure, and the exterior flap opens freely.",
      "The utility sink is a molded composite unit with a standard faucet. Drainage is adequate with no signs of slow drain or leaks. The hot and cold supply lines are braided stainless steel (good — rubber hoses should always be replaced with braided steel).",
      "The floor is vinyl tile, clean and in good condition. A floor drain is present in one corner. The walls show no signs of moisture damage. Overall, this is a well-functioning laundry space that requires minimal investment.",
    ],
    healthBar: { label: "Laundry Room Condition", current: 82, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "6 × 8 ft (48 sq ft)" },
      { label: "Washer", value: "Samsung front-load, 2020" },
      { label: "Dryer", value: "Samsung, matching, 2020" },
      { label: "Utility Sink", value: "Composite, functional" },
      { label: "Vent Length", value: "~12 ft to exterior" },
    ],
    tiers: {
      essential: { price: "$200 – $500", description: "Clean dryer vent, inspect hoses, add shelf/organization. Maintenance only." },
      enhanced: { price: "$2,000 – $4,000", description: "New LVT flooring, updated cabinetry, countertop over appliances, improved lighting, pull-out hamper." },
      signature: { price: "$6,000 – $10,000", description: "Full laundry renovation: custom cabinetry, quartz counter, new flooring, pull-out ironing board, pendant lighting." },
    },
    timing: "Year 4–5",
  },

  "mudroom-entry": {
    id: "mudroom-entry",
    title: "Mudroom & Entry",
    group: "interior-utility",
    conditionRating: "Good",
    narrative: [
      "The front entry foyer is 6×8 feet with the original ceramic tile floor and a coat closet. The tile is in good condition with intact grout. The front door threshold shows minor wear. The closet has a single rod and shelf.",
      "There is no formal mudroom — the side entry from the garage leads directly into the kitchen area. A mudroom zone with hooks, bench, and storage would be a significant quality-of-life improvement for this floor plan.",
      "The entry ceiling has a flush-mount light that provides adequate but uninspiring illumination. A pendant or semi-flush fixture would make a stronger first impression. The stair railing at the entry is solid oak, matching the original millwork throughout the home.",
      "The side entry from the garage could be converted into a functional mudroom within the existing footprint by adding built-in bench seating, hooks, and cubbies along the 6-foot wall between the garage door and the kitchen.",
    ],
    healthBar: { label: "Entry Condition", current: 72, total: 100, unit: "%" },
    specs: [
      { label: "Foyer Size", value: "6 × 8 ft (48 sq ft)" },
      { label: "Foyer Floor", value: "Ceramic tile, original" },
      { label: "Coat Closet", value: "Standard reach-in" },
      { label: "Side Entry", value: "Direct to kitchen (no mudroom)" },
    ],
    tiers: {
      essential: { price: "$300 – $600", description: "New entry light fixture, closet organization, fresh paint. Simple refresh." },
      enhanced: { price: "$3,000 – $6,000", description: "Built-in mudroom zone at side entry: bench, hooks, cubbies, LVT flooring, updated lighting." },
      signature: { price: "$8,000 – $14,000", description: "Custom mudroom buildout with locker-style storage, heated tile floor, boot dryer, wainscoting, designer lighting." },
    },
    timing: "Year 2–3",
  },

  "pantry-storage": {
    id: "pantry-storage",
    title: "Pantry & Storage",
    group: "interior-utility",
    conditionRating: "Good",
    narrative: [
      "The kitchen pantry is a reach-in closet with five fixed wire shelves. It's functional but not optimized — shelf spacing doesn't accommodate taller items, and the wire shelves allow small items to fall through and create instability.",
      "The home has adequate general storage with closets in each bedroom, a coat closet at the entry, a linen closet in the upstairs hallway, and significant unfinished basement storage space. The basement storage area is dry with no signs of moisture issues.",
      "The linen closet (2×3 feet) has three fixed shelves and is well-organized. The hallway location is convenient for serving the upstairs bedrooms and bathrooms.",
      "A pull-out pantry system or custom shelving would dramatically improve the kitchen pantry's capacity and usability — a relatively small investment with daily quality-of-life impact.",
    ],
    healthBar: { label: "Storage Adequacy", current: 68, total: 100, unit: "%" },
    specs: [
      { label: "Kitchen Pantry", value: "Reach-in, 5 wire shelves" },
      { label: "Linen Closet", value: "2 × 3 ft, 3 shelves" },
      { label: "Basement Storage", value: "Open area, dry" },
      { label: "Bedroom Closets", value: "4 standard reach-in" },
    ],
    tiers: {
      essential: { price: "$300 – $600", description: "Add pull-out pantry shelves, upgrade wire to solid shelving, add lighting." },
      enhanced: { price: "$2,000 – $4,000", description: "Custom pantry shelving system, closet organizers in all bedrooms, linen closet upgrade." },
      signature: { price: "$5,000 – $8,000", description: "Full storage optimization: walk-in pantry conversion, custom closet systems throughout, integrated lighting." },
    },
    timing: "Year 3–5",
  },

  "stairways-hallways": {
    id: "stairways-hallways",
    title: "Stairways & Hallways",
    group: "interior-utility",
    conditionRating: "Good",
    narrative: [
      "The main staircase connects the entry foyer to the second-floor hallway. The oak railing and balusters are original, well-crafted, and in good condition. The railing feels solid with no movement. One baluster near the top of the stairs has a slight wobble and should be re-secured.",
      "The stair treads are carpeted over the original hardwood. The carpet shows wear on the nose of each tread — the area of highest impact. The carpet runner is held in place by rods at the base of each riser. Removing the carpet would reveal oak treads that could be refinished to match the main-floor hardwood.",
      "The upstairs hallway is 3.5 feet wide and approximately 18 feet long, connecting all bedrooms and the hall bathroom. Flooring is the same carpet as the bedrooms. Lighting is a single ceiling fixture at center — dark at the ends.",
      "The basement stairs are more utilitarian — open-riser pine construction with a simple handrail. They're structurally sound but the open risers are a safety concern if small children are present. Adding riser boards is a simple safety improvement.",
    ],
    healthBar: { label: "Stairway Condition", current: 74, total: 100, unit: "%" },
    specs: [
      { label: "Main Staircase", value: "Oak railing, carpeted treads" },
      { label: "Hallway Width", value: "3.5 ft" },
      { label: "Hallway Length", value: "~18 ft" },
      { label: "Basement Stairs", value: "Pine, open riser" },
    ],
    tiers: {
      essential: { price: "$500 – $1,000", description: "Secure loose baluster, add riser boards to basement stairs, update hallway lighting." },
      enhanced: { price: "$3,000 – $6,000", description: "Remove carpet from stairs, refinish oak treads, new hallway lighting, fresh paint throughout." },
      signature: { price: "$8,000 – $14,000", description: "Full staircase renovation: refinished oak, iron balusters, stair runner, gallery lighting, wainscoting in hallway." },
    },
    timing: "Year 3–5",
  },

  // ────────────────────────────────────────────
  // UNFINISHED SPACES
  // ────────────────────────────────────────────
  "basement": {
    id: "basement",
    title: "Basement",
    group: "interior-unfinished",
    conditionRating: "Good",
    narrative: [
      "The basement is a full, unfinished space of approximately 1,100 square feet — the same footprint as the main floor. The concrete floor is in good condition with no significant cracks beyond typical control-joint cracking. No active moisture, efflorescence, or water staining was observed.",
      "The foundation walls are poured concrete, 8 inches thick. No horizontal or stair-step cracking was observed. Two minor vertical hairline cracks were noted on the east wall — these are typical shrinkage cracks and not structural concerns. They have been stable (per the homeowner) for over a decade.",
      "The space currently houses the furnace, water heater, electrical panel, and laundry area, with the remainder used for storage. Ceiling height is 7 feet 8 inches — adequate for finishing if desired. A sump pit is present in the northwest corner but no pump is installed; the homeowner reports no water issues.",
      "This space represents significant potential: a finished basement could add 800+ square feet of livable area to the home. The mechanicals would need to be consolidated, and egress windows added for any bedroom use. A bathroom rough-in would be valuable but requires breaking concrete.",
    ],
    healthBar: { label: "Basement Condition", current: 78, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "~1,100 sq ft (unfinished)" },
      { label: "Ceiling Height", value: "7 ft 8 in" },
      { label: "Walls", value: "8\" poured concrete" },
      { label: "Floor", value: "Concrete slab, good condition" },
      { label: "Sump", value: "Pit present, no pump" },
      { label: "Moisture", value: "No active issues observed" },
    ],
    tiers: {
      essential: { price: "$500 – $1,500", description: "Seal floor cracks, dehumidifier, improved lighting, organize storage area. Maintenance-only approach." },
      enhanced: { price: "$20,000 – $35,000", description: "Partial finish: rec room area with LVP, drywall, drop ceiling, lighting, egress window. Leave mechanical area open." },
      signature: { price: "$50,000 – $80,000", description: "Full finish: rec room, bedroom, full bathroom, wet bar, home theater area, storage room, premium finishes throughout." },
    },
    timing: "Year 3–5 (if pursuing finish)",
  },

  "attic": {
    id: "attic",
    title: "Attic",
    group: "interior-unfinished",
    conditionRating: "Good",
    narrative: [
      "The attic is accessed via a pull-down ladder in the upstairs hallway ceiling. The space is unfinished with exposed roof trusses, plywood walkway over insulation, and a single light bulb at the access point.",
      "Insulation is blown-in fiberglass at approximately R-30 depth over the ceiling joists. This meets 1987 code but falls below current R-49 recommendations for this climate zone. Adding insulation is one of the most cost-effective energy improvements available.",
      "Ventilation consists of continuous soffit vents and a ridge vent. The system appears to be functioning — attic temperature was within acceptable range during inspection and no moisture condensation was observed on the underside of the roof sheathing.",
      "No signs of pest activity, water intrusion, or rot were observed. The roof sheathing is plywood in good condition (consistent with the Roof System findings). Electrical wiring in the attic is NM-B (Romex) properly stapled to framing — no knob-and-tube or other legacy wiring.",
    ],
    healthBar: { label: "Attic Condition", current: 76, total: 100, unit: "%" },
    specs: [
      { label: "Access", value: "Pull-down ladder, hallway" },
      { label: "Insulation", value: "Blown fiberglass, ~R-30" },
      { label: "Target Insulation", value: "R-49 (current code)" },
      { label: "Ventilation", value: "Soffit + ridge vent" },
      { label: "Sheathing", value: "Plywood, good condition" },
    ],
    tiers: {
      essential: { price: "$1,200 – $2,000", description: "Blow in additional insulation to R-49, seal air leaks at penetrations, add walkway lighting." },
      enhanced: { price: "$3,000 – $5,000", description: "Insulation upgrade, comprehensive air sealing, solar attic fan, improved walkway, weatherization." },
      signature: { price: "$8,000 – $15,000", description: "Spray foam insulation, radiant barrier, powered ventilation, storage flooring system, pull-down stair upgrade." },
    },
    timing: "Year 1–2 (insulation upgrade high ROI)",
    recommendations: [
      "Adding attic insulation has the fastest payback of any energy improvement",
      "Air sealing before insulating dramatically improves effectiveness",
      "Consider during roof replacement for access efficiency",
    ],
  },

  "garage": {
    id: "garage",
    title: "Garage",
    group: "interior-unfinished",
    conditionRating: "Good",
    narrative: [
      "The attached two-car garage is 20×22 feet with a 16-foot double garage door and a 3-foot man door on the side. The concrete floor is in good condition with typical surface wear and one control-joint crack. No heaving or significant settling.",
      "The garage door is a 2014 insulated steel unit with an automatic opener (Chamberlain, belt-drive). Both function well. The safety auto-reverse mechanism tested properly. The door seals are in good condition with no visible daylight gaps at bottom or sides.",
      "The ceiling and walls are unfinished — exposed studs and roof trusses. The shared wall with the house is drywalled and fire-taped (code requirement). Insulating and finishing the garage walls and ceiling would improve temperature regulation and appear more finished.",
      "Electrical service includes two 20-amp circuits serving four duplex outlets and one overhead fluorescent fixture. This is adequate for standard garage use but insufficient for a workshop setup. No 240V outlet is present — needed for EV charging or heavy equipment.",
    ],
    healthBar: { label: "Garage Condition", current: 74, total: 100, unit: "%" },
    specs: [
      { label: "Size", value: "20 × 22 ft (440 sq ft)" },
      { label: "Door", value: "16 ft insulated steel, 2014" },
      { label: "Opener", value: "Chamberlain belt-drive, 2014" },
      { label: "Electrical", value: "2 × 20A circuits, no 240V" },
      { label: "Walls/Ceiling", value: "Unfinished (shared wall fire-taped)" },
    ],
    tiers: {
      essential: { price: "$300 – $800", description: "Floor sealer, organize storage, add task lighting. Basic functional improvements." },
      enhanced: { price: "$3,000 – $6,000", description: "Insulate walls and ceiling, drywall finish, epoxy floor coating, additional circuits, 240V outlet for EV prep." },
      signature: { price: "$10,000 – $18,000", description: "Full finish: insulation, drywall, epoxy floor, cabinet storage system, workbench, EV charger installed, premium lighting." },
    },
    timing: "Year 2–4",
    recommendations: [
      "Add 240V outlet for future EV charging — do during electrical panel upgrade",
      "Insulate garage walls if bonus room above has comfort issues",
      "Epoxy floor coating protects concrete and looks great",
    ],
  },

  // ────────────────────────────────────────────
  // HVAC SYSTEMS
  // ────────────────────────────────────────────
  "primary-furnace": {
    id: "primary-furnace",
    title: "Primary Furnace",
    group: "systems-hvac",
    conditionRating: "Poor",
    narrative: [
      "The primary furnace is the original 1987 unit — a Carrier 58SX gas furnace that has provided 39 years of service, well beyond the typical 15–20 year lifespan. While it continues to operate, it is running on borrowed time.",
      "The unit's AFUE rating is approximately 80%, meaning 20 cents of every heating dollar is lost. Modern high-efficiency furnaces achieve 95–98% AFUE, representing significant energy savings.",
      "The heat exchanger was visually inspected and no cracks were observed, but at this age, annual inspection is critical — a cracked heat exchanger poses carbon monoxide risks. The blower motor runs louder than normal, suggesting bearing wear.",
      "This is the highest priority replacement in your home. Failure during winter is not just an inconvenience — it's an emergency. Proactive replacement allows you to choose the right system and avoid emergency pricing.",
    ],
    healthBar: { label: "Furnace Lifespan", current: 39, total: 20, unit: "years" },
    specs: [
      { label: "Manufacturer", value: "Carrier" },
      { label: "Model", value: "58SX080" },
      { label: "Serial", value: "1687A23456" },
      { label: "Installed", value: "1987" },
      { label: "AFUE Rating", value: "~80%" },
      { label: "BTU Output", value: "80,000" },
      { label: "Expected Life", value: "15–20 years" },
    ],
    tiers: {
      essential: { price: "$4,500 – $6,500", description: "Standard efficiency (80% AFUE) gas furnace replacement, proper sizing, code-compliant installation." },
      enhanced: { price: "$7,000 – $10,000", description: "High-efficiency (95%+ AFUE), variable-speed blower, smart thermostat, extended warranty." },
      signature: { price: "$12,000 – $18,000", description: "Premium modulating furnace (98% AFUE), zoned heating, whole-home air quality system, smart controls." },
    },
    timing: "Immediate — Before Next Heating Season",
    recommendations: [
      "Schedule replacement before September for best pricing",
      "Combine with AC evaluation for system matching",
      "Consider ductwork inspection during installation",
    ],
  },

  "air-conditioning": {
    id: "air-conditioning",
    title: "Air Conditioning",
    group: "systems-hvac",
    conditionRating: "Fair",
    narrative: [
      "The central air conditioning is served by a Lennox split-system condenser unit installed in 2010, paired with the existing furnace's evaporator coil and blower. The condenser unit is 16 years old — approaching the end of its typical 15–20 year lifespan but still performing adequately.",
      "The condenser unit is a 3-ton, 13 SEER unit. While it was efficient for 2010 installation standards, current minimum efficiency is 15 SEER, and high-efficiency units reach 20+ SEER. An upgrade would reduce cooling costs by 15–35%.",
      "The refrigerant is R-410A, which is the current standard (not the old R-22 that is being phased out). This is positive — any replacement will use the same refrigerant platform. The line set from condenser to evaporator is in good condition.",
      "When the furnace is replaced, the AC system should be evaluated as a matched set. Mismatched furnace/AC components reduce efficiency and can cause premature failures. Replacing both simultaneously is more cost-effective than two separate projects.",
    ],
    healthBar: { label: "AC System Lifespan", current: 16, total: 18, unit: "years" },
    specs: [
      { label: "Manufacturer", value: "Lennox" },
      { label: "Type", value: "Split-system condenser" },
      { label: "Installed", value: "2010" },
      { label: "Capacity", value: "3 ton" },
      { label: "SEER Rating", value: "13" },
      { label: "Refrigerant", value: "R-410A" },
    ],
    tiers: {
      essential: { price: "$3,500 – $5,500", description: "Continue using current unit. Professional tune-up, refrigerant check, coil cleaning. Extend life 2–3 years." },
      enhanced: { price: "$6,000 – $9,000", description: "New 16 SEER condenser matched to new furnace, new evaporator coil, programmable thermostat." },
      signature: { price: "$10,000 – $16,000", description: "Premium 20+ SEER variable-speed system, matched to new furnace, smart thermostat, zoned cooling, UV air purifier." },
    },
    timing: "Year 1 — coordinate with furnace replacement",
    recommendations: [
      "Replace condenser when furnace is replaced for matched system",
      "Current unit can continue if budget requires phasing — but efficiency suffers",
      "Consider heat pump option for both heating and cooling",
    ],
  },

  "insulation-ventilation": {
    id: "insulation-ventilation",
    title: "Insulation & Ventilation",
    group: "systems-hvac",
    conditionRating: "Fair",
    narrative: [
      "The home's thermal envelope is a mix of original 1987 insulation and incremental improvements. Attic insulation is blown fiberglass at R-30 (below current R-49 recommendation). Wall insulation is fiberglass batts at R-11 to R-13 (below current R-20 standard for this climate zone).",
      "Air sealing is the most critical and cost-effective improvement. Common leakage points were identified: recessed lights (IC-rated but not air-sealed), electrical outlets on exterior walls, plumbing and wiring penetrations through the top plates, and the attic hatch itself.",
      "The basement rim joist area — where the wood frame sits on the foundation — is uninsulated. This is one of the largest sources of heat loss in homes of this era and one of the easiest to address with spray foam application.",
      "Bathroom ventilation exhausts to the exterior through properly installed ductwork. The kitchen range hood exhausts through the wall above the range. The dryer vent is properly routed to the exterior. No exhaust systems were found terminating in the attic — a common and problematic deficiency.",
    ],
    healthBar: { label: "Envelope Performance", current: 55, total: 100, unit: "%" },
    specs: [
      { label: "Attic Insulation", value: "R-30 (target: R-49)" },
      { label: "Wall Insulation", value: "R-11 to R-13 (target: R-20)" },
      { label: "Rim Joist", value: "Uninsulated" },
      { label: "Air Sealing", value: "Minimal — multiple leak points" },
      { label: "Bath Exhaust", value: "To exterior (proper)" },
    ],
    tiers: {
      essential: { price: "$2,000 – $3,500", description: "Attic insulation to R-49, air seal top plates and penetrations, insulate rim joists with spray foam." },
      enhanced: { price: "$5,000 – $9,000", description: "All essential items plus dense-pack cellulose in walls, seal recessed lights, insulate attic hatch, energy audit." },
      signature: { price: "$12,000 – $20,000", description: "Comprehensive envelope upgrade: spray foam throughout, wall insulation, new attic insulation, blower door testing, thermal imaging verification." },
    },
    timing: "Year 1 — highest ROI energy improvement",
    recommendations: [
      "Start with attic air sealing + insulation — fastest payback",
      "Insulate rim joists with spray foam — easy, high-impact",
      "Schedule before new HVAC — properly insulated home may need smaller equipment",
    ],
  },

  // ────────────────────────────────────────────
  // MECHANICAL & SAFETY
  // ────────────────────────────────────────────
  "electrical-panel": {
    id: "electrical-panel",
    title: "Electrical Panel",
    group: "systems-mechanical",
    conditionRating: "Fair",
    narrative: [
      "The main electrical panel is the original 1987 installation — a 150-amp Square D QO series panel. While the QO series is quality, the panel's age and capacity present safety and practical concerns.",
      "At 150 amps, this panel was adequate for 1987 but is undersized for modern usage. Any significant renovation will require a panel upgrade to 200 amps.",
      "The panel is full — all breaker slots are occupied with no room for additional circuits. Several breakers show signs of frequent tripping, suggesting overloading.",
      "No AFCI or GFCI breakers are present. Modern code requires AFCI protection in most living spaces — a significant safety upgrade that protects against electrical fires.",
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
      essential: { price: "$2,500 – $4,000", description: "Panel inspection, breaker replacements, add GFCI to kitchen/bath/exterior. Maintains 150A service." },
      enhanced: { price: "$5,000 – $8,000", description: "200-amp upgrade, AFCI/GFCI breakers, surge protection, proper labeling, grounding inspection." },
      signature: { price: "$10,000 – $15,000", description: "200-amp service upgrade, smart panel with monitoring, whole-home surge protection, sub-panel, EV charger prep." },
    },
    timing: "Year 1 — Before Major Renovations",
    recommendations: [
      "Upgrade before kitchen or HVAC projects",
      "Add whole-home surge protection regardless",
      "Consider EV charger circuit for future-proofing",
    ],
  },

  "plumbing-system": {
    id: "plumbing-system",
    title: "Plumbing System",
    group: "systems-mechanical",
    conditionRating: "Fair",
    narrative: [
      "The home's plumbing supply is copper throughout — original 1987 installation. Copper is an excellent material with a 50+ year lifespan, and the supply piping is performing well. No pinhole leaks, greenish corrosion deposits, or pressure issues were observed.",
      "Drain, waste, and vent (DWV) piping is a mix of cast iron (main stack and horizontal basement runs) and PVC (branch drains added during renovations). The cast iron is 39 years old — within its 50–75 year lifespan but approaching the age where interior scaling and corrosion can cause slow drains.",
      "Water pressure tested at 58 PSI at the kitchen faucet — within the acceptable 40–80 PSI range. No pressure-reducing valve (PRV) is installed; if municipal pressure increases above 80 PSI, one should be added to prevent fixture damage.",
      "The main shutoff valve is a gate valve in the basement near the meter. It turns but is stiff — a common issue with gate valves of this age. Recommend exercising annually to prevent seizing. If it fails to shut off completely, replacement with a modern ball valve is advisable.",
    ],
    healthBar: { label: "Plumbing System", current: 65, total: 100, unit: "%" },
    specs: [
      { label: "Supply", value: "Copper, 1987" },
      { label: "DWV", value: "Cast iron (main) + PVC (branches)" },
      { label: "Water Pressure", value: "58 PSI" },
      { label: "Main Shutoff", value: "Gate valve (stiff)" },
      { label: "Sewer Line", value: "Unknown material, to municipal" },
    ],
    tiers: {
      essential: { price: "$500 – $1,200", description: "Exercise/replace main shutoff, inspect cast iron with camera, replace corroded fixture connections." },
      enhanced: { price: "$3,000 – $6,000", description: "Replace main shutoff with ball valve, camera-inspect sewer line, replace problematic cast iron sections, add PRV." },
      signature: { price: "$10,000 – $20,000", description: "Full repipe with PEX, new main shutoff, sewer line replacement if needed, whole-home water filtration system." },
    },
    timing: "Year 1–2 (maintenance items), Year 3–5 (major upgrades)",
    recommendations: [
      "Camera inspect sewer line — know what you're working with before it fails",
      "Replace main shutoff valve — critical in an emergency",
      "Monitor cast iron drain performance for slow drain development",
    ],
  },

  "water-heater": {
    id: "water-heater",
    title: "Water Heater",
    group: "systems-mechanical",
    conditionRating: "Fair",
    narrative: [
      "The water heater is a 50-gallon Rheem gas unit installed in 2014. At 12 years old, it is within its expected 8–12 year lifespan but approaching the end. The unit is performing adequately — hot water delivery to fixtures is consistent and recovery time appears normal.",
      "The T&P (temperature and pressure) relief valve has a discharge pipe properly routed to within 6 inches of the floor — a safety requirement. The valve appears original to the unit and has not been tested recently. Annual testing is recommended.",
      "The anode rod — the sacrificial component that prevents tank corrosion — has likely never been inspected or replaced. On a 12-year-old tank, the anode rod is probably depleted. Without anode protection, tank corrosion accelerates significantly.",
      "The gas connection and venting are properly installed. The single-wall vent connector rises vertically before entering the chimney flue — proper draft configuration. No signs of backdrafting (melted plastic, soot) at the draft hood.",
    ],
    healthBar: { label: "Water Heater Lifespan", current: 12, total: 12, unit: "years" },
    specs: [
      { label: "Manufacturer", value: "Rheem" },
      { label: "Type", value: "Gas, tank (50 gal)" },
      { label: "Installed", value: "2014" },
      { label: "Expected Life", value: "8–12 years" },
      { label: "Energy Factor", value: "0.62" },
      { label: "BTU Input", value: "40,000" },
    ],
    tiers: {
      essential: { price: "$1,200 – $2,000", description: "Replace with standard 50-gallon gas tank water heater. Direct replacement, same location, same venting." },
      enhanced: { price: "$2,500 – $4,000", description: "High-efficiency power-vent or direct-vent tank water heater. Better energy factor, flexible venting, longer warranty." },
      signature: { price: "$4,500 – $7,000", description: "Tankless gas water heater (Rinnai/Navien). Unlimited hot water, 20-year lifespan, 30%+ energy savings, space recovery." },
    },
    timing: "Year 1 — end of expected lifespan",
    recommendations: [
      "Plan replacement proactively — water heater failure causes water damage",
      "Consider tankless if furnace is also being replaced (shared venting opportunity)",
      "If keeping tank, replace anode rod now to extend remaining life",
    ],
  },

  "fireplace-chimney": {
    id: "fireplace-chimney",
    title: "Fireplace & Chimney",
    group: "systems-mechanical",
    conditionRating: "Fair",
    narrative: [
      "The home has a single wood-burning fireplace in the family room with a masonry chimney extending through the roof. The firebox is lined with firebrick that shows normal wear — some surface spalling but no deep cracks or missing bricks.",
      "The chimney exterior shows tuckpointing needs in the upper 4 feet where mortar joints have weathered. The chimney cap is a basic concrete wash with no spark arrestor or rain cap. A proper stainless steel cap with mesh screen is recommended for weather protection and fire safety.",
      "The damper operates but is stiff and does not seal tightly when closed. When the fireplace is not in use, an open or poorly sealing damper allows conditioned air to escape — essentially an open window in your living room. A top-sealing damper would address this.",
      "Heavy creosote buildup was observed on the smoke shelf and flue walls. A Level 2 chimney inspection and professional cleaning are needed before the next use. Creosote buildup is the leading cause of chimney fires.",
    ],
    healthBar: { label: "Chimney Condition", current: 55, total: 100, unit: "%" },
    specs: [
      { label: "Type", value: "Masonry, wood-burning" },
      { label: "Chimney", value: "Brick, clay flue liner" },
      { label: "Cap", value: "Concrete wash (no rain cap)" },
      { label: "Damper", value: "Throat-mount (stiff, leaks)" },
      { label: "Last Cleaned", value: "Unknown" },
    ],
    tiers: {
      essential: { price: "$500 – $1,000", description: "Level 2 inspection, professional cleaning, install stainless steel cap. Safety-critical maintenance." },
      enhanced: { price: "$2,000 – $4,000", description: "All essential items plus tuckpointing, top-sealing damper, new firebox firebrick, hearth pad refresh." },
      signature: { price: "$5,000 – $9,000", description: "Gas fireplace insert conversion: eliminates creosote risk, improves efficiency, thermostat control, no wood storage needed." },
    },
    timing: "Year 1 — before next use",
    recommendations: [
      "Do not use fireplace until inspected and cleaned — fire risk",
      "Gas insert conversion eliminates ongoing maintenance and creosote risk",
      "Tuckpointing prevents water intrusion and chimney deterioration",
    ],
  },

  "foundation": {
    id: "foundation",
    title: "Foundation",
    group: "systems-mechanical",
    conditionRating: "Good",
    narrative: [
      "The foundation is poured concrete, 8 inches thick, with a full basement. This is the preferred foundation type for this region and era of construction. Overall, the foundation is in good condition and shows no signs of significant structural distress.",
      "Two vertical hairline cracks were noted on the east wall. Vertical cracks in poured concrete foundations are typically shrinkage cracks from the original curing process — they are not structural concerns. These cracks have been stable for over a decade per the homeowner and show no signs of moisture intrusion.",
      "No horizontal cracking, inward bowing, or stair-step cracking patterns were observed — these would indicate structural loading concerns. The floor-to-wall joint is dry with no efflorescence (white mineral deposits that indicate moisture movement).",
      "The foundation drain (exterior weeping tile) is assumed to be original 1987 perforated pipe. While not directly inspectable, the absence of basement water issues suggests it is functioning. The grading and drainage improvements noted in the Landscaping section will further protect the foundation long-term.",
    ],
    healthBar: { label: "Foundation Integrity", current: 88, total: 100, unit: "%" },
    specs: [
      { label: "Type", value: "Poured concrete, full basement" },
      { label: "Thickness", value: "8 inches" },
      { label: "Cracks", value: "2 vertical hairline (stable)" },
      { label: "Moisture", value: "No active issues" },
      { label: "Drain", value: "Perforated pipe, 1987 (assumed)" },
    ],
    tiers: {
      essential: { price: "$300 – $800", description: "Seal hairline cracks with hydraulic cement or epoxy injection. Preventive maintenance." },
      enhanced: { price: "$2,000 – $4,000", description: "Crack injection, interior waterproof coating on walls, install sump pump in existing pit, dehumidifier." },
      signature: { price: "$8,000 – $15,000", description: "Exterior waterproofing membrane, new drain tile, sump pump system, interior drainage channels, full moisture management." },
    },
    timing: "Year 2–3 (monitoring, address if needed)",
    recommendations: [
      "Monitor existing cracks annually — mark ends with pencil and date",
      "Address exterior drainage before interior waterproofing (cause vs. symptom)",
      "Install sump pump in existing pit as preventive measure",
    ],
  },

  // ────────────────────────────────────────────
  // STRATEGY
  // ────────────────────────────────────────────
  "financial-roadmap": {
    id: "financial-roadmap",
    title: "Financial Roadmap",
    group: "strategy",
    narrative: [
      "This financial roadmap sequences your recommended improvements over a 5-year horizon, organized by priority and construction logic. The goal is not to do everything at once — it's to invest strategically in the right order.",
      "Year 1 focuses on life-safety and infrastructure: furnace replacement, electrical panel upgrade, AC coordination, water heater, chimney cleaning, and insulation. These are foundational — they must happen before cosmetic renovations.",
      "Years 2–3 address the building envelope: roof replacement, window upgrades, siding maintenance, exterior doors, gutters, and deck work. These protect every other investment you'll make.",
      "Years 3–5 are quality-of-life improvements: kitchen renovation, bathroom updates, bedroom refreshes, basement finishing, and landscape enhancements. By this point, your systems are modern and reliable.",
    ],
    recommendations: [
      "Year 1: Furnace + AC + Electrical + Water Heater + Insulation = $22,000–$38,000",
      "Year 1: Chimney + Gutters + Drainage = $3,000–$6,000",
      "Year 2–3: Roof + Windows + Siding + Doors + Deck = $40,000–$70,000",
      "Year 3–5: Kitchen + Bathrooms + Bedrooms + Basement = $55,000–$120,000",
      "5-Year Total (Enhanced tier): $120,000–$234,000",
    ],
  },

  "action-plan": {
    id: "action-plan",
    title: "Action Plan",
    group: "strategy",
    narrative: [
      "This action plan translates your Home Clarity Report findings into concrete next steps — the bridge between 'here's what we found' and 'here's what to do about it.'",
      "Step 1: Review this report with your family. Discuss priorities, timeline preferences, and budget comfort levels. The Essential, Enhanced, and Signature tiers give you flexibility to choose what fits.",
      "Step 2: Schedule a strategic planning session with your advisor. We'll walk through the sequencing, discuss contractor options, and create a timeline that works with your family's schedule and budget.",
      "Step 3: Begin with the furnace and chimney. The furnace has a hard deadline (before next heating season) and the chimney must be cleaned before use. These are your immediate action items.",
      "Step 4: While HVAC work is underway, schedule the electrical panel evaluation. These projects can be coordinated for efficiency. Your HBC membership means you're never navigating this alone.",
    ],
    recommendations: [
      "This week: Review report with family, note questions",
      "Within 2 weeks: Schedule planning session with advisor",
      "Within 30 days: Get furnace replacement bids (we'll help)",
      "Within 30 days: Schedule chimney inspection and cleaning",
      "Within 60 days: Schedule electrical panel evaluation",
      "Ongoing: Use this portal to track progress and ask questions",
    ],
  },
};
