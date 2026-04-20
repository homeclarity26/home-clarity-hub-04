// Home C — The Copperline Residence
// 2021 Modern new-build, 4,200 sf, Hudson OH
// Nearly all Excellent ratings — baseline report. Luxury segment.
// Vision projects: basement finish w/ theater + wine cellar,
// outdoor kitchen + pergola, pool + pool house.

import { photosFor } from "./photos.mjs";

export const COPPERLINE = {
  slug: "copperline",
  email: "demo.copperline@homeclarityhub.test",
  clientName: "Chen-Okonkwo Family",
  clientFullName: "Dr. Priya Chen & Nnamdi Okonkwo",
  property: {
    property_name: "[DEMO] Copperline Estate — Chen-Okonkwo",
    address: "4120 Copperline Way",
    city: "Hudson",
    state: "OH",
    zip: "44236",
    county: "Summit",
    property_type: "single_family",
    estimated_value: 1385000,
    metadata: { demo: true, year_built: 2021, sqft: 4200, bedrooms: 5, bathrooms: 4.5, lot_acres: 1.1 },
  },

  reportTitle: "Home Clarity Report — Copperline Estate",

  pages: [
    // ─── 1. Executive Summary ─────────────────────────────────────
    {
      page_key: "executive-summary",
      title: "Executive Summary",
      group_name: "information",
      condition_rating: "Excellent",
      sort_order: 0,
      narrative: [
        "The Copperline Residence is a 2021 modern-transitional new-build on a 1.1-acre wooded lot in Hudson's Copperline development. The Chen-Okonkwos are the original owners; the home was built by Trescott Custom Homes to a high specification and has been meticulously maintained.",
        "This report serves as baseline documentation. Nearly every system and component is in excellent or better condition. Our work here is less about identifying problems and more about establishing the maintenance rhythm, warranty-awareness timeline, and vision-project roadmap that protects the home's value.",
        "The Chen-Okonkwos have articulated three clear vision priorities: (1) basement build-out including theater + wine cellar + bar, (2) outdoor kitchen and covered pergola extending the patio, and (3) pool with pool house over the next 3–5 years. All are discretionary vision work — none driven by condition.",
        "Priority-1 items for Year 1 are almost all warranty-aware: several product warranties expire in 2026, and we want to exercise any latent-defect claims before those windows close. Nothing urgent. Nothing even close.",
      ],
      health_bar: { label: "Overall Home Health", current: 96, total: 100, unit: "%" },
      specs: [
        { label: "Home Style", value: "Modern transitional custom build" },
        { label: "Year Built", value: "2021 (Trescott Custom Homes)" },
        { label: "Finished Sq Ft", value: "4,200" },
        { label: "Lot Size", value: "1.1 acres (wooded)" },
        { label: "Bedrooms / Baths", value: "5 / 4.5" },
        { label: "Original Owners", value: "Yes" },
      ],
      timing: "Baseline report — active vision-project roadmap spans 2026–2029",
      recommendations: [
        "Initiate builder warranty walk before July 2026 — 5-year structural warranty anniversary",
        "Begin basement architect engagement for 2027 build",
        "Pool feasibility + surveying in 2026 to support 2028 build target",
      ],
      images: photosFor("modern_new_build_exterior", 3),
    },

    // ─── 2. Roof System ───────────────────────────────────────────
    {
      page_key: "roof-system",
      title: "Roof System",
      group_name: "exterior",
      condition_rating: "Excellent",
      sort_order: 1,
      narrative: [
        "The roof is 2021 CertainTeed Landmark Pro 50-year architectural shingle in Georgetown Gray, with copper flashing around chimneys and skylights. This is a quality specification — significantly better than the standard-builder 30-year asphalt most new-build homes receive.",
        "At five years in, the roof is pristine. No observable granule loss, no lifting, no flashing movement. Attic inspection confirmed the deck is dry and ventilation is adequate (ridge + soffit + power-vented attic fan on thermostat).",
        "The three skylights (VELUX VCM) and single solar tube are all in good order. The skylight over the upstairs hallway has been noted by the homeowner to sweat during cold snaps — this is likely a humidity-management issue (not a defect) that we'll address through the bath-fan survey during the warranty walk.",
      ],
      health_bar: { label: "Roof System Life Remaining", current: 5, total: 50, unit: "years (elapsed)" },
      specs: [
        { label: "Roof Material", value: "CertainTeed Landmark Pro 50-year (2021) — Georgetown Gray" },
        { label: "Flashing", value: "Copper (chimneys, skylights)" },
        { label: "Ventilation", value: "Ridge + soffit + power attic fan (thermostat)" },
        { label: "Skylights", value: "3 VELUX VCM + 1 solar tube" },
        { label: "Gutters", value: "6\" copper K-style seamless" },
        { label: "Warranty", value: "CertainTeed SureStart Plus 50-yr (transferable)" },
      ],
      tiers: {
        essential: { price: "$0 – $450", description: "Annual inspection ($300) to maintain warranty. Address skylight humidity via bath-fan work (no-charge warranty item)." },
        enhanced: { price: "$2,800 – $5,500", description: "Add snow retention system above entryway, upgrade attic fan to humidity-driven smart unit, proactive chimney cap replacement." },
        signature: { price: "$28,000 – $48,000", description: "Accent standing-seam copper roof at front gables + porch, full ice-shield extension to ridge, custom copper finials." },
      },
      timing: "Essential: annual. No major work anticipated before 2045.",
      recommendations: [
        "Maintain annual inspection for warranty compliance — $300/yr is cheap insurance",
        "Address skylight sweating during warranty walk (Trescott has 5-year structural latent-defect window through 2026)",
      ],
      images: photosFor("asphalt_shingle_roof", 2),
    },

    // ─── 3. Exterior Siding ───────────────────────────────────────
    {
      page_key: "siding-cladding",
      title: "Exterior Siding & Trim",
      group_name: "exterior",
      condition_rating: "Excellent",
      sort_order: 2,
      narrative: [
        "The home is clad in James Hardie fiber cement lap siding (deep navy finish) with board-and-batten accents on the front gables and stacked-stone veneer at the entryway columns. This is a premium cladding package in both material quality and installation craft.",
        "At five years, the siding shows no observable issues: no fading beyond normal weathering, no caulk separation at joints, no stone veneer efflorescence. All penetrations (hose bibs, dryer vents, outdoor receptacles) are properly flashed.",
        "The only item of note: two stone veneer pieces on the west side of the entry column have developed hairline cracks — cosmetic, likely from thermal expansion. These can be addressed during the builder warranty walk.",
      ],
      specs: [
        { label: "Main Cladding", value: "James Hardie HardiePlank Lap (2021) — Deep Ocean" },
        { label: "Accent", value: "Board-and-batten Hardie, stacked-stone veneer" },
        { label: "Color Finish", value: "ColorPlus factory-applied (30-yr warranty)" },
        { label: "Rain Screen", value: "Present (builder standard on Trescott spec)" },
        { label: "Caulking", value: "OSI Quad Max — factory spec" },
        { label: "Issues Noted", value: "2 hairline cracks in stone veneer (west column)" },
      ],
      tiers: {
        essential: { price: "$0 – $450", description: "Annual walk-and-inspect, address hairline stone cracks via warranty claim." },
        enhanced: { price: "$1,200 – $2,800", description: "Add integrated landscape lighting at column features, upgrade entry stone with flush-mount LED." },
        signature: { price: "$12,000 – $22,000", description: "Full architectural accent upgrade — copper standing-seam column caps, bronze house numbers, integrated monogram plaque." },
      },
      timing: "Essential: annual. Major: 2050+ (siding warranty expires 2051).",
      recommendations: [
        "Submit stone-crack warranty claim within 30 days",
        "Hardie ColorPlus warranty is premium — hold onto original documentation",
      ],
      images: photosFor("fiber_cement_siding", 2),
    },

    // ─── 4. Windows ────────────────────────────────────────────────
    {
      page_key: "windows",
      title: "Windows",
      group_name: "exterior",
      condition_rating: "Excellent",
      sort_order: 3,
      narrative: [
        "All windows are 2021 Pella Architect Series aluminum-clad wood — a top-tier Pella product that meets Energy Star Most Efficient criteria. U-factor is 0.24, SHGC 0.22, with laminated glazing for sound attenuation (the home is near a moderate-traffic road).",
        "Performance is exactly as specified: no condensation, no seal issues, no hardware problems. The front-entry windows have motorized interior blinds (Hunter Douglas Alustra) integrated with the home's Savant control system. These are functioning correctly after five years.",
        "Only minor note: the sliding glass door to the patio has developed a slight drag in the lower track. This is likely a dirty track (family dogs) rather than a mechanical problem. Lubrication and cleaning will resolve.",
      ],
      specs: [
        { label: "Manufacturer/Product", value: "Pella Architect Series aluminum-clad wood (2021)" },
        { label: "U-Factor", value: "0.24 (Energy Star Most Efficient)" },
        { label: "Glazing", value: "Triple-pane with argon + laminated for sound" },
        { label: "Window Count", value: "31 main windows + 4 accent + sliding door" },
        { label: "Motorized Blinds", value: "Hunter Douglas Alustra (Savant-integrated)" },
        { label: "Warranty", value: "Pella 20-year transferable (expires 2041)" },
      ],
      tiers: {
        essential: { price: "$0 – $250", description: "Sliding door track clean + silicone lubricant. Annual window screen inspection." },
        enhanced: { price: "$2,500 – $4,800", description: "Add motorized blinds to remaining primary-suite windows, integrate with Savant timeline automation." },
        signature: { price: "$18,000 – $32,000", description: "Upgrade front-elevation windows to smart glass (SageGlass electrochromic) — tints automatically with sun." },
      },
      timing: "Essential: annual. No major work anticipated.",
      recommendations: [
        "Keep Pella warranty documentation in the property binder",
        "When adding motorized blinds to primary suite, do it during any other Savant system service call",
      ],
      images: photosFor("modern_windows", 2),
    },

    // ─── 5. Kitchen ────────────────────────────────────────────────
    {
      page_key: "kitchen",
      title: "Kitchen",
      group_name: "interior-utility",
      condition_rating: "Excellent",
      sort_order: 4,
      narrative: [
        "The kitchen is a flagship-quality custom installation. Full-overlay inset cabinetry by Amish Country Cabinetry in white oak with rift-cut grain, Calacatta Vagli honed marble counters, Waterworks fixtures, and a professional-grade appliance package. The design is contemporary-transitional with warm natural wood against a cool marble palette.",
        "All appliances are performing exceptionally. The Wolf range hood has noted a minor rattle at the highest fan speed (speed 5) — not affecting function, likely a loose duct section. Can be addressed during the 5-year warranty walk.",
        "Ice-maker in the Sub-Zero has produced slow cycles intermittently — also within warranty window, Sub-Zero has been notified and is scheduling a service visit.",
        "The only design item the Chen-Okonkwos have flagged: they want a second smaller prep island added in the eat-in area for kids' homework and weekend baking. This is a Year-1 discretionary addition, not a remodel.",
      ],
      specs: [
        { label: "Cabinets", value: "Amish Country Cabinetry custom inset — rift white oak" },
        { label: "Counters", value: "Calacatta Vagli honed marble" },
        { label: "Range", value: "Wolf DF36650CSP 36\" dual-fuel, 6-burner (2021)" },
        { label: "Hood", value: "Wolf VC30S 30\" chimney (2021) — minor rattle at speed 5" },
        { label: "Refrigerator", value: "Sub-Zero BI-48SID 48\" panel-ready (2021)" },
        { label: "Dishwasher", value: "Miele G7366 SCVi AutoDos (2021)" },
        { label: "Secondary Oven", value: "Wolf ICBMSS24 24\" built-in steam oven" },
        { label: "Coffee", value: "Miele CVA 7440 plumbed-in coffee machine (2021)" },
        { label: "Island Size", value: "96 × 54 main island + future prep island (planned)" },
      ],
      tiers: {
        essential: { price: "$0 – $1,200", description: "Service Wolf hood + Sub-Zero ice maker under warranty. Marble resealing on 24-month cycle." },
        enhanced: { price: "$18,000 – $32,000", description: "Add second prep island in eat-in area (matching Amish cabinetry + Calacatta Vagli), pendant lighting, refrigerated wine drawer." },
        signature: { price: "$45,000 – $75,000", description: "Scullery buildout — convert pantry to full scullery with second dishwasher, steam oven, and service-side prep sink. Elevates entertaining capability." },
      },
      timing: "Essential: immediate (warranty items). Enhanced: Year 1. Signature: Year 2.",
      recommendations: [
        "File Wolf hood + Sub-Zero warranty claims within 30 days — both are cosmetic but the window closes",
        "If adding prep island, use same Amish shop to maintain grain match — lead time is 12 weeks",
      ],
      images: photosFor("kitchen_luxury_modern", 3),
    },

    // ─── 6. Primary Suite ──────────────────────────────────────────
    {
      page_key: "primary-bedroom",
      title: "Primary Suite",
      group_name: "interior-bedrooms",
      condition_rating: "Excellent",
      sort_order: 5,
      narrative: [
        "The primary suite is 680 sf — bedroom + sitting area + walk-in closet + ensuite bath. Design is modern-minimal: 10-foot ceilings, large-format porcelain tile in the bath, walnut cabinetry in the closet, and a private juliet balcony off the sitting area.",
        "Everything is performing as specified. The bath features a freestanding Victoria + Albert Vetralla soaking tub, walk-in shower with ceiling rain head + body jets, double Robern medicine cabinets with integrated LED.",
        "The walk-in closet was built by Closets by Design with fully-integrated LED lighting, custom drawer inserts, shoe-display shelving, and an island with jewelry drawers. No issues.",
        "Only item: the closet island has been flagged for a second-generation hardware refresh — the original cabinet pulls are light-nickel; the family wants to switch to matte black to match other recent updates.",
      ],
      specs: [
        { label: "Suite Size", value: "680 sf (bedroom + sitting + closet + bath)" },
        { label: "Ceiling Height", value: "10 feet" },
        { label: "Tub", value: "Victoria + Albert Vetralla freestanding" },
        { label: "Shower", value: "Walk-in, ceiling rain head + body jets" },
        { label: "Medicine Cabinet", value: "2× Robern Uplift LED (2021)" },
        { label: "Closet", value: "Closets by Design walnut with island + jewelry drawers" },
        { label: "Floor (bath)", value: "Large-format porcelain, radiant heat" },
      ],
      tiers: {
        essential: { price: "$250 – $850", description: "Hardware refresh on closet island (swap pulls to matte black), refinish walnut shelving with conditioner." },
        enhanced: { price: "$4,500 – $8,500", description: "Add automated closet lighting via Savant, smart mirror upgrade (Kohler Verdera Voice)." },
        signature: { price: "$38,000 – $68,000", description: "Spa tower addition — sauna + steam room accessible from primary bath, wellness design." },
      },
      timing: "Essential: Year 1. Signature: Year 3+ (paired with other vision work).",
      recommendations: [
        "Hardware update is the cheapest suite improvement with highest-visibility impact",
        "If pursuing Signature, design spa tower in coordination with roof-line analysis — dormer added over bath",
      ],
      images: photosFor("primary_bedroom_luxury", 2),
    },

    // ─── 7. HVAC ───────────────────────────────────────────────────
    {
      page_key: "primary-furnace",
      title: "Heating & Cooling System",
      group_name: "systems-hvac",
      condition_rating: "Excellent",
      sort_order: 6,
      narrative: [
        "The HVAC system is a Trane XV20i variable-speed heat pump (18 SEER) paired with a Trane S9V2-VS 97% AFUE variable-speed modulating gas furnace. Four zones with dampers. This is essentially the best residential system Trane sells.",
        "Performance is as-specified. Variable speed means the system almost never cycles on/off in the traditional sense — it modulates continuously to maintain setpoint. This both improves comfort (fewer temperature swings) and reduces energy use (no start-up losses).",
        "Air quality is handled by a whole-home Aprilaire 5000 electronic air cleaner + Aprilaire 700 humidifier + UV-C bulb at the coil. All components are under warranty and functioning.",
        "Thermostats are ecobee Premium, integrated with Savant. The upstairs-east zone has shown occasional temperature anomalies — running 2-3° off setpoint during 90°+ days. Trescott's HVAC sub has been notified and may need to rebalance dampers.",
      ],
      specs: [
        { label: "Heat Pump", value: "Trane XV20i Variable-Speed 4-ton (2021) — 18 SEER2" },
        { label: "Furnace", value: "Trane S9V2-VS97 97% AFUE variable-speed modulating" },
        { label: "Zones", value: "4 (with motorized dampers)" },
        { label: "Air Cleaner", value: "Aprilaire 5000 electronic (2021)" },
        { label: "Humidifier", value: "Aprilaire 700 whole-home" },
        { label: "UV Sanitizer", value: "Aprilaire 480 UV-C at coil" },
        { label: "Thermostats", value: "ecobee Premium — Savant integrated" },
        { label: "Warranty", value: "Trane 10yr parts + compressor (expires 2031)" },
      ],
      tiers: {
        essential: { price: "$0 – $450", description: "Damper rebalance for upstairs-east zone (warranty item), continue quarterly filter replacement." },
        enhanced: { price: "$2,800 – $5,500", description: "Add zoning for basement (when finished), add IAQ monitor, upgrade to smart bypass damper control." },
        signature: { price: "$18,000 – $28,000", description: "Geothermal retrofit — convert heat pump to ground-source via vertical well drilling. 20-30% efficiency gain." },
      },
      timing: "Essential: 90 days. Major: 2035+.",
      recommendations: [
        "File warranty claim for upstairs-east zone rebalance — Trescott covers through 2026",
        "Geothermal signature option is expensive but pays back ~12 years at current rates",
      ],
      images: photosFor("hvac_modern", 2),
    },

    // ─── 8. Electrical ─────────────────────────────────────────────
    {
      page_key: "electrical-system",
      title: "Electrical System",
      group_name: "systems-mechanical",
      condition_rating: "Excellent",
      sort_order: 7,
      narrative: [
        "The home is wired with 400A service — substantially overbuilt vs. the standard 200A — and uses Siemens PN4040B1400CU main panel with two 200A subpanels. This capacity is forward-looking, anticipating EV chargers, pool equipment, and potential future expansions.",
        "All wiring is modern copper NM-B with AFCI and GFCI protection throughout. Whole-home surge protection (Siemens FS140) installed at main. 20kW Generac natural-gas whole-home generator with automatic transfer switch — tested monthly, exercised weekly via scheduler.",
        "Two Tesla Wall Connectors (Gen 3) in garage, one Chargepoint Home Flex — three EV charging positions, all on dedicated 60A circuits. Sufficient capacity for future pool + pool house + Model X expansion.",
        "Smart-home integration is extensive via Savant: lighting (all major rooms + exterior), shades, audio (Sonos-plus), HVAC, security. System is fully commissioned and functional.",
      ],
      specs: [
        { label: "Main Service", value: "400A (2021)" },
        { label: "Main Panel", value: "Siemens PN4040B1400CU + 2× 200A subpanels" },
        { label: "Surge Protection", value: "Siemens FS140 at main" },
        { label: "Generator", value: "Generac 20kW natural-gas w/ auto transfer (2021)" },
        { label: "EV Charging", value: "2× Tesla Wall Connector Gen 3 + 1 Chargepoint Home Flex" },
        { label: "Smart Home", value: "Savant — lighting, shades, audio, HVAC, security" },
        { label: "Exterior Lighting", value: "Integrated landscape lighting (Kichler Pro), Savant-controlled" },
      ],
      tiers: {
        essential: { price: "$0 – $350", description: "Generator service contract with Hudson Power (annual), surge protection warranty review." },
        enhanced: { price: "$12,000 – $22,000", description: "Add Tesla Powerwall 3 battery bank (2 units), solar-ready conduit from roof." },
        signature: { price: "$58,000 – $95,000", description: "Full solar + battery install — 15kW roof array, 3 Powerwalls, NEM agreement with FirstEnergy." },
      },
      timing: "Essential: annual. Solar: 2027 target.",
      recommendations: [
        "Solar economics are excellent for this home (south-facing roof, minimal shading) — pursue in 2027 after confirming pool project scope",
        "Generator should be exercised weekly (already scheduled) — do not lapse",
      ],
      images: photosFor("electrical_panel", 2),
    },

    // ─── 9. Plumbing ───────────────────────────────────────────────
    {
      page_key: "plumbing-system",
      title: "Plumbing System",
      group_name: "systems-mechanical",
      condition_rating: "Excellent",
      sort_order: 8,
      narrative: [
        "All distribution plumbing is PEX-A Uponor with manifold distribution — each fixture has an individual shut-off at the basement manifold. This is the current-best-practice layout for modern luxury homes and adds meaningful convenience for future service work.",
        "Water heating is a Rinnai RU199iN natural-gas tankless unit (199k BTU) with a dedicated hot-water recirculation loop — instant hot water at all fixtures. Performance is excellent; no on-demand delay noted.",
        "Water quality is managed: Kinetico whole-house softener + Kinetico K5 reverse-osmosis drinking water system + PRV (pressure reducing valve) at 60 psi. The softener regenerates on demand, not scheduled — efficient for variable usage.",
        "Leak protection: Moen Flo automatic shut-off installed at main with smart detection. System will shut off incoming water if a leak is detected. Fully integrated with Savant for alerts.",
      ],
      specs: [
        { label: "Distribution", value: "PEX-A Uponor w/ manifold (2021)" },
        { label: "Water Heater", value: "Rinnai RU199iN tankless (2021) — 199K BTU" },
        { label: "Recirculation", value: "Dedicated loop — instant hot at all fixtures" },
        { label: "Softener", value: "Kinetico 2030s (demand-regenerating)" },
        { label: "Drinking Water", value: "Kinetico K5 RO (kitchen + wet bar)" },
        { label: "PRV", value: "60 psi setpoint" },
        { label: "Leak Detection", value: "Moen Flo with automatic shut-off" },
        { label: "Warranty (Rinnai)", value: "15-year heat exchanger (expires 2036)" },
      ],
      tiers: {
        essential: { price: "$0 – $150", description: "Annual Rinnai flush (via service contract), verify Moen Flo sensor health." },
        enhanced: { price: "$8,500 – $14,000", description: "Add whole-house UV disinfection, secondary drinking-water filtration at upstairs bars, dedicated filtration for ice maker." },
        signature: { price: "$18,000 – $28,000", description: "Convert to dual tankless setup for pool + pool house expansion, add pool heater on same loop, heated garage slab." },
      },
      timing: "Essential: annual. Signature: paired with pool project.",
      recommendations: [
        "Enroll Rinnai in annual service contract — scale buildup is the #1 cause of tankless failure in hard-water areas",
        "Confirm Moen Flo battery + cellular backup is active",
      ],
      images: photosFor("plumbing_pipes", 2),
    },

    // ─── 10. Basement (unfinished — vision project) ───────────────
    {
      page_key: "basement",
      title: "Basement — Unfinished (Vision Project)",
      group_name: "interior-unfinished",
      condition_rating: "Excellent",
      sort_order: 9,
      narrative: [
        "The basement is unfinished by choice — the Chen-Okonkwos wanted to wait 5 years to understand how they lived in the home before committing to a finish plan. Trescott pre-wired for future use: roughed-in plumbing for a wet bar, theater room, and full bath. Egress windows are code-compliant (2 on the rear elevation).",
        "Current condition is pristine. 9-foot ceilings, dry floor (vapor barrier + perimeter drain + sump pump in the NE corner), and good light via four daylight windows on the rear-walkout wall. The space is ~1,800 sf usable — substantially more than most basements.",
        "This is the largest vision project on the horizon. The family has sketched a program: media room with Dolby Atmos 7.1.4 speaker layout, wine cellar (climate-controlled, ~500 bottle capacity), wet bar, workout room, and a guest suite with full bath. Total vision tier scope is ~$145k.",
      ],
      specs: [
        { label: "Basement Size", value: "1,800 sf usable (full rear walkout)" },
        { label: "Ceiling Height", value: "9 feet" },
        { label: "Rough-in", value: "Wet bar, theater, full bath (Trescott pre-spec)" },
        { label: "Egress", value: "2 compliant windows, rear walkout" },
        { label: "Daylight", value: "4 daylight windows (rear wall)" },
        { label: "Current Use", value: "Storage + workout mat area" },
        { label: "Sump Pump", value: "Liberty 257 + battery backup" },
      ],
      tiers: {
        essential: { price: "$2,200 – $4,500", description: "Add finish-quality LED lighting, install gym flooring in workout area, add storage system (ClosetMaid Pro)." },
        enhanced: { price: "$85,000 – $135,000", description: "Finish media room (Dolby Atmos 7.1.4, projector, 120\" screen), wet bar, guest bath, workout area — leave wine cellar shell for later." },
        signature: { price: "$145,000 – $215,000", description: "Full basement program: media room + wine cellar (500 bottle climate-controlled) + wet bar + guest suite + workout room + dedicated storage." },
      },
      timing: "Enhanced tier: design Q3 2026, build 2027.",
      recommendations: [
        "Engage theater designer separately from general architect — acoustic design is specialized",
        "Wine cellar HVAC is critical — consider CellarPro vs. WhisperKOOL during design phase",
      ],
      images: photosFor("basement_unfinished", 2),
    },

    // ─── 11. Strategic Roadmap ────────────────────────────────────
    {
      page_key: "strategic-roadmap",
      title: "Strategic Roadmap & Investment Timeline",
      group_name: "information",
      condition_rating: "Excellent",
      sort_order: 10,
      narrative: [
        "The Copperline roadmap is entirely vision-driven. Nothing on this property NEEDS to happen — the question is only which vision investments the family wants to make and when.",
        "Year 1 (2026) is builder-warranty exercise + planning: get the builder back for the 5-year walk (Aug 2026), file all open warranty items, and begin architect engagement for the 2027 basement build. Budget is mostly consulting + planning fees.",
        "Year 2 (2027) is the basement project — the family's highest-ranked vision item. Enhanced-tier scope targets ~$115k all-in. Coordinate with pool planning in parallel so infrastructure (gas lines, pool equipment) is staged correctly.",
        "Year 3–4 (2028–2029) is the outdoor living program: outdoor kitchen + pergola (2028) followed by pool + pool house (2029). These are sequenced so the pool deck design accommodates the outdoor kitchen permanently.",
      ],
      specs: [
        { label: "Year 1 Budget Range", value: "$18k – $35k (warranty + planning)" },
        { label: "Year 2 Budget Range", value: "$115k – $145k (basement Enhanced)" },
        { label: "Year 3 Budget Range", value: "$65k – $95k (outdoor kitchen)" },
        { label: "Year 4 Budget Range", value: "$225k – $325k (pool + pool house)" },
        { label: "4-Year Total Range", value: "$425k – $600k" },
        { label: "Value Impact Estimate", value: "$380k+ (Hudson luxury comps)" },
      ],
      timing: "Active vision plan — review quarterly",
      recommendations: [
        "Builder warranty walk before August 2026 is non-negotiable",
        "Engage both theater designer AND pool designer before 2027 kickoff — infrastructure decisions compound",
      ],
      images: photosFor("modern_new_build_exterior", 1),
    },

    // ─── 12. Safety ───────────────────────────────────────────────
    {
      page_key: "safety-detection",
      title: "Safety & Life Systems",
      group_name: "safety-detection",
      condition_rating: "Good",
      sort_order: 11,
      narrative: [
        "Life-safety systems are comprehensive. Smoke and CO detection is hardwired interconnected throughout (12 units, 2021) via Kidde P4010ACSCO units. Central alarm system is Ring Alarm Pro with 14 sensors, covering all openings on the main and lower levels.",
        "Radon is tested — 2026 reading 1.4 pCi/L, well below action. Fire suppression in the kitchen (10-lb ABC commercial), basement mechanical (5-lb ABC), and garage (10-lb Class D for EV).",
        "The family has expressed interest in central-station monitoring upgrade (currently self-monitored via Ring app). Recommend Brinks or Vivint for professional 24/7 monitoring if the family travels.",
        "Smart locks are in place (Level Bolt on front + mudroom) but NOT integrated with Savant — they operate via Apple Home. Recommend consolidation to simplify everyday use.",
      ],
      specs: [
        { label: "Smoke/CO Detectors", value: "12 hardwired interconnected Kidde P4010ACSCO (2021)" },
        { label: "Alarm System", value: "Ring Alarm Pro + 14 sensors" },
        { label: "Monitoring", value: "Self-monitored via Ring app" },
        { label: "Radon Reading", value: "1.4 pCi/L (Jan 2026)" },
        { label: "Fire Extinguishers", value: "3 (kitchen, basement, garage)" },
        { label: "Smart Locks", value: "Level Bolt — Apple Home integration only" },
        { label: "Cameras", value: "6 Ring + 2 Google Nest" },
      ],
      tiers: {
        essential: { price: "$450 – $1,200", description: "Consolidate smart locks into Savant ecosystem (currently split), verify all detector units, annual inspection." },
        enhanced: { price: "$3,500 – $6,800", description: "Professional monitoring contract (Brinks or Vivint), add 4 additional exterior cameras, integrate video + alarm." },
        signature: { price: "$18,000 – $32,000", description: "Full security program: 24/7 monitoring + cellular redundancy + biometric entry (mudroom) + smart window shade automation for \"away\" mode." },
      },
      timing: "Essential: Q3 2026. Enhanced: Year 2.",
      recommendations: [
        "Consolidate smart-lock platform — split ecosystems create security gaps",
        "If family travels 4+ weeks/year, professional monitoring is worth the ~$60/month",
      ],
      images: photosFor("home_interior", 2),
    },
  ],

  equipment: [
    { name: "Heat Pump (Variable-Speed)", category: "hvac", brand: "Trane", model: "XV20i 4-ton TXV-4WXL", install_date: "2021-05-15", warranty_expiry: "2031-05-15", condition: "excellent", estimated_replacement_cost: 18500 },
    { name: "Gas Furnace (Variable-Speed Modulating)", category: "hvac", brand: "Trane", model: "S9V2-VS 97% AFUE TUH2D100A9V5", install_date: "2021-05-15", warranty_expiry: "2031-05-15", condition: "excellent", estimated_replacement_cost: 6800 },
    { name: "Air Cleaner", category: "hvac", brand: "Aprilaire", model: "5000 Electronic Air Cleaner", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 1200 },
    { name: "Humidifier", category: "hvac", brand: "Aprilaire", model: "700 Fan-Powered Whole-Home", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 650 },
    { name: "Tankless Water Heater", category: "plumbing", brand: "Rinnai", model: "RU199iN 199,000 BTU Natural Gas", install_date: "2021-05-15", warranty_expiry: "2036-05-15", condition: "excellent", estimated_replacement_cost: 2800 },
    { name: "Whole-House Water Softener", category: "plumbing", brand: "Kinetico", model: "2030s Demand-Regenerating", install_date: "2021-05-15", warranty_expiry: "2031-05-15", condition: "excellent", estimated_replacement_cost: 3500 },
    { name: "Drinking Water RO System", category: "plumbing", brand: "Kinetico", model: "K5 Drinking Water Station (3-stage)", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 1800 },
    { name: "Smart Leak Shut-off", category: "plumbing", brand: "Moen", model: "Flo Smart Water Monitor + Shut-off", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 950 },
    { name: "Main Electrical Panel", category: "electrical", brand: "Siemens", model: "PN4040B1400CU 400A — w/ 2× 200A Sub", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 5800 },
    { name: "Whole-Home Generator", category: "electrical", brand: "Generac", model: "20kW Natural Gas Guardian w/ ATS", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "excellent", estimated_replacement_cost: 8500, notes: "Exercised weekly; annual service contract with Hudson Power." },
    { name: "EV Charger — Garage Left", category: "electrical", brand: "Tesla", model: "Wall Connector Gen 3", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 850 },
    { name: "EV Charger — Garage Right", category: "electrical", brand: "Tesla", model: "Wall Connector Gen 3", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 850 },
    { name: "EV Charger — Garage Center", category: "electrical", brand: "ChargePoint", model: "Home Flex 50A", install_date: "2021-05-15", condition: "excellent", estimated_replacement_cost: 750 },
    { name: "Range", category: "appliance", brand: "Wolf", model: "DF36650CSP 36\" Dual-Fuel 6-Burner", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "excellent", estimated_replacement_cost: 11500 },
    { name: "Range Hood", category: "appliance", brand: "Wolf", model: "VC30S 30\" Chimney", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "good", estimated_replacement_cost: 2200, notes: "Minor rattle at speed 5 — warranty claim pending." },
    { name: "Refrigerator", category: "appliance", brand: "Sub-Zero", model: "BI-48SID 48\" Built-In Side-by-Side", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "good", estimated_replacement_cost: 18500, notes: "Slow ice cycles — warranty service scheduled." },
    { name: "Steam Oven", category: "appliance", brand: "Wolf", model: "ICBMSS24 24\" Built-in Steam", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "excellent", estimated_replacement_cost: 4200 },
    { name: "Coffee System", category: "appliance", brand: "Miele", model: "CVA 7440 Plumbed Coffee Machine", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "excellent", estimated_replacement_cost: 4800 },
    { name: "Dishwasher — Kitchen", category: "appliance", brand: "Miele", model: "G7366 SCVi AutoDos (Fully Integrated)", install_date: "2021-05-15", warranty_expiry: "2026-05-15", condition: "excellent", estimated_replacement_cost: 2800 },
  ],

  projects: [
    // Priority 1 — Builder warranty walk
    {
      title: "Trescott 5-Year Builder Warranty Walk",
      project_type: "other", priority: "high", status: "active", phase: "scheduling",
      description: "Coordinate builder warranty walk for 5-year structural + latent defect claims. Items on list: skylight humidity, stone veneer hairline cracks, Wolf hood rattle, Sub-Zero ice-maker, HVAC upstairs-east rebalance.",
      estimated_cost: 0, budget: 2500, contingency_pct: 0, percent_complete: 20,
      estimated_start_date: "2026-06-15", end_date: "2026-08-30",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Compile warranty item list", status: "in_progress", sort_order: 0 },
        { name: "Schedule walk with Trescott", status: "not_started", sort_order: 1 },
        { name: "Warranty items executed", status: "not_started", sort_order: 2 },
      ],
    },
    // Vision — Basement finish
    {
      title: "Basement Finish — Media Room + Wine Cellar + Guest Suite",
      project_type: "addition", priority: "medium", status: "planning", phase: "pre-design",
      description: "Finish ~1,800 sf basement. Enhanced tier scope: Dolby Atmos media room, wine cellar, wet bar, guest suite w/ full bath, workout area.",
      estimated_cost: 115000, budget: 135000, contingency_pct: 17, percent_complete: 0,
      estimated_start_date: "2027-04-01", end_date: "2027-12-15",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Design engagement — architect + theater designer", status: "not_started", sort_order: 0 },
        { name: "Permits + bidding", status: "not_started", sort_order: 1 },
        { name: "Framing + MEP rough-in", status: "not_started", sort_order: 2 },
        { name: "Finishes + AV systems", status: "not_started", sort_order: 3 },
        { name: "Final punch + handover", status: "not_started", sort_order: 4 },
      ],
    },
    // Vision — Outdoor kitchen + pergola
    {
      title: "Outdoor Kitchen + Covered Pergola",
      project_type: "addition", priority: "medium", status: "planning", phase: "pre-design",
      description: "Outdoor kitchen w/ Wolf built-in grill, Sub-Zero outdoor fridge, prep counter. Covered pergola extends usable season. Pre-pool work — designed to remain permanent when pool added.",
      estimated_cost: 75000, budget: 88000, contingency_pct: 17, percent_complete: 0,
      estimated_start_date: "2028-04-15", end_date: "2028-07-30",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Design + material selection", status: "not_started", sort_order: 0 },
        { name: "Permit + foundation", status: "not_started", sort_order: 1 },
        { name: "Pergola + kitchen install", status: "not_started", sort_order: 2 },
      ],
    },
    // Vision — Pool
    {
      title: "In-Ground Pool + Pool House",
      project_type: "addition", priority: "medium", status: "planning", phase: "pre-design",
      description: "40×20 gunite pool + attached pool house (changing, half-bath, pool equipment). Integrates with 2028 outdoor kitchen work. Requires gas + electric runs from house.",
      estimated_cost: 275000, budget: 320000, contingency_pct: 17, percent_complete: 0,
      estimated_start_date: "2029-05-01", end_date: "2029-09-15",
      show_in_portal: true, allow_client_messages: true, show_budget_to_client: true, send_milestone_updates: true,
      phases: [
        { name: "Pool designer + survey + soil report", status: "not_started", sort_order: 0 },
        { name: "Permits + excavation", status: "not_started", sort_order: 1 },
        { name: "Pool shell + pool house construction", status: "not_started", sort_order: 2 },
        { name: "Equipment + landscape", status: "not_started", sort_order: 3 },
      ],
    },
  ],

  invoices: [
    {
      invoice_number: "HCH-2026-011", type: "invoice", title: "Initial Home Clarity Assessment",
      description: "Baseline home assessment + report authoring — Copperline Estate",
      status: "paid", issue_date: "2026-03-02", due_date: "2026-03-16", paid_date: "2026-03-06",
      subtotal: 5250, tax: 0, total: 5250, balance_due: 0,
      line_items: [
        { description: "On-site home assessment (full day)", quantity: 1, unit_price: 2400, total: 2400, item_type: "service" },
        { description: "Report authoring + photography", quantity: 1, unit_price: 1800, total: 1800, item_type: "service" },
        { description: "Radon testing + analysis", quantity: 1, unit_price: 450, total: 450, item_type: "service" },
        { description: "Builder warranty documentation audit", quantity: 6, unit_price: 100, total: 600, item_type: "service" },
      ],
    },
    {
      invoice_number: "HCH-2026-025", type: "invoice", title: "Annual Maintenance Retainer Q2–Q4",
      description: "Quarterly advisor retainer: warranty walk coordination, maintenance scheduling, vendor oversight.",
      status: "pending", issue_date: "2026-04-10", due_date: "2026-04-25",
      subtotal: 4500, tax: 0, total: 4500, balance_due: 4500,
      line_items: [
        { description: "Q2–Q4 advisor retainer (3 quarters)", quantity: 3, unit_price: 1500, total: 4500, item_type: "service" },
      ],
    },
    {
      invoice_number: "HCH-2026-026", type: "invoice", title: "Basement Design Engagement — Retainer",
      description: "Non-refundable retainer for basement design engagement w/ Studio Lane + acoustic design partner.",
      status: "pending", issue_date: "2026-04-18", due_date: "2026-05-16",
      subtotal: 9500, tax: 0, total: 9500, balance_due: 9500,
      line_items: [
        { description: "Studio Lane architect retainer (50% of design fee)", quantity: 1, unit_price: 7500, total: 7500, item_type: "service" },
        { description: "Acoustic designer initial consult (Henry Stein Acoustics)", quantity: 1, unit_price: 1200, total: 1200, item_type: "service" },
        { description: "HBC advisor oversight (design phase Q2–Q4 2026)", quantity: 8, unit_price: 100, total: 800, item_type: "service" },
      ],
    },
  ],

  schedule_events: [
    { title: "Initial Home Walkthrough — Completed", event_type: "assessment", status: "completed", event_date: "2026-02-26T13:00:00-05:00", description: "Priya + Nnamdi + HBC advisor. Baseline assessment (pristine home)." },
    { title: "Report Delivery + Vision Planning", event_type: "consultation", status: "completed", event_date: "2026-03-10T18:30:00-05:00", description: "Walked through report + vision project sequencing." },
    { title: "Builder Warranty Walk — Trescott", event_type: "appointment", status: "scheduled", event_date: "2026-07-22T09:00:00-04:00", description: "5-year warranty walk with Trescott. Items logged in warranty list." },
    { title: "Studio Lane — Basement Concept Kickoff", event_type: "consultation", status: "scheduled", event_date: "2026-06-10T16:00:00-04:00", description: "Concept design kickoff for basement project." },
    { title: "Annual Maintenance Review", event_type: "annual_review", status: "scheduled", event_date: "2027-03-02T10:00:00-05:00", description: "Year-one maintenance review + 2027–28 roadmap refresh." },
    { title: "Generator Annual Service", event_type: "maintenance", status: "scheduled", event_date: "2026-09-18T11:00:00-04:00", description: "Generac 20kW annual service (Hudson Power)." },
    { title: "Rinnai Annual Flush", event_type: "maintenance", status: "scheduled", event_date: "2026-10-05T10:00:00-04:00", description: "Annual tankless flush + inspection." },
  ],

  goals: [
    { title: "Complete Builder Warranty Walk", description: "Exercise all latent-defect claims before 5-year window closes.", target_year: 2026, estimated_budget: 0, status: "planning" },
    { title: "Basement Finish — Enhanced Tier", description: "Media room + wine cellar shell + guest suite + wet bar + workout.", target_year: 2027, estimated_budget: 135000, status: "planning" },
    { title: "Outdoor Kitchen + Pergola", description: "Extension of patio for year-round use.", target_year: 2028, estimated_budget: 88000, status: "planning" },
    { title: "Pool + Pool House", description: "40×20 gunite pool + pool house with changing + half-bath.", target_year: 2029, estimated_budget: 320000, status: "dreaming" },
    { title: "Solar + Battery Integration", description: "15kW roof array + 3 Powerwalls (paired w/ pool electrical planning).", target_year: 2027, estimated_budget: 75000, status: "dreaming" },
  ],

  messages: [
    { from: "creator", content: "Priya, Nnamdi — Copperline report is live in your portal. As expected, almost everything is in great shape. The big Year-1 item is coordinating the builder warranty walk — I've flagged six items (skylight, stone veneer, Wolf hood, Sub-Zero ice-maker, HVAC zone, plus one generator item I want to revisit). Scheduling with Trescott for July." },
    { from: "client", content: "Thanks Adam. Question — for the basement, we were thinking of hiring our own designer. What's the HBC role when a homeowner brings their own designer to the table?" },
    { from: "creator", content: "Great question. When you bring your own designer, I act as owner's advocate — I oversee contractor selection, manage bid-leveling, catch scope gaps, coordinate with Trescott on structural items, and keep the project on schedule and on budget. The designer drives vision; I keep the execution clean. If you've got a name, send it my way and I'll interface with them directly." },
    { from: "client", content: "We've been considering Studio Lane (Emily Brooks). She did a basement for friends of ours in Hudson last year and we loved the work. Let's start there." },
  ],
};
