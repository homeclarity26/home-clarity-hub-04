// Home A — The Alderwood Estate
// 1912 restored Colonial, 3,800 sf, Hudson OH
// Family heirloom needing system modernization. Beautiful bones,
// deferred maintenance catching up, multiple high-ticket vision projects.

// Approved 2026-04-23 — see workspace/alderwood_image_page_map.md.
// Served from /public/demo/alderwood/ as /demo/alderwood/<file>.
const IMG_BASE = "/demo/alderwood";
const ALDERWOOD_IMG = {
  exterior_front:       `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_47_16-AM.jpg`, // cover / hero
  roof_slate:           `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_50_55-AM.jpg`,
  siding_trim:          `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_54_18-AM.jpg`,
  kitchen:              `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_55_19-AM.jpg`,
  primary_suite:        `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_57_22-AM.jpg`,
  exterior_detail:      `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-07_58_28-AM.jpg`,
  mechanical_room:      `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-08_00_44-AM.jpg`, // HVAC / plumbing fallback
  electrical_attic:     `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-08_02_07-AM.jpg`,
  basement_foundation:  `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-08_04_11-AM.jpg`,
  exterior_golden_hour: `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-08_04_54-AM.jpg`, // alt hero / roadmap fallback
  interior_transition:  `${IMG_BASE}/ChatGPT-Image-Apr-23-2026-08_08_08-AM.jpg`, // windows / safety fallback
};

export const ALDERWOOD = {
  slug: "alderwood",
  email: "demo.alderwood@homeclarityhub.test",
  clientName: "Whitaker Family",
  clientFullName: "Margaret & Thomas Whitaker",
  property: {
    // [DEMO] prefix + metadata.demo:true flags this as non-real so Adam can
    // filter it out of dashboards / email blasts later if he wants.
    property_name: "[DEMO] Alderwood Estate — Whitaker",
    address: "2847 Stow Road",
    city: "Hudson",
    state: "OH",
    zip: "44236",
    county: "Summit",
    property_type: "single_family",
    estimated_value: 1050000,
    metadata: { demo: true, year_built: 1912, sqft: 3800, bedrooms: 5, bathrooms: 3.5, lot_acres: 1.4 },
  },

  reportTitle: "Home Clarity Report — Alderwood Estate",

  pages: [
    // ─── 1. Executive Summary ──────────────────────────────────────
    {
      page_key: "executive-summary",
      title: "Executive Summary",
      group_name: "information",
      condition_rating: "Fair",
      sort_order: 0,
      narrative: [
        "The Alderwood Estate is a significant 1912 Center-Hall Colonial on 1.4 acres in Hudson's historic north corridor. The home carries tremendous architectural integrity — original quartersawn oak flooring, fully plastered walls with intact crown and base profiles, and a slate roof that has outlived two generations of its occupants.",
        "That integrity has come at the cost of systems that are now materially behind the curve. The 1985 Carrier boiler is at the end of its service life, electrical includes remnants of knob-and-tube in the third-floor attic, and the kitchen has not been meaningfully updated since 1995. None of these are emergencies, but together they represent roughly $285k–$430k of work across the next 24 months if the Whitakers wish to bring the home to current performance standards.",
        "Where the home excels: foundation (poured stone, dry and sound), slate roof (easily 15+ more years with attention to flashings), window stock on the main levels (recent Marvin Ultimate replacements), and the 2018 primary bath renovation. Preserve what works, modernize what doesn't. That's the operating principle for this report.",
        "Our Priority-1 items for the next 12 months: HVAC replacement, partial knob-and-tube remediation in the attic, and kitchen program definition (so design can begin Q3 2026). Everything else has runway.",
      ],
      health_bar: { label: "Overall Home Health", current: 62, total: 100, unit: "%" },
      specs: [
        { label: "Home Style", value: "Center-Hall Colonial" },
        { label: "Year Built", value: "1912" },
        { label: "Finished Sq Ft", value: "3,800" },
        { label: "Lot Size", value: "1.4 acres" },
        { label: "Bedrooms / Baths", value: "5 / 3.5" },
        { label: "Previous Major Renovation", value: "2018 Primary Suite" },
      ],
      timing: "Strategic roadmap spans 2026–2029",
      recommendations: [
        "Lock in HVAC replacement by late Q2 2026 before the heating season",
        "Define kitchen program scope this year — specification alone takes 60–90 days",
        "Budget $35k in 2026 for discretionary preservation (slate re-pointing, storm windows)",
      ],
      images: [ALDERWOOD_IMG.exterior_front, ALDERWOOD_IMG.exterior_golden_hour, ALDERWOOD_IMG.exterior_detail],
    },

    // ─── 2. Roof System ────────────────────────────────────────────
    {
      page_key: "roof-system",
      title: "Roof System",
      group_name: "exterior",
      condition_rating: "Fair",
      sort_order: 1,
      narrative: [
        "The roof is original 1912 Vermont Buckingham slate on the main block with terneplate-tin flashing at the eaves and chimneys. The slate itself is in excellent shape — Buckingham is a 150+ year material — but the supporting infrastructure has aged. Six or seven tiles have slipped or cracked over the last decade and been replaced with mismatched substitutes.",
        "The flashings around both chimneys are showing pinhole corrosion consistent with 30+ year-old terneplate. These are not yet leaking but will be within the next 3 years if not replaced. Ice-and-water shield is absent (not code in 1912) — this is a moderate concern at the porch roof where winter ice dams have caused ceiling staining in the 2nd floor hall on two occasions.",
        "The carriage house roof is 1998 Celotex architectural asphalt — 28 years old, past its design life. Granule loss is severe. This is a deferred replacement the Whitakers should plan for in 2027, bundled with other exterior work.",
      ],
      health_bar: { label: "Main Slate Roof Life", current: 114, total: 150, unit: "years" },
      specs: [
        { label: "Main Roof Material", value: "Vermont Buckingham slate (original 1912)" },
        { label: "Flashings", value: "Terneplate tin (original, failing)" },
        { label: "Carriage House Roof", value: "1998 Celotex 25-year asphalt shingle" },
        { label: "Ice & Water Shield", value: "Not present — 1912 construction" },
        { label: "Slate Tiles Replaced", value: "~8 visible mismatched repairs" },
        { label: "Expected Slate Service Life Remaining", value: "35–50 years with maintenance" },
      ],
      tiers: {
        essential: { price: "$14,500 – $21,000", description: "Slate flashing replacement at both chimneys (copper), eave ice-and-water strip, replace mismatched tile patches with reclaimed Buckingham." },
        enhanced: { price: "$38,000 – $55,000", description: "Full copper flashing package, custom copper valleys, restore slate ridge caps, seal and repoint chimney crowns, re-gutter in copper half-round." },
        signature: { price: "$68,000 – $95,000", description: "Complete slate assessment and re-point, copper flashings throughout, replace carriage-house with matching slate or standing-seam copper, integrate snow guards." },
      },
      timing: "Flashings: Year 1 (2026). Carriage house: Year 2.",
      recommendations: [
        "Replace chimney flashings in spring 2026 — before another winter accelerates the corrosion",
        "Source reclaimed Buckingham slate from a restoration yard for the mismatched patches",
        "Install snow guards above the entry porch as part of the flashing work",
      ],
      images: [ALDERWOOD_IMG.roof_slate],
    },

    // ─── 3. Exterior Siding ────────────────────────────────────────
    {
      page_key: "siding-cladding",
      title: "Exterior Siding & Trim",
      group_name: "exterior",
      condition_rating: "Fair",
      sort_order: 2,
      narrative: [
        "The home is clad in original old-growth cedar clapboard with hand-planed detail on window and door surrounds. Paint history is visible in the areas where layers have blistered — at least eight paint cycles in the last century, all lead-based prior to 1978. Current topcoat is 2016 Benjamin Moore Regal Select.",
        "Rot inspection identified three localized areas of concern: the northeast corner water table, a 12-foot run of clapboard above the kitchen bay where the 1995 renovation introduced a flashing gap, and the south gable-end fascia. None are structural but each requires stabilization this year before winter freeze-thaw expands the damage.",
        "The cedar itself, where sound, has another 50 years of service with periodic maintenance. The Whitakers should resist any suggestion to replace with fiber cement — you cannot recreate hand-planed old-growth cedar profiles, and the material value alone justifies preservation.",
      ],
      health_bar: { label: "Siding Integrity", current: 68, total: 100, unit: "%" },
      specs: [
        { label: "Material", value: "Old-growth cedar clapboard, original 1912" },
        { label: "Current Paint", value: "Benjamin Moore Regal Select (2016)" },
        { label: "Paint Cycle", value: "7–9 years (trending 6 in full-sun exposures)" },
        { label: "Rot Areas Identified", value: "3 localized (NE water table, kitchen bay, S gable)" },
        { label: "Lead Paint", value: "Present in layers 2–7 (pre-1978)" },
        { label: "Water Management", value: "No rain screen — original construction" },
      ],
      tiers: {
        essential: { price: "$9,500 – $14,500", description: "Dutchman repair at three rot areas, spot-prime, and topcoat. Addresses water intrusion risk this year." },
        enhanced: { price: "$38,000 – $58,000", description: "Full south-and-west repaint (prep-to-finish), repair all identified rot, restore historic trim profiles, 10-year paint warranty." },
        signature: { price: "$85,000 – $135,000", description: "Full home repaint with lead-safe abatement, rebuild three runs of compromised cedar with reclaimed material, add concealed rain screen strapping, sound-match hand-planed profiles." },
      },
      timing: "Rot repairs: Year 1 (fall 2026). Full repaint: Year 3 (2028).",
      recommendations: [
        "Hire a lead-certified painter — not all contractors carry EPA RRP certification",
        "Have rot areas repaired before October 2026 — winter moisture expands the damage",
        "Plan full repaint to coincide with roof flashing work so scaffolding is shared",
      ],
      images: [ALDERWOOD_IMG.siding_trim, ALDERWOOD_IMG.exterior_detail],
    },

    // ─── 4. Windows ────────────────────────────────────────────────
    {
      page_key: "windows",
      title: "Windows",
      group_name: "exterior",
      condition_rating: "Good",
      sort_order: 3,
      narrative: [
        "The main-floor and second-floor windows were replaced in 2017 with Marvin Ultimate Double Hung wood-clad units, matched to the original 6-over-6 divided-light pattern. This was a significant and correct investment: the windows maintain the home's historical character while meeting current thermal performance standards (U-factor 0.29, SHGC 0.27).",
        "The third-floor dormer windows remain original — nine 1912 double-hung units with single-pane glass, weight-and-pulley sash cords (most broken), and minor sash rot. These are the leakiest surfaces in the home, contributing an estimated 18% of winter heat loss despite being only 6% of the window area.",
        "Storm windows are absent throughout. Adding interior storms to the third floor is a low-cost high-return improvement that preserves the original sash and drops heat loss substantially.",
      ],
      specs: [
        { label: "Main Floors Windows", value: "22 Marvin Ultimate DH (2017)" },
        { label: "Marvin U-Factor", value: "0.29 (Energy Star rated)" },
        { label: "Third Floor Windows", value: "9 original 1912 (single-pane, failing sash cords)" },
        { label: "Storm Windows", value: "None present" },
        { label: "Window Manufacturer Warranty", value: "Marvin Owens Corning — 20 yr on 2017 units, transferable" },
      ],
      tiers: {
        essential: { price: "$4,500 – $7,500", description: "Interior magnetic storms for all 9 third-floor windows. Cuts heat loss ~60% on those openings without touching sash." },
        enhanced: { price: "$28,000 – $42,000", description: "Restore third-floor sash (replace cords, weatherstrip, replace rotted rails), add interior storms." },
        signature: { price: "$58,000 – $85,000", description: "Replace third-floor with Marvin Ultimate DH to match main-floor set, custom-order historic divided lights." },
      },
      timing: "Storms: immediately. Sash decision: Year 2.",
      recommendations: [
        "Install interior storms this fall — $4,500 investment cuts $1,200/yr in heating",
        "If proceeding with sash restoration, use a period-correct restorer not a general window shop",
      ],
      // Fallback: no dedicated windows-only shot — use trim/window detail, then interior transition.
      images: [ALDERWOOD_IMG.siding_trim, ALDERWOOD_IMG.interior_transition],
    },

    // ─── 5. Kitchen ────────────────────────────────────────────────
    {
      page_key: "kitchen",
      title: "Kitchen",
      group_name: "interior-utility",
      condition_rating: "Fair",
      sort_order: 4,
      narrative: [
        "The kitchen received a renovation in 1995 that added the 7-foot window bay, installed oak raised-panel cabinetry, and laid a Tarkett sheet-vinyl floor. The space is fully functional but cosmetically and functionally dated. Appliances have been selectively upgraded — the Viking range (2015) is current, the Sub-Zero 648 (2015) is current, the dishwasher (Miele G7106, 2019) is current.",
        "Storage and workflow are the main friction points: the original 1912 pantry pass-through to the butler's pantry is narrow, the island is undersized at 36×72\", and cabinet interiors have no roll-outs. The pot filler at the range is non-functional (failed solenoid). Counter lighting is absent; the under-cabinet LED strip was never replaced after the 2015 range install.",
        "This is the property's largest discretionary opportunity. A full renovation modernizing workflow, opening the wall to the butler's pantry, and restoring period-correct millwork above the cabinetry would put this kitchen at the level the rest of the home deserves.",
      ],
      specs: [
        { label: "Last Renovation", value: "1995 (partial — cabinets, floor, bay window)" },
        { label: "Range", value: "Viking Professional VGR736LSS 36\" (2015)" },
        { label: "Refrigeration", value: "Sub-Zero 648PRO 48\" (2015)" },
        { label: "Dishwasher", value: "Miele G7106 SCU (2019)" },
        { label: "Sink", value: "Original 1912 soapstone apron (kept in 1995 reno)" },
        { label: "Cabinet Style", value: "1995 oak raised-panel, varnish finish" },
        { label: "Island Size", value: "36 × 72 in (undersized for footprint)" },
      ],
      tiers: {
        essential: { price: "$18,500 – $32,000", description: "Replace cabinet doors + drawer fronts with Shaker inset, new quartz counters, replace vinyl with engineered rift-sawn oak, new pulls, new under-cabinet lighting, replumb pot filler." },
        enhanced: { price: "$95,000 – $135,000", description: "Gut-and-redesign preserving Viking/Sub-Zero: custom inset Shaker cabinetry in poplar, Calacatta Oro honed counters, expanded island (42×96), new Miele dishwasher, integrated plate warmer, scullery-style butler's pantry reopened." },
        signature: { price: "$165,000 – $240,000", description: "Full architect-led kitchen + butler's pantry + informal dining redesign. Custom millwork above cabinets matched to 1912 details, reclaimed brick hearth at the range wall, Lacanche range option, Officine Gullo hood, stone floor warming." },
      },
      timing: "Design Year 1 (2026). Build Year 2 (2027).",
      recommendations: [
        "Specify range hood and pot-filler solenoid replacements as a small Year-1 project regardless of which tier you ultimately fund",
        "Keep the original 1912 soapstone apron sink — it is irreplaceable and its patina is a focal point",
        "If choosing Signature tier, commit design by July 2026 to lock fabricator slots",
      ],
      images: [ALDERWOOD_IMG.kitchen],
    },

    // ─── 6. Primary Suite ──────────────────────────────────────────
    {
      page_key: "primary-bedroom",
      title: "Primary Suite",
      group_name: "interior-bedrooms",
      condition_rating: "Good",
      sort_order: 5,
      narrative: [
        "The primary suite was renovated in 2018 — converting a small bedroom and adjacent sitting room into a unified 580 sf suite with ensuite bath, walk-in closet, and small reading alcove. The work is high-quality: Waterworks fixtures, Calacatta Oro marble floors in the bath, Farrow & Ball \"Stiffkey Blue\" walls.",
        "Aging issues are minor and cosmetic. The walk-in closet was specified without a window for light, and residents have noted the space is dim. Shower glass shows hard-water staining (Hudson's water is moderately hard at ~9 gpg). The wall-hung vanity has a hairline stress crack at the wall mount — not yet loose but worth monitoring.",
        "The alcove reading nook offers expansion potential. Converting it to a proper dressing room or expanding the suite into the adjacent corner bedroom is the logical vision project if the Whitakers want to go further.",
      ],
      specs: [
        { label: "Renovation Year", value: "2018" },
        { label: "Suite Size", value: "580 sf" },
        { label: "Bath Fixtures", value: "Waterworks Studio collection (Barclay lav, Opus tub)" },
        { label: "Floor (bath)", value: "Calacatta Oro polished marble" },
        { label: "Paint", value: "Farrow & Ball Stiffkey Blue No.281 (walls)" },
        { label: "Shower Glass", value: "3/8\" starphire low-iron — moderate hard-water staining" },
      ],
      tiers: {
        essential: { price: "$2,800 – $4,500", description: "Professional shower-glass restoration, re-seal marble floor, repair vanity crack, add reading-nook sconce." },
        enhanced: { price: "$28,000 – $42,000", description: "Convert reading alcove to dressing room with built-in millwork, add dormer for closet light, upgrade shower to rainhead." },
        signature: { price: "$95,000 – $145,000", description: "Expand suite into adjacent corner bedroom, add fireplace, convert full alcove to custom dressing room with island, relocate bath for dual-vanity layout." },
      },
      timing: "Essential: Year 1. Enhanced or Signature: Year 2+.",
      recommendations: [
        "Add a whole-house water softener (see Plumbing page) before refinishing shower glass — otherwise the hardness re-etches within 18 months",
        "Before Signature-tier commitment, review structural feasibility of merging with corner bedroom — wall is load-bearing",
      ],
      images: [ALDERWOOD_IMG.primary_suite],
    },

    // ─── 7. HVAC ───────────────────────────────────────────────────
    {
      page_key: "primary-furnace",
      title: "Heating & Cooling System",
      group_name: "systems-hvac",
      condition_rating: "Poor",
      sort_order: 6,
      narrative: [
        "The home's heat is delivered via a 1985 Carrier 58SS 300,000 BTU gas-fired steam boiler serving the original cast-iron radiators on the main and second floors. The boiler is 41 years old — a full 11 years past its expected service life — and its efficiency is well below modern standards (~72% AFUE vs. current 95%+).",
        "The system has been competently maintained (current service contract with Keller Heating, annual tune-ups) but is a single-point failure with no redundancy. A mid-winter boiler failure in Hudson triggers pipe-freeze risk within hours. The Whitakers had a near-miss in February 2024 when a burner orifice clogged overnight.",
        "Air conditioning is handled by a 2012 Carrier Performance 2-ton condenser and air handler, ducted through an awkward third-floor retrofit. Cooling performance on the second floor is marginal on 90°+ days. The third floor has no cooling at all.",
        "The path we recommend is a three-phase conversion: decommission the steam boiler, install hydronic radiant floor heat where practical (main level), and wrap the upper floors in a variable-speed heat pump system with dedicated zones. This is a 6–8 week project best executed in spring.",
      ],
      specs: [
        { label: "Boiler Make/Model", value: "Carrier 58SS 300K BTU steam (1985)" },
        { label: "Boiler Age", value: "41 years (expected life: 25–30)" },
        { label: "Boiler AFUE", value: "~72% (estimated from age)" },
        { label: "Radiator System", value: "Cast-iron, original 1912, functional" },
        { label: "AC Condenser", value: "Carrier 24ACB7 2-ton (2012)" },
        { label: "AC SEER", value: "13 (current standard: 16+)" },
        { label: "Service Contract", value: "Keller Heating annual, current" },
      ],
      tiers: {
        essential: { price: "$14,500 – $21,000", description: "Replace boiler with new Weil-McLain EG-55 95% AFUE gas boiler. Maintains steam system; immediate efficiency + reliability gain." },
        enhanced: { price: "$42,000 – $68,000", description: "High-efficiency Buderus gas boiler + retrofit second-floor radiators to hot water (conversion), add Mitsubishi mini-split heat pump for third floor with 3 zones." },
        signature: { price: "$95,000 – $145,000", description: "Full modernization: hydronic radiant floor main level, Carrier Infinity 20 variable-speed heat pump with zoned ductwork for upper floors, smart thermostats throughout, demolish 3rd-floor retrofit ducting." },
      },
      timing: "Priority 1 — execute by August 2026 (before heating season).",
      recommendations: [
        "Begin HVAC contractor bidding in March 2026 — lead times are 10+ weeks for equipment",
        "Whatever tier you choose, specify a battery-backup thermostat so a power outage doesn't drop the system",
        "Request the AHJ (City of Hudson) sign off on the boiler decommissioning permit — they have been restrictive about removing historic systems",
      ],
      images: [ALDERWOOD_IMG.mechanical_room],
    },

    // ─── 8. Electrical ─────────────────────────────────────────────
    {
      page_key: "electrical-system",
      title: "Electrical System",
      group_name: "systems-mechanical",
      condition_rating: "Fair",
      sort_order: 7,
      narrative: [
        "The main electrical service was upgraded to 200A copper in 2008 with a Square D QO200 panel in the basement. The panel itself is modern, correctly sized, and has room for expansion. Branch circuits on the main and second floors are all 2008 or later NM-B — safe and compliant.",
        "The issue is the third-floor attic and servants' wing. Original 1912 knob-and-tube wiring is still live on approximately 40% of third-floor circuits. Homeowner's insurance has flagged this twice in renewals but has not (yet) required remediation. Knob-and-tube is not inherently unsafe when undisturbed, but it fails when insulation is laid over it or it is accidentally connected to modern receptacles by well-meaning contractors.",
        "GFCI protection is present in bath and kitchen but absent in the basement wet areas (washer, laundry sink, utility sink). AFCI breakers are absent — current code requires them on bedroom and living-space circuits; they would be a retrofit for peace-of-mind rather than a code compliance item.",
      ],
      specs: [
        { label: "Main Service", value: "200A copper (2008)" },
        { label: "Main Panel", value: "Square D QO200" },
        { label: "Main/Second Floor Wiring", value: "2008 NM-B, copper, compliant" },
        { label: "Third Floor Wiring", value: "~40% knob-and-tube, 1912 original" },
        { label: "GFCI Coverage", value: "Main baths + kitchen only (missing basement)" },
        { label: "AFCI Coverage", value: "None" },
        { label: "Smoke/CO Detectors", value: "Battery-only, 5 units, ages vary" },
      ],
      tiers: {
        essential: { price: "$4,500 – $7,500", description: "Add GFCI protection to basement wet areas, hardwire + interconnect 10 smoke/CO detectors, label panel." },
        enhanced: { price: "$22,000 – $38,000", description: "Remove all live knob-and-tube from third floor, replace with new 12/2 copper NM-B, add dedicated circuits for AC + kitchen, add AFCI breakers on bedroom circuits." },
        signature: { price: "$48,000 – $75,000", description: "Full electrical modernization — rewire third floor AND servants' wing, upgrade to 320A service, add whole-house surge protection, add Tesla Powerwall or similar battery backup system." },
      },
      timing: "Essential: within 6 months. K&T removal: Year 1–2.",
      recommendations: [
        "Get knob-and-tube removal on the calendar — insurance will eventually require it",
        "Hardwire and interconnect smoke/CO detectors this year regardless of other scope",
        "When adding AC capacity for primary-suite or kitchen, confirm panel has capacity (current load factor ~65%)",
      ],
      images: [ALDERWOOD_IMG.electrical_attic],
    },

    // ─── 9. Plumbing ───────────────────────────────────────────────
    {
      page_key: "plumbing-system",
      title: "Plumbing System",
      group_name: "systems-mechanical",
      condition_rating: "Fair",
      sort_order: 8,
      narrative: [
        "Water service is 1\" copper from street to main shut-off, 2008 vintage. Distribution within the home is a mix of original 1912 galvanized (largely replaced), 1970s copper (most of it, still serviceable), and 1995 polybutylene in the kitchen run (should be replaced — polybutylene fails by rupture, often catastrophically).",
        "The water heater is a Rheem Performance Platinum 50-gallon gas, installed 2021 and performing well. A Rinnai tankless would better serve a household of this size if a vision-level kitchen renovation goes forward — the existing 50-gallon cannot support simultaneous shower + dishwasher + pot-filler demand.",
        "Hudson's municipal water is hard (~9 gpg) and this is visible on fixtures, glass, and inside the kettle. A whole-house softener would add 18–24 months of life to plumbing, appliances, and the primary-bath marble. Cost is modest; benefit is substantial.",
      ],
      specs: [
        { label: "Service Line", value: "1\" copper (2008)" },
        { label: "Distribution", value: "1970s copper (main) + 1995 polybutylene (kitchen only)" },
        { label: "Water Heater", value: "Rheem Performance Platinum 50gal gas (2021)" },
        { label: "Water Heater Warranty", value: "12-year tank, expires 2033" },
        { label: "Water Hardness", value: "9 gpg (moderately hard)" },
        { label: "Softener", value: "None present" },
        { label: "Main Shut-off", value: "Ball valve, basement NW corner" },
      ],
      tiers: {
        essential: { price: "$4,200 – $6,800", description: "Replace polybutylene kitchen run with PEX, install whole-house softener (Kinetico), pressure-reducing valve adjustment." },
        enhanced: { price: "$18,000 – $28,000", description: "Full re-pipe to PEX-A throughout, Rinnai RU199iN tankless install, whole-house filtration + softening, emergency shut-off valve at every fixture." },
        signature: { price: "$38,000 – $55,000", description: "Full modernization plus dedicated hot-water recirculation loop, dual tankless setup for future kitchen + pool house expansion, manifold distribution system with per-fixture shut-offs." },
      },
      timing: "Polybutylene: priority 1. Softener: Year 1.",
      recommendations: [
        "Replace polybutylene kitchen run as part of kitchen renovation — do not touch the water heater until then",
        "Install softener within 60 days — the longer hard water runs, the more damage accumulates",
        "If going tankless, confirm gas line upsize first (3/4\" required for RU199iN)",
      ],
      // Fallback: no dedicated plumbing image — mechanical room shows visible piping.
      images: [ALDERWOOD_IMG.mechanical_room],
    },

    // ─── 10. Basement / Foundation ────────────────────────────────
    {
      page_key: "basement",
      title: "Basement & Foundation",
      group_name: "interior-unfinished",
      condition_rating: "Good",
      sort_order: 9,
      narrative: [
        "The foundation is original 1912 poured concrete over a stone rubble footing, 18\" thick walls. This is extraordinary construction for the era and the primary reason the home is still plumb 114 years later. No visible cracking beyond hairline (normal), no efflorescence on walls, and the basement is dry in all seasons.",
        "A Zoeller M53 sump pump was added in 2016 in the NW corner — this is belt-and-suspenders for an already-dry basement but provides peace of mind. The pump is functional; we recommend a secondary backup (battery-powered or water-powered) given the home is on well-drained terrain but storms have intensified.",
        "The basement is unfinished — bare concrete floor, exposed joists, limited lighting. It currently serves as mechanical space + general storage. A Signature-tier finish program would add ~1,200 sf of usable space (media room, wine cellar, workshop) but is not urgent.",
      ],
      specs: [
        { label: "Foundation Material", value: "Poured concrete 18\" over stone rubble footing" },
        { label: "Foundation Age", value: "114 years (original)" },
        { label: "Water Intrusion History", value: "None in past decade" },
        { label: "Sump Pump", value: "Zoeller M53 1/3 HP (2016)" },
        { label: "Sump Backup", value: "None" },
        { label: "Finished Space", value: "None — full basement unfinished" },
        { label: "Ceiling Height", value: "6'8\" (limited for finishing)" },
      ],
      tiers: {
        essential: { price: "$1,800 – $3,200", description: "Add battery-backup sump pump (Wayne ESP25), update sump basin liner, install simple shelving." },
        enhanced: { price: "$28,000 – $48,000", description: "Partial finish: 800 sf media/gym room with egress, insulation + drywall, LED lighting, flooring, basic electrical." },
        signature: { price: "$125,000 – $185,000", description: "Full basement finish: media room with Dolby Atmos, climate-controlled wine cellar, workshop, half bath, and new egress. Requires ceiling-raise excavation (limited ceiling height)." },
      },
      timing: "Essential: immediate. Enhanced/Signature: Year 3+.",
      recommendations: [
        "Add a battery sump backup this summer — $1,800 buys peace of mind on the one system that matters in a storm",
        "If pursuing finish work, address the ceiling-height constraint first — finish cost without ceiling raise is significantly compromised",
      ],
      images: [ALDERWOOD_IMG.basement_foundation],
    },

    // ─── 11. Strategic Roadmap ────────────────────────────────────
    {
      page_key: "strategic-roadmap",
      title: "Strategic Roadmap & Investment Timeline",
      group_name: "information",
      condition_rating: "Good",
      sort_order: 10,
      narrative: [
        "This roadmap is designed to sequence work so that dependencies are respected (flashing before paint, HVAC before basement finish, plumbing before kitchen), and so the Whitakers can make informed funding decisions quarter by quarter.",
        "Year 1 (2026) priorities are safety-and-systems: HVAC replacement, knob-and-tube removal, chimney flashings, polybutylene kitchen run, and basement sump backup. These are non-discretionary — each has a real risk profile attached to delay.",
        "Year 2 (2027) is the value-add year: kitchen modernization (Enhanced tier target), exterior repaint, primary-suite dressing room. These are the improvements visitors will notice.",
        "Year 3+ (2028–2029) is the vision horizon: basement finish, potential carriage-house conversion to a guest studio, long-term exterior restoration. Budget placeholders only — details revisited annually.",
      ],
      specs: [
        { label: "Year 1 Budget Range", value: "$85k – $135k (priority + planning)" },
        { label: "Year 2 Budget Range", value: "$180k – $275k (kitchen + exterior)" },
        { label: "Year 3+ Placeholder", value: "$150k – $400k (vision)" },
        { label: "3-Year Total Range", value: "$415k – $810k" },
        { label: "Value Impact Estimate", value: "$480k+ at current neighborhood comps" },
      ],
      timing: "Active plan — review quarterly",
      recommendations: [
        "Establish a dedicated home-improvement line of credit against equity for tranche funding",
        "Revisit this roadmap every Q4 — projects shift, priorities change, scope evolves",
        "Consider bundling 2026 HVAC + 2027 kitchen contractor selection to negotiate larger-project discount",
      ],
      // Fallback: no dedicated roadmap graphic — use elegant golden-hour exterior.
      images: [ALDERWOOD_IMG.exterior_golden_hour],
    },

    // ─── 12. Safety ────────────────────────────────────────────────
    {
      page_key: "safety-detection",
      title: "Safety & Life Systems",
      group_name: "safety-detection",
      condition_rating: "Fair",
      sort_order: 11,
      narrative: [
        "Smoke and CO detection coverage is present but inconsistent. Five battery-operated units (mix of Kidde and First Alert) are placed on each level, but they are not interconnected — a fire on the third floor does not trip alarms on the main. Current code requires hardwired interconnection in newly-renovated spaces; historic homes are typically grandfathered but the life-safety risk is real.",
        "Radon test results from January 2026 show 3.8 pCi/L — above EPA's action level (4.0) is the line, but the Whitakers' reading is close enough to recommend mitigation. A simple sub-slab depressurization system runs $1,200–$2,400 installed and drops typical readings below 1.5 pCi/L.",
        "The home lacks a central security system. Window-and-door coverage on the main level alone (e.g., Ring Alarm Pro or SimpliSafe) would provide basic intrusion monitoring. Smart locks are absent; entry-level Schlage Encode units would add keyless access for the property management firm.",
      ],
      specs: [
        { label: "Smoke/CO Detectors", value: "5 battery-only, ages 2018–2023" },
        { label: "Interconnection", value: "None — each unit independent" },
        { label: "Radon Reading (Jan 2026)", value: "3.8 pCi/L (near EPA action level)" },
        { label: "Radon Mitigation", value: "None installed" },
        { label: "Security System", value: "None" },
        { label: "Smart Locks", value: "None" },
        { label: "Fire Extinguishers", value: "2 (kitchen ABC, basement utility)" },
      ],
      tiers: {
        essential: { price: "$1,800 – $2,800", description: "Hardwire + interconnect 10 smoke/CO detectors (Kidde i4618AC), radon mitigation system, add fire extinguisher to each floor." },
        enhanced: { price: "$6,500 – $12,000", description: "Full Ring Alarm Pro install (panel + sensors + base cameras), smart locks on 3 entry doors, radon mitigation, all-level detection." },
        signature: { price: "$28,000 – $48,000", description: "Full Control4 or Savant smart-home integration: security + lighting + HVAC + entertainment under one system. Professional monitoring contract." },
      },
      timing: "Radon + detectors: Year 1. Security: Year 1–2.",
      recommendations: [
        "Radon mitigation is the highest-leverage safety investment — do this first",
        "Hardwire smoke/CO detectors during the knob-and-tube electrical work (same electrician, same trip, much cheaper)",
      ],
      // Fallback: no dedicated safety/life-systems image in this set.
      images: [ALDERWOOD_IMG.interior_transition],
    },
  ],

  equipment: [
    { name: "Gas Boiler", category: "hvac", brand: "Carrier", model: "58SS 300K BTU Steam", install_date: "1985-06-15", condition: "poor", estimated_replacement_cost: 55000, notes: "41yr old — replacement priority 1. AFUE ~72%." },
    { name: "Central AC Condenser", category: "hvac", brand: "Carrier", model: "24ACB7 2-ton", install_date: "2012-04-22", condition: "fair", estimated_replacement_cost: 6800, notes: "SEER 13. Marginal 2nd-floor performance on 90°+ days." },
    { name: "Water Heater", category: "plumbing", brand: "Rheem", model: "Performance Platinum 50gal Gas XG50T12DU38U0", install_date: "2021-08-10", warranty_expiry: "2033-08-10", condition: "good", estimated_replacement_cost: 1800 },
    { name: "Sump Pump", category: "plumbing", brand: "Zoeller", model: "M53 1/3 HP", install_date: "2016-03-12", condition: "good", estimated_replacement_cost: 650, notes: "No backup system — recommend adding battery backup." },
    { name: "Main Electrical Panel", category: "electrical", brand: "Square D", model: "QO200 — 200A 40-space", install_date: "2008-09-01", condition: "good", estimated_replacement_cost: 3200 },
    { name: "Range", category: "appliance", brand: "Viking Professional", model: "VGR736LSS 36\" 6-burner gas", install_date: "2015-05-18", condition: "good", estimated_replacement_cost: 9800, notes: "Pot-filler solenoid failed; not affecting main range function." },
    { name: "Refrigerator", category: "appliance", brand: "Sub-Zero", model: "648PRO 48\" side-by-side panel-ready", install_date: "2015-05-18", condition: "good", estimated_replacement_cost: 18500 },
    { name: "Dishwasher", category: "appliance", brand: "Miele", model: "G7106 SCU SF Futura Classic", install_date: "2019-02-14", warranty_expiry: "2024-02-14", condition: "good", estimated_replacement_cost: 2400 },
    { name: "Sump Backup (Recommended)", category: "plumbing", brand: "—", model: "Recommended: Wayne ESP25 battery backup", condition: "unknown", estimated_replacement_cost: 850, notes: "Not yet installed — Essential-tier recommendation." },
  ],

  projects: [
    // Priority 1 — HVAC replacement (repair/system upgrade)
    {
      title: "HVAC System Modernization",
      project_type: "renovation", priority: "high", status: "active", phase: "planning",
      description: "Replace 1985 Carrier boiler + 2012 AC with modern heat pump + hydronic hybrid system. Priority 1 — execute before heating season 2026.",
      estimated_cost: 58000, budget: 68000, contingency_pct: 15, percent_complete: 15,
      estimated_start_date: "2026-05-15", end_date: "2026-08-30",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Contractor bidding + specification", status: "in_progress", sort_order: 0 },
        { name: "Equipment order + permits", status: "not_started", sort_order: 1 },
        { name: "Demolition of 1985 boiler + ductwork", status: "not_started", sort_order: 2 },
        { name: "Install new high-efficiency system", status: "not_started", sort_order: 3 },
        { name: "Commissioning + homeowner walkthrough", status: "not_started", sort_order: 4 },
      ],
    },
    // Vision — Kitchen
    {
      title: "Kitchen Modernization & Butler's Pantry Restoration",
      project_type: "renovation", priority: "medium", status: "planning", phase: "design",
      description: "Full kitchen redesign preserving the 1912 soapstone apron sink and high-end appliances. Expand island, reopen butler's pantry, period-correct millwork above cabinets. Enhanced tier target ~$115k.",
      estimated_cost: 115000, budget: 132000, contingency_pct: 15, percent_complete: 5,
      estimated_start_date: "2027-03-01", end_date: "2027-08-15",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Architect selection + concept design", status: "not_started", sort_order: 0 },
        { name: "Design development + specifications", status: "not_started", sort_order: 1 },
        { name: "Cabinet fabrication", status: "not_started", sort_order: 2 },
        { name: "Demo + rough-in", status: "not_started", sort_order: 3 },
        { name: "Installation", status: "not_started", sort_order: 4 },
        { name: "Final punch + handover", status: "not_started", sort_order: 5 },
      ],
    },
    // Vision — Primary Suite expansion
    {
      title: "Primary Suite — Dressing Room Addition",
      project_type: "addition", priority: "medium", status: "planning", phase: "scoping",
      description: "Convert reading alcove to proper dressing room with custom millwork. Add dormer for natural light. Enhanced tier.",
      estimated_cost: 38000, budget: 45000, contingency_pct: 15, percent_complete: 0,
      estimated_start_date: "2027-09-01", end_date: "2027-11-30",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Scope + design", status: "not_started", sort_order: 0 },
        { name: "Permits + dormer structural review", status: "not_started", sort_order: 1 },
        { name: "Build + millwork install", status: "not_started", sort_order: 2 },
      ],
    },
    // Priority 1 — Knob-and-tube
    {
      title: "Knob-and-Tube Electrical Remediation (3rd Floor)",
      project_type: "renovation", priority: "high", status: "active", phase: "scoping",
      description: "Remove all live K&T wiring from 3rd floor + servants' wing. ~40% of 3rd-floor circuits affected. Coordinates with attic insulation improvements.",
      estimated_cost: 28000, budget: 33000, contingency_pct: 15, percent_complete: 10,
      estimated_start_date: "2026-09-15", end_date: "2026-11-15",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Electrical survey + panel-load check", status: "in_progress", sort_order: 0 },
        { name: "Permit + scope sign-off", status: "not_started", sort_order: 1 },
        { name: "Wire + remove old K&T", status: "not_started", sort_order: 2 },
        { name: "Inspection + drywall patch", status: "not_started", sort_order: 3 },
      ],
    },
  ],

  invoices: [
    // Paid — initial assessment
    {
      invoice_number: "HCH-2026-001", type: "invoice", title: "Initial Home Clarity Assessment",
      description: "Full-home walkthrough + report authoring — Alderwood Estate",
      status: "paid", issue_date: "2026-02-10", due_date: "2026-02-25", paid_date: "2026-02-18",
      subtotal: 4850, tax: 0, total: 4850, balance_due: 0,
      line_items: [
        { description: "On-site home assessment (full day)", quantity: 1, unit_price: 2400, total: 2400, item_type: "service" },
        { description: "Report authoring + photography", quantity: 1, unit_price: 1800, total: 1800, item_type: "service" },
        { description: "Radon testing + analysis", quantity: 1, unit_price: 450, total: 450, item_type: "service" },
        { description: "Advisor consult (post-report)", quantity: 2, unit_price: 100, total: 200, item_type: "service" },
      ],
    },
    // Overdue — HVAC planning retainer
    {
      invoice_number: "HCH-2026-014", type: "invoice", title: "HVAC Project Planning Retainer",
      description: "Contractor coordination + specification authoring + bid review for HVAC modernization project.",
      status: "overdue", issue_date: "2026-03-10", due_date: "2026-03-25",
      subtotal: 1850, tax: 0, total: 1850, balance_due: 1850,
      line_items: [
        { description: "HVAC specification + scope document", quantity: 1, unit_price: 950, total: 950, item_type: "service" },
        { description: "Contractor bid solicitation (3 bids)", quantity: 1, unit_price: 600, total: 600, item_type: "service" },
        { description: "Bid review + recommendation", quantity: 1, unit_price: 300, total: 300, item_type: "service" },
      ],
    },
    // Draft — kitchen design engagement
    {
      invoice_number: "HCH-2026-DRAFT-002", type: "invoice", title: "Kitchen Design Engagement (Draft)",
      description: "Design engagement retainer for Enhanced-tier kitchen program. 50% upfront, balance on final drawings.",
      status: "pending", issue_date: "2026-04-18", due_date: "2026-05-02",
      subtotal: 7500, tax: 0, total: 7500, balance_due: 7500,
      line_items: [
        { description: "Architect retainer (Studio Lane) — 50%", quantity: 1, unit_price: 6000, total: 6000, item_type: "service" },
        { description: "HBC advisor oversight (design phase)", quantity: 15, unit_price: 100, total: 1500, item_type: "service" },
      ],
    },
  ],

  schedule_events: [
    { title: "Initial Home Walkthrough — Completed", event_type: "assessment", status: "completed", event_date: "2026-02-08T14:00:00-05:00", description: "Margaret + Thomas + HBC advisor. Full-home assessment." },
    { title: "Report Review Call", event_type: "consultation", status: "completed", event_date: "2026-02-24T10:00:00-05:00", description: "Went through draft report findings + priority roadmap." },
    { title: "HVAC Contractor Site Visits", event_type: "appointment", status: "scheduled", event_date: "2026-05-14T13:00:00-04:00", description: "3 contractor site visits staged back-to-back for bid comparison." },
    { title: "Kitchen Design Kickoff — Studio Lane", event_type: "consultation", status: "scheduled", event_date: "2026-06-03T15:00:00-04:00", description: "First meeting with architect for Enhanced-tier kitchen program." },
    { title: "Annual Review — Alderwood", event_type: "annual_review", status: "scheduled", event_date: "2027-02-15T10:00:00-05:00", description: "Year-one progress review + roadmap refresh." },
    { title: "HVAC Installation Begins", event_type: "project_milestone", status: "scheduled", event_date: "2026-07-20T08:00:00-04:00", description: "Boiler demo + new system install start." },
  ],

  goals: [
    { title: "Modernize HVAC System", description: "Replace 1985 boiler with high-efficiency system before winter 2026.", target_year: 2026, estimated_budget: 68000, status: "planning" },
    { title: "Kitchen Renovation — Enhanced Tier", description: "Full redesign preserving existing appliances. Architect engagement Q3 2026, build 2027.", target_year: 2027, estimated_budget: 132000, status: "planning" },
    { title: "Primary Suite Dressing Room", description: "Convert alcove to dressing room with dormer + custom millwork.", target_year: 2027, estimated_budget: 45000, status: "dreaming" },
    { title: "Exterior Full Repaint (Lead-Safe)", description: "Full home repaint with lead abatement. Coordinate with roof flashing scaffolding.", target_year: 2028, estimated_budget: 58000, status: "dreaming" },
    { title: "Basement Media Room + Wine Cellar", description: "Finish portion of basement for entertaining space.", target_year: 2029, estimated_budget: 145000, status: "dreaming" },
  ],

  messages: [
    { from: "creator", content: "Margaret + Thomas — great meeting today. Draft report is now published in your portal. Biggest Year-1 item is HVAC; I've put it on the schedule and will coordinate contractor visits for mid-May. Let me know if that week works for you both." },
    { from: "client", content: "Thank you Adam — we looked through the report last night over wine. Two questions: (1) is the knob-and-tube something insurance will eventually force, and (2) if we do the kitchen next year, should we hold off on HVAC and bundle them?" },
    { from: "creator", content: "Good questions both. (1) Yes — your carrier has flagged it twice in renewals; I expect a mitigation requirement within 12–18 months, so scheduling it this fall is the right move. (2) I'd strongly recommend NOT bundling. HVAC is a Year-1 priority because failure is catastrophic; kitchen is Year-2 because it's discretionary. Different contractors, different project management, different risk profiles. Let's keep them on separate tracks." },
    { from: "client", content: "Makes sense. Let's go ahead with the HVAC contractor visits for May 14th. Tom will be there; I'm away that week but Tom has veto power." },
  ],
};
