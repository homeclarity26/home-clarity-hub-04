import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Crown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MembershipTierManager = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [monthly, setMonthly] = useState(0);
  const [annually, setAnnually] = useState(0);
  const [color, setColor] = useState("#C9A84C");
  const [features, setFeatures] = useState<string[]>([""]);
  const [reportFreq, setReportFreq] = useState("Annual");
  const [slaHours, setSlaHours] = useState(24);
  const [maxProps, setMaxProps] = useState(1);

  const { data: tiers = [] } = useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data } = await (supabase.from("membership_tiers") as any).select("*").eq("is_active", true).order("price_annually");
      return data || [];
    },
  });

  const create = async () => {
    if (!user || !name.trim()) return;
    await (supabase.from("membership_tiers") as any).insert({
      name: name.trim(), description: desc.trim(), price_monthly: monthly, price_annually: annually,
      features_json: features.filter(f => f.trim()), report_frequency: reportFreq,
      response_time_sla_hours: slaHours, max_properties: maxProps, color_hex: color,
    });
    setCreateOpen(false); setName(""); setDesc(""); setFeatures([""]);
    qc.invalidateQueries({ queryKey: ["membership-tiers"] });
    toast.success("Tier created");
  };

  const archive = async (id: string) => {
    await (supabase.from("membership_tiers") as any).update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["membership-tiers"] });
    toast.success("Tier archived");
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Membership Tiers</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />New Tier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier: any) => (
          <Card key={tier.id} className="p-4 border-l-[3px]" style={{ borderLeftColor: tier.color_hex }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-sans font-bold text-foreground">{tier.name}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => archive(tier.id)}>
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
            {tier.description && <p className="text-xs font-sans text-muted-foreground mb-2">{tier.description}</p>}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-xl font-sans font-bold text-foreground">${tier.price_annually}</span>
              <span className="text-xs font-sans text-muted-foreground">/year</span>
            </div>
            <div className="space-y-1.5">
              {(tier.features_json || []).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-[11px] font-sans text-foreground">{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
              {tier.report_frequency} reports · {tier.response_time_sla_hours}h SLA · {tier.max_properties} property
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">New Membership Tier</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Tier Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Professional" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Color</Label>
                <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 p-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Monthly Price ($)</Label>
                <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Annual Price ($)</Label>
                <Input type="number" value={annually} onChange={e => setAnnually(Number(e.target.value))} className="font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-sans">Features</Label>
              {features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={f} onChange={e => { const nf = [...features]; nf[i] = e.target.value; setFeatures(nf); }} placeholder="Feature..." className="font-sans text-sm" />
                  {features.length > 1 && <Button variant="ghost" size="sm" onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="px-2"><Trash2 className="w-3 h-3" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => setFeatures([...features, ""])}>+ Add Feature</Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!name.trim()} className="font-sans">Create Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MembershipTierManager;
