import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS_BY_ERA: Record<string, Record<string, { conditionRating: string; lifespanYears: number }>> = {
  "pre-1970": {
    roof: { conditionRating: "Poor", lifespanYears: 25 },
    furnace: { conditionRating: "Poor", lifespanYears: 20 },
    "electrical-panel": { conditionRating: "Poor", lifespanYears: 40 },
    "water-heater": { conditionRating: "Poor", lifespanYears: 12 },
    kitchen: { conditionRating: "Fair", lifespanYears: 25 },
    "primary-bathroom": { conditionRating: "Fair", lifespanYears: 25 },
    windows: { conditionRating: "Poor", lifespanYears: 30 },
    siding: { conditionRating: "Fair", lifespanYears: 40 },
  },
  "1970-1990": {
    roof: { conditionRating: "Fair", lifespanYears: 28 },
    furnace: { conditionRating: "Fair", lifespanYears: 20 },
    "electrical-panel": { conditionRating: "Fair", lifespanYears: 40 },
    "water-heater": { conditionRating: "Fair", lifespanYears: 12 },
    kitchen: { conditionRating: "Fair", lifespanYears: 25 },
    "primary-bathroom": { conditionRating: "Fair", lifespanYears: 25 },
    windows: { conditionRating: "Fair", lifespanYears: 30 },
    siding: { conditionRating: "Good", lifespanYears: 40 },
  },
  "1990-2010": {
    roof: { conditionRating: "Good", lifespanYears: 30 },
    furnace: { conditionRating: "Good", lifespanYears: 20 },
    "electrical-panel": { conditionRating: "Good", lifespanYears: 40 },
    "water-heater": { conditionRating: "Good", lifespanYears: 12 },
    kitchen: { conditionRating: "Good", lifespanYears: 25 },
    "primary-bathroom": { conditionRating: "Good", lifespanYears: 25 },
    windows: { conditionRating: "Good", lifespanYears: 30 },
    siding: { conditionRating: "Good", lifespanYears: 40 },
  },
  "2010+": {
    roof: { conditionRating: "Excellent", lifespanYears: 30 },
    furnace: { conditionRating: "Excellent", lifespanYears: 20 },
    "electrical-panel": { conditionRating: "Excellent", lifespanYears: 40 },
    "water-heater": { conditionRating: "Excellent", lifespanYears: 12 },
    kitchen: { conditionRating: "Excellent", lifespanYears: 25 },
    "primary-bathroom": { conditionRating: "Excellent", lifespanYears: 25 },
    windows: { conditionRating: "Excellent", lifespanYears: 30 },
    siding: { conditionRating: "Excellent", lifespanYears: 40 },
  },
};

function getEra(yearBuilt: number | null | undefined): string {
  if (!yearBuilt) return "1990-2010";
  if (yearBuilt < 1970) return "pre-1970";
  if (yearBuilt < 1990) return "1970-1990";
  if (yearBuilt < 2010) return "1990-2010";
  return "2010+";
}

interface Props {
  yearBuilt?: number | null;
  pageSlug: string;
  onApply: (defaults: { conditionRating?: string; expectedLifespanYears?: number; currentAgeYears?: number }) => void;
}

const SmartDefaults = ({ yearBuilt, pageSlug, onApply }: Props) => {
  const era = getEra(yearBuilt);
  
  // Find matching defaults using partial slug matching
  const findDefaults = () => {
    const defaults = DEFAULTS_BY_ERA[era];
    const slug = pageSlug.toLowerCase();
    for (const [key, vals] of Object.entries(defaults)) {
      if (slug.includes(key)) return vals;
    }
    return null;
  };

  const handleApply = () => {
    const defs = findDefaults();
    if (!defs) {
      toast.info("No smart defaults available for this page type.");
      return;
    }
    const currentAge = yearBuilt ? new Date().getFullYear() - yearBuilt : undefined;
    onApply({
      conditionRating: defs.conditionRating,
      expectedLifespanYears: defs.lifespanYears,
      currentAgeYears: currentAge,
    });
    toast.success(`Applied smart defaults for ${era} era homes`);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={handleApply} title="Auto-fill condition rating and lifespan based on property age">
      <Wand2 className="w-3.5 h-3.5" />
      Smart Defaults
    </Button>
  );
};

export default SmartDefaults;
