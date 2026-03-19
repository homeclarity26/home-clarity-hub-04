import { useState, useEffect } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PhotoInspectionSidebarProps {
  photoUrl: string | null;
  onClose: () => void;
}

interface AnalysisData {
  condition_rating: string;
  confidence_score: number;
  identified_defects: Array<{
    defect_name: string;
    severity: string;
    location_in_image: string;
    description: string;
  }>;
  recommended_actions: Array<{
    action: string;
    urgency: string;
    estimated_cost_low: number;
    estimated_cost_high: number;
  }>;
  narrative_paragraph: string;
  raw_observations: string[];
  analyzed_at: string;
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

const PhotoInspectionSidebar = ({ photoUrl, onClose }: PhotoInspectionSidebarProps) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photoUrl) { setAnalysis(null); return; }

    setLoading(true);
    supabase
      .from("photo_analyses" as any)
      .select("*")
      .eq("photo_url", photoUrl)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setAnalysis((data as any)?.[0] || null);
        setLoading(false);
      });
  }, [photoUrl]);

  if (!photoUrl) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-semibold text-foreground">Inspection Notes</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Photo preview */}
      <div className="p-4 border-b border-border">
        <img src={photoUrl} alt="" className="w-full rounded-lg object-cover max-h-48" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-muted-foreground">Loading analysis...</div>
          </div>
        )}

        {!loading && !analysis && (
          <div className="text-center py-8">
            <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No analysis data for this photo.</p>
          </div>
        )}

        {!loading && analysis && (
          <>
            {/* Rating */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Condition</span>
              <div className="flex items-center gap-2">
                <span className={`font-display text-lg font-bold ${ratingColor[analysis.condition_rating] || "text-foreground"}`}>
                  {analysis.condition_rating}
                </span>
                <Badge variant="secondary" className="text-[9px] h-4">
                  {analysis.confidence_score}% confidence
                </Badge>
              </div>
            </div>

            {/* Narrative */}
            {analysis.narrative_paragraph && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Assessment</span>
                <p className="text-sm text-foreground leading-relaxed">{analysis.narrative_paragraph}</p>
              </div>
            )}

            {/* Defects */}
            {analysis.identified_defects?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Defects ({analysis.identified_defects.length})
                </span>
                {analysis.identified_defects.map((d, i) => (
                  <div key={i} className="p-2 bg-muted/30 rounded-md space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[8px] h-3.5 ${severityColor[d.severity]}`}>{d.severity}</Badge>
                      <span className="text-xs font-semibold text-foreground">{d.defect_name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{d.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {analysis.recommended_actions?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Recommended Actions
                </span>
                {analysis.recommended_actions.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-[8px] h-3.5 shrink-0">{a.urgency}</Badge>
                      <span className="text-xs text-foreground truncate">{a.action}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                      ${a.estimated_cost_low.toLocaleString()}–${a.estimated_cost_high.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-[9px] text-muted-foreground font-mono pt-2 border-t border-border">
              Analyzed {new Date(analysis.analyzed_at).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoInspectionSidebar;
