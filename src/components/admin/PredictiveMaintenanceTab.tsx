import { useState, useEffect, useMemo } from "react";
import { Shield, RefreshCw, CheckCircle2, AlertTriangle, Clock, ArrowRight, Trash2, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PredictiveMaintenanceTabProps {
  clientId: string;
  propertyId?: string;
}

const TIMEFRAME_LABELS: Record<string, string> = {
  immediate: "Immediate", "3_months": "3 Months", "6_months": "6 Months",
  "1_year": "1 Year", "2_years": "2 Years", "3_years": "3 Years", "5_years": "5 Years",
};

export default function PredictiveMaintenanceTab({ clientId, propertyId }: PredictiveMaintenanceTabProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [outcomeDialog, setOutcomeDialog] = useState<string | null>(null);
  const [outcomeForm, setOutcomeForm] = useState({ actual_service_date: "", actual_cost: "", outcome_notes: "" });

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    const [{ data: preds }, { data: outs }] = await Promise.all([
      (supabase.from("maintenance_predictions" as any) as any).select("*").eq("client_id", clientId).order("probability_score", { ascending: false }),
      (supabase.from("maintenance_outcomes" as any) as any).select("*").eq("client_id", clientId).order("actual_service_date", { ascending: false }),
    ]);
    setPredictions(preds || []);
    setOutcomes(outs || []);
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-predictions", { body: { client_id: clientId } });
      if (error) throw error;
      toast.success(`Generated ${data.count} predictions`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await (supabase.from("maintenance_predictions" as any) as any).update({ status: "dismissed" }).eq("id", id);
    toast.success("Dismissed");
    await load();
  };

  const handleComplete = async (id: string) => {
    setOutcomeDialog(id);
    setOutcomeForm({ actual_service_date: new Date().toISOString().split("T")[0], actual_cost: "", outcome_notes: "" });
  };

  const submitOutcome = async () => {
    if (!outcomeDialog) return;
    const pred = predictions.find(p => p.id === outcomeDialog);
    await (supabase.from("maintenance_outcomes" as any) as any).insert({
      client_id: clientId,
      prediction_id: outcomeDialog,
      equipment_id: pred?.equipment_id || null,
      actual_service_date: outcomeForm.actual_service_date,
      actual_cost: parseFloat(outcomeForm.actual_cost) || 0,
      outcome_notes: outcomeForm.outcome_notes,
    });
    await (supabase.from("maintenance_predictions" as any) as any).update({ status: "completed" }).eq("id", outcomeDialog);
    toast.success("Outcome recorded");
    setOutcomeDialog(null);
    await load();
  };

  const activePredictions = predictions.filter(p => p.status === "active");
  const dismissedPredictions = predictions.filter(p => p.status === "dismissed");
  const completedPredictions = predictions.filter(p => p.status === "completed");

  // Accuracy score
  const accuracyScore = useMemo(() => {
    if (outcomes.length === 0) return null;
    const withPrediction = outcomes.filter(o => o.prediction_id);
    if (withPrediction.length === 0) return null;
    // Simple accuracy: % of outcomes that had a matching prediction
    return Math.round((withPrediction.length / (withPrediction.length + completedPredictions.length || 1)) * 100);
  }, [outcomes, completedPredictions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent" />
          <div>
            <h2 className="font-display text-lg text-foreground">Predictive Maintenance</h2>
            <p className="text-sm text-muted-foreground">{activePredictions.length} active predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {accuracyScore !== null && (
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              {accuracyScore}% accuracy
            </Badge>
          )}
          <Button size="sm" onClick={handleRegenerate} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Active Predictions */}
      {activePredictions.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No predictions yet</p>
          <Button size="sm" onClick={handleRegenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate Predictions"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {activePredictions.map(pred => {
            const reasons = Array.isArray(pred.reasoning) ? pred.reasoning : [];
            return (
              <Card key={pred.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-sm text-foreground">{pred.system_type}</h3>
                      <Badge variant={pred.prediction_type === "replacement" ? "destructive" : "secondary"} className="text-[10px]">
                        {pred.prediction_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {pred.probability_score}% prob
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {pred.confidence_level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{TIMEFRAME_LABELS[pred.predicted_timeframe]}</span>
                      <span>${pred.estimated_cost_low?.toLocaleString()}–${pred.estimated_cost_high?.toLocaleString()}</span>
                    </div>
                    {reasons.length > 0 && (
                      <div className="space-y-1">
                        {reasons.slice(0, 3).map((r: any, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                              r.impact === "high" ? "bg-destructive" : r.impact === "medium" ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            <strong>{r.factor}:</strong> {r.detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleComplete(pred.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleDismiss(pred.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Outcomes History */}
      {outcomes.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Past Outcomes ({outcomes.length})
          </h3>
          <div className="space-y-2">
            {outcomes.slice(0, 10).map(o => (
              <Card key={o.id} className="p-3 bg-muted/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{o.outcome_notes || "Service completed"}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>${o.actual_cost?.toLocaleString()}</span>
                    <span>{o.actual_service_date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Outcome Dialog */}
      <Dialog open={!!outcomeDialog} onOpenChange={() => setOutcomeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Date</Label>
              <Input type="date" value={outcomeForm.actual_service_date} onChange={e => setOutcomeForm(f => ({ ...f, actual_service_date: e.target.value }))} />
            </div>
            <div>
              <Label>Actual Cost ($)</Label>
              <Input type="number" value={outcomeForm.actual_cost} onChange={e => setOutcomeForm(f => ({ ...f, actual_cost: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={outcomeForm.outcome_notes} onChange={e => setOutcomeForm(f => ({ ...f, outcome_notes: e.target.value }))} />
            </div>
            <Button onClick={submitOutcome} className="w-full">Save Outcome</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
