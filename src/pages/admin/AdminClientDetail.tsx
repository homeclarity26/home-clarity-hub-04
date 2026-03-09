import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink, Plus, Calendar, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientOverview from "@/components/admin/ClientOverview";
import ReportPageManager from "@/components/admin/ReportPageManager";
import FileManager from "@/components/admin/FileManager";
import CommentsManager from "@/components/admin/CommentsManager";
import { useAdminClient } from "@/hooks/useAdminData";
import { mockProjects, mockInvoices } from "@/data/adminMockData";

type ClientTab = "overview" | "report" | "files" | "comments" | "projects" | "payments" | "schedule";

const tabs: { id: ClientTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "report", label: "Report" },
  { id: "files", label: "Files" },
  { id: "comments", label: "Comments" },
  { id: "projects", label: "Projects" },
  { id: "payments", label: "Payments" },
  { id: "schedule", label: "Schedule" },
];

const AdminClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const { client, isLoading } = useAdminClient(clientId);

  const statusStyles: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    in_progress: "bg-accent/20 text-accent-foreground",
    complete: "bg-primary/10 text-foreground",
  };

  const invoiceStatusStyles: Record<string, string> = {
    paid: "bg-primary/10 text-foreground",
    pending: "bg-accent/20 text-accent-foreground",
    overdue: "bg-destructive/10 text-destructive",
  };

  if (isLoading) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: "Loading..." }]} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: "Not Found" }]} />
        <div className="p-6 text-center">
          <p className="text-sm font-sans text-muted-foreground">Client not found.</p>
          <Button variant="outline" className="mt-4 font-sans" onClick={() => navigate("/admin/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Clients", path: "/admin/clients" }, { label: client.propertyName }]} />
      <div className="p-6 max-w-7xl space-y-6">
        {/* Client header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="gap-1 font-sans">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-sans font-bold text-foreground">{client.propertyName}</h1>
              <p className="text-sm font-sans text-muted-foreground">{client.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/portal/${client.propertyId}?edit=true`)} className="gap-1.5 font-sans">
            <ExternalLink className="w-4 h-4" />
            Open in Portal
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-sans whitespace-nowrap transition-colors border-b-2 bg-transparent cursor-pointer ${
                activeTab === tab.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "comments" && client.unreadComments > 0 && (
                <Badge className="ml-1.5 bg-accent/20 text-accent-foreground text-[10px] border-none">{client.unreadComments}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <ClientOverview client={client} />}
        {activeTab === "report" && <ReportPageManager propertyId={client.propertyId} reportId={client.reportId} />}
        {activeTab === "files" && <FileManager />}
        {activeTab === "comments" && <CommentsManager clientId={client.id} />}

        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Projects</h3>
              <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Project</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Project</TableHead>
                  <TableHead className="font-sans text-xs">Status</TableHead>
                  <TableHead className="font-sans text-xs">Contractor</TableHead>
                  <TableHead className="font-sans text-xs">Budget</TableHead>
                  <TableHead className="font-sans text-xs">Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-sans text-sm font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge className={`${statusStyles[project.status]} text-[11px] font-sans border-none capitalize`}>{project.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{project.contractor}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{project.budget}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{project.timeline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Invoices</h3>
              <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Invoice</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Invoice</TableHead>
                  <TableHead className="font-sans text-xs">Description</TableHead>
                  <TableHead className="font-sans text-xs">Amount</TableHead>
                  <TableHead className="font-sans text-xs">Date</TableHead>
                  <TableHead className="font-sans text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-sans text-sm font-medium">{invoice.number}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{invoice.description}</TableCell>
                    <TableCell className="font-sans text-sm font-medium">${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{invoice.date}</TableCell>
                    <TableCell>
                      <Badge className={`${invoiceStatusStyles[invoice.status]} text-[11px] font-sans border-none capitalize`}>{invoice.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Schedule & Milestones</h3>
              <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Appointment</Button>
            </div>
            <Card className="p-6 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-sans text-foreground mb-1">Calendar Integration Coming Soon</p>
              <p className="text-xs font-sans text-muted-foreground">Schedule appointments, set maintenance reminders, and sync with your calendar.</p>
            </Card>
            <Card className="p-5">
              <h4 className="text-sm font-sans font-semibold text-foreground mb-3">Upcoming Reminders</h4>
              <div className="space-y-3">
                {[
                  { label: "HVAC filter replacement", date: "March 2024", type: "maintenance" },
                  { label: "Gutter cleaning", date: "April 2024", type: "maintenance" },
                  { label: "Annual roof inspection", date: "May 2024", type: "inspection" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-sans text-foreground">{item.label}</p>
                      <p className="text-xs font-sans text-muted-foreground">{item.type}</p>
                    </div>
                    <span className="text-xs font-sans text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetail;
