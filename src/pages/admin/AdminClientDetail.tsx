import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Plus, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientOverview from "@/components/admin/ClientOverview";
import ReportPageManager from "@/components/admin/ReportPageManager";
import FileManager from "@/components/admin/FileManager";
import CommentsManager from "@/components/admin/CommentsManager";
import { useAdminClient, useAdminProjects, useAdminInvoices, useAdminScheduleEvents } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

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

const statusStyles: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-foreground",
  in_progress: "bg-accent/20 text-accent-foreground",
  complete: "bg-primary/10 text-foreground",
};

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-primary/10 text-foreground",
  pending: "bg-accent/20 text-accent-foreground",
  overdue: "bg-destructive/10 text-destructive",
};

const AdminClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const { client, isLoading } = useAdminClient(clientId);
  const { data: projects } = useAdminProjects(clientId);
  const { data: invoices } = useAdminInvoices(clientId);
  const { data: events } = useAdminScheduleEvents(clientId);

  // Dialog states
  const [projectOpen, setProjectOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({ title: "", status: "planned", notes: "" });
  const [invoiceForm, setInvoiceForm] = useState({ description: "", amount: "", due_date: "", status: "pending" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "", event_type: "appointment" });

  const createProject = async () => {
    if (!clientId || !projectForm.title) return;
    const { error } = await supabase.from("projects").insert({
      property_id: clientId,
      title: projectForm.title,
      status: projectForm.status,
      notes: projectForm.notes || null,
    });
    if (error) { toast.error("Failed to create project"); return; }
    toast.success("Project created");
    setProjectOpen(false);
    setProjectForm({ title: "", status: "planned", notes: "" });
    queryClient.invalidateQueries({ queryKey: ["admin-projects", clientId] });
  };

  const createInvoice = async () => {
    if (!clientId || !invoiceForm.description || !invoiceForm.amount) return;
    const { error } = await supabase.from("invoices").insert({
      property_id: clientId,
      description: invoiceForm.description,
      amount: parseFloat(invoiceForm.amount),
      status: invoiceForm.status,
      due_date: invoiceForm.due_date || null,
    });
    if (error) { toast.error("Failed to create invoice"); return; }
    toast.success("Invoice created");
    setInvoiceOpen(false);
    setInvoiceForm({ description: "", amount: "", due_date: "", status: "pending" });
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", clientId] });
  };

  const createEvent = async () => {
    if (!clientId || !eventForm.title || !eventForm.event_date) return;
    const { error } = await supabase.from("schedule_events").insert({
      property_id: clientId,
      title: eventForm.title,
      description: eventForm.description || null,
      event_date: new Date(eventForm.event_date).toISOString(),
      event_type: eventForm.event_type,
    });
    if (error) { toast.error("Failed to create event"); return; }
    toast.success("Event added");
    setEventOpen(false);
    setEventForm({ title: "", description: "", event_date: "", event_type: "appointment" });
    queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", clientId] });
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
              <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Create Project</DialogTitle></DialogHeader>
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
                    <div><Label className="font-sans">Notes</Label><Textarea value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} /></div>
                    <Button onClick={createProject} className="w-full font-sans">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {projects && projects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Project</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs">Tier</TableHead>
                    <TableHead className="font-sans text-xs">Notes</TableHead>
                    <TableHead className="font-sans text-xs">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-sans text-sm font-medium">{project.title}</TableCell>
                      <TableCell>
                        <Badge className={`${statusStyles[project.status] || "bg-muted text-muted-foreground"} text-[11px] font-sans border-none capitalize`}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{project.approved_tier || "—"}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground max-w-[200px] truncate">{project.notes || "—"}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{format(new Date(project.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm font-sans text-muted-foreground">No projects yet. Create one to track client work.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Invoices</h3>
              <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Create Invoice</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Create Invoice</DialogTitle></DialogHeader>
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
                    <Button onClick={createInvoice} className="w-full font-sans">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {invoices && invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Description</TableHead>
                    <TableHead className="font-sans text-xs">Amount</TableHead>
                    <TableHead className="font-sans text-xs">Due Date</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-sans text-sm font-medium">{invoice.description}</TableCell>
                      <TableCell className="font-sans text-sm font-medium">${Number(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Badge className={`${invoiceStatusStyles[invoice.status] || "bg-muted text-muted-foreground"} text-[11px] font-sans border-none capitalize`}>{invoice.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm font-sans text-muted-foreground">No invoices yet.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-sans font-semibold text-foreground">Schedule & Events</h3>
              <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-sans">Add Event</DialogTitle></DialogHeader>
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
                    <Button onClick={createEvent} className="w-full font-sans">Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {events && events.length > 0 ? (
              <Card className="p-5">
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-sans text-foreground">{event.title}</p>
                        <p className="text-xs font-sans text-muted-foreground">{event.event_type} · {event.status}</p>
                      </div>
                      <span className="text-xs font-sans text-muted-foreground">{format(new Date(event.event_date), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm font-sans text-muted-foreground">No events scheduled. Add one to get started.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetail;
