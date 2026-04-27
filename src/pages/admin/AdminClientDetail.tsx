import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Pencil, Trash2, Plus } from "lucide-react";
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
import AIClientBrief from "@/components/admin/AIClientBrief";
import AIMeetingPrep from "@/components/admin/AIMeetingPrep";
import ConditionForecast from "@/components/admin/ConditionForecast";
import AIFollowUpSuggestions from "@/components/admin/AIFollowUpSuggestions";
import ClientTags from "@/components/admin/ClientTags";
import QuickReplyTemplates from "@/components/admin/QuickReplyTemplates";
import OnboardingTracker from "@/components/admin/OnboardingTracker";
import InspectionChecklist from "@/components/admin/InspectionChecklist";
import PageAssignments from "@/components/admin/PageAssignments";
import BatchOperationsBar from "@/components/admin/BatchOperationsBar";
import AIDraftAssistant from "@/components/admin/AIDraftAssistant";
import AICostEstimator from "@/components/admin/AICostEstimator";
import AIClientInsightsCard from "@/components/admin/AIClientInsightsCard";
import AIMaintenanceSchedule from "@/components/admin/AIMaintenanceSchedule";
import AITranscriptSummarizer from "@/components/admin/AITranscriptSummarizer";
import ClientTimelineTab from "@/components/admin/ClientTimelineTab";
import ClientEngagementTab from "@/components/admin/ClientEngagementTab";
import ReportVersionHistory from "@/components/admin/ReportVersionHistory";
import SignatureRequestManager from "@/components/admin/SignatureRequestManager";
import ClientRiskScore from "@/components/admin/ClientRiskScore";
import RecurringInvoiceScheduler from "@/components/admin/RecurringInvoiceScheduler";
import InternalReportComments from "@/components/admin/InternalReportComments";
import DragReportReorder from "@/components/admin/DragReportReorder";
import WYSIWYGReportEditor from "@/components/wysiwyg/WYSIWYGReportEditor";
import EstimatesSection from "@/components/admin/EstimatesSection";
import ClientServicesTab from "@/components/admin/ClientServicesTab";
import SubscriptionManager from "@/components/admin/SubscriptionManager";
import PhotoManager from "@/components/admin/PhotoManager";
import PredictiveMaintenanceTab from "@/components/admin/PredictiveMaintenanceTab";
import DigitalTwinTab from "@/components/admin/DigitalTwinTab";
import ClientReferralsTab from "@/components/admin/ClientReferralsTab";
import ReportBuildProgress from "@/components/admin/ReportBuildProgress";

// Workspace components
import WorkspaceContextCard from "@/components/admin/workspace/WorkspaceContextCard";
import WorkspaceTabGroups from "@/components/admin/workspace/WorkspaceTabGroups";
import WorkspaceAgentRail from "@/components/admin/workspace/WorkspaceAgentRail";
import ClientQuickSwitch from "@/components/admin/workspace/ClientQuickSwitch";

import type { ClientTab } from "@/components/admin/workspace/WorkspaceTabGroups";
import type { ReportBlock } from "@/components/wysiwyg/types";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

// ─── Report Tab with WYSIWYG toggle ─────────────────────────
const ReportTabContent = ({ client, reportPages, pdfData }: { client: any; reportPages: any[] | undefined; pdfData: PDFReportData | undefined }) => {
  const [editorMode, setEditorMode] = useState<"pages" | "wysiwyg">("pages");

  const { data: reportBlocks } = useQuery({
    queryKey: ["report-blocks-main", client.reportId],
    enabled: !!client.reportId,
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("blocks_json")
        .eq("id", client.reportId!)
        .single();
      return (data?.blocks_json as unknown as ReportBlock[]) || [];
    },
  });

  return (
    <div className="space-y-4">
      {client.reportId && (
        <ReportBuildProgress
          reportId={client.reportId}
          propertyId={client.propertyId}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <button onClick={() => setEditorMode("pages")} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${editorMode === "pages" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Page Manager</button>
          <button onClick={() => setEditorMode("wysiwyg")} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${editorMode === "wysiwyg" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>WYSIWYG Editor</button>
        </div>
        <div className="flex items-center gap-2">
          {client.reportId && <ReportVersionHistory reportId={client.reportId} propertyId={client.propertyId} />}
          {client.reportId && <ReportCloneDialog sourceReportId={client.reportId} sourcePropertyName={client.propertyName} />}
          {pdfData && <PDFDownloadButton data={pdfData} variant="outline" size="sm" className="text-xs" label="Generate PDF" />}
        </div>
      </div>

      {editorMode === "wysiwyg" && client.reportId ? (
        <WYSIWYGReportEditor reportId={client.reportId} propertyAddress={client.address} initialBlocks={reportBlocks || []} />
      ) : (
        <>
          {client.reportId && <TemplateVersioning reportId={client.reportId} />}
          {reportPages && reportPages.length > 0 && <ReportProgressKanban pages={reportPages} propertyId={client.propertyId} />}
          <AIDraftAssistant propertyId={client.propertyId} propertyContext={{ propertyAddress: client.address, yearBuilt: client.yearBuilt, sqft: client.sqft, propertyType: client.propertyType }} />
          <VoiceAndPhotoTools reportId={client.reportId || ""} propertyId={client.propertyId} />
          <ReportAITools reportId={client.reportId || ""} propertyId={client.propertyId} propertyContext={{ propertyAddress: client.address, yearBuilt: client.yearBuilt, sqft: client.sqft, bedrooms: client.bedrooms, bathrooms: client.bathrooms, propertyType: client.propertyType }} />
          <InternalReportComments reportId={client.reportId} />
          {reportPages && reportPages.length > 0 && <DragReportReorder pages={reportPages.map((p: any) => ({ id: p.id, title: p.title, group_name: p.group_name, sort_order: p.sort_order, status: p.status, condition_rating: p.condition_rating }))} reportId={client.reportId!} />}
          <ReportPageManager propertyId={client.propertyId} reportId={client.reportId} propertyContext={{ propertyAddress: client.address, yearBuilt: client.yearBuilt, sqft: client.sqft, bedrooms: client.bedrooms, bathrooms: client.bathrooms, propertyType: client.propertyType, relationshipType: client.relationshipType, clientIntelligenceSummary: client.clientIntelligenceSummary }} />
        </>
      )}
    </div>
  );
};

const AdminClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const { client, isLoading } = useAdminClient(clientId);

  const { data: unreadMsgCount } = useQuery({
    queryKey: ["admin-unread-messages", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { count, error } = await supabase.from("property_messages").select("*", { count: "exact", head: true }).eq("property_id", clientId).eq("is_read", false).neq("sender_id", user?.id);
      if (error) return 0;
      return count || 0;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useAdminProjects(clientId);
  const { data: invoices } = useAdminInvoices(clientId);
  const { data: events } = useAdminScheduleEvents(clientId);

  const { data: equipmentData } = useQuery({
    queryKey: ["admin-equipment", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, next_service_date, category").eq("property_id", clientId!);
      return data || [];
    },
  });

  const { data: reportPages } = useQuery({
    queryKey: ["admin-report-pages", client?.reportId],
    enabled: !!client?.reportId,
    queryFn: async () => {
      const { data } = await supabase.from("report_pages").select("*").eq("report_id", client!.reportId!).order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const pdfData: PDFReportData | undefined = useMemo(() => {
    if (!client || !reportPages || reportPages.length === 0) return undefined;
    const groupMap = new Map<string, { pages: { key: string; order: number }[] }>();
    const pagesMap: Record<string, ReportPageData> = {};
    const imagesMap: Record<string, string[]> = {};

    for (const p of reportPages) {
      if (!groupMap.has(p.group_name)) groupMap.set(p.group_name, { pages: [] });
      groupMap.get(p.group_name)!.pages.push({ key: p.page_key, order: p.sort_order });
      pagesMap[p.page_key] = {
        id: p.page_key, title: p.title, group: p.group_name, conditionRating: p.condition_rating as ReportPageData["conditionRating"],
        narrative: (p.narrative as string[]) || [], healthBar: p.health_bar as ReportPageData["healthBar"],
        specs: (p.specs as { label: string; value: string }[]) || undefined, tiers: p.tiers as unknown as ReportPageData["tiers"],
        timing: p.timing || undefined, recommendations: (p.recommendations as string[]) || undefined,
      } as ReportPageData;
      const extended = pagesMap[p.page_key] as unknown as Record<string, unknown>;
      extended.key_observations = (p.key_observations as string[]) || undefined;
      extended.risks = (p.risks as string[]) || undefined;
      extended.dependencies = p.dependencies || undefined;
      extended.maintenance = p.maintenance || undefined;
      extended.creator_notes = p.creator_notes || undefined;
      if (p.images && Array.isArray(p.images) && (p.images as string[]).length > 0) imagesMap[p.page_key] = p.images as string[];
    }

    const groups: PortalGroup[] = Array.from(groupMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      title: name,
      pages: data.pages.sort((a, b) => a.order - b.order).map((p) => p.key),
    }));

    return {
      propertyName: client.propertyName, address: client.address,
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      creatorName: profile?.full_name || "Hometown Builders Club",
      creatorEmail: profile?.email || undefined, creatorPhone: profile?.phone || undefined,
      groups, pages: pagesMap, pageImages: imagesMap,
    };
  }, [client, reportPages, profile]);

  // Schedule event state
  const [eventOpen, setEventOpen] = useState(false);
  const [editScheduleEvent, setEditScheduleEvent] = useState<any>(null);

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("schedule_events").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Event deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", clientId] });
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

  // Enrichment data for agent rail
  const overdueInvoices = invoices?.filter(i => i.status === "overdue") || [];
  const enrichment = {
    openInvoiceCount: invoices?.length || 0,
    overdueAmount: overdueInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    activeProjectCount: projects?.filter(p => p.status !== "completed" && p.status !== "cancelled").length || 0,
    reportCompletion: client.totalPages > 0 ? Math.round((client.completePages / client.totalPages) * 100) : 0,
    lastContactDays: 0,
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: client.propertyName }]} />
      <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
        {/* Left: Context Card */}
        <WorkspaceContextCard
          client={client}
          invoiceCount={invoices?.length || 0}
          overdueCount={overdueInvoices.length}
          projectCount={projects?.length || 0}
          reportCompletion={enrichment.reportCompletion}
        />

        {/* Center: Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="gap-1 font-sans h-7"><ArrowLeft className="w-3.5 h-3.5" /></Button>
              <ClientQuickSwitch currentClientId={client.propertyId} />
            </div>
            <div className="flex items-center gap-2">
              <AIClientBrief propertyId={client.propertyId} propertyName={client.propertyName} />
            </div>
          </div>

          <WorkspaceTabGroups
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadMessages={unreadMsgCount || 0}
          />

          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-5xl space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <AIClientInsightsCard propertyId={client.propertyId} clientData={{ name: client.name, address: client.address, propertyType: client.propertyType, yearBuilt: client.yearBuilt }} />
                  <AIMeetingPrep clientId={client.propertyId} clientName={client.name} propertyAddress={client.address} />
                  <ClientRiskScore client={client} invoices={invoices?.map(i => ({ status: i.status, due_date: i.due_date, balance_due: Number(i.balance_due) }))} />
                  <ClientHealthCard client={client} />
                  <AIFollowUpSuggestions propertyId={client.propertyId} clientName={client.name} />
                  <ConditionForecast propertyId={client.propertyId} />
                  <OnboardingTracker client={client} />
                  <ClientStickyNotes propertyId={client.propertyId} />
                  <PortalEngagementCard clientUserId={client.clientUserId || ""} />
                  <ClientOverview client={client} />
                  <HomeGoalsAdmin clientUserId={client.clientUserId || ""} propertyId={client.propertyId} />
                  <PortalPersonalization propertyId={client.propertyId} />
                  <AdminValuationCard propertyId={client.propertyId} address={client.address} city={client.city || undefined} state={client.state || undefined} zip={client.zip || undefined} />
                </div>
              )}
              {activeTab === "digital-twin" && <DigitalTwinTab clientId={clientId!} propertyId={client.propertyId} />}
              {activeTab === "timeline" && <ClientTimelineTab propertyId={client.propertyId} />}
              {activeTab === "engagement" && <ClientEngagementTab clientUserId={client.clientUserId || ""} propertyId={client.propertyId} />}
              {activeTab === "report" && <ReportTabContent client={client} reportPages={reportPages} pdfData={pdfData} />}
              {activeTab === "photos" && <PhotoManager propertyId={client.propertyId} reportPages={reportPages?.map((rp) => ({ id: rp.id, title: rp.title, page_key: rp.page_key }))} projects={projects?.map((p) => ({ id: p.id, title: p.title }))} />}
              {activeTab === "files" && (
                <div className="space-y-4">
                  <SignatureRequestManager clientId={client.propertyId} propertyId={client.propertyId} />
                  <AITranscriptSummarizer propertyId={client.propertyId} />
                  <FileManager propertyId={client.propertyId} />
                </div>
              )}
              {activeTab === "comments" && <CommentsManager clientId={client.id} />}
              {activeTab === "vendors" && <VendorManager propertyId={client.propertyId} />}
              {activeTab === "messages" && (
                <div className="space-y-4">
                  <AdminMessagesSection propertyId={client.propertyId} clientName={client.name} propertyAddress={client.address} />
                  <QuickReplyTemplates />
                </div>
              )}
              {activeTab === "equipment" && <EquipmentSection propertyId={client.propertyId} reportPages={reportPages?.map((rp) => ({ id: rp.id, title: rp.title, page_key: rp.page_key }))} />}
              {activeTab === "projects" && (
                projectsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-4">
                    <AICostEstimator propertyId={client.propertyId} propertyAddress={client.address} />
                    <AdminProjectsSection propertyId={client.propertyId} projects={projects} reportPages={reportPages?.map((rp) => ({ id: rp.id, title: rp.title, page_key: rp.page_key }))} />
                  </div>
                )
              )}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  <SubscriptionManager propertyId={client.propertyId} clientUserId={client.clientUserId || ""} clientEmail={client.email || ""} clientName={client.name} />
                  <RecurringInvoiceScheduler propertyId={client.propertyId} />
                  <AdminInvoicesSection propertyId={client.propertyId} propertyContext={{ propertyAddress: client.address, sqft: client.sqft, propertyType: client.propertyType, clientName: client.name }} />
                </div>
              )}
              {activeTab === "estimates" && <EstimatesSection propertyId={client.propertyId} clientName={client.name} />}
              {activeTab === "services" && <ClientServicesTab propertyId={client.propertyId} clientUserId={client.clientUserId || ""} />}
              {activeTab === "schedule" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-sans font-semibold text-foreground">Schedule & Events</h3>
                    <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => { setEditScheduleEvent(null); setEventOpen(true); }}><Plus className="w-3.5 h-3.5" />Add Event</Button>
                  </div>
                  <AIMaintenanceSchedule propertyId={client.propertyId} equipment={equipmentData || []} location={client.address} />
                  <SmartScheduleDialog open={eventOpen} onOpenChange={(o) => { setEventOpen(o); if (!o) setEditScheduleEvent(null); }} propertyId={client.propertyId} existingEvents={events || []} equipment={equipmentData || []} editEvent={editScheduleEvent} />
                  <FollowUpSequence propertyId={client.propertyId} reportStatus={client.reportStatus} events={events || []} />
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
                                    <AlertDialogDescription className="font-sans">This will permanently delete "{event.title}".</AlertDialogDescription>
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
                    <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No events scheduled.</p></Card>
                  )}
                </div>
              )}
              {activeTab === "tasks" && <Card className="p-5"><TasksSection clientId={client.propertyId} /></Card>}
              {activeTab === "time" && (
                <div className="space-y-4">
                  <TimeTrackingSection clientId={client.propertyId} totalRevenue={0} />
                  <ProfitabilityCard data={{ totalRevenue: 0, totalHours: 0, targetHourlyRate: 150, messageCount: 0, messageCostPerMsg: 5 }} />
                </div>
              )}
              {activeTab === "predictions" && <PredictiveMaintenanceTab clientId={clientId!} propertyId={client.propertyId} />}
              {activeTab === "referrals" && <ClientReferralsTab propertyId={client.propertyId} clientId={client.clientUserId} />}
            </div>
          </div>
        </div>

        {/* Right: AI Agent Rail */}
        <WorkspaceAgentRail
          clientId={client.propertyId}
          clientName={client.propertyName}
          propertyId={client.propertyId}
          propertyAddress={client.address}
          activeTab={activeTab}
          enrichment={enrichment}
          onNavigate={(tab) => setActiveTab(tab as ClientTab)}
        />
      </div>
    </div>
  );
};

export default AdminClientDetail;
