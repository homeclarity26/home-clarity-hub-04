import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Phone, Mail, Globe, Shield, Star, Briefcase, FileText, MessageSquare, DollarSign, BarChart3, Users, GitBranch, CheckCircle2, AlertTriangle, Calendar, MapPin, Plus, ExternalLink } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CRMAIAssistant from "@/components/admin/CRMAIAssistant";
import { useCRMContact, useCRMActivities, useCRMPipelineHistory, useUpdateCRMStage, useLogCRMActivity } from "@/hooks/useCRMData";
import { useVendorDetail, useVendorProjects, useVendorBids, useVendorReviews, useVendorTasks, useCreateVendorReview } from "@/hooks/useTradePartnerData";
import { useAuth } from "@/contexts/AuthContext";
import { format, isPast, addDays, isAfter } from "date-fns";
import { toast } from "sonner";

type ProfileTab = "overview" | "pipeline" | "projects" | "bids" | "timeline" | "documents" | "financial" | "reviews" | "portal";

const PARTNER_STAGES = ["prospecting", "vetting", "approved", "active", "preferred", "inactive"];
const stageLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
const stageColor = (s: string): string => {
  const m: Record<string, string> = { prospecting: "bg-blue-100 text-blue-800", vetting: "bg-yellow-100 text-yellow-800", approved: "bg-emerald-100 text-emerald-800", active: "bg-cyan-100 text-cyan-800", preferred: "bg-purple-100 text-purple-800", inactive: "bg-muted text-muted-foreground" };
  return m[s] || "bg-muted text-muted-foreground";
};

const AdminCRMTradePartnerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [aiOpen, setAiOpen] = useState(false);

  const { data: crmContact, isLoading } = useCRMContact(id);
  const vendorId = crmContact?.vendor_id;
  const { data: vendor } = useVendorDetail(vendorId || undefined);
  const { data: projects } = useVendorProjects(vendorId || undefined);
  const { data: bids } = useVendorBids(vendorId || undefined);
  const { data: reviews } = useVendorReviews(vendorId || undefined);
  const { data: tasks } = useVendorTasks(vendorId || undefined);
  const { data: activities } = useCRMActivities(id);
  const { data: pipelineHistory } = useCRMPipelineHistory(id);
  const updateStage = useUpdateCRMStage();
  const logActivity = useLogCRMActivity();

  if (isLoading) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: "Loading..." }]} />
        <div className="p-6 space-y-4 max-w-6xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>
      </div>
    );
  }

  if (!crmContact || !vendor) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: "Not Found" }]} />
        <div className="p-6 max-w-6xl">
          <Card className="p-12 text-center">
            <h3 className="font-sans font-semibold text-lg text-foreground mb-2">Trade partner not found</h3>
            <Button variant="outline" onClick={() => navigate("/admin/crm")}>Back to CRM</Button>
          </Card>
        </div>
      </div>
    );
  }

  const name = vendor.contact_name || vendor.company_name;
  const stage = crmContact.partner_stage || "prospecting";
  const insuranceExpiry = vendor.insurance_expiry ? new Date(vendor.insurance_expiry) : null;
  const insuranceWarning = insuranceExpiry && isAfter(addDays(new Date(), 60), insuranceExpiry);
  const insuranceExpired = insuranceExpiry && isPast(insuranceExpiry);
  const avgRating = reviews && reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + (r.quality_rating + r.timeliness_rating + r.communication_rating + r.cost_accuracy_rating) / 4, 0) / reviews.length).toFixed(1) : null;

  const handleStageChange = (newStage: string) => {
    if (!user) return;
    updateStage.mutate({ contactId: crmContact.id, contactType: "trade_partner", newStage, userId: user.id });
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: name }]} />
      <div className="p-6 space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/crm")}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-sans font-medium">
              {(name || "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold text-foreground">{name}</h1>
              <p className="font-sans text-xs text-muted-foreground">{vendor.company_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans mt-0.5">
                {vendor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{vendor.email}</span>}
                {vendor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] font-sans ${stageColor(stage)}`}>{stageLabel(stage)}</Badge>
            {vendor.tier && <Badge variant="outline" className="text-[10px] font-sans">{stageLabel(vendor.tier)}</Badge>}
            <div className="flex items-center gap-0.5 ml-1">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < (vendor.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}
            </div>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="gap-1.5 font-sans ml-2">
              <Sparkles className="w-4 h-4" /> AI
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => setTab(v as ProfileTab)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs font-sans gap-1"><Users className="w-3.5 h-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs font-sans gap-1"><GitBranch className="w-3.5 h-3.5" /> Pipeline</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs font-sans gap-1"><Briefcase className="w-3.5 h-3.5" /> Projects</TabsTrigger>
            <TabsTrigger value="bids" className="text-xs font-sans gap-1"><DollarSign className="w-3.5 h-3.5" /> Bids</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-sans gap-1"><Calendar className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs font-sans gap-1"><FileText className="w-3.5 h-3.5" /> Documents</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs font-sans gap-1"><DollarSign className="w-3.5 h-3.5" /> Financial</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs font-sans gap-1"><BarChart3 className="w-3.5 h-3.5" /> Reviews</TabsTrigger>
            <TabsTrigger value="portal" className="text-xs font-sans gap-1"><ExternalLink className="w-3.5 h-3.5" /> Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab vendor={vendor} projects={projects} reviews={reviews} tasks={tasks} insuranceWarning={!!insuranceWarning} insuranceExpired={!!insuranceExpired} avgRating={avgRating} />
          </TabsContent>
          <TabsContent value="pipeline">
            <PipelineTab stage={stage} onStageChange={handleStageChange} history={pipelineHistory} vendor={vendor} />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab projects={projects} tasks={tasks} />
          </TabsContent>
          <TabsContent value="bids">
            <BidsTab bids={bids} vendorName={vendor.company_name} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelineTab activities={activities} contactId={crmContact.id} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab vendor={vendor} />
          </TabsContent>
          <TabsContent value="financial">
            <FinancialTab projects={projects} reviews={reviews} />
          </TabsContent>
          <TabsContent value="reviews">
            <ReviewsTab reviews={reviews} vendorId={vendorId!} avgRating={avgRating} />
          </TabsContent>
          <TabsContent value="portal">
            <PortalTab vendor={vendor} />
          </TabsContent>
        </Tabs>
      </div>
      <CRMAIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
};

// ─── TAB 1: OVERVIEW ───
const OverviewTab = ({ vendor, projects, reviews, tasks, insuranceWarning, insuranceExpired, avgRating }: any) => {
  const activeProjects = (projects || []).filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length;
  const completedProjects = (projects || []).filter((p: any) => p.status === "completed").length;
  const openTasks = (tasks || []).filter((t: any) => t.status !== "complete").length;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {insuranceExpired && (
        <Card className="p-3 border-destructive/30 bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-sans text-destructive font-medium">Insurance has expired — action required</span>
        </Card>
      )}
      {insuranceWarning && !insuranceExpired && (
        <Card className="p-3 border-amber-300/50 bg-amber-50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-sans text-amber-800">Insurance expires {vendor.insurance_expiry ? format(new Date(vendor.insurance_expiry), "MMM d, yyyy") : "soon"}</span>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Active Projects" value={activeProjects} />
        <StatCard label="Completed" value={completedProjects} />
        <StatCard label="Open Tasks" value={openTasks} />
        <StatCard label="Avg Rating" value={avgRating || "—"} />
        <StatCard label="Reviews" value={(reviews || []).length} />
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-sans font-semibold text-foreground">Company Details</h3>
          <DetailRow label="Company" value={vendor.company_name} />
          <DetailRow label="Contact" value={vendor.contact_name} />
          <DetailRow label="Phone" value={vendor.phone} />
          <DetailRow label="Email" value={vendor.email} />
          <DetailRow label="Website" value={vendor.website} icon={<Globe className="w-3 h-3" />} />
          <DetailRow label="Service Area" value={vendor.service_area} />
          <DetailRow label="Lead Time" value={vendor.lead_time} />
          <DetailRow label="Cost Tier" value={vendor.cost_tier} />
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-sans font-semibold text-foreground">Licensing & Insurance</h3>
          <DetailRow label="License #" value={vendor.license_number} />
          <DetailRow label="Insurance Expiry" value={vendor.insurance_expiry ? format(new Date(vendor.insurance_expiry), "MMM d, yyyy") : "—"} />
          <DetailRow label="Status" value={vendor.status} />
          {vendor.specialties && vendor.specialties.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-sans mb-1">Specialties</p>
              <div className="flex flex-wrap gap-1">
                {vendor.specialties.map((s: string) => <Badge key={s} variant="outline" className="text-[10px] font-sans">{s}</Badge>)}
              </div>
            </div>
          )}
          {vendor.notes && (
            <div>
              <p className="text-xs text-muted-foreground font-sans mb-1">Notes</p>
              <p className="text-sm font-sans text-foreground">{vendor.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Vetting Checklist */}
      <Card className="p-5">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Vetting Checklist</h3>
        <VettingChecklist checklist={vendor.vetting_checklist} />
      </Card>
    </div>
  );
};

// ─── TAB 2: PIPELINE ───
const PipelineTab = ({ stage, onStageChange, history, vendor }: any) => (
  <div className="space-y-6">
    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Relationship Stage</h3>
      <div className="flex items-center gap-1 flex-wrap">
        {PARTNER_STAGES.map((s, i) => (
          <button key={s} onClick={() => onStageChange(s)} className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-sans transition-colors border-none cursor-pointer ${stage === s ? "bg-primary text-primary-foreground font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
            {stageLabel(s)}
          </button>
        ))}
      </div>
    </Card>

    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Stage History</h3>
      {(history || []).length === 0 ? (
        <p className="text-sm text-muted-foreground font-sans text-center py-6">No stage changes yet</p>
      ) : (
        <div className="space-y-2">
          {(history || []).map((h: any) => (
            <div key={h.id} className="flex items-center gap-3 text-xs font-sans py-2 border-b border-border last:border-0">
              <span className="text-muted-foreground w-28 shrink-0">{format(new Date(h.changed_at), "MMM d, h:mm a")}</span>
              <Badge className={`text-[10px] ${stageColor(h.from_stage || "")}`}>{stageLabel(h.from_stage || "—")}</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge className={`text-[10px] ${stageColor(h.to_stage)}`}>{stageLabel(h.to_stage)}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>

    {/* Vetting Checklist inline */}
    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Vetting Checklist</h3>
      <VettingChecklist checklist={vendor.vetting_checklist} />
    </Card>
  </div>
);

// ─── TAB 3: PROJECTS ───
const ProjectsTab = ({ projects, tasks }: any) => (
  <div className="space-y-4">
    {(projects || []).length === 0 ? (
      <Card className="p-12 text-center">
        <Briefcase className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No projects yet</h3>
        <p className="text-xs text-muted-foreground font-sans">Assign this trade partner to a project to see work history here.</p>
      </Card>
    ) : (
      (projects || []).map((p: any) => {
        const projectTasks = (tasks || []).filter((t: any) => t.project_id === p.id);
        const completeTasks = projectTasks.filter((t: any) => t.status === "complete").length;
        return (
          <Card key={p.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-sans font-medium text-foreground">{p.title}</h4>
                <p className="text-xs text-muted-foreground font-sans">{p.description?.slice(0, 80)}</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-sans">{p.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
              <span>{projectTasks.length} tasks ({completeTasks} done)</span>
              {p.actual_cost && <span>${Number(p.actual_cost).toLocaleString()} paid</span>}
              <span>{format(new Date(p.created_at), "MMM yyyy")}</span>
            </div>
          </Card>
        );
      })
    )}
  </div>
);

// ─── TAB 4: BIDS ───
const BidsTab = ({ bids, vendorName }: any) => {
  const filtered = (bids || []).filter((b: any) => b.contractor_name?.toLowerCase() === vendorName?.toLowerCase());
  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No bids</h3>
          <p className="text-xs text-muted-foreground font-sans">Bids submitted by this trade partner will appear here.</p>
        </Card>
      ) : (
        filtered.map((b: any) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-sans font-medium text-foreground">{b.scope_of_work || "Bid"}</h4>
                <p className="text-xs text-muted-foreground font-sans">{b.estimated_timeline}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-sans font-bold text-foreground">${Number(b.bid_amount).toLocaleString()}</p>
                <Badge variant="outline" className={`text-[10px] font-sans ${b.status === "accepted" ? "bg-emerald-100 text-emerald-800" : b.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{b.status}</Badge>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

// ─── TAB 5: TIMELINE ───
const TimelineTab = ({ activities, contactId }: any) => {
  const logActivity2 = useLogCRMActivity();
  const { user } = useAuth();
  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState("call");
  const [logContent, setLogContent] = useState("");

  const handleLog = () => {
    if (!logContent.trim()) return;
    logActivity2.mutate({ contact_id: contactId, activity_type: logType, channel: logType, content_preview: logContent, metadata: {}, logged_by: user?.id || null });
    setLogContent("");
    setShowLog(false);
    toast.success("Activity logged");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Activity Timeline</h3>
        <Button size="sm" variant="outline" onClick={() => setShowLog(!showLog)} className="gap-1 font-sans text-xs"><Plus className="w-3 h-3" /> Log Activity</Button>
      </div>

      {showLog && (
        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            {["call", "meeting", "email", "site_visit", "note"].map(t => (
              <button key={t} onClick={() => setLogType(t)} className={`px-2 py-1 rounded text-xs font-sans border-none cursor-pointer ${logType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
          <Textarea value={logContent} onChange={e => setLogContent(e.target.value)} placeholder="What happened?" className="font-sans text-sm" rows={3} />
          <Button size="sm" onClick={handleLog} className="font-sans">Save</Button>
        </Card>
      )}

      {(activities || []).length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No activity yet</h3>
          <p className="text-xs text-muted-foreground font-sans">Log calls, meetings, and emails to build a complete timeline.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(activities || []).map((a: any) => (
            <Card key={a.id} className="p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {a.activity_type === "call" ? <Phone className="w-3.5 h-3.5 text-muted-foreground" /> : a.activity_type === "email" ? <Mail className="w-3.5 h-3.5 text-muted-foreground" /> : <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-sans text-foreground">{a.content_preview}</p>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                  {stageLabel(a.activity_type)} · {format(new Date(a.logged_at), "MMM d, h:mm a")}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TAB 6: DOCUMENTS ───
const DocumentsTab = ({ vendor }: any) => {
  const checklist = vendor.vetting_checklist || {};
  const docs = [
    { label: "W-9 Form", key: "w9_on_file", status: checklist.w9_on_file },
    { label: "Insurance Certificate", key: "insurance_verified", status: checklist.insurance_verified },
    { label: "License Copy", key: "license_verified", status: checklist.license_verified },
    { label: "Background Check", key: "background_check", status: checklist.background_check },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Documents</h3>
        <Button size="sm" variant="outline" className="gap-1 font-sans text-xs"><Plus className="w-3 h-3" /> Request Document</Button>
      </div>
      {docs.map(d => (
        <Card key={d.key} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-sans text-foreground">{d.label}</span>
          </div>
          {d.status ? (
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-sans gap-1"><CheckCircle2 className="w-3 h-3" /> On File</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-sans text-muted-foreground">Missing</Badge>
          )}
        </Card>
      ))}
    </div>
  );
};

// ─── TAB 7: FINANCIAL ───
const FinancialTab = ({ projects, reviews }: any) => {
  const totalPaid = (projects || []).reduce((s: number, p: any) => s + (Number(p.actual_cost) || 0), 0);
  const totalEstimated = (projects || []).reduce((s: number, p: any) => s + (Number(p.estimated_cost) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Paid" value={`$${totalPaid.toLocaleString()}`} />
        <StatCard label="Total Estimated" value={`$${totalEstimated.toLocaleString()}`} />
        <StatCard label="Projects" value={(projects || []).length} />
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Payment History</h3>
        {(projects || []).filter((p: any) => p.actual_cost).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans text-center py-6">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {(projects || []).filter((p: any) => p.actual_cost).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-sans text-foreground">{p.title}</span>
                <span className="text-sm font-sans font-medium text-foreground">${Number(p.actual_cost).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── TAB 8: REVIEWS ───
const ReviewsTab = ({ reviews, vendorId, avgRating }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ quality_rating: 4, timeliness_rating: 4, communication_rating: 4, cost_accuracy_rating: 4, notes: "" });
  const createReview = useCreateVendorReview();

  const handleSubmit = () => {
    createReview.mutate({ vendor_id: vendorId, ...form });
    setShowAdd(false);
    setForm({ quality_rating: 4, timeliness_rating: 4, communication_rating: 4, cost_accuracy_rating: 4, notes: "" });
  };

  const categories = ["quality_rating", "timeliness_rating", "communication_rating", "cost_accuracy_rating"];
  const catLabels: Record<string, string> = { quality_rating: "Quality", timeliness_rating: "Timeliness", communication_rating: "Communication", cost_accuracy_rating: "Cost Accuracy" };

  // Compute averages per category
  const catAvgs = categories.reduce((acc, cat) => {
    acc[cat] = reviews && reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + (r[cat] || 0), 0) / reviews.length).toFixed(1) : "—";
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-sans font-semibold text-foreground">Performance Reviews</h3>
          {avgRating && <p className="text-xs text-muted-foreground font-sans">{reviews?.length} reviews · Avg {avgRating}/5</p>}
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1 font-sans text-xs"><Plus className="w-3 h-3" /> Add Review</Button>
      </div>

      {/* Category averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Card key={cat} className="p-3 text-center">
            <p className="text-xl font-sans font-bold text-foreground">{catAvgs[cat]}</p>
            <p className="text-[10px] text-muted-foreground font-sans">{catLabels[cat]}</p>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-sans font-semibold text-foreground">New Review</h4>
          <div className="grid grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat}>
                <Label className="text-xs font-sans">{catLabels[cat]}</Label>
                <Select value={String((form as any)[cat])} onValueChange={v => setForm(f => ({ ...f, [cat]: Number(v) }))}>
                  <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Star{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs font-sans">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-sans" rows={3} />
          </div>
          <Button onClick={handleSubmit} className="font-sans">Submit Review</Button>
        </Card>
      )}

      {/* Review list */}
      {(reviews || []).map((r: any) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-sans">{format(new Date(r.review_date), "MMM d, yyyy")}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const avg = (r.quality_rating + r.timeliness_rating + r.communication_rating + r.cost_accuracy_rating) / 4;
                return <Star key={i} className={`w-3 h-3 ${i < Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />;
              })}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mb-2">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-sm font-sans font-bold text-foreground">{r[cat]}</p>
                <p className="text-[9px] text-muted-foreground font-sans">{catLabels[cat]}</p>
              </div>
            ))}
          </div>
          {r.notes && <p className="text-xs font-sans text-muted-foreground border-t border-border pt-2 mt-2">{r.notes}</p>}
        </Card>
      ))}
    </div>
  );
};

// ─── TAB 9: PORTAL ACCESS ───
const PortalTab = ({ vendor }: any) => (
  <div className="space-y-4">
    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Portal Access</h3>
      <div className="space-y-3">
        <DetailRow label="User ID" value={vendor.user_id || "Not linked"} />
        <DetailRow label="Portal URL" value={vendor.user_id ? "/trade" : "—"} />
        <DetailRow label="Status" value={vendor.user_id ? "Active" : "Not invited"} />
      </div>
      <div className="flex gap-2 mt-4">
        {!vendor.user_id ? (
          <Button size="sm" className="gap-1 font-sans"><Mail className="w-3.5 h-3.5" /> Send Portal Invite</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="font-sans">Resend Invite</Button>
            <Button size="sm" variant="outline" className="font-sans">Reset Password</Button>
          </>
        )}
      </div>
    </Card>
  </div>
);

// ─── Shared sub-components ───

const StatCard = ({ label, value }: { label: string; value: any }) => (
  <Card className="p-4 text-center">
    <p className="text-xl font-sans font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{label}</p>
  </Card>
);

const DetailRow = ({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-muted-foreground font-sans">{label}</span>
    <span className="text-sm font-sans text-foreground flex items-center gap-1">{icon}{value || "—"}</span>
  </div>
);

const VettingChecklist = ({ checklist }: { checklist: any }) => {
  const items = [
    { key: "license_verified", label: "License Verified" },
    { key: "insurance_verified", label: "Insurance Verified" },
    { key: "w9_on_file", label: "W-9 on File" },
    { key: "background_check", label: "Background Check" },
    { key: "reference_check", label: "Reference Check" },
  ];
  const cl = checklist || {};
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map(item => (
        <div key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-sans ${cl[item.key] ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
          {cl[item.key] ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />}
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default AdminCRMTradePartnerProfile;
