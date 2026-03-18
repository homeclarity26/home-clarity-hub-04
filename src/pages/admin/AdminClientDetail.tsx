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
import { ArrowLeft, ExternalLink, Plus, Loader2, Trash2, Pencil, Sparkles } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientOverview from "@/components/admin/ClientOverview";
import ReportPageManager from "@/components/admin/ReportPageManager";
import FileManager from "@/components/admin/FileManager";
import CommentsManager from "@/components/admin/CommentsManager";
import VendorManager from "@/components/admin/VendorManager";
import AdminProjectsSection from "@/components/admin/AdminProjectsSection";
import EquipmentSection from "@/components/admin/EquipmentSection";
import { useAdminClient, useAdminProjects, useAdminInvoices, useAdminScheduleEvents } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import AdminMessagesSection from "@/components/admin/AdminMessagesSection";
import AdminValuationCard from "@/components/admin/AdminValuationCard";
import ClientHealthCard from "@/components/admin/ClientHealthCard";
import AdminInvoicesSection from "@/components/admin/AdminInvoicesSection";
import ClientActivityTimeline from "@/components/admin/ClientActivityTimeline";
import SmartScheduleDialog from "@/components/admin/SmartScheduleDialog";
import FollowUpSequence from "@/components/admin/FollowUpSequence";
import TasksSection from "@/components/admin/TasksSection";
import TimeTrackingSection from "@/components/admin/TimeTrackingSection";
import ProfitabilityCard from "@/components/admin/ProfitabilityCard";
import PortalPersonalization from "@/components/admin/PortalPersonalization";
import PortalEngagementCard from "@/components/admin/PortalEngagementCard";
import HomeGoalsAdmin from "@/components/admin/HomeGoalsAdmin";
import ClientStickyNotes from "@/components/admin/ClientStickyNotes";
import ReportCloneDialog from "@/components/admin/ReportCloneDialog";
import TemplateVersioning from "@/components/admin/TemplateVersioning";
import ReportProgressKanban from "@/components/admin/ReportProgressKanban";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import ReportAITools from "@/components/admin/ReportAITools";
import VoiceAndPhotoTools from "@/components/admin/VoiceAndPhotoTools";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

type ClientTab = "overview" | "timeline" | "report" | "files" | "comments" | "projects" | "payments" | "equipment" | "schedule" | "vendors" | "messages" | "tasks" | "time";

const tabs: { id: ClientTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks" },
  { id: "time", label: "Time" },
  { id: "report", label: "Report" },
  { id: "files", label: "Files" },
  { id: "comments", label: "Comments" },
  { id: "messages", label: "Messages" },
  { id: "projects", label: "Projects" },
  { id: "payments", label: "Payments" },
  { id: "equipment", label: "Equipment" },
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

  // Fetch unread message count for badge
  const { data: unreadMsgCount } = useQuery({
    queryKey: ["admin-unread-messages", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { count, error } = await (supabase
        .from("property_messages" as any) as any)
        .select("*", { count: "exact", head: true })
        .eq("property_id", clientId)
        .eq("is_read", false)
        .neq("sender_id", user?.id);
      if (error) return 0;
      return count || 0;
    },
  });
  const { data: projects, isLoading: projectsLoading } = useAdminProjects(clientId);
  const { data: invoices } = useAdminInvoices(clientId);
  const { data: events } = useAdminScheduleEvents(clientId);

  // Fetch equipment for smart scheduling suggestions
  const { data: equipmentData } = useQuery({
    queryKey: ["admin-equipment", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("id, name, next_service_date, category")
        .eq("property_id", clientId!);
      return data || [];
    },
  });

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
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [tierInvoiceOpen, setTierInvoiceOpen] = useState(false);
  const [selectedTierPage, setSelectedTierPage] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [eventOpen, setEventOpen] = useState(false);
  const [editScheduleEvent, setEditScheduleEvent] = useState<any>(null);

  // Edit dialog states
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({ description: "", amount: "", due_date: "", status: "pending" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "", event_type: "appointment" });

  // Edit IDs
  const [editId, setEditId] = useState<string | null>(null);

  const resetInvoiceForm = () => setInvoiceForm({ description: "", amount: "", due_date: "", status: "pending" });
  const resetEventForm = () => setEventForm({ title: "", description: "", event_date: "", event_type: "appointment" });

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

  const updateInvoiceStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-sans whitespace-nowrap transition-colors border-b-2 bg-transparent cursor-pointer relative ${activeTab === tab.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
              {tab.id === "messages" && (unreadMsgCount ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                  {unreadMsgCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <ClientHealthCard client={client} />
            <ClientStickyNotes propertyId={client.propertyId} />
            <PortalEngagementCard clientUserId={client.clientUserId || ""} />
            <ClientOverview client={client} />
            <HomeGoalsAdmin clientUserId={client.clientUserId || ""} propertyId={client.propertyId} />
            <PortalPersonalization propertyId={client.propertyId} />
            <AdminValuationCard propertyId={client.propertyId} address={client.address} />
          </div>
        )}
        {activeTab === "timeline" && <ClientActivityTimeline propertyId={client.propertyId} />}
        {activeTab === "report" && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
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
            <VoiceAndPhotoTools reportId={client.reportId || ""} propertyId={client.propertyId} />
            <ReportAITools
              reportId={client.reportId || ""}
              propertyId={client.propertyId}
              propertyContext={{
                propertyAddress: client.address,
                yearBuilt: client.yearBuilt,
                sqft: client.sqft,
                bedrooms: client.bedrooms,
                bathrooms: client.bathrooms,
                propertyType: client.propertyType,
              }}
            />
            <ReportPageManager
              propertyId={client.propertyId}
              reportId={client.reportId}
              propertyContext={{
                propertyAddress: client.address,
                yearBuilt: client.yearBuilt,
                sqft: client.sqft,
                bedrooms: client.bedrooms,
                bathrooms: client.bathrooms,
                propertyType: client.propertyType,
                relationshipType: client.relationshipType,
                clientIntelligenceSummary: client.clientIntelligenceSummary,
              }}
            />
          </div>
        )}
        {activeTab === "files" && <FileManager propertyId={client.propertyId} />}
        {activeTab === "comments" && <CommentsManager clientId={client.id} />}
        {activeTab === "vendors" && <VendorManager propertyId={client.propertyId} />}
        {activeTab === "messages" && <AdminMessagesSection propertyId={client.propertyId} />}
        {activeTab === "equipment" && (
          <EquipmentSection
            propertyId={client.propertyId}
            reportPages={reportPages?.map((rp) => ({ id: rp.id, title: rp.title, page_key: rp.page_key }))}
          />
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          projectsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AdminProjectsSection
              propertyId={client.propertyId}
              projects={projects}
              reportPages={reportPages?.map((rp) => ({ id: rp.id, title: rp.title, page_key: rp.page_key }))}
            />
          )
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <AdminInvoicesSection
            propertyId={client.propertyId}
            propertyContext={{
              propertyAddress: client.address,
              sqft: client.sqft,
              propertyType: client.propertyType,
              clientName: client.name,
            }}
          />
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Schedule & Events</h3>
              <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => { setEditScheduleEvent(null); setEventOpen(true); }}>
                <Plus className="w-3.5 h-3.5" />Add Event
              </Button>
            </div>

            <SmartScheduleDialog
              open={eventOpen}
              onOpenChange={(o) => { setEventOpen(o); if (!o) setEditScheduleEvent(null); }}
              propertyId={client.propertyId}
              existingEvents={events || []}
              equipment={equipmentData || []}
              editEvent={editScheduleEvent}
            />

            {/* Follow-Up Sequence */}
            <FollowUpSequence
              propertyId={client.propertyId}
              reportStatus={client.reportStatus}
              events={events || []}
            />

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
                        <Button variant="ghost" size="sm" onClick={() => { setEditScheduleEvent(event); setEventOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
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

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <Card className="p-5">
            <TasksSection clientId={client.propertyId} />
          </Card>
        )}

        {/* TIME TRACKING TAB */}
        {activeTab === "time" && (
          <div className="space-y-4">
            <TimeTrackingSection clientId={client.propertyId} totalRevenue={0} />
            <ProfitabilityCard data={{ totalRevenue: 0, totalHours: 0, targetHourlyRate: 150, messageCount: 0, messageCostPerMsg: 5 }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetail;
