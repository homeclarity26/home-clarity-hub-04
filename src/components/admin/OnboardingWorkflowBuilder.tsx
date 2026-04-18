import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowDown, GitBranch, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WorkflowStep {
  id?: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  action_type: string;
  action_config_json: any;
}

const OnboardingWorkflowBuilder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  const { data: workflows = [] } = useQuery({
    queryKey: ["onboarding-workflows"],
    queryFn: async () => {
      const { data } = await supabase.from("onboarding_workflows").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addStep = () => {
    setSteps([...steps, {
      step_order: steps.length, delay_days: steps.length === 0 ? 0 : 1, delay_hours: 0,
      action_type: "send_message", action_config_json: { message: "" },
    }]);
  };

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i })));
  };

  const updateStep = (idx: number, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const create = async () => {
    if (!user || !wfName.trim()) return;
    const { data: wf } = await supabase.from("onboarding_workflows").insert({
      admin_id: user.id, name: wfName.trim(), description: wfDesc.trim(),
    }).select().single();

    if (wf && steps.length > 0) {
      await supabase.from("onboarding_steps").insert(
        steps.map(s => ({ ...s, workflow_id: wf.id }))
      );
    }

    setCreateOpen(false); setWfName(""); setWfDesc(""); setSteps([]);
    qc.invalidateQueries({ queryKey: ["onboarding-workflows"] });
    toast.success("Workflow created");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("onboarding_workflows").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["onboarding-workflows"] });
  };

  const toggleDefault = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      await supabase.from("onboarding_workflows").update({ is_default: false }).neq("id", "none");
    }
    await supabase.from("onboarding_workflows").update({ is_default: isDefault }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["onboarding-workflows"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Onboarding Workflows</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => { setCreateOpen(true); setSteps([]); addStep(); }}>
          <Plus className="w-3.5 h-3.5" />New Workflow
        </Button>
      </div>

      <div className="space-y-3">
        {workflows.map((wf: any) => (
          <Card key={wf.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-medium text-foreground">{wf.name}</span>
                  {wf.is_default && <Badge className="bg-accent/20 text-accent border-none text-[10px]">Default</Badge>}
                  <Badge variant={wf.is_active ? "secondary" : "outline"} className="text-[10px]">{wf.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                {wf.description && <p className="text-xs font-sans text-muted-foreground mt-0.5">{wf.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={wf.is_active} onCheckedChange={v => toggleActive(wf.id, v)} />
                {!wf.is_default && <Button variant="ghost" size="sm" className="text-xs font-sans" onClick={() => toggleDefault(wf.id, true)}>Set Default</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-sans">Build Onboarding Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Workflow Name</Label>
                <Input value={wfName} onChange={e => setWfName(e.target.value)} placeholder="e.g., Standard Onboarding" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Description</Label>
                <Input value={wfDesc} onChange={e => setWfDesc(e.target.value)} className="font-sans" />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <Label className="text-xs font-sans font-medium">Steps</Label>
              {steps.map((step, idx) => (
                <div key={idx}>
                  {idx > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <Card className="p-4 border-l-[3px] border-l-accent">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-[10px] font-mono">Step {idx + 1}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeStep(idx)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-sans text-muted-foreground">Wait Days</Label>
                        <Input type="number" value={step.delay_days} onChange={e => updateStep(idx, { delay_days: Number(e.target.value) })} className="font-mono text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-sans text-muted-foreground">Wait Hours</Label>
                        <Input type="number" value={step.delay_hours} onChange={e => updateStep(idx, { delay_hours: Number(e.target.value) })} className="font-mono text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-sans text-muted-foreground">Action</Label>
                        <Select value={step.action_type} onValueChange={v => updateStep(idx, { action_type: v, action_config_json: {} })}>
                          <SelectTrigger className="font-sans text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send_message">Send Message</SelectItem>
                            <SelectItem value="create_task">Create Task</SelectItem>
                            <SelectItem value="send_announcement">Send Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {step.action_type === "send_message" && (
                      <Textarea
                        placeholder="Message content... Use {{client_first_name}}, {{property_address}}, {{advisor_name}}"
                        value={step.action_config_json?.message || ""}
                        onChange={e => updateStep(idx, { action_config_json: { message: e.target.value } })}
                        className="font-sans text-sm min-h-[60px]"
                      />
                    )}
                    {step.action_type === "create_task" && (
                      <Input
                        placeholder="Task title..."
                        value={step.action_config_json?.title || ""}
                        onChange={e => updateStep(idx, { action_config_json: { title: e.target.value } })}
                        className="font-sans text-sm"
                      />
                    )}
                  </Card>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs font-sans gap-1" onClick={addStep}>
                <Plus className="w-3 h-3" />Add Step
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!wfName.trim() || steps.length === 0} className="font-sans">Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingWorkflowBuilder;
