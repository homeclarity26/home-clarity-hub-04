import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Star, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ReportTemplateManager = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tierLabel, setTierLabel] = useState("Standard");
  const [coverStyle, setCoverStyle] = useState("standard");
  const [extWeight, setExtWeight] = useState(33);
  const [intWeight, setIntWeight] = useState(33);
  const [sysWeight, setSysWeight] = useState(34);

  const { data: templates = [] } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data } = await (supabase.from("report_templates") as any).select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const create = async () => {
    if (!user || !name.trim()) return;
    await (supabase.from("report_templates") as any).insert({
      admin_id: user.id, name: name.trim(), description: description.trim(),
      tier_label: tierLabel, cover_style: coverStyle,
      scoring_weights_json: { exterior: extWeight, interior: intWeight, systems: sysWeight },
    });
    setCreateOpen(false); setName(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["report-templates"] });
    toast.success("Template created");
  };

  const setDefault = async (id: string) => {
    await (supabase.from("report_templates") as any).update({ is_default: false }).neq("id", "none");
    await (supabase.from("report_templates") as any).update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["report-templates"] });
    toast.success("Default template updated");
  };

  const tierColors: Record<string, string> = {
    Standard: "bg-muted text-foreground",
    Premium: "bg-accent/20 text-accent",
    Estate: "bg-primary/10 text-primary",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Report Templates</h3>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl: any) => (
          <Card key={tpl.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <span className="text-sm font-sans font-medium text-foreground">{tpl.name}</span>
              </div>
              {tpl.is_default && <Badge className="bg-accent/20 text-accent border-none text-[10px]"><Star className="w-3 h-3 mr-0.5" />Default</Badge>}
            </div>
            <Badge className={`text-[10px] border-none ${tierColors[tpl.tier_label] || tierColors.Standard}`}>{tpl.tier_label}</Badge>
            {tpl.description && <p className="text-xs font-sans text-muted-foreground line-clamp-2">{tpl.description}</p>}
            <div className="text-[10px] font-mono text-muted-foreground">
              Weights: Ext {tpl.scoring_weights_json?.exterior || 33}% · Int {tpl.scoring_weights_json?.interior || 33}% · Sys {tpl.scoring_weights_json?.systems || 34}%
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs font-sans" onClick={() => setPreviewOpen(tpl)}>
                <Eye className="w-3 h-3 mr-1" />Preview
              </Button>
              {!tpl.is_default && (
                <Button variant="ghost" size="sm" className="h-7 text-xs font-sans" onClick={() => setDefault(tpl.id)}>
                  Set Default
                </Button>
              )}
            </div>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-sans text-muted-foreground">No templates yet. Create one to standardize your reports.</p>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">New Report Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Template Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Standard Assessment" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Tier</Label>
                <Select value={tierLabel} onValueChange={setTierLabel}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Estate">Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Cover Style</Label>
                <Select value={coverStyle} onValueChange={setCoverStyle}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="estate">Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-sans">Scoring Weights (%)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] font-sans text-muted-foreground">Exterior</Label>
                  <Input type="number" value={extWeight} onChange={e => setExtWeight(Number(e.target.value))} className="font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-[10px] font-sans text-muted-foreground">Interior</Label>
                  <Input type="number" value={intWeight} onChange={e => setIntWeight(Number(e.target.value))} className="font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-[10px] font-sans text-muted-foreground">Systems</Label>
                  <Input type="number" value={sysWeight} onChange={e => setSysWeight(Number(e.target.value))} className="font-mono text-sm" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!name.trim()} className="font-sans">Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewOpen} onOpenChange={() => setPreviewOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">{previewOpen?.name} — Preview</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-primary rounded-lg p-8 text-center">
              <p className="font-display text-2xl text-primary-foreground">Home Clarity Report</p>
              <p className="text-sm font-sans text-primary-foreground/60 mt-2">{previewOpen?.tier_label} · {previewOpen?.cover_style} Cover</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Chapters</p>
              {["Exterior", "Interior", "Systems", "Strategic Plan"].map(ch => (
                <div key={ch} className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm font-sans">{ch}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {ch !== "Strategic Plan" ? `${previewOpen?.scoring_weights_json?.[ch.toLowerCase()] || 33}% weight` : "Roadmap"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportTemplateManager;
