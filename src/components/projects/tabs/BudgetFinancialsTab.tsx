import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { useProjectPhases, useChangeOrders, usePurchaseOrders, useCreateChangeOrder, useCreatePurchaseOrder } from "@/hooks/useProjectData";

interface Props { project: any; }

const BudgetFinancialsTab = ({ project }: Props) => {
  const budget = Number(project.budget || 0); const spent = Number(project.actual_spent || 0);
  const contingencyAmt = budget * (Number(project.contingency_pct || 10) / 100);
  const total = budget + contingencyAmt; const remaining = total - spent;
  const spentPct = total > 0 ? (spent / total) * 100 : 0;

  const { data: phases } = useProjectPhases(project.id);
  const { data: changeOrders } = useChangeOrders(project.id);
  const { data: purchaseOrders } = usePurchaseOrders(project.id);
  const createCO = useCreateChangeOrder(); const createPO = useCreatePurchaseOrder();

  const [showCO, setShowCO] = useState(false);
  const [co, setCo] = useState({ title: "", description: "", reason: "", cost_impact: "", timeline_impact_days: "" });
  const [showPO, setShowPO] = useState(false);
  const [po, setPo] = useState({ description: "", amount: "", po_number: "", phase_id: "" });

  const approvedTotal = (changeOrders || []).filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.cost_impact), 0);

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[["Base Budget", budget], [`Contingency (${project.contingency_pct || 10}%)`, contingencyAmt], ["Spent", spent], ["Remaining", remaining]].map(([label, val], i) => (
          <Card key={i} className="p-4 text-center"><p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">{label as string}</p><p className={`text-xl font-mono font-bold ${i === 2 ? (spentPct >= 100 ? "text-destructive" : spentPct >= 80 ? "text-amber-500" : "text-emerald-500") : i === 3 && (val as number) < 0 ? "text-destructive" : "text-foreground"}`}>${(val as number).toLocaleString()}</p></Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Budget by Phase</h3>
        <Table><TableHeader><TableRow><TableHead className="text-xs font-sans">Phase</TableHead><TableHead className="text-xs font-sans text-right">Estimated</TableHead><TableHead className="text-xs font-sans text-right">Actual</TableHead><TableHead className="text-xs font-sans text-right">Remaining</TableHead></TableRow></TableHeader>
          <TableBody>{(phases || []).map((p) => (<TableRow key={p.id}><TableCell className="text-sm font-sans">{p.name}</TableCell><TableCell className="text-sm font-mono text-right">${Number(p.estimated_cost || 0).toLocaleString()}</TableCell><TableCell className="text-sm font-mono text-right">${Number(p.actual_cost || 0).toLocaleString()}</TableCell><TableCell className="text-sm font-mono text-right">${(Number(p.estimated_cost || 0) - Number(p.actual_cost || 0)).toLocaleString()}</TableCell></TableRow>))}</TableBody></Table>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />Change Orders{approvedTotal !== 0 && <span className="text-xs font-mono text-muted-foreground">({approvedTotal > 0 ? "+" : ""}${approvedTotal.toLocaleString()} approved)</span>}</h3>
          <Dialog open={showCO} onOpenChange={setShowCO}><DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs font-sans"><Plus className="w-3.5 h-3.5" />New Change Order</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle className="font-sans">New Change Order</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-sans text-muted-foreground">Title *</label><Input value={co.title} onChange={(e) => setCo({ ...co, title: e.target.value })} className="text-sm" /></div>
                <div><label className="text-xs font-sans text-muted-foreground">Description</label><Textarea value={co.description} onChange={(e) => setCo({ ...co, description: e.target.value })} className="text-sm" rows={2} /></div>
                <div><label className="text-xs font-sans text-muted-foreground">Reason</label><Input value={co.reason} onChange={(e) => setCo({ ...co, reason: e.target.value })} className="text-sm" /></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-sans text-muted-foreground">Cost Impact ($)</label><Input type="number" value={co.cost_impact} onChange={(e) => setCo({ ...co, cost_impact: e.target.value })} className="text-sm font-mono" /></div><div><label className="text-xs font-sans text-muted-foreground">Timeline (days)</label><Input type="number" value={co.timeline_impact_days} onChange={(e) => setCo({ ...co, timeline_impact_days: e.target.value })} className="text-sm font-mono" /></div></div>
                <Button className="w-full text-sm font-sans" disabled={!co.title.trim() || createCO.isPending} onClick={() => { createCO.mutate({ project_id: project.id, title: co.title, description: co.description || undefined, reason: co.reason || undefined, cost_impact: Number(co.cost_impact) || 0, timeline_impact_days: Number(co.timeline_impact_days) || undefined }, { onSuccess: () => { setShowCO(false); setCo({ title: "", description: "", reason: "", cost_impact: "", timeline_impact_days: "" }); toast.success("Change order created"); } }); }}>Create Change Order</Button>
              </div>
            </DialogContent></Dialog>
        </div>
        {(changeOrders || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans">No change orders yet.</p> : <div className="space-y-2">{changeOrders!.map((c) => (<div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-md"><div><p className="text-sm font-sans font-medium text-foreground">{c.title}</p><p className="text-xs text-muted-foreground font-sans">{c.description || c.reason || ""}</p></div><div className="flex items-center gap-3"><span className={`text-sm font-mono font-medium ${Number(c.cost_impact) > 0 ? "text-destructive" : "text-emerald-500"}`}>{Number(c.cost_impact) > 0 ? "+" : ""}${Number(c.cost_impact).toLocaleString()}</span><Badge variant={c.status === "approved" ? "default" : c.status === "declined" ? "destructive" : "secondary"} className="text-[10px] capitalize">{c.status}</Badge></div></div>))}</div>}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground">Purchase Orders</h3>
          <Dialog open={showPO} onOpenChange={setShowPO}><DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs font-sans"><Plus className="w-3.5 h-3.5" />New PO</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle className="font-sans">New Purchase Order</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-sans text-muted-foreground">Description *</label><Input value={po.description} onChange={(e) => setPo({ ...po, description: e.target.value })} className="text-sm" /></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-sans text-muted-foreground">Amount ($)</label><Input type="number" value={po.amount} onChange={(e) => setPo({ ...po, amount: e.target.value })} className="text-sm font-mono" /></div><div><label className="text-xs font-sans text-muted-foreground">PO #</label><Input value={po.po_number} onChange={(e) => setPo({ ...po, po_number: e.target.value })} className="text-sm font-mono" /></div></div>
                {(phases || []).length > 0 && <div><label className="text-xs font-sans text-muted-foreground">Phase</label><Select value={po.phase_id} onValueChange={(v) => setPo({ ...po, phase_id: v })}><SelectTrigger className="text-sm"><SelectValue placeholder="Select phase..." /></SelectTrigger><SelectContent>{(phases || []).map((p) => <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>)}</SelectContent></Select></div>}
                <Button className="w-full text-sm font-sans" disabled={!po.description.trim() || createPO.isPending} onClick={() => { createPO.mutate({ project_id: project.id, description: po.description, amount: Number(po.amount) || 0, po_number: po.po_number || undefined, phase_id: po.phase_id || undefined }, { onSuccess: () => { setShowPO(false); setPo({ description: "", amount: "", po_number: "", phase_id: "" }); toast.success("Purchase order created"); } }); }}>Create PO</Button>
              </div>
            </DialogContent></Dialog>
        </div>
        {(purchaseOrders || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans">No purchase orders yet.</p> : <Table><TableHeader><TableRow><TableHead className="text-xs font-sans">PO #</TableHead><TableHead className="text-xs font-sans">Description</TableHead><TableHead className="text-xs font-sans text-right">Amount</TableHead><TableHead className="text-xs font-sans">Status</TableHead></TableRow></TableHeader><TableBody>{purchaseOrders!.map((p) => (<TableRow key={p.id}><TableCell className="text-sm font-mono">{p.po_number || "—"}</TableCell><TableCell className="text-sm font-sans">{p.description}</TableCell><TableCell className="text-sm font-mono text-right">${Number(p.amount).toLocaleString()}</TableCell><TableCell><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></TableCell></TableRow>))}</TableBody></Table>}
      </Card>
    </div>
  );
};

export default BudgetFinancialsTab;
