import type { ChecklistItem } from "@/contexts/WizardContext";

// Default field-side checklist seeded into every new wizard draft.
//
// The list is the consultant's mental model of "what does the AI need to
// build a complete report?" — items are short prompts the consultant ticks
// off as they confirm each observation during the walkthrough. Unchecked
// items at publish time signal gaps in the report's source material.
//
// Group prefixes (Property, Exterior, Systems, Safety, Interior, Vision)
// keep the list scannable when expanded; the renderer treats prefixes as
// plain text — no special grouping logic needed.

const DEFAULT_LABELS: string[] = [
  // Property basics
  "Property: address confirmed against records",
  "Property: year built confirmed",
  "Property: square footage confirmed",
  "Property: bedroom + bathroom counts confirmed",
  "Property: property type confirmed (single-family, condo, etc.)",

  // Exterior / envelope
  "Exterior: roof material identified + approximate age",
  "Exterior: roof condition photos captured",
  "Exterior: siding material + condition photographed",
  "Exterior: foundation type confirmed + visible cracks photographed",
  "Exterior: windows count + type + estimated age",
  "Exterior: exterior drainage observed (gutters, grading)",
  "Exterior: front elevation photo for hero image",
  "Exterior: driveway / walkway condition noted",

  // Major systems
  "HVAC: serial / model plate photographed",
  "HVAC: brand + model + age confirmed",
  "HVAC: last service date asked",
  "HVAC: filter size + last change asked",
  "Water heater: serial plate photographed",
  "Water heater: capacity + fuel type + age confirmed",
  "Electrical: main panel photo (door open) captured",
  "Electrical: panel amperage + breaker count confirmed",
  "Electrical: GFCI / AFCI presence checked",
  "Plumbing: main shutoff location confirmed + photographed",
  "Plumbing: water main material identified (copper / PEX / galv)",
  "Plumbing: sewer line type + age noted (if known)",
  "Gas: meter + shutoff location photographed (if applicable)",

  // Safety
  "Safety: smoke detector count + locations confirmed",
  "Safety: CO detector locations confirmed",
  "Safety: fire extinguisher locations noted",
  "Safety: radon test status asked",
  "Safety: fireplace + chimney inspection date asked (if applicable)",

  // Interior systems + finishes
  "Interior: sump pump present + battery backup status",
  "Interior: whole-home water filter or softener present",
  "Interior: attic insulation type + ventilation observed",
  "Interior: basement moisture / signs of past water observed",
  "Interior: kitchen appliance brands + ages noted",
  "Interior: bathroom fixture ages + visible condition noted",
  "Interior: laundry: washer / dryer brand + age + venting confirmed",
  "Interior: garage door opener brand + age",

  // Vision / strategy
  "Vision: planned renovations or improvements discussed",
  "Vision: budget capacity + timing discussed",
  "Vision: family priorities for the next 12 months confirmed",
  "Vision: end-of-life / sequence-risk items flagged",
];

let counter = 0;
function makeId(): string {
  counter += 1;
  return `chk-default-${counter}`;
}

// Returns a fresh array on every call so React state updates don't share
// references between drafts. The IDs are stable strings (not random) so
// that envelope serialization and resume don't churn IDs unnecessarily.
export function buildDefaultFieldChecklist(): ChecklistItem[] {
  counter = 0;
  return DEFAULT_LABELS.map((label) => ({
    id: makeId(),
    label,
    checked: false,
  }));
}
