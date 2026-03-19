import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Crown, Trash2, Pencil, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const MembershipTierManager = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [monthly, setMonthly] = useState(0);
  const [annually, setAnnually] = useState(0);
  const [color, setColor] = useState("#C9A84C");
  const [priceType, setPriceType] = useState("annual");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [stripePriceMonthly, setStripePriceMonthly] = useState("");
  const [stripePriceAnnual, setStripePriceAnnual] = useState("");

  const { data: tiers = [] } = useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data } = await (supabase.from("membership_tiers") as any).select("*").eq("is_active", true).order("sort_order").order("price_annually");
      return data || [];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-library"],
    queryFn: async () => {
      const { data } = await (supabase.from("services") as any).select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: tierServices = [] } = useQuery({
    queryKey: ["membership-tier-services"],
    queryFn: async () => {
      const { data } = await (supabase.from("membership_tier_services") as any).select("*");
      return data || [];
    },
  });

  const getServicesForTier = (tierId: string) => {
    const serviceIds = tierServices.filter((ts: any) => ts.tier_id === tierId).map((ts: any) => ts.service_id);
    return services.filter((s: any) => serviceIds.includes(s.id));
  };

  const openCreate = () => {
    setEditId(null); setName(""); setDesc(""); setMonthly(0); setAnnually(0);
    setColor("#C9A84C"); setPriceType("annual"); setIsFeatured(false); setSelectedServiceIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (tier: any) => {
    setEditId(tier.id); setName(tier.name); setDesc(tier.description || "");
    setMonthly(tier.price_monthly || 0); setAnnually(tier.price_annually || 0);
    setColor(tier.color_hex || "#C9A84C"); setPriceType(tier.price_type || "annual");
    setIsFeatured(tier.is_featured || false);
    const ids = tierServices.filter((ts: any) => ts.tier_id === tier.id).map((ts: any) => ts.service_id);
    setSelectedServiceIds(ids);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user || !name.trim()) return;
    const payload = {
      name: name.trim(), description: desc.trim(), price_monthly: monthly, price_annually: annually,
      color_hex: color, price_type: priceType, is_featured: isFeatured,
    };

    let tierId = editId;
    if (editId) {
      await (supabase.from("membership_tiers") as any).update(payload).eq("id", editId);
    } else {
      const { data } = await (supabase.from("membership_tiers") as any).insert(payload).select("id").single();
      tierId = data?.id;
    }

    if (tierId) {
      // Sync tier services
      await (supabase.from("membership_tier_services") as any).delete().eq("tier_id", tierId);
      if (selectedServiceIds.length > 0) {
        await (supabase.from("membership_tier_services") as any).insert(
          selectedServiceIds.map(sid => ({ tier_id: tierId, service_id: sid }))
        );
      }
    }

    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["membership-tiers"] });
    qc.invalidateQueries({ queryKey: ["membership-tier-services"] });
    toast.success(editId ? "Tier updated" : "Tier created");
  };

  const archive = async (id: string) => {
    await (supabase.from("membership_tiers") as any).update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["membership-tiers"] });
    toast.success("Tier archived");
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Membership Tiers</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" />New Tier
        </Button>
      </div>

      <p className="text-sm font-sans text-muted-foreground">
        Each tier includes services from your Services Library. Edit anytime without affecting existing subscribers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier: any) => {
          const tierSvcs = getServicesForTier(tier.id);
          return (
            <Card key={tier.id} className="p-4 border-l-[3px] relative" style={{ borderLeftColor: tier.color_hex }}>
              {tier.is_featured && (
                <Badge className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] gap-1">
                  <Star className="w-2.5 h-2.5" />Most Popular
                </Badge>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-sans font-bold text-foreground">{tier.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(tier)}>
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => archive(tier.id)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {tier.description && <p className="text-xs font-sans text-muted-foreground mb-2">{tier.description}</p>}
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-sans font-bold text-foreground">{fmt(tier.price_annually)}</span>
                <span className="text-xs font-sans text-muted-foreground">/{tier.price_type === "monthly" ? "mo" : "yr"}</span>
              </div>

              {tierSvcs.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Included Services</p>
                  {tierSvcs.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-[11px] font-sans text-foreground">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {tier.price_monthly > 0 && (
                <div className="pt-2 border-t border-border text-[10px] font-mono text-muted-foreground">
                  Also available: {fmt(tier.price_monthly)}/mo
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">{editId ? "Edit Tier" : "New Membership Tier"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Tier Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Stewardship" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Color</Label>
                <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 p-1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Description</Label>
              <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What this tier offers..." className="font-sans text-sm" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Annual Price ($)</Label>
                <Input type="number" value={annually} onChange={e => setAnnually(Number(e.target.value))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Monthly Price ($)</Label>
                <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Price Type</Label>
                <Select value={priceType} onValueChange={setPriceType}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label className="text-xs font-sans">Mark as "Most Popular" (highlighted in portal)</Label>
            </div>

            {/* Service selection */}
            <div className="space-y-2">
              <Label className="text-xs font-sans">Included Services</Label>
              <p className="text-[10px] font-sans text-muted-foreground">Select which services from your library are included in this tier.</p>
              <div className="border border-border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                {services.length === 0 ? (
                  <p className="text-xs font-sans text-muted-foreground text-center py-4">No services yet. Add services in the Services Library first.</p>
                ) : (
                  services.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={selectedServiceIds.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                      <span className="text-xs font-sans text-foreground flex-1">{s.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{fmt(s.price)}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">{selectedServiceIds.length} service{selectedServiceIds.length !== 1 ? "s" : ""} selected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-sans">Cancel</Button>
            <Button onClick={save} disabled={!name.trim()} className="font-sans">{editId ? "Update" : "Create"} Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MembershipTierManager;
