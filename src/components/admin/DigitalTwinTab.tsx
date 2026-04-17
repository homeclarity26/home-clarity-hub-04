import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Search, Shield, FileText, Clock, Wrench, Building, AlertTriangle,
  RefreshCw, Loader2, Plus, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Sparkles, Upload, Eye
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";

interface Props {
  clientId: string;
  propertyId: string;
}

// ─── Completeness Gauge ──────────────────────────
const CompletenessGauge = ({ score, breakdown }: { score: number; breakdown: Record<string, number> }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-destructive";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-8">
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              className={`${color} transition-all duration-700`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-sans ${color}`}>{score}%</span>
            <span className="text-[10px] text-muted-foreground font-sans">Complete</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-sans font-semibold text-foreground">Digital Twin Completeness</h4>
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[11px] font-sans text-muted-foreground w-24 capitalize">{key.replace(/_/g, " ")}</span>
              <Progress value={val as number} className="h-1.5 flex-1" />
              <span className="text-[11px] font-sans text-muted-foreground w-8 text-right">{val}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ─── Knowledge Base Table ───────────────────────
const KnowledgeBaseSection = ({ clientId }: { clientId: string }) => {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", content: "", knowledge_type: "fact", confidence: "medium" });
  const qc = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ["knowledge-base", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("home_knowledge_base").select("*")
        .eq("client_id", clientId).eq("is_current", true).order("date_recorded", { ascending: false });
      return data || [];
    },
  });

  const filtered = (entries || []).filter(e =>
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  const addEntry = async () => {
    if (!form.subject || !form.content) return;
    const { error } = await supabase.from("home_knowledge_base").insert({
      client_id: clientId, ...form, source_type: "manual_entry",
    });
    if (error) { toast.error("Failed to add"); return; }
    toast.success("Knowledge entry added");
    setAddOpen(false);
    setForm({ subject: "", content: "", knowledge_type: "fact", confidence: "medium" });
    qc.invalidateQueries({ queryKey: ["knowledge-base", clientId] });
  };

  const confidenceColor = (c: string) => {
    if (c === "verified") return "bg-emerald-500/10 text-emerald-600";
    if (c === "high") return "bg-blue-500/10 text-blue-600";
    if (c === "medium") return "bg-amber-500/10 text-amber-600";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search knowledge base..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm font-sans" />
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" />Add Entry
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-sans">No knowledge entries yet. Upload documents to auto-populate.</p>
            </Card>
          ) : filtered.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-sans font-semibold text-foreground">{entry.subject}</span>
                    <Badge variant="outline" className="text-[9px] h-4 capitalize">{entry.knowledge_type}</Badge>
                    <Badge className={`text-[9px] h-4 ${confidenceColor(entry.confidence)}`}>{entry.confidence}</Badge>
                  </div>
                  <p className="text-xs font-sans text-muted-foreground">{entry.content}</p>
                  <p className="text-[10px] font-sans text-muted-foreground mt-1">
                    Source: {entry.source_type.replace(/_/g, " ")}
                    {entry.date_of_fact && ` · Fact date: ${format(new Date(entry.date_of_fact), "MMM d, yyyy")}`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Add Knowledge Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs font-sans">Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="text-sm" /></div>
            <div><Label className="text-xs font-sans">Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="text-sm" rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-sans">Type</Label>
                <Select value={form.knowledge_type} onValueChange={(v) => setForm({ ...form, knowledge_type: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["fact","specification","history","warranty","permit","restriction","measurement","material","system_detail"].map(t => <SelectItem key={t} value={t} className="text-sm capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-sans">Confidence</Label>
                <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["verified","high","medium","low"].map(c => <SelectItem key={c} value={c} className="text-sm capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full text-xs font-sans" onClick={addEntry}>Add Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Timeline ───────────────────────────────
const TimelineSection = ({ clientId }: { clientId: string }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_type: "renovation", cost: "" });
  const qc = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["property-timeline", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("property_timeline").select("*")
        .eq("client_id", clientId).order("event_date", { ascending: false });
      return data || [];
    },
  });

  const addEvent = async () => {
    if (!form.title || !form.event_date) return;
    await supabase.from("property_timeline").insert({
      client_id: clientId, title: form.title, description: form.description,
      event_date: form.event_date, event_type: form.event_type,
      cost: form.cost ? parseFloat(form.cost) : null, created_by: "admin", verified: true,
    });
    toast.success("Timeline event added");
    setAddOpen(false);
    setForm({ title: "", description: "", event_date: "", event_type: "renovation", cost: "" });
    qc.invalidateQueries({ queryKey: ["property-timeline", clientId] });
  };

  const typeColors: Record<string, string> = {
    renovation: "bg-blue-500", repair: "bg-amber-500", purchase: "bg-emerald-500",
    permit: "bg-purple-500", inspection: "bg-cyan-500", appliance_install: "bg-indigo-500",
    service: "bg-orange-500", damage: "bg-red-500", insurance_claim: "bg-rose-500", sale: "bg-green-500",
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" />Add Event
        </Button>
      </div>

      {(events || []).length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">No timeline events. Upload documents to auto-populate history.</p>
        </Card>
      ) : (
        <div className="relative ml-4 border-l-2 border-border space-y-4 pl-6">
          {(events || []).map((ev) => (
            <div key={ev.id} className="relative">
              <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full ${typeColors[ev.event_type] || "bg-muted-foreground"}`} />
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-sans font-semibold text-foreground">{ev.title}</span>
                      <Badge variant="outline" className="text-[9px] h-4 capitalize">{ev.event_type.replace(/_/g, " ")}</Badge>
                      {ev.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    {ev.description && <p className="text-xs font-sans text-muted-foreground">{ev.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-sans text-muted-foreground">
                      <span>{format(new Date(ev.event_date), "MMM d, yyyy")}</span>
                      {ev.cost && <span>${Number(ev.cost).toLocaleString()}</span>}
                      {ev.contractor_name && <span>{ev.contractor_name}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Add Timeline Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs font-sans">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="text-sm" /></div>
            <div><Label className="text-xs font-sans">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-sm" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-sans">Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="text-sm" /></div>
              <div><Label className="text-xs font-sans">Type</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["renovation","repair","purchase","permit","inspection","appliance_install","service","damage","insurance_claim","sale"].map(t => <SelectItem key={t} value={t} className="text-sm capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs font-sans">Cost (optional)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="text-sm" /></div>
            <Button className="w-full text-xs font-sans" onClick={addEvent}>Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Warranty Registry ──────────────────────
const WarrantySection = ({ clientId }: { clientId: string }) => {
  const { data: warranties } = useQuery({
    queryKey: ["warranty-registry", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("warranty_registry").select("*")
        .eq("client_id", clientId).order("expiration_date", { ascending: true });
      return data || [];
    },
  });

  const getStatusColor = (exp: string | null) => {
    if (!exp) return "text-muted-foreground";
    const days = differenceInDays(new Date(exp), new Date());
    if (days < 0) return "text-destructive";
    if (days < 90) return "text-destructive";
    if (days < 365) return "text-amber-500";
    return "text-emerald-500";
  };

  const expiringWarranties = (warranties || []).filter(w => {
    if (!w.expiration_date) return false;
    const days = differenceInDays(new Date(w.expiration_date), new Date());
    return days >= 0 && days <= 90;
  });

  return (
    <div className="space-y-3">
      {expiringWarranties.length > 0 && (
        <Card className="p-3 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-sans font-medium text-amber-600">{expiringWarranties.length} warranty(s) expiring within 90 days</span>
          </div>
        </Card>
      )}

      {(warranties || []).length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">No warranty records. Upload warranty documents to auto-populate.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(warranties || []).map((w) => {
            const daysLeft = w.expiration_date ? differenceInDays(new Date(w.expiration_date), new Date()) : null;
            return (
              <Card key={w.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-sans font-semibold text-foreground">{w.item_name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {w.manufacturer && <span className="text-xs text-muted-foreground font-sans">{w.manufacturer}</span>}
                      {w.model_number && <span className="text-xs text-muted-foreground font-sans">· {w.model_number}</span>}
                      <Badge variant="outline" className="text-[9px] h-4 capitalize">{w.warranty_type}</Badge>
                    </div>
                    {w.coverage_description && <p className="text-xs text-muted-foreground font-sans mt-1">{w.coverage_description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {w.expiration_date && (
                      <>
                        <span className={`text-sm font-sans font-medium ${getStatusColor(w.expiration_date)}`}>
                          {daysLeft !== null && daysLeft < 0 ? "Expired" : `${daysLeft} days`}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-sans">{format(new Date(w.expiration_date), "MMM d, yyyy")}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Permit Registry ────────────────────────
const PermitSection = ({ clientId }: { clientId: string }) => {
  const { data: permits } = useQuery({
    queryKey: ["permit-registry", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("permit_registry").select("*")
        .eq("client_id", clientId).order("issue_date", { ascending: false });
      return data || [];
    },
  });

  const openPermits = (permits || []).filter(p => p.status === "open");

  return (
    <div className="space-y-3">
      {openPermits.length > 0 && (
        <Card className="p-3 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-sans font-medium text-amber-600">{openPermits.length} open permit(s) without final inspection</span>
          </div>
        </Card>
      )}

      {(permits || []).length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">No permits on file. Upload permit documents to auto-populate.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(permits || []).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans font-semibold text-foreground">{p.permit_type || "Permit"}</span>
                    {p.permit_number && <span className="text-xs text-muted-foreground font-sans">#{p.permit_number}</span>}
                    <Badge variant={p.status === "closed" ? "secondary" : p.status === "expired" ? "destructive" : "default"} className="text-[9px] h-4 capitalize">{p.status}</Badge>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground font-sans mt-1">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-sans">
                    {p.issue_date && <span>Issued: {format(new Date(p.issue_date), "MMM d, yyyy")}</span>}
                    {p.issued_by && <span>by {p.issued_by}</span>}
                    {p.contractor_name && <span>Contractor: {p.contractor_name}</span>}
                  </div>
                </div>
                {(p.estimated_cost || p.final_cost) && (
                  <span className="text-sm font-sans text-muted-foreground">${Number(p.final_cost || p.estimated_cost).toLocaleString()}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Service History ────────────────────────
const ServiceHistorySection = ({ clientId }: { clientId: string }) => {
  const { data: records } = useQuery({
    queryKey: ["service-history", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("service_history").select("*")
        .eq("client_id", clientId).order("service_date", { ascending: false });
      return data || [];
    },
  });

  return (
    (records || []).length === 0 ? (
      <Card className="p-8 text-center">
        <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-sans">No service records. Upload invoices or service records to auto-populate.</p>
      </Card>
    ) : (
      <div className="space-y-2">
        {(records || []).map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-sans font-semibold text-foreground">{r.service_type}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">{format(new Date(r.service_date), "MMM d, yyyy")}</span>
                </div>
                {r.description && <p className="text-xs text-muted-foreground font-sans">{r.description}</p>}
                {r.contractor_name && <p className="text-[10px] text-muted-foreground font-sans mt-1">Contractor: {r.contractor_name}</p>}
              </div>
              {r.cost && <span className="text-sm font-sans text-muted-foreground">${Number(r.cost).toLocaleString()}</span>}
            </div>
          </Card>
        ))}
      </div>
    )
  );
};

// ─── Structural Specs ───────────────────────
const StructuralSpecsSection = ({ clientId }: { clientId: string }) => {
  const { data: specs } = useQuery({
    queryKey: ["structural-specs", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("structural_specifications").select("*")
        .eq("client_id", clientId).order("spec_category");
      return data || [];
    },
  });

  const grouped = (specs || []).reduce((acc, s) => {
    (acc[s.spec_category] = acc[s.spec_category] || []).push(s);
    return acc;
  }, {} as Record<string, typeof specs>);

  return Object.keys(grouped).length === 0 ? (
    <Card className="p-8 text-center">
      <Building className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground font-sans">No structural specifications recorded.</p>
    </Card>
  ) : (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="p-4">
          <h4 className="text-sm font-sans font-semibold text-foreground mb-2 capitalize">{cat.replace(/_/g, " ")}</h4>
          <div className="space-y-1">
            {(items || []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-xs font-sans text-muted-foreground">{s.specification_name}</span>
                <span className="text-xs font-sans text-foreground font-medium">{s.specification_value}{s.unit ? ` ${s.unit}` : ""}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── Document Intelligence ──────────────────
const DocumentIntelligence = ({ clientId }: { clientId: string }) => {
  const { data: extractions } = useQuery({
    queryKey: ["doc-extractions", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("document_extractions").select("*")
        .eq("client_id", clientId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    (extractions || []).length === 0 ? (
      <Card className="p-8 text-center">
        <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-sans">No documents have been processed yet.</p>
      </Card>
    ) : (
      <div className="space-y-2">
        {(extractions || []).map((ext) => (
          <Card key={ext.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={ext.extraction_status === "complete" ? "secondary" : ext.extraction_status === "failed" ? "destructive" : "default"}
                  className="text-[9px] h-4 capitalize">{ext.extraction_status}</Badge>
                {ext.document_type && <Badge variant="outline" className="text-[9px] h-4 capitalize">{ext.document_type.replace(/_/g, " ")}</Badge>}
                {ext.confidence_score && <span className="text-[10px] text-muted-foreground font-sans">{ext.confidence_score}% confidence</span>}
              </div>
              <span className="text-[10px] text-muted-foreground font-sans">{format(new Date(ext.created_at), "MMM d, yyyy")}</span>
            </div>
          </Card>
        ))}
      </div>
    )
  );
};

// ─── Knowledge Gap Analysis ─────────────────
const KnowledgeGapSection = ({ clientId }: { clientId: string }) => {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-knowledge-gaps", { body: { client_id: clientId } });
      if (error) throw error;
      setGaps(data.gaps || []);
    } catch (e: any) {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={analyze} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        Analyze Missing Records
      </Button>

      {gaps.length > 0 && (
        <div className="space-y-2">
          {gaps.map((g, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-sans font-semibold text-foreground">{g.title}</span>
                    <Badge variant={g.difficulty === "easy" ? "secondary" : g.difficulty === "medium" ? "default" : "destructive"} className="text-[9px] h-4 capitalize">{g.difficulty}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">{g.description}</p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-1">Why: {g.why_it_matters}</p>
                  <p className="text-[10px] text-primary font-sans mt-0.5">How: {g.how_to_obtain}</p>
                </div>
                {g.can_upload && (
                  <Button variant="outline" size="sm" className="text-[10px] gap-1 shrink-0">
                    <Upload className="w-3 h-3" />Upload
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────
const DigitalTwinTab = ({ clientId, propertyId }: Props) => {
  const [completeness, setCompleteness] = useState({ score: 0, breakdown: {} as Record<string, number> });
  const [loadingScore, setLoadingScore] = useState(false);

  const loadCompleteness = async () => {
    setLoadingScore(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-knowledge-gaps", { body: { client_id: propertyId } });
      if (error) {
        console.error("analyze-knowledge-gaps returned error:", error);
      } else if (data) {
        setCompleteness({ score: data.completeness_score || 0, breakdown: data.completeness_breakdown || {} });
      }
    } catch (err) {
      // Keep this catch: network drop / edge function missing shouldn't crash
      // the Digital Twin tab. But no longer silent — log so we can diagnose.
      console.error("analyze-knowledge-gaps invoke failed:", err);
    }
    setLoadingScore(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-base font-sans font-bold text-foreground">Digital Twin</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={loadCompleteness} disabled={loadingScore}>
          {loadingScore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Analyze Completeness
        </Button>
      </div>

      {/* Completeness Gauge */}
      {completeness.score > 0 && <CompletenessGauge score={completeness.score} breakdown={completeness.breakdown} />}

      {/* Sub-tabs */}
      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="knowledge" className="text-xs font-sans">Knowledge Base</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-sans">Timeline</TabsTrigger>
          <TabsTrigger value="warranties" className="text-xs font-sans">Warranties</TabsTrigger>
          <TabsTrigger value="permits" className="text-xs font-sans">Permits</TabsTrigger>
          <TabsTrigger value="service" className="text-xs font-sans">Service History</TabsTrigger>
          <TabsTrigger value="specs" className="text-xs font-sans">Structural Specs</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-sans">Document Intelligence</TabsTrigger>
          <TabsTrigger value="gaps" className="text-xs font-sans">Missing Records</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge"><KnowledgeBaseSection clientId={propertyId} /></TabsContent>
        <TabsContent value="timeline"><TimelineSection clientId={propertyId} /></TabsContent>
        <TabsContent value="warranties"><WarrantySection clientId={propertyId} /></TabsContent>
        <TabsContent value="permits"><PermitSection clientId={propertyId} /></TabsContent>
        <TabsContent value="service"><ServiceHistorySection clientId={propertyId} /></TabsContent>
        <TabsContent value="specs"><StructuralSpecsSection clientId={propertyId} /></TabsContent>
        <TabsContent value="documents"><DocumentIntelligence clientId={propertyId} /></TabsContent>
        <TabsContent value="gaps"><KnowledgeGapSection clientId={propertyId} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default DigitalTwinTab;
