import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCRMStage } from "@/hooks/useCRMData";
import { format } from "date-fns";
import type { CRMContact, PipelineEntry } from "@/hooks/useCRMData";

const CLIENT_STAGES = ["lead", "onboarding", "active", "proposal_out", "project_running", "completed", "at_risk", "churned"];
const stageLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const stageColor = (s: string) => {
  const colors: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800", onboarding: "bg-indigo-100 text-indigo-800",
    active: "bg-emerald-100 text-emerald-800", proposal_out: "bg-amber-100 text-amber-800",
    project_running: "bg-cyan-100 text-cyan-800", completed: "bg-green-100 text-green-800",
    at_risk: "bg-orange-100 text-orange-800", churned: "bg-red-100 text-red-800",
  };
  return colors[s] || "bg-muted text-muted-foreground";
};

const CRMPipelineTab = ({ contact, history }: { contact: CRMContact; history: PipelineEntry[] | undefined }) => {
  const { user } = useAuth();
  const updateStage = useUpdateCRMStage();
  const currentStage = contact.client_stage || "lead";

  return (
    <div className="space-y-6">
      {/* Visual Pipeline */}
      <Card className="p-5">
        <h3 className="font-sans font-semibold text-sm text-foreground mb-4">Pipeline Stage</h3>
        <div className="flex flex-wrap gap-2">
          {CLIENT_STAGES.map(stage => (
            <Button
              key={stage}
              variant={currentStage === stage ? "default" : "outline"}
              size="sm"
              className={`text-xs font-sans ${currentStage === stage ? "" : "opacity-60"}`}
              onClick={() => {
                if (stage !== currentStage && user) {
                  updateStage.mutate({ contactId: contact.id, contactType: "client", newStage: stage, userId: user.id });
                }
              }}
            >
              {stageLabel(stage)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Stage History */}
      <Card className="p-5">
        <h3 className="font-sans font-semibold text-sm text-foreground mb-4">Stage History</h3>
        {(history || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No stage changes recorded.</p>
        ) : (
          <div className="space-y-3">
            {(history || []).map(h => (
              <div key={h.id} className="flex items-center gap-3 text-sm font-sans">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1">
                  <span className="text-muted-foreground">
                    {h.from_stage ? <><Badge className={`text-[9px] ${stageColor(h.from_stage)}`}>{stageLabel(h.from_stage)}</Badge> → </> : "Set to "}
                    <Badge className={`text-[9px] ${stageColor(h.to_stage)}`}>{stageLabel(h.to_stage)}</Badge>
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{format(new Date(h.changed_at), "MMM d, yyyy h:mm a")}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CRMPipelineTab;
