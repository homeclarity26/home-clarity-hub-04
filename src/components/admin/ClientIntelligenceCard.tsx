import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntelligenceSummary {
  summary: string;
  goals: string[];
  constraints: string[];
  priorities: string[];
}

interface ClientIntelligenceCardProps {
  propertyId?: string;
  discoveryNotes: string;
  clientName: string;
  address: string;
  existingSummary?: string | null;
  onAccept?: (summary: string) => void;
}

export default function ClientIntelligenceCard({
  propertyId,
  discoveryNotes,
  clientName,
  address,
  existingSummary,
  onAccept,
}: ClientIntelligenceCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IntelligenceSummary | null>(
    existingSummary ? tryParseExisting(existingSummary) : null
  );
  const [accepted, setAccepted] = useState(!!existingSummary);

  async function analyze() {
    if (!discoveryNotes.trim()) {
      toast.error("No discovery notes to analyze.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-discovery-notes", {
        body: {
          notes: discoveryNotes,
          propertyAddress: address,
          clientName,
        },
      });

      if (error) throw error;

      const parsed: IntelligenceSummary = data;
      setResult(parsed);
      setAccepted(false);

      if (propertyId) {
        await supabase
          .from("properties")
          .update({ client_intelligence_summary: JSON.stringify(parsed) })
          .eq("id", propertyId);
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
      // Show placeholder on failure
      setResult({
        summary: "AI analysis is not yet connected. The discovery notes have been saved and can be analyzed later.",
        goals: [],
        constraints: [],
        priorities: [],
      });
      setAccepted(false);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleAccept() {
    setAccepted(true);
    if (result) {
      onAccept?.(JSON.stringify(result));
    }
  }

  if (!discoveryNotes.trim() && !result) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-[11px] uppercase tracking-[0.15em] flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Client Intelligence Summary
          </CardTitle>
          {result && !accepted && (
            <Badge variant="outline" className="text-[10px] font-mono">
              AI Generated
            </Badge>
          )}
          {accepted && (
            <Badge className="text-[10px] font-mono bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              Accepted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isAnalyzing && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Analyze discovery notes to generate a client intelligence summary.
            </p>
            <Button onClick={analyze} size="sm" variant="outline" className="font-mono text-[11px]">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              Analyze Notes
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="font-mono text-[11px] text-muted-foreground">
              Analyzing discovery notes...
            </span>
          </div>
        )}

        {result && !isAnalyzing && (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>

            {result.goals.length > 0 && (
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                  Goals & Priorities
                </h4>
                <ul className="space-y-1">
                  {result.goals.map((g, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">-</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.constraints.length > 0 && (
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                  Constraints
                </h4>
                <ul className="space-y-1">
                  {result.constraints.map((c, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">-</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.priorities.length > 0 && (
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                  Flagged Priorities
                </h4>
                <ul className="space-y-1">
                  {result.priorities.map((p, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">!</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!accepted && (
                <Button onClick={handleAccept} size="sm" className="font-mono text-[11px]">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Accept
                </Button>
              )}
              <Button
                onClick={analyze}
                size="sm"
                variant="outline"
                className="font-mono text-[11px]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function tryParseExisting(raw: string): IntelligenceSummary | null {
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary ?? raw,
      goals: parsed.goals ?? [],
      constraints: parsed.constraints ?? [],
      priorities: parsed.priorities ?? [],
    };
  } catch {
    return { summary: raw, goals: [], constraints: [], priorities: [] };
  }
}
