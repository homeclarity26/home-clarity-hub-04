import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientOverview from "@/components/admin/ClientOverview";
import ReportPageManager from "@/components/admin/ReportPageManager";
import FileManager from "@/components/admin/FileManager";
import CommentsManager from "@/components/admin/CommentsManager";
import { useAdminClient, useAdminProjects, useAdminInvoices, useAdminScheduleEvents } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

type ClientTab = "overview" | "report" | "files" | "comments" | "projects" | "payments" | "schedule" | "vendors";

const tabs: { id: ClientTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "report", label: "Report" },
  { id: "files", label: "Files" },
  { id: "comments", label: "Comments" },
  { id: "projects", label: "Projects" },
  { id: "payments", label: "Payments" },
  { id: "schedule", label: "Schedule" },
  { id: "vendors", label: "Vendors" },
];

const AdminClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const { client, isLoading } = useAdminClient(clientId);
  const { data: projects } = useAdminProjects(clientId);
  const { data: invoices } = useAdminInvoices(clientId);
  const { data: events } = useAdminScheduleEvents(clientId);

  // Fetch report pages for PDF generation
  const { data: reportPages } = useQuery({
    queryKey: ["admin-report-pages", client?.reportId],
    enabled: !!client?.reportId,
    queryFn: async () => {
      const { data } = await supabase
        .from("report_pages")
        .select("*")
        .eq("report_id", client!.reportId!)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const pdfData: PDFReportData | undefined = useMemo(() => {
    if (!client || !reportPages || reportPages.length === 0) return undefined;

    // Build groups and pages from DB data
    const groupMap = new Map<string, { pages: { key: string; order: number }[] }>();
    const pagesMap: Record<string, ReportPageData> = {};
    const imagesMap: Record<string, string[]> = {};

    for (const p of reportPages) {
      if (!groupMap.has(p.group_name)) {
        groupMap.set(p.group_name, { pages: [] });
      }
      groupMap.get(p.group_name)!.pages.push({ key: p.page_key, order: p.sort_order });

      pagesMap[p.page_key] = {
        id: p.page_key,
        title: p.title,
        group: p.group_name,
        conditionRating: p.condition_rating as ReportPageData["conditionRating"],
        narrative: (p.narrative as string[]) || [],
        healthBar: p.health_bar as ReportPageData["healthBar"],
        specs: (p.specs as { label: string; value: string }[]) || undefined,
        tiers: p.tiers as unknown as ReportPageData["tiers"],
        timing: p.timing || undefined,
        recommendations: (p.recommendations as string[]) || undefined,
      } as ReportPageData;

      // Attach extended fields for PDF
      const extended = pagesMap[p.page_key] as unknown as Record<string, unknown>;
      extended.key_observations = (p.key_observations as string[]) || undefined;
      extended.risks = (p.risks as string[]) || undefined;
      extended.dependencies = p.dependencies || undefined;
      extended.maintenance = p.maintenance || undefined;
      extended.creator_notes = p.creator_notes || undefined;

      if (p.images && Array.isArray(p.images) && (p.images as string[]).length > 0) {
        imagesMap[p.page_key] = p.images as string[];
      }
    }

    const groups: PortalGroup[] = Array.from(groupMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      title: name,
      pages: data.pages.sort((a, b) => a.order - b.order).map((p) => p.key),
    }));

    const now = new Date();
    return {
      propertyName: client.propertyName,
      address: client.address,
      date: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      creatorName: profile?.full_name || "Hometown Builders Club",
      creatorEmail: profile?.email || undefined,
      creatorPhone: profile?.phone || undefined,
      groups,
      pages: pagesMap,
      pageImages: imagesMap,
    };
  }, [client, reportPages, profile]);

  // Create dialog states
  const [projectOpen, setProjectOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  // Edit dialog states
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({ title: "", status: "planned", notes: "", approved_tier: "" });
  const [invoiceForm, setInvoiceForm] = useState({ description: "", amount: "", due_date: "", status: "pending" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "", event_type: "appointment" });

  // Edit IDs
  const [editId, setEditId] = useState<string | null>(null);

  const resetProjectForm = () => setProjectForm({ title: "", status: "planned", notes: "", approved_tier: "" });
  const resetInvoiceForm = () => setInvoiceForm({ description: "", amount: "", due_date: "", status: "pending" });
  const resetEventForm = () => setEventForm({ title: "", description: "", event_date: "", event_type: "appointment" });

  const createProject = async () => {
    if (!clientId || !projectForm.title) return;
    const { error } = await supabase.from("projects").insert({
      property_id: clientId, title: projectForm.title, status: projectForm.status, notes: projectForm.notes || null, approved_tier: projectForm.approved_tier || null,
    });
    if (error) { toast.error("Failed to create project"); return; }
    toast.success("Project created");
    setProjectOpen(false);
    resetProjectForm();
    queryClient.invalidateQueries({ queryKey: ["admin-projects", clientId] });
  };

  const updateProject = async () => {
    if (!editId || !projectForm.title) return;
    const { error } = await supabase.from("projects").update({
      title: projectForm.title, status: projectForm.status, notes: projectForm.notes || null, approved_tier: projectForm.approved_tier || null,
    }).eq("id", editId);
    if (error) { toast.error("Failed to update project"); return; }
    toast.success("Project updated");
    setEditProjectOpen(false);
    resetProjectForm();
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ["admin-projects", clientId] });
  };

  const createInvoice = async () => {
    if (!clientId || !invoiceForm.description || !invoiceForm.amount) return;
    const { error } = await supabase.from("invoices").insert({
      property_id: clientId, description: invoiceForm.description, amount: parseFloat(invoiceForm.amount), status: invoiceForm.status, due_date: invoiceForm.due_date || null,
    });
    if (error) { toast.error("Failed to create invoice"); return; }
    toast.success("Invoice created");
    setInvoiceOpen(false);
    resetInvoiceForm();
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
  };

  const updateInvoice = async () => {
    if (!editId || !invoiceForm.description || !invoiceForm.amount) return;
    const { error } = await supabase.from("invoices").update({
      description: invoiceForm.description, amount: parseFloat(invoiceForm.amount), status: invoiceForm.status, due_date: invoiceForm.due_date || null,
    }).eq("id", editId);
    if (error) { toast.error("Failed to update invoice"); return; }
    toast.success("Invoice updated");
    setEditInvoiceOpen(false);
    resetInvoiceForm();
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
  };

  const createEvent = async () => {
    if (!clientId || !eventForm.title || !eventForm.event_date) return;
    const { error } = await supabase.from("schedule_events").insert({
      property_id: clientId, title: eventForm.title, description: eventForm.description || null, event_date: new Date(eventForm.event_date).toISOString(), event_type: eventForm.event_type,
    });
    if (error) { toast.error("Failed to create event"); return; }
    toast.success("Event added");
    setEventOpen(false);
    resetEventForm();
    queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", clientId] });
  };

  const updateEvent = async () => {
    if (!editId || !eventForm.title || !eventForm.event_date) return;
    const { error } = await supabase.from("schedule_events").update({
      title: eventForm.title, description: eventForm.description || null, event_date: new Date(eventForm.event_date).toISOString(), event_type: eventForm.event_type,
    }).eq("id", editId);
    if (error) { toast.error("Failed to update event"); return; }
    toast.success("Event updated");
    setEditEventOpen(false);
    resetEventForm();
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", clientId] });
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Project deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-projects", clientId] });
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Invoice deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("schedule_events").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Event deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", clientId] });
  };

  const updateProjectStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-projects", clientId] });
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
  };

  const openEditProject = (p: typeof projects extends (infer T)[] | undefined ? T : never) => {
    if (!p) return;
    setEditId(p.id);
    setProjectForm({ title: p.title, status: p.status, notes: p.notes || "", approved_tier: p.approved_tier || "" });
    setEditProjectOpen(true);
  };

  const openEditInvoice = (inv: typeof invoices extends (infer T)[] | undefined ? T : never) => {
    if (!inv) return;
    setEditId(inv.id);
    setInvoiceForm({ description: inv.description, amount: String(inv.amount), due_date: inv.due_date || "", status: inv.status });
    setEditInvoiceOpen(true);
  };

  const openEditEvent = (ev: typeof events extends (infer T)[] | undefined ? T : never) => {
    if (!ev) return;
    setEditId(ev.id);
    const d = new Date(ev.event_date);
    const localDate = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + "T" + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    setEventForm({ title: ev.title, description: ev.description || "", event_date: localDate, event_type: ev.event_type });
    setEditEventOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: "Loading..." }]} />
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: "Not Found" }]} />
        <div className="p-6 text-center">
          <p className="text-sm font-sans text-muted-foreground">Client not found.</p>
          <Button variant="outline" className="mt-4 font-sans" onClick={() => navigate("/admin/clients")}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  // Shared project form fields
  const ProjectFormFields = () => (
    <div className="space-y-4">
      <div><Label className="font-sans">Title</Label><Input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} /></div>
      <div><Label className="font-sans">Status</Label>
        <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="font-sans">Approved Tier</Label><Input value={projectForm.approved_tier} onChange={(e) => setProjectForm({ ...projectForm, approved_tier: e.target.value })} placeholder="e.g. Enhanced" /></div>
      <div><Label className="font-sans">Notes</Label><Textarea value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} /></div>
    </div>
  );

  const InvoiceFormFields = () => (
    <div className="space-y-4">
      <div><Label className="font-sans">Description</Label><Input value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} /></div>
      <div><Label className="font-sans">Amount ($)</Label><Input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} /></div>
      <div><Label className="font-sans">Due Date</Label><Input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} /></div>
      <div><Label className="font-sans">Status</Label>
        <Select value={invoiceForm.status} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const EventFormFields = () => (
    <div className="space-y-4">
      <div><Label className="font-sans">Title</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} /></div>
      <div><Label className="font-sans">Date</Label><Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} /></div>
      <div><Label className="font-sans">Type</Label>
        <Select value={eventForm.event_type} onValueChange={(v) => setEventForm({ ...eventForm, event_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="appointment">Appointment</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="font-sans">Description</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
    </div>
  );

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: client.propertyName }]} />
      <div className="p-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="gap-1 font-sans"><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-xl font-sans font-bold text-foreground">{client.propertyName}</h1>
              <p className="text-sm font-sans text-muted-foreground">{client.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/portal/${client.propertyId}?edit=true`)} className="gap-1.5 font-sans"><ExternalLink className="w-4 h-4" />Open in Portal</Button>
        </div>

        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-sans whitespace-nowrap transition-colors border-b-2 bg-transparent cursor-pointer ${activeTab === tab.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <ClientOverview client={client} />}
        {activeTab === "report" && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              {pdfData && (
                <PDFDownloadButton
                  data={pdfData}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  label="Generate PDF"
                />
              )}
            </div>
            <ReportPageManager propertyId={client.propertyId} reportId={client.reportId} />
          </div>
        )}
        {activeTab === "files" && <FileManager propertyId={client.propertyId} />}
        {activeTab === "comments" && <CommentsManager clientId={client.id} />}
        {activeTab === "vendors" && <VendorManager propertyId={client.propertyId} />}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Projects</h3>
              <Dialog open={projectOpen} onOpenChange={(o) => { setProjectOpen(o); if (!o) resetProjectForm(); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Project</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Create Project</DialogTitle></DialogHeader>
                  <ProjectFormFields />
                  <Button onClick={createProject} className="w-full font-sans">Create</Button>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit project dialog */}
            <Dialog open={editProjectOpen} onOpenChange={(o) => { setEditProjectOpen(o); if (!o) { resetProjectForm(); setEditId(null); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-sans">Edit Project</DialogTitle></DialogHeader>
                <ProjectFormFields />
                <Button onClick={updateProject} className="w-full font-sans">Save Changes</Button>
              </DialogContent>
            </Dialog>

            {projects && projects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Project</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs">Tier</TableHead>
                    <TableHead className="font-sans text-xs">Notes</TableHead>
                    <TableHead className="font-sans text-xs">Created</TableHead>
                    <TableHead className="font-sans text-xs w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-sans text-sm font-medium">{project.title}</TableCell>
                      <TableCell>
                        <Select value={project.status} onValueChange={(v) => updateProjectStatus(project.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-[11px] font-sans"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{project.approved_tier || "—"}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground max-w-[200px] truncate">{project.notes || "—"}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{format(new Date(project.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openEditProject(project)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-sans">Delete project?</AlertDialogTitle>
                                <AlertDialogDescription className="font-sans">This will permanently delete "{project.title}". This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteProject(project.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No projects yet. Create one to track client work.</p></Card>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Invoices</h3>
              <Dialog open={invoiceOpen} onOpenChange={(o) => { setInvoiceOpen(o); if (!o) resetInvoiceForm(); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Invoice</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Create Invoice</DialogTitle></DialogHeader>
                  <InvoiceFormFields />
                  <Button onClick={createInvoice} className="w-full font-sans">Create</Button>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog open={editInvoiceOpen} onOpenChange={(o) => { setEditInvoiceOpen(o); if (!o) { resetInvoiceForm(); setEditId(null); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-sans">Edit Invoice</DialogTitle></DialogHeader>
                <InvoiceFormFields />
                <Button onClick={updateInvoice} className="w-full font-sans">Save Changes</Button>
              </DialogContent>
            </Dialog>

            {invoices && invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Description</TableHead>
                    <TableHead className="font-sans text-xs">Amount</TableHead>
                    <TableHead className="font-sans text-xs">Due Date</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-sans text-sm font-medium">{invoice.description}</TableCell>
                      <TableCell className="font-sans text-sm font-medium">${Number(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Select value={invoice.status} onValueChange={(v) => updateInvoiceStatus(invoice.id, v)}>
                          <SelectTrigger className="h-7 w-[100px] text-[11px] font-sans"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openEditInvoice(invoice)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-sans">Delete invoice?</AlertDialogTitle>
                                <AlertDialogDescription className="font-sans">This will permanently delete this invoice. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteInvoice(invoice.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No invoices yet.</p></Card>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Schedule & Events</h3>
              <Dialog open={eventOpen} onOpenChange={(o) => { setEventOpen(o); if (!o) resetEventForm(); }}>
                <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Event</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Add Event</DialogTitle></DialogHeader>
                  <EventFormFields />
                  <Button onClick={createEvent} className="w-full font-sans">Add</Button>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog open={editEventOpen} onOpenChange={(o) => { setEditEventOpen(o); if (!o) { resetEventForm(); setEditId(null); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-sans">Edit Event</DialogTitle></DialogHeader>
                <EventFormFields />
                <Button onClick={updateEvent} className="w-full font-sans">Save Changes</Button>
              </DialogContent>
            </Dialog>

            {events && events.length > 0 ? (
              <Card className="p-5">
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-sans text-foreground">{event.title}</p>
                        <p className="text-xs font-sans text-muted-foreground">{event.event_type} · {event.status}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans text-muted-foreground">{format(new Date(event.event_date), "MMM d, yyyy h:mm a")}</span>
                        <Button variant="ghost" size="sm" onClick={() => openEditEvent(event)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-sans">Delete event?</AlertDialogTitle>
                              <AlertDialogDescription className="font-sans">This will permanently delete "{event.title}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteEvent(event.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No events scheduled. Add one to get started.</p></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetail;
