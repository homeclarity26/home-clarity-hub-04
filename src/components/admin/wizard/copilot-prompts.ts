const PAGE_PROMPTS: Record<string, string> = {
  "roof-system": "Inspect shingles, flashing, gutters, and drainage. Note any lifting, granule loss, or water intrusion signs.",
  "siding-cladding": "Check material condition, paint/stain, caulking, trim, and any signs of moisture damage or rot.",
  "windows": "Note glazing condition, seals, frames, hardware, and any fogging, cracking, or operational issues.",
  "exterior-doors": "Assess door condition, weatherstripping, hardware, thresholds, and security.",
  "gutters-downspouts": "Check for proper pitch, blockages, leaks, downspout discharge, and gutter attachment.",
  "deck-patio": "Inspect decking boards, ledger attachment, posts, railings, and any rot, movement, or structural concerns.",
  "driveway-walkways": "Note cracking, settling, heaving, drainage, and surface condition.",
  "landscaping": "Assess grading near foundation, tree proximity, irrigation, and overall drainage.",
  "kitchen": "Assess cabinet condition, countertops, appliances, ventilation, faucet, garbage disposal, and plumbing under sink.",
  "laundry-room": "Check washer/dryer connections, venting, flooring for moisture, and utility sink if present.",
  "mudroom-entry": "Assess flooring durability, storage, exterior door condition, and moisture management.",
  "basement": "Inspect for water intrusion, efflorescence, floor cracks, sump pump function, egress, and mechanical clearances.",
  "attic": "Note insulation depth and coverage, ventilation (soffit/ridge), signs of moisture or pest intrusion, and sheathing condition.",
  "garage": "Check door operation and auto-reverse, floor condition, overhead storage, fire separation from living space, and CO detector.",
  "primary-furnace": "Note equipment age, filter condition, heat exchanger, flue connections, and last service date.",
  "air-conditioning": "Note equipment age, refrigerant line condition, condensate drain, coil cleanliness, and last service date.",
  "insulation-ventilation": "Assess insulation R-value and coverage, ventilation balance, and any air sealing gaps.",
  "electrical-panel": "Note panel brand, amperage, service age, breaker condition, and any double-taps or evidence of DIY work.",
  "plumbing-system": "Check supply line material, drain condition, water pressure, shutoff valve accessibility, and any active leaks or staining.",
  "water-heater": "Note tank age, fuel type, anode rod service history, pressure relief valve, and flue/venting.",
  "fireplace-chimney": "Assess firebox condition, damper operation, flue liner, cap, crown, and exterior mortar.",
  "foundation": "Inspect visible foundation walls for cracking, bowing, or moisture, and note any settlement patterns.",
  "primary-bathroom": "Check fixtures, tile/grout, ventilation, plumbing under sink, water pressure, and signs of moisture damage.",
  "hall-bathroom": "Check fixtures, tile/grout, ventilation, plumbing under sink, water pressure, and signs of moisture damage.",
  "powder-room": "Check fixtures, tile/grout, ventilation, plumbing under sink, and signs of moisture or odor.",
  "refrigerator": "Note model, age, seal condition, coil cleanliness, ice maker function, and any operational issues.",
  "range-oven": "Note fuel type, igniter/element condition, oven calibration, and range hood operation.",
  "microwave": "Check door seal, turntable, and any sparking or arcing.",
  "dishwasher": "Inspect door seal, spray arms, drain, and detergent dispenser.",
  "garbage-disposal": "Note operation, reset button accessibility, and any leaks under sink.",
  "washer-dryer": "Note age, drum seal, lint trap, and dryer vent path length and cleanliness.",
  "range-hood": "Check CFM rating, filter cleanliness, duct path, and exterior exhaust termination.",
  "fence-gate": "Assess post stability, panel condition, hardware, and gate swing.",
  "shed-outbuilding": "Check roof, siding, floor, doors, and electrical if present.",
  "outdoor-lighting": "Note fixture condition, bulb type, motion sensors, and timer function.",
  "irrigation-sprinklers": "Verify zone coverage, head condition, controller programming, and backflow preventer.",
  "pool-spa": "Inspect equipment (pump, filter, heater), coping, interior surface, and safety barriers.",
  "crawlspace": "Check for moisture, vapor barrier, insulation, structural members, and pest evidence.",
  "workshop": "Assess electrical capacity, ventilation, flooring, and storage.",
};

const ROOM_KEYS = new Set([
  "living-room", "dining-room", "family-room", "home-office", "bonus-room",
  "primary-bedroom", "bedroom-2", "bedroom-3", "bedroom-4",
  "sunroom-screened-porch", "media-room",
]);

const ROOM_PROMPT =
  "Assess floor condition, walls and ceiling, windows, outlets, lighting, closet space, and any moisture or air quality concerns.";

const GENERIC_PROMPT =
  "Describe what you observed during your walkthrough. Note condition, age, and any concerns.";

export function getDraftObservationsPrompt(pageKey: string): string {
  const lower = pageKey.toLowerCase();
  if (PAGE_PROMPTS[lower]) return PAGE_PROMPTS[lower];
  if (ROOM_KEYS.has(lower)) return ROOM_PROMPT;
  // Partial match for custom page keys (e.g. "bedroom-5", "hvac-zone-2").
  for (const [k, v] of Object.entries(PAGE_PROMPTS)) {
    if (lower.includes(k) || k.split("-").some((part) => lower.includes(part) && part.length > 3)) {
      return v;
    }
  }
  return GENERIC_PROMPT;
}
