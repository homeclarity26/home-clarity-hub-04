import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
}

const SYSTEM_CHECKLISTS: Record<string, ChecklistItem[]> = {
  roof: [
    { id: "shingle-condition", label: "Shingles in good condition (no curling, cracking, missing)", weight: 15 },
    { id: "flashing", label: "Flashing intact around penetrations", weight: 10 },
    { id: "gutters", label: "Gutters properly attached and draining", weight: 10 },
    { id: "ventilation", label: "Ridge/soffit vents unobstructed", weight: 10 },
    { id: "no-leaks", label: "No active leaks or water staining in attic", weight: 20 },
    { id: "age-appropriate", label: "Roof age within expected lifespan", weight: 15 },
    { id: "no-moss", label: "No moss, algae, or debris accumulation", weight: 10 },
    { id: "decking", label: "Roof decking shows no waviness/sagging", weight: 10 },
  ],
  hvac: [
    { id: "operational", label: "System heats/cools to setpoint", weight: 20 },
    { id: "age", label: "Equipment age within expected lifespan", weight: 15 },
    { id: "noise", label: "No unusual noises during operation", weight: 10 },
    { id: "filter", label: "Filter clean and properly sized", weight: 5 },
    { id: "ductwork", label: "Ductwork sealed and insulated", weight: 10 },
    { id: "thermostat", label: "Thermostat responsive and accurate", weight: 5 },
    { id: "exchanger", label: "Heat exchanger shows no cracks/corrosion", weight: 20 },
    { id: "efficiency", label: "Energy efficiency acceptable for age", weight: 15 },
  ],
  electrical: [
    { id: "panel-capacity", label: "Panel capacity adequate (200A recommended)", weight: 15 },
    { id: "breakers", label: "No tripping breakers or double-taps", weight: 15 },
    { id: "gfci", label: "GFCI protection in wet areas", weight: 15 },
    { id: "grounding", label: "Proper grounding throughout", weight: 10 },
    { id: "wiring", label: "No aluminum wiring or knob-and-tube", weight: 15 },
    { id: "capacity-room", label: "Open breaker slots available", weight: 10 },
    { id: "afci", label: "AFCI protection in bedrooms", weight: 10 },
    { id: "labeling", label: "Panel properly labeled", weight: 10 },
  ],
  plumbing: [
    { id: "supply", label: "Adequate water pressure throughout", weight: 15 },
    { id: "drainage", label: "Drains flow freely, no backups", weight: 15 },
    { id: "water-heater", label: "Water heater functioning, proper temp", weight: 15 },
    { id: "no-leaks", label: "No visible leaks under fixtures", weight: 15 },
    { id: "material", label: "Supply lines in good condition (copper/PEX)", weight: 10 },
    { id: "shutoffs", label: "Shut-off valves accessible and working", weight: 10 },
    { id: "sewer", label: "Sewer/septic in good condition", weight: 10 },
    { id: "hose-bibs", label: "Exterior hose bibs functional", weight: 10 },
  ],
  kitchen: [
    { id: "cabinets", label: "Cabinets sturdy, doors align, hardware works", weight: 15 },
    { id: "countertops", label: "Countertops intact, no chips or damage", weight: 15 },
    { id: "appliances", label: "All appliances functional", weight: 15 },
    { id: "plumbing", label: "Sink/faucet in good condition, no leaks", weight: 10 },
    { id: "ventilation", label: "Range hood vents to exterior", weight: 10 },
    { id: "lighting", label: "Adequate task and ambient lighting", weight: 10 },
    { id: "flooring", label: "Flooring in good condition", weight: 10 },
    { id: "layout", label: "Layout functional (work triangle efficient)", weight: 15 },
  ],
  bathroom: [
    { id: "tile-grout", label: "Tile/grout intact, no cracks or gaps", weight: 15 },
    { id: "ventilation", label: "Exhaust fan works and vents to exterior", weight: 15 },
    { id: "fixtures", label: "Faucets, toilet, and showerhead functional", weight: 15 },
    { id: "caulk", label: "Caulking sealed around tub/shower", weight: 15 },
    { id: "water-damage", label: "No signs of water damage or mold", weight: 15 },
    { id: "toilet", label: "Toilet firmly mounted, doesn't rock", weight: 10 },
    { id: "drainage", label: "Drains properly, no slow drains", weight: 10 },
    { id: "flooring", label: "Floor material waterproof and intact", weight: 5 },
  ],
  general: [
    { id: "visual", label: "Visual condition acceptable", weight: 25 },
    { id: "functional", label: "Functions as intended", weight: 25 },
    { id: "age", label: "Within expected service life", weight: 25 },
    { id: "safety", label: "No safety concerns identified", weight: 25 },
  ],
};

function getChecklistForPage(pageSlug: string): { key: string; items: ChecklistItem[] } {
  const s = pageSlug.toLowerCase();
  if (s.includes("roof")) return { key: "roof", items: SYSTEM_CHECKLISTS.roof };
  if (s.includes("furnace") || s.includes("hvac") || s.includes("heat") || s.includes("air-condition")) return { key: "hvac", items: SYSTEM_CHECKLISTS.hvac };
  if (s.includes("electric")) return { key: "electrical", items: SYSTEM_CHECKLISTS.electrical };
  if (s.includes("plumb") || s.includes("water-heater")) return { key: "plumbing", items: SYSTEM_CHECKLISTS.plumbing };
  if (s.includes("kitchen")) return { key: "kitchen", items: SYSTEM_CHECKLISTS.kitchen };
  if (s.includes("bath")) return { key: "bathroom", items: SYSTEM_CHECKLISTS.bathroom };
  return { key: "general", items: SYSTEM_CHECKLISTS.general };
}

function scoreToRating(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

interface Props {
  pageSlug: string;
  onRate: (rating: string) => void;
}

const ConditionRatingWizard = ({ pageSlug, onRate }: Props) => {
  const { items } = getChecklistForPage(pageSlug);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const score = items.filter((i) => checked.has(i.id)).reduce((s, i) => s + i.weight, 0);
  const pct = Math.round((score / totalWeight) * 100);
  const rating = scoreToRating(pct);

  const ratingColors: Record<string, string> = {
    Excellent: "bg-emerald-100 text-emerald-700",
    Good: "bg-blue-100 text-blue-700",
    Fair: "bg-amber-100 text-amber-700",
    Poor: "bg-orange-100 text-orange-700",
    Critical: "bg-destructive/10 text-destructive",
  };

  const handleApply = () => {
    onRate(rating);
    setOpen(false);
    setChecked(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
          <ClipboardCheck className="w-3.5 h-3.5" />
          Rating Wizard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans">Condition Rating Wizard</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-sans mb-4">
          Check each item that passes inspection. The condition rating will be auto-calculated.
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <label key={item.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox checked={checked.has(item.id)} onCheckedChange={() => toggle(item.id)} className="mt-0.5" />
              <div className="flex-1">
                <span className="text-sm font-sans">{item.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground ml-2">({item.weight}pts)</span>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-sans text-muted-foreground">Score: <strong className="text-foreground">{pct}%</strong></span>
            <Badge className={`${ratingColors[rating]} border-none text-xs font-sans`}>{rating}</Badge>
          </div>
          <Button onClick={handleApply} size="sm" className="font-sans">
            Apply Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionRatingWizard;
