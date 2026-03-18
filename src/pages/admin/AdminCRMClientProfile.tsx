import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Phone, Mail, MapPin, Calendar, DollarSign, Briefcase, MessageSquare, FileText, Users, Settings, GitBranch, Heart } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useCRMContact, useCRMActivities, useCRMPipelineHistory, useCRMPeople } from "@/hooks/useCRMData";
import { useAdminClients, useAdminProjects, useAdminInvoices } from "@/hooks/useAdminData";
import CRMAIAssistant from "@/components/admin/CRMAIAssistant";
import CRMOverviewTab from "@/components/crm/CRMOverviewTab";
import CRMPipelineTab from "@/components/crm/CRMPipelineTab";
import CRMTimelineTab from "@/components/crm/CRMTimelineTab";
import CRMContactsTab from "@/components/crm/CRMContactsTab";
import CRMFinancialTab from "@/components/crm/CRMFinancialTab";
import CRMCommunicationTab from "@/components/crm/CRMCommunicationTab";
import CRMDocumentsTab from "@/components/crm/CRMDocumentsTab";
import CRMSettingsTab from "@/components/crm/CRMSettingsTab";
import AdminProjectsSection from "@/components/admin/AdminProjectsSection";
import { format } from "date-fns";

type ProfileTab = "overview" | "pipeline" | "timeline" | "contacts" | "projects" | "financial" | "communication" | "documents" | "referrals" | "settings";

const tabConfig: { id: ProfileTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "referrals", label: "Referrals", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminCRMClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [aiOpen, setAiOpen] = useState(false);

  const { data: crmContact, isLoading: contactLoading } = useCRMContact(id);
  const { data: activities } = useCRMActivities(id);
  const { data: pipelineHistory } = useCRMPipelineHistory(id);
  const { data: people } = useCRMPeople(id);

  // Also load the legacy client data for property info
  const propertyId = crmContact?.property_id;
  const { data: allClients } = useAdminClients();
  const client = allClients?.find(c => c.id === propertyId) || null;
  const { data: projects } = useAdminProjects(propertyId || undefined);
  const { data: invoices } = useAdminInvoices(propertyId || undefined);

  if (contactLoading) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: "Loading..." }]} />
        <div className="p-6 space-y-4 max-w-6xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!crmContact) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: "Not Found" }]} />
        <div className="p-6 max-w-6xl">
          <Card className="p-12 text-center">
            <h3 className="font-sans font-semibold text-lg text-foreground mb-2">Contact not found</h3>
            <Button variant="outline" onClick={() => navigate("/admin/crm")}>Back to CRM</Button>
          </Card>
        </div>
      </div>
    );
  }

  const clientName = client?.name || "Client";

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: clientName }]} />
      <div className="p-6 space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/crm")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-sans font-medium">
              {clientName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold text-foreground">{clientName}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
                {client?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                {client?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                {client?.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.address}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] font-sans bg-emerald-100 text-emerald-800">
              {(crmContact.client_stage || "lead").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="gap-1.5 font-sans">
              <Sparkles className="w-4 h-4" /> AI
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => setTab(v as ProfileTab)}>
          <TabsList className="flex-wrap h-auto gap-1">
            {tabConfig.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs font-sans gap-1">
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <CRMOverviewTab contact={crmContact} client={client} projects={projects} invoices={invoices} activities={activities} />
          </TabsContent>
          <TabsContent value="pipeline">
            <CRMPipelineTab contact={crmContact} history={pipelineHistory} />
          </TabsContent>
          <TabsContent value="timeline">
            <CRMTimelineTab contactId={crmContact.id} activities={activities} />
          </TabsContent>
          <TabsContent value="contacts">
            <CRMContactsTab contactId={crmContact.id} people={people} />
          </TabsContent>
          <TabsContent value="projects">
            {propertyId && projects ? <AdminProjectsSection propertyId={propertyId} projects={projects} /> : <EmptySection label="No property linked" />}
          </TabsContent>
          <TabsContent value="financial">
            <CRMFinancialTab propertyId={propertyId} invoices={invoices} />
          </TabsContent>
          <TabsContent value="communication">
            <CRMCommunicationTab propertyId={propertyId} contactId={crmContact.id} />
          </TabsContent>
          <TabsContent value="documents">
            <CRMDocumentsTab propertyId={propertyId} />
          </TabsContent>
          <TabsContent value="referrals">
            <EmptySection label="Referral tracking coming soon" />
          </TabsContent>
          <TabsContent value="settings">
            <CRMSettingsTab contact={crmContact} />
          </TabsContent>
        </Tabs>
      </div>

      <CRMAIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
};

const EmptySection = ({ label }: { label: string }) => (
  <Card className="p-12 text-center">
    <p className="text-sm text-muted-foreground font-sans">{label}</p>
  </Card>
);

export default AdminCRMClientProfile;
