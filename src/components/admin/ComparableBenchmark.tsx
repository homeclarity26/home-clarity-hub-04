import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const BENCHMARK_DATA: Record<string, Record<string, { avgRating: string; pctFair: number; pctPoor: number }>> = {
  "pre-1970": {
    roof: { avgRating: "Fair", pctFair: 45, pctPoor: 30 },
    hvac: { avgRating: "Poor", pctFair: 25, pctPoor: 50 },
    electrical: { avgRating: "Poor", pctFair: 30, pctPoor: 45 },
    plumbing: { avgRating: "Fair", pctFair: 40, pctPoor: 35 },
    kitchen: { avgRating: "Fair", pctFair: 50, pctPoor: 20 },
    bathroom: { avgRating: "Fair", pctFair: 45, pctPoor: 25 },
  },
  "1970-1990": {
    roof: { avgRating: "Fair", pctFair: 50, pctPoor: 20 },
    hvac: { avgRating: "Fair", pctFair: 45, pctPoor: 30 },
    electrical: { avgRating: "Fair", pctFair: 50, pctPoor: 20 },
    plumbing: { avgRating: "Good", pctFair: 35, pctPoor: 15 },
    kitchen: { avgRating: "Fair", pctFair: 55, pctPoor: 15 },
    bathroom: { avgRating: "Fair", pctFair: 50, pctPoor: 15 },
  },
  "1990-2010": {
    roof: { avgRating: "Good", pctFair: 35, pctPoor: 10 },
    hvac: { avgRating: "Good", pctFair: 30, pctPoor: 15 },
    electrical: { avgRating: "Good", pctFair: 25, pctPoor: 10 },
    plumbing: { avgRating: "Good", pctFair: 20, pctPoor: 8 },
    kitchen: { avgRating: "Good", pctFair: 35, pctPoor: 10 },
    bathroom: { avgRating: "Good", pctFair: 30, pctPoor: 10 },
  },
  "2010+": {
    roof: { avgRating: "Good", pctFair: 15, pctPoor: 3 },
    hvac: { avgRating: "Good", pctFair: 15, pctPoor: 5 },
    electrical: { avgRating: "Excellent", pctFair: 10, pctPoor: 2 },
    plumbing: { avgRating: "Good", pctFair: 12, pctPoor: 3 },
    kitchen: { avgRating: "Good", pctFair: 15, pctPoor: 5 },
    bathroom: { avgRating: "Good", pctFair: 12, pctPoor: 3 },
  },
};

const RATING_SCORES: Record<string, number> = {
  Excellent: 5, Good: 4, Fair: 3, Poor: 2, Critical: 1,
};

function getEraKey(yearBuilt: number | null | undefined): string {
  if (!yearBuilt) return "1990-2010";
  if (yearBuilt < 1970) return "pre-1970";
  if (yearBuilt < 1990) return "1970-1990";
  if (yearBuilt < 2010) return "1990-2010";
  return "2010+";
}

function getSystemKey(pageSlug: string): string | null {
  const s = pageSlug.toLowerCase();
  if (s.includes("roof")) return "roof";
  if (s.includes("furnace") || s.includes("hvac") || s.includes("heat") || s.includes("air-condition")) return "hvac";
  if (s.includes("electric")) return "electrical";
  if (s.includes("plumb") || s.includes("water-heater")) return "plumbing";
  if (s.includes("kitchen")) return "kitchen";
  if (s.includes("bath")) return "bathroom";
  return null;
}

interface Props {
  pageSlug: string;
  conditionRating?: string;
  yearBuilt?: number | null;
}

const ComparableBenchmark = ({ pageSlug, conditionRating, yearBuilt }: Props) => {
  const systemKey = getSystemKey(pageSlug);
  if (!systemKey || !conditionRating) return null;

  const era = getEraKey(yearBuilt);
  const benchmark = BENCHMARK_DATA[era]?.[systemKey];
  if (!benchmark) return null;

  const currentScore = RATING_SCORES[conditionRating] || 3;
  const benchmarkScore = RATING_SCORES[benchmark.avgRating] || 3;
  const diff = currentScore - benchmarkScore;

  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-orange-500" : "text-muted-foreground";
  const trendLabel = diff > 0 ? "Above average" : diff < 0 ? "Below average" : "At average";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/50">
      <TrendIcon className={`w-3.5 h-3.5 ${trendColor} flex-shrink-0`} />
      <span className="text-[10px] font-sans text-muted-foreground">
        <span className={`font-medium ${trendColor}`}>{trendLabel}</span>
        {" "}for homes built {era}. Typical rating: <strong>{benchmark.avgRating}</strong> ({benchmark.pctFair}% Fair, {benchmark.pctPoor}% Poor)
      </span>
    </div>
  );
};

export default ComparableBenchmark;
