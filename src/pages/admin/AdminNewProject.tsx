import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowLeft, ArrowRight, Check, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const PROJECT_TYPES = ["kitchen", "bathroom", "basement", "addition", "full_renovation", "exterior", "landscaping", "custom"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const DEFAULT_PHASES = [
  "Demo", "Rough-In", "Framing", "Electrical", "Plumbing", "HVAC", "Insulation", "Drywall", "Painting", "Flooring", "Cabinets & Counters", "Finishing", "Final Walkthrough"
];

const AdminNewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [projectType, setProjectType] = useState("custom");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  // Step 2
  const [phases, setPhases] = useState<{ name: string; estimatedCost: number }[]>([]);
  const [newPhaseName, setNewPhaseName] = useState("");

  // Step 3
  const [budget, setBudget] = useState("");
  const [contingencyPct, setContingencyPct] = useState("10");

  // Step 4
  const [assignedVendors, setAssignedVendors] = useState<Record<number, string>>({});

  // Step 5
  const [showInPortal, setShowInPortal] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showBudget, setShowBudget] = useState(false);
  const [sendUpdates, setSendUpdates] = useState(true);

  const { data: properties } = useQuery({
    queryKey: ["admin-properties-select"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, property_name, address").order("property_name");
      return data || [];
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["admin-vendors-select"],
    queryFn: async () => {
      const { data } = await supabase.from("central_vendors").select("id, company_name, specialties");
      return data || [];
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const selectedProp = (properties || []).find((p: any) => p.id === propertyId);
      const { data: proj, error } = await supabase.from("projects").insert({
        title,
        property_id: propertyId,
        project_type: projectType,
        description,
        priority,
        budget: Number(budget) || 0,
        contingency_pct: Number(contingencyPct) || 10,
        show_in_portal: showInPortal,
        allow_client_messages: allowMessages,
        show_budget_to_client: showBudget,
        send_milestone_updates: sendUpdates,
        status: "lead",
        address: selectedProp?.address || "",
        project_manager_id: user?.id,
      } as any).select().single();
      if (error) throw error;

      // Create phases
      for (let i = 0; i < phases.length; i++) {
        await supabase.from("project_phases").insert({
          project_id: proj.id,
          name: phases[i].name,
          estimated_cost: phases[i].estimatedCost || 0,
          sort_order: i,
        });
      }

      return proj;
    },
    onSuccess: (proj) => {
      toast.success("Project created!");
      navigate(`/admin/projects/${proj.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const addPhase = () => {
    if (newPhaseName.trim()) {
      setPhases([...phases, { name: newPhaseName.trim(), estimatedCost: 0 }]);
      setNewPhaseName("");
    }
  };

  const loadDefaults = () => {
    setPhases(DEFAULT_PHASES.map((name) => ({ name, estimatedCost: 0 })));
  };

  const totalPhasesCost = phases.reduce((s, p) => s + (p.estimatedCost || 0), 0);
  const budgetNum = Number(budget) || 0;
  const contingencyAmt = budgetNum * (Number(contingencyPct) / 100);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Projects", path: "/admin/projects" }, { label: "New Project" }]} />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-medium ${
                s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>{s < step ? <Check className="w-3.5 h-3.5" /> : s}</div>
              {s < 5 && <div className={`w-8 h-0.5 ${s < step ? "bg-primary/40" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Basics */}
        {step === 1 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Project Basics</h2>
            <div>
              <label className="text-xs font-sans text-muted-foreground">Project Name *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Johnson Kitchen Remodel" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-sans text-muted-foreground">Client / Property *</label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {(properties || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.property_name || p.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-sans text-muted-foreground">Project Type</label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm capitalize">{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-sm capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-sans text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project overview..." className="text-sm" rows={3} />
            </div>
          </Card>
        )}

        {/* Step 2: Phases */}
        {step === 2 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-sans font-semibold text-foreground">Scope & Phases</h2>
              <Button variant="outline" size="sm" className="text-xs font-sans" onClick={loadDefaults}>Load Default Phases</Button>
            </div>
            <div className="space-y-2">
              {phases.map((phase, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-sans flex-1">{phase.name}</span>
                  <Input
                    type="number"
                    value={phase.estimatedCost || ""}
                    onChange={(e) => {
                      const next = [...phases];
                      next[i].estimatedCost = Number(e.target.value) || 0;
                      setPhases(next);
                    }}
                    placeholder="Est. cost"
                    className="w-28 h-7 text-xs font-mono"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPhases(phases.filter((_, j) => j !== i))}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="Phase name..." className="text-sm" onKeyDown={(e) => e.key === "Enter" && addPhase()} />
              <Button size="sm" className="gap-1 text-xs" onClick={addPhase}><Plus className="w-3.5 h-3.5" />Add</Button>
            </div>
            {totalPhasesCost > 0 && (
              <p className="text-xs font-sans text-muted-foreground">Total estimated phase costs: <span className="font-mono font-medium text-foreground">${totalPhasesCost.toLocaleString()}</span></p>
            )}
          </Card>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Budget</h2>
            <div>
              <label className="text-xs font-sans text-muted-foreground">Total Project Budget</label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" className="text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-sans text-muted-foreground">Contingency %</label>
              <Input type="number" value={contingencyPct} onChange={(e) => setContingencyPct(e.target.value)} className="text-sm font-mono w-24" />
            </div>
            <div className="p-3 bg-muted/50 rounded-md space-y-1">
              <div className="flex justify-between text-sm font-sans"><span className="text-muted-foreground">Base Budget</span><span className="font-mono">${budgetNum.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm font-sans"><span className="text-muted-foreground">Contingency ({contingencyPct}%)</span><span className="font-mono">${contingencyAmt.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm font-sans font-semibold border-t border-border pt-1"><span>Total</span><span className="font-mono">${(budgetNum + contingencyAmt).toLocaleString()}</span></div>
            </div>
          </Card>
        )}

        {/* Step 4: Team */}
        {step === 4 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Team & Trade Partners</h2>
            <p className="text-xs text-muted-foreground font-sans">Assign trade partners to each phase. You can change these later.</p>
            {phases.length === 0 ? (
              <p className="text-sm text-muted-foreground font-sans">No phases added. Go back to add phases first.</p>
            ) : (
              <div className="space-y-2">
                {phases.map((phase, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                    <span className="text-sm font-sans flex-1">{phase.name}</span>
                    <Select value={assignedVendors[i] || ""} onValueChange={(v) => setAssignedVendors({ ...assignedVendors, [i]: v })}>
                      <SelectTrigger className="w-48 text-xs"><SelectValue placeholder="Assign vendor..." /></SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map((v: any) => (
                          <SelectItem key={v.id} value={v.id} className="text-xs">{v.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Step 5: Client Settings */}
        {step === 5 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Client Settings</h2>
            <div className="space-y-3">
              {[
                { label: "Show project in client portal", value: showInPortal, setter: setShowInPortal },
                { label: "Allow client to message about this project", value: allowMessages, setter: setAllowMessages },
                { label: "Show budget to client", value: showBudget, setter: setShowBudget },
                { label: "Send automatic milestone updates to client", value: sendUpdates, setter: setSendUpdates },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <span className="text-sm font-sans text-foreground">{item.label}</span>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate("/admin/projects")} className="gap-1 text-sm font-sans">
            <ArrowLeft className="w-4 h-4" />{step > 1 ? "Back" : "Cancel"}
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && (!title.trim() || !propertyId)} className="gap-1 text-sm font-sans">
              Next<ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => createProject.mutate()} disabled={createProject.isPending} className="gap-1 text-sm font-sans">
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNewProject;
