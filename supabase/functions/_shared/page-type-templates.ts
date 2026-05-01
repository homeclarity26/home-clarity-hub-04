/**
 * Page-type structural templates.
 *
 * Each template locks the SHAPE of the AI-drafted narrative for a
 * matching page type — what topics it covers, in what order, with what
 * vocabulary. The AI's voice stays free; the structure is enforced.
 *
 * Used by draft-page-narrative to inject a structureGuidance section
 * into the system prompt before the AI writes. Without templates, the
 * AI produces serviceable but inconsistent narratives — every Roof
 * page reads differently. With templates, every Roof page across every
 * report covers the same checklist.
 *
 * findTemplateForPage matches by lowercase substring on slug first,
 * page name as fallback. Multiple templates can theoretically match;
 * the first one wins (order matters — most-specific first).
 */

export interface PageTypeTemplate {
  id: string;
  /** Substrings to look for in the page slug. First-match wins. */
  slugMatchers: string[];
  /** Optional substrings in the page name as a fallback. */
  nameMatchers?: string[];
  /** Locked-order topics the narrative MUST cover. */
  structureGuidance: string;
  /** Domain vocabulary the AI should pull from when relevant. */
  vocabularyHints?: string[];
  /** Optional: required observations for the key_observations array. */
  requiredObservations?: string[];
}

export const PAGE_TYPE_TEMPLATES: PageTypeTemplate[] = [
  // ── SYSTEMS ──────────────────────────────────────────────────────
  {
    id: "system_hvac",
    slugMatchers: ["hvac", "furnace", "boiler", "ac", "air-conditioning", "heat-pump", "geothermal"],
    structureGuidance: `Cover IN THIS ORDER:
1. System type and configuration (split system / package / heat pump / geothermal / forced air / hydronic)
2. Make, model, and install year if known — say "approximate vintage" if uncertain
3. Visible cabinet/coil/refrigerant-line condition
4. Last serviced date (or "service date not yet confirmed")
5. Filter size and last change interval
6. Recommended next service window (annual tune-up, etc.)
7. Replacement timeline if approaching end-of-life (typical AC life 12-15y, furnace 15-20y, heat pump 12-15y)

Be specific — never say "the HVAC works well" without a reason.`,
    vocabularyHints: ["compressor", "evaporator coil", "condenser", "refrigerant lines", "BTU", "SEER", "AFUE", "filter size", "ductwork", "tune-up"],
  },
  {
    id: "system_water_heater",
    slugMatchers: ["water-heater", "water_heater", "tank", "tankless"],
    structureGuidance: `Cover IN THIS ORDER:
1. Type (tank vs tankless), capacity in gallons, fuel (gas / electric / heat-pump)
2. Make, model, install year if known
3. Visible tank condition (rust, sediment streaks, corrosion at fittings)
4. T&P valve and expansion tank presence
5. Anode rod replacement status (every 4-6y for longevity)
6. Recommended action (flush schedule, anode swap, replacement timeline — typical tank life 8-12y)`,
    vocabularyHints: ["BTU input", "first-hour rating", "T&P valve", "expansion tank", "anode rod", "sediment flush", "thermocouple"],
  },
  {
    id: "system_electrical",
    slugMatchers: ["electrical", "panel", "breaker", "service-panel"],
    structureGuidance: `Cover IN THIS ORDER:
1. Service amperage (100A / 150A / 200A / 400A) and panel manufacturer (Square D, Eaton, Siemens, Murray, Federal Pacific, Zinsco)
2. Number of breaker spaces and how many are in use
3. Sub-panel presence and location if any
4. GFCI presence in wet areas (kitchen, bathrooms, garage, exterior, laundry)
5. AFCI presence in bedrooms and living areas (NEC 2008+ requires)
6. Visible aluminum branch wiring or knob-and-tube remnants
7. Recommended attention (panel replacement if Federal Pacific or Zinsco, GFCI/AFCI gap closure, dedicated circuits for high-draw appliances)`,
    vocabularyHints: ["main breaker", "double-pole", "tandem", "neutral bar", "ground bar", "AFCI", "GFCI", "aluminum branch wiring", "knob-and-tube"],
  },
  {
    id: "system_plumbing",
    slugMatchers: ["plumbing", "supply", "drain", "main-shutoff"],
    structureGuidance: `Cover IN THIS ORDER:
1. Main supply material (copper / PEX / galvanized / lead) and approximate vintage
2. Main shutoff location and accessibility
3. Drain/waste material (cast iron / PVC / ABS / orangeburg)
4. Sewer line type and approximate age if known (or "not yet confirmed via scope")
5. Visible leaks, corrosion, or recent repairs
6. Water pressure observation (high / normal / low) and PRV presence
7. Recommended attention (any galvanized supply or orangeburg drain warrants planned replacement)`,
    vocabularyHints: ["copper Type L", "PEX-A vs PEX-B", "PRV (pressure-reducing valve)", "main shutoff", "cleanout", "stack vent"],
  },

  // ── EXTERIOR / ENVELOPE ──────────────────────────────────────────
  {
    id: "exterior_roof",
    slugMatchers: ["roof", "shingles", "underlayment"],
    structureGuidance: `Cover IN THIS ORDER:
1. Material (architectural asphalt / 3-tab / metal / slate / tile / cedar) and pitch
2. Approximate age and remaining life (typical architectural asphalt 25-30y, 3-tab 15-20y, metal 40-50y)
3. Visible condition from ground or drone (granule loss, curling, cupping, missing tabs, moss, sagging)
4. Flashings (chimney, valley, step) and ridge vent condition
5. Gutter/drainage interaction
6. Recommended next service (annual debris clean, decade-mark inspection, replacement window)`,
    vocabularyHints: ["architectural shingle", "3-tab", "ridge vent", "step flashing", "drip edge", "ice and water shield", "underlayment"],
  },
  {
    id: "exterior_siding",
    slugMatchers: ["siding", "cladding", "stucco"],
    structureGuidance: `Cover IN THIS ORDER:
1. Material (vinyl / fiber-cement / wood / engineered wood / brick / stucco / composite)
2. Approximate age and visible condition (chalking, fading, gaps at trim, soft spots)
3. Caulk and trim condition at penetrations
4. Paint or finish age (if applicable — wood and fiber-cement need recoating every 7-15y)
5. Recommended next service (recaulk schedule, refinish window, replacement if EOL)`,
    vocabularyHints: ["fiber-cement (Hardie)", "engineered wood (LP SmartSide)", "vinyl", "EIFS", "weep screed", "rain screen", "kick-out flashing"],
  },
  {
    id: "exterior_windows",
    slugMatchers: ["windows", "glazing"],
    structureGuidance: `Cover IN THIS ORDER:
1. Window count, type (single-hung / double-hung / casement / slider / fixed), and frame material (vinyl / wood / aluminum-clad / fiberglass)
2. Glazing (single / double / triple pane, low-E coating)
3. Approximate age and condition (seal failure between panes, sash operation, hardware integrity)
4. Trim and caulk condition at exterior surrounds
5. Recommended next service (recaulk schedule, full-house replacement timing if approaching EOL — typical vinyl 25-30y, wood 30-40y with maintenance)`,
    vocabularyHints: ["double-hung", "low-E", "argon fill", "sash", "weatherstripping", "balance assembly", "muntin"],
  },
  {
    id: "exterior_doors",
    slugMatchers: ["exterior-door", "entry-door", "patio-door", "front-door", "back-door", "garage-door"],
    structureGuidance: `Cover IN THIS ORDER:
1. Door type and material per opening (entry, patio/sliding, garage)
2. Threshold and weatherstripping condition
3. Lock and deadbolt operation
4. Garage door opener brand and approximate age (typical opener 10-15y; springs ~10-15k cycles)
5. Recommended attention (weatherstrip swap, opener spring inspection, lock rekey if recently moved in)`,
    vocabularyHints: ["fiberglass door", "steel door", "torsion spring", "extension spring", "rolling code opener", "deadbolt"],
  },
  {
    id: "exterior_foundation",
    slugMatchers: ["foundation", "footing", "crawlspace", "slab"],
    structureGuidance: `Cover IN THIS ORDER:
1. Foundation type (poured concrete / block / stone / slab / pier and beam) and approximate vintage
2. Visible cracks (hairline cosmetic vs structural diagonal)
3. Moisture indicators (efflorescence, staining, dampness, active water)
4. Drainage at perimeter (grading, downspout extensions, French drain, sump pump)
5. Recommended attention (crack monitoring, drainage corrections, basement waterproofing if active intrusion)`,
    vocabularyHints: ["poured concrete", "CMU block", "efflorescence", "carbon-fiber strap", "exterior excavation", "interior French drain", "sump pump"],
  },
  {
    id: "exterior_gutters",
    slugMatchers: ["gutter", "downspout", "drainage"],
    structureGuidance: `Cover IN THIS ORDER:
1. Material (aluminum / copper / steel) and size (5" / 6" K-style / half-round)
2. Visible condition (sagging, separations at seams, debris)
3. Downspout count and discharge (extensions away from foundation? splash blocks? underground drain to daylight?)
4. Gutter guards / leaf protection if any
5. Recommended attention (clean schedule, extension upgrades, replacement timing)`,
    vocabularyHints: ["K-style", "half-round", "downspout extension", "splash block", "underground discharge", "gutter guard"],
  },

  // ── INTERIOR / SPACES ────────────────────────────────────────────
  {
    id: "interior_kitchen",
    slugMatchers: ["kitchen"],
    structureGuidance: `Cover IN THIS ORDER:
1. Layout, approximate vintage of cabinets and counters
2. Cabinet condition (boxes, doors, drawer slides, hinges)
3. Countertop material and visible condition (granite / quartz / laminate / butcher block)
4. Backsplash and grout condition
5. Appliance brands and approximate ages (range, hood, refrigerator, dishwasher, microwave, disposal)
6. Plumbing fixtures (faucet brand, sprayer, undersink condition)
7. Lighting and electrical (under-cabinet, GFCI at counters)
8. Recommended attention (any appliance approaching EOL, vision-renovation timing if discussed)`,
    vocabularyHints: ["soft-close hinge", "drawer glide", "honed vs polished granite", "quartz (engineered stone)", "induction range", "GFCI"],
  },
  {
    id: "interior_bathroom",
    slugMatchers: ["bathroom", "primary-bath", "master-bath", "powder-room", "guest-bath", "half-bath"],
    structureGuidance: `Cover IN THIS ORDER:
1. Configuration (full / three-quarter / half) and approximate vintage of finishes
2. Tile and grout condition (floor and shower/tub surround)
3. Fixture brands and ages (toilet, vanity faucet, shower valve, tub spout)
4. Vanity cabinet and countertop condition
5. Ventilation (exhaust fan presence, capacity, vents to exterior or attic)
6. Plumbing visible from below if accessible
7. Recommended attention (regrout cycle, fixture refresh, ventilation upgrade if vented to attic)`,
    vocabularyHints: ["thermostatic shower valve", "regrout", "exhaust fan CFM", "P-trap", "comfort-height toilet", "linear drain"],
  },
  {
    id: "interior_living",
    slugMatchers: ["living-room", "family-room", "great-room", "dining-room", "den", "study", "office"],
    structureGuidance: `Cover IN THIS ORDER:
1. Room dimensions and approximate vintage of finishes
2. Flooring material and condition (hardwood / engineered / laminate / tile / carpet)
3. Wall and ceiling condition (drywall integrity, paint freshness, trim)
4. Windows in this room and natural light orientation
5. HVAC delivery (supply registers, returns, comfort observation)
6. Electrical (outlet count vs furniture layout, switching, lighting fixtures)
7. Recommended attention (refinish flooring, paint refresh, lighting upgrade if discussed)`,
    vocabularyHints: ["select-grade oak", "engineered hardwood", "crown molding", "wainscoting", "5\" baseboard", "supply register", "cold-air return"],
  },
  {
    id: "interior_bedroom",
    slugMatchers: ["bedroom", "primary-bedroom", "master-bedroom", "guest-bedroom", "kids-bedroom"],
    structureGuidance: `Cover IN THIS ORDER:
1. Room dimensions and approximate vintage of finishes
2. Flooring material and condition
3. Closet configuration (reach-in / walk-in / storage capacity)
4. Window count and type (egress compliance — at least one operable window with 5.7 sqft opening)
5. Ceiling fan or lighting fixture
6. HVAC delivery and comfort observation
7. Smoke + CO detector presence
8. Recommended attention (closet upgrade, finish refresh, smoke detector replacement if >10y)`,
    vocabularyHints: ["egress window", "walk-in closet", "ceiling fan downrod", "battery backup smoke detector"],
  },
  {
    id: "interior_basement",
    slugMatchers: ["basement", "lower-level", "rec-room"],
    structureGuidance: `Cover IN THIS ORDER:
1. Finished vs unfinished, approximate vintage if finished
2. Moisture indicators (any staining, efflorescence on walls, dampness, sump activity)
3. Floor and wall finish materials and condition
4. Mechanical room / utility area access and organization
5. Egress (window well at sleeping area? walkout?) for any bedroom or sleeping space
6. Lighting and outlet count
7. Recommended attention (waterproofing if moisture, finish refresh, egress correction if non-compliant)`,
    vocabularyHints: ["egress window well", "vapor barrier", "drop ceiling", "sump basin", "sump pump backup battery"],
  },
  {
    id: "interior_attic",
    slugMatchers: ["attic", "insulation"],
    structureGuidance: `Cover IN THIS ORDER:
1. Attic access type (pull-down stair / scuttle hole / fixed stair) and accessibility
2. Insulation type (blown-in cellulose / fiberglass batts / spray foam) and approximate R-value depth
3. Air sealing visible at top plates, can lights, plumbing penetrations
4. Ventilation balance (intake at soffit, exhaust at ridge or gable)
5. Visible signs of pests, moisture, or roof-deck staining
6. Recommended attention (insulation top-up to R-49+ for climate zone 5+, baffle install if soffit blockage, air-seal pass)`,
    vocabularyHints: ["R-value", "blown cellulose", "kraft-faced batts", "soffit baffle", "ridge vent", "knee wall", "vapor retarder"],
  },
  {
    id: "interior_garage",
    slugMatchers: ["garage"],
    structureGuidance: `Cover IN THIS ORDER:
1. Garage type (attached / detached / under-house) and bay count
2. Door type and opener (covered above in exterior_doors if separate page)
3. Floor condition (cracks, oil staining, sealer)
4. Wall finish (drywall fire separation if attached — required at house wall)
5. Storage capacity and shelving
6. Electrical (outlet count, dedicated circuits, EV charger pre-wire?)
7. Recommended attention (floor sealer, fire-separation patching, EV charger install if discussed)`,
    vocabularyHints: ["fire-rated drywall (Type X)", "epoxy floor coating", "EV charger Level 2", "dedicated 240V circuit"],
  },

  // ── SAFETY ───────────────────────────────────────────────────────
  {
    id: "safety_detection",
    slugMatchers: ["smoke-detector", "co-detector", "carbon-monoxide", "safety", "alarm"],
    structureGuidance: `Cover IN THIS ORDER:
1. Smoke detector count and locations (one per bedroom + one per floor at minimum per code)
2. CO detector count and locations (within 15ft of each sleeping area; required when fuel-fired appliances present)
3. Detector type (battery / hardwired with battery backup / interconnected)
4. Approximate age (replace smoke detectors every 10y, CO every 5-7y)
5. Fire extinguisher presence (kitchen + garage minimum)
6. Recommended attention (gap closure to current code, age-out replacements)`,
    vocabularyHints: ["photoelectric vs ionization", "interconnected", "10-year sealed battery", "ABC dry chemical extinguisher"],
  },

  // ── VISION / STRATEGY ────────────────────────────────────────────
  {
    id: "vision_project",
    slugMatchers: ["vision", "renovation", "addition", "remodel", "project"],
    structureGuidance: `Cover IN THIS ORDER:
1. Client's stated goal in their own words (or paraphrased from intake)
2. Current state of the area being changed
3. Three pricing tiers — Essential / Enhanced / Signature — with brief scope description and ballpark ranges based on intake (do NOT invent numbers if the intake didn't mention budget — say "ranges to be confirmed in scope-of-work step")
4. Sequence considerations (any system EOL that should be addressed before this project — flag explicitly)
5. Permit posture (likely required / may be required / not required)
6. Disclosure: if AKR is the recommended trade partner, name AKR explicitly with the brand-voice transparency rule

Tier discipline:
- Essential = same footprint, refresh finishes only
- Enhanced = some reconfiguration, expanded scope
- Signature = full hotel-level / structural / addition-class scope`,
    vocabularyHints: ["scope of work", "permit posture", "structural change", "load-bearing wall", "footprint", "tier"],
  },

  // ── INFORMATION ──────────────────────────────────────────────────
  {
    id: "executive_summary",
    slugMatchers: ["executive-summary", "summary"],
    structureGuidance: `Cover IN THIS ORDER:
1. Property profile in one sentence (year built, sqft, configuration, location)
2. Overall condition snapshot — name 2-3 strongest areas and 2-3 areas needing near-term attention
3. The three biggest decisions ahead (typically: any approaching-EOL system, any active issue, any vision project on the horizon)
4. Financial posture statement (broad maintenance trajectory + any vision capacity discussed)
5. Why HBC's stewardship approach helps over the next 12 months

Tone: confident advisor. No hedging. No marketing-speak. 4-6 sentences total.`,
    vocabularyHints: ["stewardship", "near-term", "approaching end-of-life", "vision project", "capital plan"],
  },
];

/**
 * Find the first matching template for a page. Returns undefined if no
 * template applies — caller should fall back to a generic prompt.
 */
export function findTemplateForPage(
  pageSlug: string,
  pageName: string,
): PageTypeTemplate | undefined {
  const slug = (pageSlug || "").toLowerCase();
  const name = (pageName || "").toLowerCase();
  for (const t of PAGE_TYPE_TEMPLATES) {
    if (t.slugMatchers.some((m) => slug.includes(m))) return t;
    if (t.nameMatchers && t.nameMatchers.some((m) => name.includes(m))) return t;
  }
  return undefined;
}
