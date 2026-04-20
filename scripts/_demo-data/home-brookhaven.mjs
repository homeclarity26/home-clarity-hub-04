// Home B — The Brookhaven Residence
// 1985 Ranch with 2-story addition, 3,500 sf, Fairlawn OH
// Decent bones, deferred maintenance catching up. Upper-mid market.
// Vision: primary suite addition + kitchen open-concept + new deck.

import { photosFor } from "./photos.mjs";

export const BROOKHAVEN = {
  slug: "brookhaven",
  email: "demo.brookhaven@homeclarityhub.test",
  clientName: "Martinez Family",
  clientFullName: "Elena & David Martinez",
  property: {
    property_name: "[DEMO] Brookhaven Residence — Martinez",
    address: "3412 Smith Road",
    city: "Fairlawn",
    state: "OH",
    zip: "44333",
    county: "Summit",
    property_type: "single_family",
    estimated_value: 745000,
    metadata: { demo: true, year_built: 1985, sqft: 3500, bedrooms: 4, bathrooms: 2.5, lot_acres: 0.6 },
  },

  reportTitle: "Home Clarity Report — Brookhaven Residence",

  pages: [
    // ─── 1. Executive Summary ─────────────────────────────────────
    {
      page_key: "executive-summary",
      title: "Executive Summary",
      group_name: "information",
      condition_rating: "Good",
      sort_order: 0,
      narrative: [
        "The Brookhaven Residence is a well-maintained 1985 ranch with a 2-story addition completed in 2003 (primary suite + bonus room above garage). Core systems were meaningfully upgraded in the 2015–2019 window: 200A electrical service, PEX re-pipe, Trane heat-pump HVAC, and a new architectural-shingle roof. Those investments have paid off — the home's \"bones\" are in good shape for a 40-year-old residence.",
        "The deferred items that now need attention are the cosmetic and quality-of-life spaces: a 2005 kitchen remodel that has dated, a 1985 original primary bath that was never updated in the addition work, a 1990s treated-lumber deck that is structurally compromised, and six failed-seal windows. None are emergencies; all are legitimate improvements for a home staying in the family.",
        "The Martinezes have explicitly flagged two vision projects: primary-suite expansion (taking over the current guest bedroom to double the suite footprint), and a full kitchen refresh with wall removal to open the kitchen to the family room. Both are well-scoped for 2027–2028 execution.",
        "Priority-1 items for Year 1: failed-seal windows (6 units), deck structural repair or rebuild, and the original 1985 primary bath — which is on the verge of moisture-failure risk.",
      ],
      health_bar: { label: "Overall Home Health", current: 78, total: 100, unit: "%" },
      specs: [
        { label: "Home Style", value: "Ranch with 2-story addition" },
        { label: "Year Built", value: "1985 (addition 2003)" },
        { label: "Finished Sq Ft", value: "3,500" },
        { label: "Lot Size", value: "0.6 acres" },
        { label: "Bedrooms / Baths", value: "4 / 2.5" },
        { label: "Major Upgrades", value: "Roof 2018, HVAC 2019, Re-pipe 2015" },
      ],
      timing: "Strategic roadmap spans 2026–2028",
      recommendations: [
        "Prioritize failed-seal window replacement before winter 2026–27",
        "Commit to deck decision (repair vs. rebuild) before summer 2027",
        "Begin primary-suite architect interviews in 2026 — vision project requires 12-month runway",
      ],
      images: photosFor("ranch_exterior", 3),
    },

    // ─── 2. Roof System ───────────────────────────────────────────
    {
      page_key: "roof-system",
      title: "Roof System",
      group_name: "exterior",
      condition_rating: "Good",
      sort_order: 1,
      narrative: [
        "The roof is 2018 GAF Timberline HDZ architectural asphalt shingle on the original ranch and 2003 Owens Corning Duration on the addition. Both are on roughly the same age curve with 18–22 years of remaining service life. The 2018 work included ice-and-water shield at the eaves, ridge ventilation, and a full tear-off (no second-layer concerns).",
        "Inspection found the system in good overall condition: no curling, no significant granule loss, no lifted shingles. Flashings around the two chimneys and the addition junction are aluminum with new mastic — all sound. Pipe boots are original 2003 rubber on three vents; these typically fail at 15–20 years so replacement is a 2026–27 item.",
        "Gutters are 6\" K-style aluminum (2018), seamless, with LeafGuard covers on the front and back elevations. The side elevations are uncovered and show organic debris buildup — annual cleaning recommended.",
      ],
      health_bar: { label: "Roof System Life Remaining", current: 8, total: 25, unit: "years (elapsed)" },
      specs: [
        { label: "Main Roof Material", value: "GAF Timberline HDZ (2018)" },
        { label: "Addition Roof Material", value: "Owens Corning Duration (2003)" },
        { label: "Ice & Water Shield", value: "Present at eaves (2018 work)" },
        { label: "Ventilation", value: "Ridge vent + soffit" },
        { label: "Pipe Boots", value: "2003 original — replacement due" },
        { label: "Gutters", value: "6\" K-style aluminum (2018) with partial LeafGuard" },
        { label: "Warranty", value: "GAF Golden Pledge (transferable) — expires 2068" },
      ],
      tiers: {
        essential: { price: "$850 – $1,400", description: "Replace 3 pipe boots, inspect flashing seals, blow out gutters twice yearly (service contract)." },
        enhanced: { price: "$4,500 – $7,800", description: "Pipe boot replacement + full gutter cover upgrade (LeafGuard all sides), ridge vent inspection + seal touch-up." },
        signature: { price: "$18,000 – $28,000", description: "Early re-roof upgrade to 50-year premium architectural or standing-seam metal accent at porch, copper gutter system, integrated snow retention." },
      },
      timing: "Essential: Year 1. Major replacement: 2036+.",
      recommendations: [
        "Schedule pipe boot replacement this fall before winter freeze-thaw cycles",
        "Add gutter covers to remaining two elevations — avoids annual cleaning",
      ],
      images: photosFor("asphalt_shingle_roof", 2),
    },

    // ─── 3. Siding ─────────────────────────────────────────────────
    {
      page_key: "siding-cladding",
      title: "Exterior Siding & Trim",
      group_name: "exterior",
      condition_rating: "Good",
      sort_order: 2,
      narrative: [
        "The home is clad in beige vinyl siding — original 1985 on the main structure, matched-replacement 2003 on the addition. Color retention is good despite 41 years of exposure; vinyl's UV inhibitors have held up better than the era's reputation suggests.",
        "Three panels on the west elevation are loose at the J-channel — likely from wind or a lawn mower strike. These are 20-minute fixes. Stock-matching is a concern: the original 1985 panel profile is no longer manufactured, so replacement requires careful sourcing from salvage yards or inventory.",
        "The trim is aluminum-wrapped wood with a baked finish. One 8-foot section of fascia on the south gable shows oxidation blooms but no structural deterioration. Caulking at all window/door penetrations is original or near-original — recommend full re-caulk on next paint cycle.",
      ],
      specs: [
        { label: "Material", value: "Vinyl siding, mid-grade" },
        { label: "Installed", value: "1985 (main), 2003 (addition)" },
        { label: "Panel Stock Match", value: "Original 1985 pattern discontinued — salvage only" },
        { label: "Trim", value: "Aluminum-wrapped wood with baked finish" },
        { label: "Loose Panels", value: "3 on west elevation" },
        { label: "Caulking Status", value: "Original — due for full refresh" },
      ],
      tiers: {
        essential: { price: "$450 – $850", description: "Re-clip loose panels, full perimeter re-caulk at windows + doors, touch-up oxidation on fascia." },
        enhanced: { price: "$14,500 – $24,000", description: "Replace faded west-side panels, add insulated vinyl backer on sun-exposed elevations, full re-trim + caulk." },
        signature: { price: "$48,000 – $78,000", description: "Full re-side with James Hardie fiber cement in color of choice, new fascia + soffits, integrated trim, 50-year warranty." },
      },
      timing: "Essential: immediate. Enhanced: Year 3+. Signature: paired with primary-suite addition timeline.",
      recommendations: [
        "Re-clip loose panels before next windstorm — a half-hour job that avoids a much bigger repair",
        "If pursuing the Signature tier, time it with the primary-suite addition to bundle exterior work",
      ],
      images: photosFor("vinyl_siding", 2),
    },

    // ─── 4. Windows ────────────────────────────────────────────────
    {
      page_key: "windows",
      title: "Windows",
      group_name: "exterior",
      condition_rating: "Fair",
      sort_order: 3,
      narrative: [
        "Windows throughout the main home are 1985 Andersen Perma-Shield double-hung, dual-pane. The addition windows (2003) are Pella ProLine, also double-hung dual-pane. Both were good product choices for their eras but are now showing age.",
        "Six units on the original ranch portion have failed seals — visible condensation between panes, characteristic clouding. These are the highest-leverage replacements on the property. Each failed-seal window leaks ~40% more heat than a sound dual-pane, and all six are on high-exposure elevations.",
        "The addition's Pella ProLine windows (2003) are still performing — no seal failures yet, though they are approaching the 25-year mark. Expect 2–4 seal failures in the next 5 years; budget accordingly.",
        "Hardware is fully functional on all units. The 2003 addition has a few sticky operators but nothing binding.",
      ],
      specs: [
        { label: "Main Home Windows", value: "22 Andersen Perma-Shield (1985) — dual-pane" },
        { label: "Addition Windows", value: "12 Pella ProLine (2003) — dual-pane" },
        { label: "Failed Seal Count", value: "6 (all on original ranch)" },
        { label: "Avg U-Factor (1985 Andersen)", value: "0.48 (legacy — current std 0.30)" },
        { label: "Manufacturer Warranty", value: "Lapsed (1985) / 20-yr ProLine (2003, expires 2028)" },
      ],
      tiers: {
        essential: { price: "$9,800 – $15,500", description: "Replace 6 failed-seal windows with Andersen 400 Series Tilt-Wash matching existing profile." },
        enhanced: { price: "$38,000 – $62,000", description: "Replace all 22 original-ranch windows with Andersen 400 Series, add low-E + argon fills, full capping." },
        signature: { price: "$95,000 – $145,000", description: "Full replacement (main + addition) with Marvin Elevate fiberglass-clad, triple-pane on north/west, full trim replacement inside and out." },
      },
      timing: "Essential: before winter 2026. Full replacement: 2027–2028.",
      recommendations: [
        "Replace failed-seal windows this fall — each leaking unit costs ~$140/yr in extra heating/cooling",
        "When specifying replacements, stay with Andersen — their size stock matches original 1985 rough openings",
      ],
      images: photosFor("modern_windows", 2),
    },

    // ─── 5. Kitchen ────────────────────────────────────────────────
    {
      page_key: "kitchen",
      title: "Kitchen",
      group_name: "interior-utility",
      condition_rating: "Fair",
      sort_order: 4,
      narrative: [
        "The kitchen was last remodeled in 2005 — maple cabinets with tumbled-marble backsplash, granite counters, tile floor. Style is mid-2000s transitional; the quality is fine but the design is dated (raised-panel cabinets, tumbled backsplash, slate-inset tile floor pattern). Family now eats almost all meals at the 38\" island which is undersized for their usage.",
        "Appliances are a mixed vintage: GE Profile PGB920 30\" gas range (2005 — functional but loud fan, discolored griddle), LG InstaView LRFXS2503 side-by-side (2020 — excellent), Bosch SHEM3AY52N 500 Series dishwasher (2018 — excellent). The GE range is the obvious upgrade target.",
        "The most significant design constraint is the wall separating kitchen from family room. The Martinezes want this wall removed for open-concept living. Structural review confirms it is load-bearing — removal requires a beam (~$12–18k for the beam + LVL installation alone, before finish work).",
      ],
      specs: [
        { label: "Last Remodel", value: "2005 (cabinets, counters, backsplash, floor)" },
        { label: "Cabinets", value: "Maple raised-panel, amber stain" },
        { label: "Counters", value: "Ubatuba granite (2005)" },
        { label: "Backsplash", value: "Tumbled marble 3x6 subway (2005)" },
        { label: "Range", value: "GE Profile PGB920 30\" gas (2005)" },
        { label: "Refrigerator", value: "LG InstaView LRFXS2503 (2020)" },
        { label: "Dishwasher", value: "Bosch 500 Series SHEM3AY52N (2018)" },
        { label: "Load-bearing wall (for open concept)", value: "Confirmed — removal requires LVL beam" },
      ],
      tiers: {
        essential: { price: "$14,500 – $24,000", description: "Repaint cabinets white, replace tumbled backsplash with current ceramic, new range (Bosch 800 Series), counter-to-ceiling pendant lighting, island expansion to 54\"." },
        enhanced: { price: "$78,000 – $115,000", description: "Remove wall to family room (LVL beam engineered), new Shaker cabinetry, quartz counters, porcelain-tile floor, new island sized to 96\", Wolf 30\" dual-fuel range, integrated fridge panel." },
        signature: { price: "$135,000 – $185,000", description: "Full gut with walk-in pantry addition, custom inset cabinetry, Calacatta quartz, Wolf 36\" dual-fuel, SubZero 48\" fridge, pot filler, scullery area off kitchen." },
      },
      timing: "Enhanced tier target: build 2027 (design 2026).",
      recommendations: [
        "Don't replace the range without deciding on the remodel scope — Bosch 800 is a bridge; Wolf 30\" DF is the destination",
        "Engage structural engineer NOW for wall removal feasibility — LVL span is the constraint that drives design",
      ],
      images: photosFor("kitchen_transitional", 3),
    },

    // ─── 6. Primary Suite (original 1985 — needs update) ──────────
    {
      page_key: "primary-bedroom",
      title: "Primary Suite",
      group_name: "interior-bedrooms",
      condition_rating: "Fair",
      sort_order: 5,
      narrative: [
        "The primary suite is the 2003 addition — 320 sf bedroom + walk-in closet + attached bath. Bedroom and closet are in fine condition. The bath, however, is the original 1985 bath (kept from the pre-addition ranch) with 5×5 alcove tub, tile tub surround, Formica vanity, and plastic shower curtain. It has not been touched since 1985 and shows it.",
        "More concerning than style: the tile grout has been repeatedly patched, and inspection showed soft backing behind two tiles near the showerhead — early evidence of moisture intrusion. This is not yet a structural problem but WILL become one within 18–24 months. Addressing it before failure is significantly cheaper than remediating after.",
        "The Martinezes have flagged this as the highest-priority vision project on their list. They want to expand the bath by taking over the current guest bedroom next door — the plumbing wall is shared, so the conversion is structurally straightforward. Enhanced tier target.",
      ],
      specs: [
        { label: "Bedroom Age", value: "2003 (addition)" },
        { label: "Bath Age", value: "1985 (original ranch bath — never updated)" },
        { label: "Tub", value: "1985 fiberglass alcove (5×5)" },
        { label: "Surround", value: "1985 4×4 ceramic tile w/ repeated grout patching" },
        { label: "Shower Head", value: "Original 1985 fixed-head" },
        { label: "Vanity", value: "Formica top, 1985 — delaminating at edges" },
        { label: "Moisture Evidence", value: "Soft tile backing near showerhead (2 tiles)" },
      ],
      tiers: {
        essential: { price: "$18,000 – $28,000", description: "Full bath gut inside existing footprint: new tub-shower combo, all fixtures, tile floor, new vanity (quartz top, 48\"), re-plumb to PEX-A, moisture-tolerant wall board." },
        enhanced: { price: "$58,000 – $95,000", description: "Expand into guest bedroom: double-vanity, walk-in shower with bench, freestanding tub, heated floor, custom tile pattern." },
        signature: { price: "$135,000 – $210,000", description: "Full primary-suite rebuild — combine bedroom + guest bedroom into a 650 sf suite with spa bath, dressing room, built-in dresser wall, fireplace, sitting area." },
      },
      timing: "Essential: Year 1 priority (moisture risk). Enhanced/Signature: 2027–2028.",
      recommendations: [
        "Address the moisture risk this year regardless of remodel scope — even a temporary re-tile buys you planning time",
        "If committing to Signature vision, plan the primary-suite project BEFORE the kitchen so the family isn't living through two major disruptions simultaneously",
      ],
      images: photosFor("bathroom_dated", 2),
    },

    // ─── 7. HVAC ───────────────────────────────────────────────────
    {
      page_key: "primary-furnace",
      title: "Heating & Cooling System",
      group_name: "systems-hvac",
      condition_rating: "Good",
      sort_order: 6,
      narrative: [
        "HVAC was modernized in 2019 with a Trane XR16 heat pump (4-ton, SEER 16) paired with a Trane XV80 80% AFUE gas furnace as backup heat. This is a well-sized, well-matched system for a 3,500 sf home in our climate. Ductwork is original 1985 rectangular galvanized with 2003 additions; no significant leakage observed in visible runs.",
        "Performance is appropriate. Both floors hit setpoint within 30 minutes of thermostat changes. The addition's bonus room above the garage is slightly under-served by the single supply register — consider adding a second register during any future renovation work up there.",
        "Maintenance is consistent: annual tune-ups by Kurtz Heating & Cooling, filter changes every 90 days. The only note is the thermostats — original 2019 Honeywell T6 units without wifi. Adding ecobee smart thermostats would give the family usage visibility and scheduling capability they don't currently have.",
      ],
      health_bar: { label: "HVAC System Life Remaining", current: 7, total: 18, unit: "years (elapsed)" },
      specs: [
        { label: "Heat Pump", value: "Trane XR16 4-ton (2019) — SEER 16" },
        { label: "Backup Furnace", value: "Trane XV80 80% AFUE (2019)" },
        { label: "Ductwork", value: "1985 rectangular galvanized + 2003 additions" },
        { label: "Thermostats", value: "Honeywell T6 — 2 zones (no smart)" },
        { label: "Service Contract", value: "Kurtz H&C annual (current)" },
        { label: "Filter Schedule", value: "90-day replacement (consistent)" },
      ],
      tiers: {
        essential: { price: "$650 – $1,200", description: "Upgrade thermostats to ecobee Premium, add bonus-room supply register." },
        enhanced: { price: "$4,500 – $7,800", description: "Full duct seal + insulation survey, add zoning dampers for addition, add whole-home humidifier (Aprilaire 600)." },
        signature: { price: "$22,000 – $38,000", description: "Upgrade to Trane XV20i variable-speed heat pump + modulating furnace, full zoning with 4 zones, dedicated bonus-room mini-split, air purification." },
      },
      timing: "Essential: Year 1. Major: 2037+ (end of current system life).",
      recommendations: [
        "Smart thermostats are a cheap win — $650 for meaningful visibility into usage",
        "Address bonus-room comfort before any renovation work up there makes access harder",
      ],
      images: photosFor("hvac_modern", 2),
    },

    // ─── 8. Electrical ─────────────────────────────────────────────
    {
      page_key: "electrical-system",
      title: "Electrical System",
      group_name: "systems-mechanical",
      condition_rating: "Good",
      sort_order: 7,
      narrative: [
        "The main service was upgraded from 100A to 200A in 2015 with a Siemens PN2040B1200C panel in the basement. All original 1985 aluminum branch wiring (which caused the 2015 upgrade) was replaced with copper at the same time. Current work is compliant with modern codes.",
        "GFCI protection is present in all required locations: kitchen, baths, outdoor receptacles, laundry, garage. AFCI breakers were installed on all bedroom circuits in 2015.",
        "Smoke and CO detectors are hardwired with battery backup — 8 units total, all within service life. Added in 2015 during the panel upgrade. No concerns.",
        "Only note: the garage EV-charging receptacle is a standard 240V 50A (NEMA 14-50) installed in 2020 for a Chevy Bolt. If the family plans to add a second EV (David has mentioned a Tesla Model Y), the panel has sufficient capacity but the current receptacle is not near the passenger-side parking spot.",
      ],
      specs: [
        { label: "Main Service", value: "200A copper (2015)" },
        { label: "Main Panel", value: "Siemens PN2040B1200C" },
        { label: "Wiring", value: "Copper throughout (2015 rewire from original aluminum)" },
        { label: "GFCI Coverage", value: "All required locations" },
        { label: "AFCI Coverage", value: "Bedroom circuits" },
        { label: "Smoke/CO Detectors", value: "8 hardwired (2015) — interconnected" },
        { label: "EV Receptacle", value: "NEMA 14-50 (2020) — garage driver side only" },
      ],
      tiers: {
        essential: { price: "$850 – $1,500", description: "Add second NEMA 14-50 receptacle for passenger-side parking, full panel schedule + labeling." },
        enhanced: { price: "$4,500 – $7,800", description: "Add whole-house surge protection, Tesla Wall Connector + dedicated 60A circuit for Model Y readiness, upgrade exterior receptacles to weather-resistant." },
        signature: { price: "$18,000 – $28,000", description: "Add home battery backup (Tesla Powerwall 3 or Enphase IQ10) with solar-ready transfer switch." },
      },
      timing: "Essential: before second EV purchase. Enhanced: 2027.",
      recommendations: [
        "Confirm Tesla Model Y purchase timeline before committing to Essential tier — drives receptacle placement",
        "If solar is in the long-term plan, specify battery-ready panel NOW even if not installing yet",
      ],
      images: photosFor("electrical_panel", 2),
    },

    // ─── 9. Plumbing ───────────────────────────────────────────────
    {
      page_key: "plumbing-system",
      title: "Plumbing System",
      group_name: "systems-mechanical",
      condition_rating: "Good",
      sort_order: 8,
      narrative: [
        "A full re-pipe was completed in 2015 — all distribution piping replaced with PEX-A. This was the right call for an aluminum-and-galvanized era home and resolves what would otherwise be the highest-risk category on the property. All drain lines were also inspected and the original 1985 cast-iron was found sound.",
        "Water heater is a Bradford White RG250T6N 50-gallon gas (2020), performing well. Lifespan on these tanks is typically 8–12 years — this one is on track. No visible corrosion, sacrificial anode reportedly checked in 2024.",
        "Main shut-off is located in the basement, clearly labeled, with a quarter-turn ball valve. Emergency shut-offs are present under each sink and at each toilet.",
        "No softener installed. Fairlawn's municipal water is moderately hard (~7–9 gpg) and the Martinezes have mentioned kettle scaling and bath-tub ring. A softener would pay back through appliance and fixture longevity.",
      ],
      specs: [
        { label: "Distribution", value: "PEX-A (2015 re-pipe)" },
        { label: "Drain Lines", value: "Original 1985 cast iron — sound" },
        { label: "Water Heater", value: "Bradford White RG250T6N 50gal gas (2020)" },
        { label: "Water Heater Warranty", value: "6-year — expires 2026" },
        { label: "Water Hardness", value: "~7–9 gpg (moderately hard)" },
        { label: "Softener", value: "None" },
        { label: "Main Shut-off", value: "Ball valve, basement SE corner" },
      ],
      tiers: {
        essential: { price: "$2,200 – $3,600", description: "Install Kinetico or Culligan whole-house softener + carbon filter, service anode rod on water heater." },
        enhanced: { price: "$8,500 – $14,000", description: "Softener + filter + hot water recirculation loop (instant hot at all fixtures) + leak detector + whole-house shut-off automation." },
        signature: { price: "$18,000 – $28,000", description: "Full modernization including tankless water heater (Rinnai RU199iN), softener, filtration, hot water recirc, smart leak detection + shutoff at each fixture." },
      },
      timing: "Essential: Year 1. Tankless: consider at 2030 water heater replacement.",
      recommendations: [
        "Install softener this year — payback is fixture + appliance lifespan",
        "Water heater is a solid 4–6 more years — don't replace early unless kitchen renovation requires relocation",
      ],
      images: photosFor("plumbing_pipes", 2),
    },

    // ─── 10. Deck & Outdoor Structures ────────────────────────────
    {
      page_key: "deck-patio",
      title: "Deck & Outdoor Structures",
      group_name: "exterior-structures",
      condition_rating: "Poor",
      sort_order: 9,
      narrative: [
        "The 24×16 rear deck is 1995 pressure-treated pine — original to the home, 31 years old. Deck boards have been repeatedly replaced (some 2010, some 2018) but the structural framing and posts are original. Inspection identified two posts with rot at ground contact, joist hangers showing corrosion, and the ledger board connection to the house is marginal by modern code (lagged bolts without flashing).",
        "This is genuinely the highest-risk item on the property. A deck collapse from a rotted post is rare but catastrophic — and the Martinezes entertain 10–15 people regularly on this deck. At minimum, the structural components need attention this year.",
        "Also present: a 1990s brick patio (sunken pavers, drainage issues) and a small garden shed (8×10, 1998, functional). Neither urgent but noted.",
      ],
      specs: [
        { label: "Deck Size", value: "24 × 16 feet" },
        { label: "Deck Age", value: "31 years (1995)" },
        { label: "Material", value: "Pressure-treated pine" },
        { label: "Rotted Posts Identified", value: "2 (both ground-contact)" },
        { label: "Joist Hangers", value: "Corrosion observed" },
        { label: "Ledger Connection", value: "Lag bolts — not flashed (pre-code)" },
        { label: "Railings", value: "Original pine balusters — several loose" },
      ],
      tiers: {
        essential: { price: "$6,500 – $11,500", description: "Replace 2 rotted posts, all joist hangers, re-secure and flash ledger board, tighten all railings. Makes the deck safe for another 3–5 years." },
        enhanced: { price: "$28,000 – $42,000", description: "Full deck rebuild: new joists + composite decking (Trex Transcend), cable railings, LED stair lighting, expand to 16×22 footprint." },
        signature: { price: "$68,000 – $125,000", description: "Full outdoor-living program: composite deck + pergola + outdoor kitchen (grill, prep space, fridge), built-in firepit, landscape lighting, integrated audio." },
      },
      timing: "Essential: priority 1 (this spring). Enhanced/Signature: 2027–2028.",
      recommendations: [
        "Do NOT defer the structural repair — liability risk is real",
        "If pursuing Enhanced or Signature tiers, commit to Essential this year regardless — demo cost is similar either way",
      ],
      images: photosFor("deck_worn", 2),
    },

    // ─── 11. Strategic Roadmap ────────────────────────────────────
    {
      page_key: "strategic-roadmap",
      title: "Strategic Roadmap & Investment Timeline",
      group_name: "information",
      condition_rating: "Good",
      sort_order: 10,
      narrative: [
        "The Brookhaven roadmap is driven by the family's clear vision: open-concept kitchen + expanded primary suite + new deck. The question is sequencing, because doing them in the wrong order creates significant logistical pain.",
        "Year 1 (2026) is safety + highest-risk items: deck structural repair, 6 failed-seal windows, primary-bath moisture remediation (minimum tier). Plus establish architect relationships for the 2027 vision projects.",
        "Year 2 (2027) is one of the vision projects — our recommendation is primary-suite expansion FIRST, not kitchen. Reason: the family lives day-to-day in the kitchen; a kitchen renovation without alternative cooking space is brutal. The primary-suite project displaces them from one room, not the entire household.",
        "Year 3 (2028) is kitchen renovation + deck rebuild (bundled). Once the primary-suite project is complete, the family can absorb a kitchen project with the new suite as a comfortable refuge.",
      ],
      specs: [
        { label: "Year 1 Budget Range", value: "$48k – $78k (safety + planning)" },
        { label: "Year 2 Budget Range", value: "$135k – $210k (primary suite)" },
        { label: "Year 3 Budget Range", value: "$105k – $160k (kitchen + deck)" },
        { label: "3-Year Total Range", value: "$288k – $448k" },
        { label: "Value Impact Estimate", value: "$285k+ at Fairlawn comps" },
      ],
      timing: "Active plan — review semi-annually",
      recommendations: [
        "Interview architects for primary-suite project in fall 2026 — builds 10-month design lead for spring 2027 start",
        "Time kitchen renovation so it begins October 2028 at earliest — finished before the holidays of 2029",
      ],
      images: photosFor("ranch_exterior", 1),
    },

    // ─── 12. Safety ───────────────────────────────────────────────
    {
      page_key: "safety-detection",
      title: "Safety & Life Systems",
      group_name: "safety-detection",
      condition_rating: "Good",
      sort_order: 11,
      narrative: [
        "Safety coverage is solid baseline. Smoke and CO detectors are hardwired and interconnected — a fire anywhere in the home triggers alarms everywhere. Eight units cover all required areas including basement, mechanical spaces, and each bedroom. Units are 2015 vintage; lifespan is 10 years, so replacement is due within 18 months.",
        "Radon test from February 2026 returned 2.1 pCi/L — below EPA's action level. No mitigation needed. Recommend retesting every 3–5 years or after any significant basement work.",
        "Fire extinguishers present in kitchen (ABC) and laundry room (ABC); neither has been inspected since installation. Replace both with current-generation units.",
        "No security system or smart locks. Ring doorbell only.",
      ],
      specs: [
        { label: "Smoke/CO Detectors", value: "8 hardwired interconnected (2015)" },
        { label: "Detector Replacement Due", value: "2027" },
        { label: "Radon Reading (Feb 2026)", value: "2.1 pCi/L (below action level)" },
        { label: "Fire Extinguishers", value: "2 (kitchen, laundry) — unchecked" },
        { label: "Security", value: "Ring doorbell only" },
        { label: "Smart Locks", value: "None" },
      ],
      tiers: {
        essential: { price: "$950 – $1,600", description: "Replace all 10 smoke/CO detectors (hardwired First Alert interconnected), new fire extinguishers (2 ABC + 1 Class K for kitchen)." },
        enhanced: { price: "$3,500 – $6,800", description: "Add Ring Alarm Pro system with 8 sensors, smart locks on front + back entries, perimeter lighting." },
        signature: { price: "$18,000 – $28,000", description: "Full smart-home system with security integration, cellular backup, professional monitoring, 24/7 video retention." },
      },
      timing: "Essential: 2027. Enhanced: Year 1 (2026).",
      recommendations: [
        "Replace detectors during any electrical work to minimize trip cost",
        "Consider Enhanced tier — Ring Alarm + smart locks materially improves family security at modest cost",
      ],
      images: photosFor("home_interior", 2),
    },
  ],

  equipment: [
    { name: "Heat Pump", category: "hvac", brand: "Trane", model: "XR16 4-ton TWR048E4R", install_date: "2019-05-10", condition: "good", estimated_replacement_cost: 12500, notes: "SEER 16. Excellent performance; bonus room register under-sized." },
    { name: "Backup Gas Furnace", category: "hvac", brand: "Trane", model: "XV80 TUH1B080A9361A 80% AFUE", install_date: "2019-05-10", condition: "good", estimated_replacement_cost: 5500 },
    { name: "Water Heater", category: "plumbing", brand: "Bradford White", model: "RG250T6N 50gal Gas", install_date: "2020-03-22", warranty_expiry: "2026-03-22", condition: "good", estimated_replacement_cost: 1650 },
    { name: "Main Electrical Panel", category: "electrical", brand: "Siemens", model: "PN2040B1200C 200A 40-space", install_date: "2015-07-08", condition: "good", estimated_replacement_cost: 2800 },
    { name: "Range", category: "appliance", brand: "GE Profile", model: "PGB920SEJSS 30\" 5-burner gas", install_date: "2005-09-10", condition: "fair", estimated_replacement_cost: 2200, notes: "21yr old. Functional; fan is loud; griddle discolored." },
    { name: "Refrigerator", category: "appliance", brand: "LG", model: "InstaView LRFXS2503S 25 cu ft", install_date: "2020-07-14", condition: "good", estimated_replacement_cost: 3200 },
    { name: "Dishwasher", category: "appliance", brand: "Bosch", model: "SHEM3AY52N 500 Series", install_date: "2018-11-02", condition: "good", estimated_replacement_cost: 1100 },
    { name: "EV Charging Receptacle", category: "electrical", brand: "Leviton", model: "NEMA 14-50 50A (for Chevy Bolt)", install_date: "2020-01-15", condition: "good", estimated_replacement_cost: 850, notes: "Garage driver-side only. Second receptacle planned for Model Y." },
  ],

  projects: [
    // Priority 1 — Deck structural repair
    {
      title: "Deck Structural Repair",
      project_type: "renovation", priority: "high", status: "active", phase: "scoping",
      description: "Replace 2 rotted posts, corroded joist hangers, re-secure and flash ledger board. Safety priority.",
      estimated_cost: 8500, budget: 10000, contingency_pct: 15, percent_complete: 10,
      estimated_start_date: "2026-05-05", end_date: "2026-05-20",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Contractor selection + structural scope", status: "in_progress", sort_order: 0 },
        { name: "Materials order + permits", status: "not_started", sort_order: 1 },
        { name: "Repair execution", status: "not_started", sort_order: 2 },
        { name: "Inspection + final walkthrough", status: "not_started", sort_order: 3 },
      ],
    },
    // Priority 1 — Failed-seal windows
    {
      title: "Failed-Seal Window Replacement (6 units)",
      project_type: "renovation", priority: "high", status: "planning", phase: "scoping",
      description: "Replace 6 Andersen Perma-Shield windows on high-exposure elevations with Andersen 400 Series Tilt-Wash matching existing profile.",
      estimated_cost: 12500, budget: 14500, contingency_pct: 12, percent_complete: 0,
      estimated_start_date: "2026-09-08", end_date: "2026-10-05",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Measure + order", status: "not_started", sort_order: 0 },
        { name: "Installation", status: "not_started", sort_order: 1 },
        { name: "Trim + caulk finish", status: "not_started", sort_order: 2 },
      ],
    },
    // Vision — Primary suite expansion
    {
      title: "Primary Suite Expansion & Spa Bath",
      project_type: "renovation", priority: "medium", status: "planning", phase: "pre-design",
      description: "Expand primary suite by absorbing adjacent guest bedroom. Double-vanity, walk-in shower, freestanding tub, heated floor, custom tile. Enhanced tier target ~$75k.",
      estimated_cost: 75000, budget: 88000, contingency_pct: 15, percent_complete: 0,
      estimated_start_date: "2027-03-01", end_date: "2027-06-30",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Architect selection + concept", status: "not_started", sort_order: 0 },
        { name: "Design development", status: "not_started", sort_order: 1 },
        { name: "Permits + bidding", status: "not_started", sort_order: 2 },
        { name: "Demo + rough-in", status: "not_started", sort_order: 3 },
        { name: "Finishes + fixtures", status: "not_started", sort_order: 4 },
      ],
    },
    // Vision — Kitchen open-concept
    {
      title: "Kitchen Open-Concept Renovation",
      project_type: "renovation", priority: "medium", status: "planning", phase: "pre-design",
      description: "Remove load-bearing wall to family room (LVL beam), new Shaker cabinetry, quartz counters, Wolf range. Enhanced tier ~$95k.",
      estimated_cost: 95000, budget: 110000, contingency_pct: 15, percent_complete: 0,
      estimated_start_date: "2028-09-15", end_date: "2029-01-20",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Structural engineer + wall removal plan", status: "not_started", sort_order: 0 },
        { name: "Architect + cabinet design", status: "not_started", sort_order: 1 },
        { name: "Permits + bidding", status: "not_started", sort_order: 2 },
        { name: "Demo + wall removal", status: "not_started", sort_order: 3 },
        { name: "Cabinet + finish installation", status: "not_started", sort_order: 4 },
      ],
    },
  ],

  invoices: [
    {
      invoice_number: "HCH-2026-007", type: "invoice", title: "Initial Home Clarity Assessment",
      description: "Full-home walkthrough + report authoring — Brookhaven Residence",
      status: "paid", issue_date: "2026-02-25", due_date: "2026-03-10", paid_date: "2026-03-05",
      subtotal: 3950, tax: 0, total: 3950, balance_due: 0,
      line_items: [
        { description: "On-site home assessment", quantity: 1, unit_price: 2000, total: 2000, item_type: "service" },
        { description: "Report authoring + photography", quantity: 1, unit_price: 1500, total: 1500, item_type: "service" },
        { description: "Radon testing + analysis", quantity: 1, unit_price: 450, total: 450, item_type: "service" },
      ],
    },
    {
      invoice_number: "HCH-2026-022", type: "invoice", title: "Deck Repair — Draw 1 of 2",
      description: "50% deposit for deck structural repair project. Materials + mobilization.",
      status: "pending", issue_date: "2026-04-15", due_date: "2026-04-30",
      subtotal: 4250, tax: 0, total: 4250, balance_due: 4250,
      line_items: [
        { description: "Deck structural repair — 50% draw", quantity: 1, unit_price: 4250, total: 4250, item_type: "milestone" },
      ],
    },
    {
      invoice_number: "HCH-2026-023", type: "invoice", title: "Primary Suite Design Retainer",
      description: "Architect engagement retainer for 2027 primary-suite project. Non-refundable.",
      status: "pending", issue_date: "2026-04-18", due_date: "2026-05-10",
      subtotal: 5500, tax: 0, total: 5500, balance_due: 5500,
      line_items: [
        { description: "Design retainer (Fairlawn Design Group)", quantity: 1, unit_price: 4500, total: 4500, item_type: "service" },
        { description: "HBC advisor oversight (Q2-Q4 2026)", quantity: 10, unit_price: 100, total: 1000, item_type: "service" },
      ],
    },
  ],

  schedule_events: [
    { title: "Initial Home Walkthrough — Completed", event_type: "assessment", status: "completed", event_date: "2026-02-22T10:00:00-05:00", description: "Elena + David + HBC advisor. Full-home assessment + priorities conversation." },
    { title: "Report Delivery + Priorities", event_type: "consultation", status: "completed", event_date: "2026-03-08T14:00:00-05:00", description: "Delivered report + discussed deck + window priorities." },
    { title: "Deck Repair Start", event_type: "project_milestone", status: "scheduled", event_date: "2026-05-05T08:00:00-04:00", description: "Structural repair crew begins work." },
    { title: "Deck Final Walkthrough", event_type: "project_milestone", status: "scheduled", event_date: "2026-05-20T10:00:00-04:00", description: "Sign-off + balance invoice." },
    { title: "Architect Intro — Fairlawn Design Group", event_type: "consultation", status: "scheduled", event_date: "2026-10-14T15:00:00-04:00", description: "First meeting for primary-suite project design." },
    { title: "Annual Review — Brookhaven", event_type: "annual_review", status: "scheduled", event_date: "2027-02-25T11:00:00-05:00", description: "Year-one progress + roadmap refresh." },
  ],

  goals: [
    { title: "Replace Failed-Seal Windows", description: "6 units before winter 2026-27.", target_year: 2026, estimated_budget: 14500, status: "planning" },
    { title: "Deck Structural Repair", description: "Safety priority — structural posts, hangers, ledger.", target_year: 2026, estimated_budget: 10000, status: "planning" },
    { title: "Primary Suite Expansion", description: "Expand into guest bedroom. Enhanced tier spa bath.", target_year: 2027, estimated_budget: 88000, status: "planning" },
    { title: "Open-Concept Kitchen", description: "Remove wall to family room, new Wolf range, full refresh.", target_year: 2028, estimated_budget: 110000, status: "dreaming" },
    { title: "Deck Full Rebuild + Pergola", description: "Composite deck + pergola + outdoor kitchen.", target_year: 2029, estimated_budget: 85000, status: "dreaming" },
  ],

  messages: [
    { from: "creator", content: "Elena + David — report is live in the portal. The deck is the big priority for safety; I've scheduled contractor visits and will have bids for you by April 25th. Everything else is planning-stage." },
    { from: "client", content: "Thanks Adam. Two questions. (1) The deck cost — is $8-10k for the structural repair realistic? (2) We want to start talking architects for the primary suite now even though the build is 2027." },
    { from: "creator", content: "(1) Yes — $8.5k middle-bid range for competent work, assuming no surprise rot once opened up. I'd budget $10k to have contingency. (2) Perfect — I know three firms who do great work in your price range. Let me set up meet-and-greets for late summer. It'll give you runway to develop the program over fall/winter before detailed design in early 2027." },
    { from: "client", content: "Sounds good. Let's do the deck contractor selection this month and schedule architect intros for September or October." },
  ],
};
