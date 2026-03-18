import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProjectPermits, useProjectInspections, useCreatePermit, useCreateInspection } from "@/hooks/useProjectData";

const PERMIT_TYPES = ["Building", "Electrical", "Plumbing", "Mechanical", "Demolition", "Other"];
const INSP_TYPES = ["Framing", "Electrical", "Plumbing", "HVAC", "Insulation", "Drywall", "Final", "Other"];

interface Props { projectId: string; }

const InspectionsPermitsTab = ({ projectId }: Props) => {
  const { data: permits } = useProjectPermits(projectId);
  const { data: inspections } = useProjectInspections(projectId);
  const createPermit = useCreatePermit();
  const createInspection = useCreateInspection();

  const [showP, setShowP] = useState(false);
  const [pf, setPf] = useState({ permit_type: "", permit_number: "", submitted_date: "" });
  const [showI, setShowI] = useState(false);
  const [inf, setInf] = useState({ inspection_type: "", scheduled_date: "", inspector_name: "" });

  return (
    <div className="space-y-6 mt-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" />Permits</h3>
          <Dialog open={showP} onOpenChange={setShowP}><DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Permit</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle className="font-sans">Add Permit</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-sans text-muted-foreground">Type *</label><Select value={pf.permit_type} onValueChange={(v) => setPf({ ...pf, permit_type: v })}><SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{PERMIT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-xs font-sans text-muted-foreground">Permit #</label><Input value={pf.permit_number} onChange={(e) => setPf({ ...pf, permit_number: e.target.value })} className="text-sm font-mono" /></div>
                <div><label className="text-xs font-sans text-muted-foreground">Submitted Date</label><Input type="date" value={pf.submitted_date} onChange={(e) => setPf({ ...pf, submitted_date: e.target.value })} className="text-sm" /></div>
                <Button className="w-full text-sm font-sans" disabled={!pf.permit_type || createPermit.isPending} onClick={() => { createPermit.mutate({ project_id: projectId, permit_type: pf.permit_type, permit_number: pf.permit_number || undefined, submitted_date: pf.submitted_date || undefined }, { onSuccess: () => { setShowP(false); setPf({ permit_type: "", permit_number: "", submitted_date: "" }); toast.success("Permit added"); } }); }}>Add Permit</Button>
              </div></DialogContent></Dialog>
        </div>
        {(permits || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans">No permits tracked yet.</p> : (
          <Table><TableHeader><TableRow><TableHead className="text-xs font-sans">Type</TableHead><TableHead className="text-xs font-sans">Permit #</TableHead><TableHead className="text-xs font-sans">Submitted</TableHead><TableHead className="text-xs font-sans">Approved</TableHead><TableHead className="text-xs font-sans">Status</TableHead></TableRow></TableHeader>
            <TableBody>{permits!.map((p) => (<TableRow key={p.id}><TableCell className="text-sm font-sans">{p.permit_type}</TableCell><TableCell className="text-sm font-mono">{p.permit_number || "—"}</TableCell><TableCell className="text-xs text-muted-foreground">{p.submitted_date ? format(new Date(p.submitted_date), "MMM d") : "—"}</TableCell><TableCell className="text-xs text-muted-foreground">{p.approved_date ? format(new Date(p.approved_date), "MMM d") : "—"}</TableCell><TableCell><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></TableCell></TableRow>))}</TableBody></Table>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-muted-foreground" />Inspections</h3>
          <Dialog open={showI} onOpenChange={setShowI}><DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Inspection</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle className="font-sans">Schedule Inspection</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-sans text-muted-foreground">Type *</label><Select value={inf.inspection_type} onValueChange={(v) => setInf({ ...inf, inspection_type: v })}><SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{INSP_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-xs font-sans text-muted-foreground">Scheduled Date</label><Input type="date" value={inf.scheduled_date} onChange={(e) => setInf({ ...inf, scheduled_date: e.target.value })} className="text-sm" /></div>
                <div><label className="text-xs font-sans text-muted-foreground">Inspector</label><Input value={inf.inspector_name} onChange={(e) => setInf({ ...inf, inspector_name: e.target.value })} className="text-sm" /></div>
                <Button className="w-full text-sm font-sans" disabled={!inf.inspection_type || createInspection.isPending} onClick={() => { createInspection.mutate({ project_id: projectId, inspection_type: inf.inspection_type, scheduled_date: inf.scheduled_date || undefined, inspector_name: inf.inspector_name || undefined }, { onSuccess: () => { setShowI(false); setInf({ inspection_type: "", scheduled_date: "", inspector_name: "" }); toast.success("Inspection scheduled"); } }); }}>Schedule</Button>
              </div></DialogContent></Dialog>
        </div>
        {(inspections || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans">No inspections scheduled yet.</p> : (
          <Table><TableHeader><TableRow><TableHead className="text-xs font-sans">Type</TableHead><TableHead className="text-xs font-sans">Scheduled</TableHead><TableHead className="text-xs font-sans">Inspector</TableHead><TableHead className="text-xs font-sans">Result</TableHead></TableRow></TableHeader>
            <TableBody>{inspections!.map((i) => (<TableRow key={i.id}><TableCell className="text-sm font-sans">{i.inspection_type}</TableCell><TableCell className="text-xs text-muted-foreground">{i.scheduled_date ? format(new Date(i.scheduled_date), "MMM d") : "—"}</TableCell><TableCell className="text-sm font-sans">{i.inspector_name || "—"}</TableCell><TableCell>{i.result ? <Badge variant={i.result === "pass" ? "default" : i.result === "fail" ? "destructive" : "secondary"} className="text-[10px] capitalize">{i.result}</Badge> : <span className="text-xs text-muted-foreground">Pending</span>}</TableCell></TableRow>))}</TableBody></Table>
        )}
      </Card>
    </div>
  );
};

export default InspectionsPermitsTab;
