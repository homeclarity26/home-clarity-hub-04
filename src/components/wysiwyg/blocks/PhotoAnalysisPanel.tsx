import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Eye, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface PhotoAnalysis {
  photo_url: string;
  condition_rating: string;
  confidence_score: number;
  identified_defects: Array<{
    defect_name: string;
    severity: "low" | "medium" | "high" | "critical";
    location_in_image: string;
    description: string;
  }>;
  estimated_age_years?: number | null;
  recommended_actions: Array<{
    action: string;
    urgency: string;
    estimated_cost_low: number;
    estimated_cost_high: number;
  }>;
  narrative_paragraph: string;
  raw_observations: string[];
  error?: string;
}

interface PhotoAnalysisPanelProps {
  analyses: PhotoAnalysis[];
  isAnalyzing: boolean;
  analyzingCount?: { current: number; total: number };
  currentRating?: string;
  onApplyRating: (rating: string) => void;
  onApplyNarrative: (narrative: string) => void;
  onApplyFinding: (finding: { name: string; rating: string; notes: string }) => void;
  onApplyAllFindings: (findings: Array<{ name: string; rating: string; notes: string }>) => void;
}

const severityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-hbc-gold/20 text-hbc-gold",
  high: "bg-hbc-rust/20 text-hbc-rust",
  critical: "bg-destructive/20 text-destructive",
};

const ratingColor: Record<string, string> = {
  Excellent: "text-accent",
  Good: "text-accent/80",
  Fair: "text-hbc-gold",
  Poor: "text-hbc-rust",
};

function aggregateRating(analyses: PhotoAnalysis[]): { rating: string; note: string } | null {
  const valid = analyses.filter((a) => a.condition_rating && !a.error);
  if (valid.length === 0) return null;

  const order = ["Poor", "Fair", "Good", "Excellent"];
  const counts: Record<string, number> = {};
  let worstIdx = 3;

  for (const a of valid) {
    counts[a.condition_rating] = (counts[a.condition_rating] || 0) + 1;
    const idx = order.indexOf(a.condition_rating);
    if (idx >= 0 && idx < worstIdx) worstIdx = idx;
  }

  const rating = order[worstIdx];
  const breakdown = Object.entries(counts)
    .map(([r, c]) => `${c} suggest ${r}`)
    .join(", ");

  const note =
    valid.length === 1
      ? `${valid[0].confidence_score}% confidence`
      : `Based on ${valid.length} photos: ${breakdown}. Showing most conservative rating.`;

  return { rating, note };
}

const PhotoAnalysisPanel = ({
  analyses,
  isAnalyzing,
  analyzingCount,
  currentRating,
  onApplyRating,
  onApplyNarrative,
  onApplyFinding,
  onApplyAllFindings,
}: PhotoAnalysisPanelProps) => {
  const [defectsOpen, setDefectsOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  if (isAnalyzing) {
    return (
      <div className="bg-card border border-accent/20 rounded-lg p-4 mt-3 animate-pulse">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="font-mono text-xs">
            Analyzing{analyzingCount ? ` ${analyzingCount.current}/${analyzingCount.total}` : ""}...
          </span>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) return null;

  const agg = aggregateRating(analyses);
  const allDefects = analyses.flatMap((a) => a.identified_defects || []);
  const allActions = analyses.flatMap((a) => a.recommended_actions || []);
  const allObs = analyses.flatMap((a) => a.raw_observations || []);
  const bestNarrative = analyses.find((a) => a.narrative_paragraph)?.narrative_paragraph || "";

  const ratingMismatch = agg && currentRating && agg.rating !== currentRating;

  const findingsForInsert = allDefects.map((d) => ({
    name: d.defect_name,
    rating: d.severity === "critical" ? "Poor" : d.severity === "high" ? "Poor" : d.severity === "medium" ? "Fair" : "Good",
    notes: `${d.description} (${d.location_in_image})`,
  }));

  return (
    <div className="bg-card border border-accent/20 rounded-lg p-4 mt-3 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="font-display text-sm font-semibold text-foreground">AI Photo Insights</span>
      </div>

      {/* Rating suggestion */}
      {agg && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Suggested:</span>
            <span className={`font-display text-sm font-bold ${ratingColor[agg.rating] || "text-foreground"}`}>
              {agg.rating}
            </span>
            {analyses.length === 1 && (
              <Badge variant="secondary" className="text-[9px] h-4">
                {analyses[0].confidence_score}% confidence
              </Badge>
            )}
          </div>
          {analyses.length > 1 && (
            <p className="text-[10px] text-muted-foreground font-mono">{agg.note}</p>
          )}
        </div>
      )}

      {/* Rating mismatch banner */}
      {ratingMismatch && (
        <div className="bg-hbc-gold/10 border border-hbc-gold/30 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-hbc-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-foreground">
              AI suggests <strong className={ratingColor[agg!.rating]}>{agg!.rating}</strong>; your current rating is{" "}
              <strong>{currentRating}</strong>.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 text-[10px] text-accent hover:text-accent/80 px-2"
              onClick={() => onApplyRating(agg!.rating)}
            >
              Update to {agg!.rating}
            </Button>
          </div>
        </div>
      )}

      {/* Defects */}
      {allDefects.length > 0 && (
        <Collapsible open={defectsOpen} onOpenChange={setDefectsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            {defectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-xs font-mono text-muted-foreground">
              {allDefects.length} defect{allDefects.length !== 1 ? "s" : ""} identified
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {allDefects.map((d, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
                <Badge className={`text-[9px] h-4 shrink-0 ${severityColor[d.severity]}`}>
                  {d.severity}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{d.defect_name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.description}</p>
                  <p className="text-[10px] text-muted-foreground italic">Location: {d.location_in_image}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[9px] px-2 text-accent shrink-0"
                  onClick={() =>
                    onApplyFinding({
                      name: d.defect_name,
                      rating: d.severity === "critical" || d.severity === "high" ? "Poor" : d.severity === "medium" ? "Fair" : "Good",
                      notes: `${d.description} (${d.location_in_image})`,
                    })
                  }
                >
                  Use
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1"
              onClick={() => onApplyAllFindings(findingsForInsert)}
            >
              <Zap className="h-3 w-3" /> Apply All {allDefects.length} Findings
            </Button>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Narrative */}
      {bestNarrative && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-mono italic">"{bestNarrative}"</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-accent hover:text-accent/80 px-2 gap-1"
            onClick={() => onApplyNarrative(bestNarrative)}
          >
            <CheckCircle2 className="h-3 w-3" /> Use AI Narrative
          </Button>
        </div>
      )}

      {/* Observations */}
      {allObs.length > 0 && (
        <Collapsible open={obsOpen} onOpenChange={setObsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            {obsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-xs font-mono text-muted-foreground">
              <Eye className="h-3 w-3 inline mr-1" />
              {allObs.length} observations
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ul className="space-y-1 pl-4 list-disc">
              {allObs.map((o, i) => (
                <li key={i} className="text-[10px] text-muted-foreground">{o}</li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Recommended actions */}
      {allActions.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Recommended Actions</span>
          {allActions.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] py-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] h-3.5">{a.urgency}</Badge>
                <span className="text-foreground">{a.action}</span>
              </div>
              <span className="text-muted-foreground font-mono">
                ${a.estimated_cost_low.toLocaleString()}–${a.estimated_cost_high.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoAnalysisPanel;
