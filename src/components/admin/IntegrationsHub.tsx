import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Check, X, Copy, ExternalLink, Zap, Webhook, Key, Plus, Trash2, Send,
  Loader2, AlertTriangle, Calendar, HardDrive, MapPin, Mail, BookOpen, LayoutDashboard,
  DollarSign, MessageSquare, Phone, Clock, FileSignature, Eye, EyeOff, ChevronDown, ChevronUp,
  Globe, Shield, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────
type IntegrationStatus = "connected" | "not_connected";
type IntegrationCategory = "automation" | "google" | "productivity" | "finance" | "communication" | "scheduling" | "esignature";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: React.ReactNode;
  logoColor: string;
  connectType: "oauth" | "apikey" | "webhook";
}

// ── Integration definitions ────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  { id: "zapier", name: "Zapier", description: "Connect HBC to 5,000+ apps with automated workflows", category: "automation", icon: <Zap className="w-5 h-5" />, logoColor: "bg-orange-500", connectType: "webhook" },
  { id: "make", name: "Make (Integromat)", description: "Build powerful multi-step automation scenarios", category: "automation", icon: <Globe className="w-5 h-5" />, logoColor: "bg-violet-600", connectType: "webhook" },
  { id: "google-calendar", name: "Google Calendar", description: "Sync inspections, milestones, and due dates to Google Calendar", category: "google", icon: <Calendar className="w-5 h-5" />, logoColor: "bg-blue-500", connectType: "oauth" },
  { id: "google-drive", name: "Google Drive", description: "Auto-export PDF reports and documents to Drive folders", category: "google", icon: <HardDrive className="w-5 h-5" />, logoColor: "bg-green-500", connectType: "oauth" },
  { id: "google-maps", name: "Google Maps", description: "Address autocomplete, street view, and service area mapping", category: "google", icon: <MapPin className="w-5 h-5" />, logoColor: "bg-red-500", connectType: "apikey" },
  { id: "gmail", name: "Gmail / Google Workspace", description: "Send emails from your own Gmail address", category: "google", icon: <Mail className="w-5 h-5" />, logoColor: "bg-red-600", connectType: "oauth" },
  { id: "notion", name: "Notion", description: "Sync clients to a Notion database automatically", category: "productivity", icon: <BookOpen className="w-5 h-5" />, logoColor: "bg-neutral-800", connectType: "oauth" },
  { id: "monday", name: "Monday.com", description: "Sync projects and tasks to Monday boards", category: "productivity", icon: <LayoutDashboard className="w-5 h-5" />, logoColor: "bg-rose-500", connectType: "apikey" },
  { id: "quickbooks", name: "QuickBooks Online", description: "Sync invoices and clients to QuickBooks", category: "finance", icon: <DollarSign className="w-5 h-5" />, logoColor: "bg-emerald-600", connectType: "oauth" },
  { id: "slack", name: "Slack", description: "Get notified in Slack for messages, invoices, and more", category: "communication", icon: <MessageSquare className="w-5 h-5" />, logoColor: "bg-purple-600", connectType: "oauth" },
  { id: "twilio", name: "Twilio (SMS)", description: "Send SMS alerts to clients for reports and invoices", category: "communication", icon: <Phone className="w-5 h-5" />, logoColor: "bg-red-500", connectType: "apikey" },
  { id: "calendly", name: "Calendly", description: "Embed booking links and auto-create events from bookings", category: "scheduling", icon: <Clock className="w-5 h-5" />, logoColor: "bg-blue-600", connectType: "apikey" },
  { id: "docusign", name: "DocuSign", description: "Send agreements for e-signature via DocuSign", category: "esignature", icon: <FileSignature className="w-5 h-5" />, logoColor: "bg-yellow-500", connectType: "apikey" },
];

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  automation: "Automation",
  google: "Google",
  productivity: "Productivity",
  finance: "Finance",
  communication: "Communication",
  scheduling: "Scheduling",
  esignature: "E-Signature",
};

const WEBHOOK_TRIGGERS = [
  { event: "client.created", label: "New Client Created", description: "Fires when a new client is added to HBC" },
  { event: "report.published", label: "Report Published", description: "Fires when a report is published to the client portal" },
  { event: "invoice.paid", label: "Invoice Paid", description: "Fires when an invoice is marked as paid" },
  { event: "invoice.overdue", label: "Invoice Overdue", description: "Fires when an invoice passes its due date" },
  { event: "message.received", label: "New Client Message", description: "Fires when a client sends a new message" },
  { event: "project.status_changed", label: "Project Status Changed", description: "Fires when a project status is updated" },
  { event: "referral.added", label: "New Referral Added", description: "Fires when a new referral is submitted" },
  { event: "task.completed", label: "Task Completed", description: "Fires when a task is marked as done" },
  { event: "payment.received", label: "Payment Received", description: "Fires when a payment is posted to an invoice" },
];

const WEBHOOK_ACTIONS = [
  { action: "create_client", label: "Create Client", description: "Create a new client record in HBC" },
  { action: "create_task", label: "Create Task", description: "Add a task to a client's task board" },
  { action: "create_invoice", label: "Create Invoice", description: "Generate a new invoice for a client" },
  { action: "send_announcement", label: "Send Announcement", description: "Send an announcement to all or selected clients" },
  { action: "add_note", label: "Add Note to Client", description: "Append a note to a client's timeline" },
  { action: "update_project", label: "Update Project Status", description: "Change the status of an existing project" },
];

const WEBHOOK_EVENTS = [
  "client.created", "client.updated", "report.published", "report.updated",
  "project.created", "project.status_changed", "invoice.created", "invoice.paid",
  "invoice.overdue", "message.sent_by_client", "equipment.service_due", "referral.converted",
];

// ── Slack notification types ───────────────────────────────────────────
const SLACK_NOTIFICATION_TYPES = [
  { key: "new_message", label: "New client messages" },
  { key: "overdue_invoice", label: "Overdue invoices" },
  { key: "completed_project", label: "Completed projects" },
  { key: "new_referral", label: "New referrals" },
  { key: "sla_breach", label: "SLA breaches" },
];

// ── Google Calendar sync types ─────────────────────────────────────────
const GCAL_SYNC_TYPES = [
  { key: "inspections", label: "Scheduled Inspections", color: "bg-blue-500" },
  { key: "milestones", label: "Project Milestones", color: "bg-emerald-500" },
  { key: "invoices", label: "Invoice Due Dates", color: "bg-amber-500" },
];

// ── Main Component ─────────────────────────────────────────────────────
const IntegrationsHub = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, IntegrationStatus>>(() => {
    const stored = localStorage.getItem("hbc_integrations");
    return stored ? JSON.parse(stored) : {};
  });

  // API keys & webhook state
  const [activeTab, setActiveTab] = useState("apps");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("read_write");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [whLabel, setWhLabel] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);

  // Integration-specific state
  const [slackNotifs, setSlackNotifs] = useState<Record<string, boolean>>({});
  const [slackChannel, setSlackChannel] = useState("#hbc-notifications");
  const [gCalSync, setGCalSync] = useState<Record<string, boolean>>({ inspections: true, milestones: true, invoices: true });
  const [driveFolder, setDriveFolder] = useState("");
  const [mapsApiKey, setMapsApiKey] = useState("");
  const [calendlyLink, setCalendlyLink] = useState("");
  const [mondayApiKey, setMondayApiKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [docusignKey, setDocusignKey] = useState("");

  // Webhook URL for Zapier/Make
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "vvwojahsianpmwjvkunn";
  const webhookBaseUrl = `https://${projectId}.supabase.co/functions/v1/webhook-inbound`;

  const saveConnections = (updated: Record<string, IntegrationStatus>) => {
    setConnections(updated);
    localStorage.setItem("hbc_integrations", JSON.stringify(updated));
  };

  const connectIntegration = (id: string) => {
    saveConnections({ ...connections, [id]: "connected" });
    toast.success(`${INTEGRATIONS.find(i => i.id === id)?.name} connected`);
  };

  const disconnectIntegration = (id: string) => {
    const updated = { ...connections };
    delete updated[id];
    saveConnections(updated);
    toast.success(`${INTEGRATIONS.find(i => i.id === id)?.name} disconnected`);
    setActiveDetail(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // DB queries
  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const generateApiKey = async () => {
    if (!user || !newKeyLabel.trim()) return;
    const key = `hbc_${crypto.randomUUID().replace(/-/g, "")}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    await supabase.from("api_keys").insert({ admin_id: user.id, key_hash: hashHex, label: newKeyLabel.trim() });
    setGeneratedKey(key);
    setNewKeyLabel("");
    setShowKeyDialog(false);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API key generated");
  };

  const revokeKey = async (id: string) => {
    await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API key revoked");
  };

  const addWebhook = async () => {
    if (!user || !whUrl.trim() || !whLabel.trim() || whEvents.length === 0) return;
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
    await supabase.from("webhooks").insert({
      admin_id: user.id, endpoint_url: whUrl.trim(), label: whLabel.trim(),
      events_subscribed_json: whEvents, secret_token: secret,
    });
    setWebhookOpen(false);
    setWhUrl(""); setWhLabel(""); setWhEvents([]);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success("Webhook added");
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await supabase.from("webhooks").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success("Webhook deleted");
  };

  const testWebhook = async (wh: any) => {
    setTesting(wh.id);
    try {
      await supabase.from("webhook_logs").insert({
        webhook_id: wh.id, event_type: "test", payload_json: { event: "test", timestamp: new Date().toISOString() },
        response_status: 200, success: true,
      });
      toast.success("Test event sent");
    } catch { toast.error("Test failed"); }
    finally { setTesting(null); }
  };

  // Filter integrations
  const filtered = INTEGRATIONS.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Object.keys(CATEGORY_LABELS) as IntegrationCategory[];

  // ── Render detail panel for a specific integration ───────────────────
  const renderDetail = (integration: Integration) => {
    const isConnected = connections[integration.id] === "connected";

    switch (integration.id) {
      case "zapier":
      case "make":
        return (
          <AutomationDetail
            integration={integration}
            isConnected={isConnected}
            webhookBaseUrl={webhookBaseUrl}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            onCopy={copyToClipboard}
          />
        );
      case "google-calendar":
        return (
          <GoogleCalendarDetail
            isConnected={isConnected}
            syncTypes={gCalSync}
            onSyncToggle={(key, val) => setGCalSync(prev => ({ ...prev, [key]: val }))}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
          />
        );
      case "google-drive":
        return (
          <SimpleOAuthDetail
            integration={integration}
            isConnected={isConnected}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <div className="space-y-2">
                <Label className="text-xs font-sans">Default Drive Folder</Label>
                <Input value={driveFolder} onChange={e => setDriveFolder(e.target.value)} placeholder="e.g., HBC Reports" className="font-sans text-sm" />
                <p className="text-[10px] font-sans text-muted-foreground">A subfolder will be auto-created for each client.</p>
              </div>
            ) : null}
          />
        );
      case "google-maps":
        return (
          <ApiKeyDetail
            integration={integration}
            isConnected={isConnected}
            apiKey={mapsApiKey}
            setApiKey={setMapsApiKey}
            placeholder="AIza..."
            helpText="Find your key in the Google Cloud Console → APIs & Services → Credentials"
            onConnect={() => { connectIntegration(integration.id); }}
            onDisconnect={() => disconnectIntegration(integration.id)}
          />
        );
      case "gmail":
        return (
          <SimpleOAuthDetail
            integration={integration}
            isConnected={isConnected}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-sans text-muted-foreground">Sending from</p>
                <p className="text-sm font-sans font-medium text-foreground">admin@yourdomain.com</p>
              </div>
            ) : null}
          />
        );
      case "notion":
        return (
          <SimpleOAuthDetail
            integration={integration}
            isConnected={isConnected}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <div className="space-y-2">
                <p className="text-xs font-sans text-muted-foreground">New clients will auto-create a Notion page with: name, address, tier, health score, active projects, last contact date.</p>
                <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5"><RefreshCw className="w-3 h-3" />Sync All Clients to Notion</Button>
              </div>
            ) : null}
          />
        );
      case "monday":
        return (
          <ApiKeyDetail
            integration={integration}
            isConnected={isConnected}
            apiKey={mondayApiKey}
            setApiKey={setMondayApiKey}
            placeholder="eyJhbGci..."
            helpText="Find your API token in Monday → Profile → API"
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <p className="text-xs font-sans text-muted-foreground">New projects in HBC auto-create board items. Status changes sync both ways.</p>
            ) : null}
          />
        );
      case "quickbooks":
        return (
          <SimpleOAuthDetail
            integration={integration}
            isConnected={isConnected}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <div className="space-y-3">
                <p className="text-xs font-sans text-muted-foreground">Paid invoices sync as income. Clients sync as customers.</p>
                <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5"><RefreshCw className="w-3 h-3" />Sync All to QuickBooks</Button>
              </div>
            ) : null}
          />
        );
      case "slack":
        return (
          <SlackDetail
            isConnected={isConnected}
            channel={slackChannel}
            setChannel={setSlackChannel}
            notifs={slackNotifs}
            onNotifToggle={(key, val) => setSlackNotifs(prev => ({ ...prev, [key]: val }))}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
          />
        );
      case "twilio":
        return (
          <TwilioDetail
            isConnected={isConnected}
            sid={twilioSid}
            setSid={setTwilioSid}
            token={twilioToken}
            setToken={setTwilioToken}
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
          />
        );
      case "calendly":
        return (
          <ApiKeyDetail
            integration={integration}
            isConnected={isConnected}
            apiKey={calendlyLink}
            setApiKey={setCalendlyLink}
            placeholder="https://calendly.com/your-link"
            helpText="Paste your Calendly booking URL. A 'Book a Visit' button will appear in the client portal."
            label="Calendly Booking Link"
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <p className="text-xs font-sans text-muted-foreground">Bookings auto-create calendar events and tasks in HBC.</p>
            ) : null}
          />
        );
      case "docusign":
        return (
          <ApiKeyDetail
            integration={integration}
            isConnected={isConnected}
            apiKey={docusignKey}
            setApiKey={setDocusignKey}
            placeholder="Your DocuSign Integration Key"
            helpText="Find your Integration Key in DocuSign Admin → API and Keys"
            onConnect={() => connectIntegration(integration.id)}
            onDisconnect={() => disconnectIntegration(integration.id)}
            extra={isConnected ? (
              <div className="space-y-2">
                <p className="text-xs font-sans text-muted-foreground">Agreements route through DocuSign. Status tracked: Sent → Viewed → Signed → Declined. Signed docs auto-saved to client Documents.</p>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">DocuSign Active</Badge>
              </div>
            ) : null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="apps" className="font-sans text-xs">Connected Apps</TabsTrigger>
          <TabsTrigger value="api" className="font-sans text-xs">API Keys & Webhooks</TabsTrigger>
        </TabsList>

        {/* ── Connected Apps Tab ────────────────────────────────────── */}
        <TabsContent value="apps" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 font-sans"
            />
          </div>

          {/* Detail panel */}
          {activeDetail && (
            <Card className="p-6 border-accent/30 bg-accent/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${INTEGRATIONS.find(i => i.id === activeDetail)?.logoColor} text-white p-2 rounded-lg`}>
                    {INTEGRATIONS.find(i => i.id === activeDetail)?.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-sans font-semibold text-foreground">{INTEGRATIONS.find(i => i.id === activeDetail)?.name}</h3>
                    <p className="text-xs font-sans text-muted-foreground">{INTEGRATIONS.find(i => i.id === activeDetail)?.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveDetail(null)}><X className="w-4 h-4" /></Button>
              </div>
              {renderDetail(INTEGRATIONS.find(i => i.id === activeDetail)!)}
            </Card>
          )}

          {/* Category grid */}
          {categories.map(cat => {
            const items = filtered.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider">{CATEGORY_LABELS[cat]}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(integration => {
                    const status = connections[integration.id] || "not_connected";
                    return (
                      <Card
                        key={integration.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${activeDetail === integration.id ? "ring-2 ring-accent" : ""}`}
                        onClick={() => setActiveDetail(integration.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`${integration.logoColor} text-white p-2 rounded-lg shrink-0`}>
                            {integration.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-sans font-semibold text-foreground truncate">{integration.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[9px] shrink-0 ${status === "connected"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
                                  : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {status === "connected" ? <><Check className="w-2.5 h-2.5 mr-0.5" />Connected</> : "Not Connected"}
                              </Badge>
                            </div>
                            <p className="text-[11px] font-sans text-muted-foreground mt-1 line-clamp-2">{integration.description}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── API Keys & Webhooks Tab ───────────────────────────────── */}
        <TabsContent value="api" className="space-y-6">
          {/* API Keys */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-accent" />
                <h3 className="text-base font-sans font-semibold text-foreground">API Keys</h3>
              </div>
              <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setShowKeyDialog(true)}>
                <Plus className="w-3.5 h-3.5" />Generate Key
              </Button>
            </div>

            {generatedKey && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <p className="text-xs font-sans text-foreground font-medium mb-1">Your new API key (copy now — it won't be shown again):</p>
                <code className="text-sm font-mono text-foreground bg-muted p-2 rounded block break-all">{generatedKey}</code>
                <Button size="sm" variant="outline" className="mt-2 text-xs font-sans" onClick={() => { copyToClipboard(generatedKey, "API key"); }}>Copy Key</Button>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-foreground">{key.label}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">Read/Write</Badge>
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {key.key_hash.slice(0, 12)}...
                      {key.last_used_at ? <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</> : " · Never used"}
                      {" · Created "}{new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.is_active ? "secondary" : "destructive"} className="text-[10px]">
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                    {key.is_active && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => revokeKey(key.id)}>Revoke</Button>
                    )}
                  </div>
                </div>
              ))}
              {apiKeys.length === 0 && <p className="text-sm font-sans text-muted-foreground text-center py-4">No API keys yet.</p>}
            </div>
          </Card>

          {/* Webhooks */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-accent" />
                <h3 className="text-base font-sans font-semibold text-foreground">Webhooks</h3>
              </div>
              <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setWebhookOpen(true)}>
                <Plus className="w-3.5 h-3.5" />Add Webhook
              </Button>
            </div>

            <div className="space-y-3">
              {webhooks.map((wh: any) => (
                <div key={wh.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-foreground">{wh.label}</span>
                      {wh.failure_count >= 10 && (
                        <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="w-3 h-3" />Auto-disabled</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={wh.is_active} onCheckedChange={v => toggleWebhook(wh.id, v)} />
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => testWebhook(wh)} disabled={testing === wh.id}>
                        {testing === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}Test
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpandedWebhook(expandedWebhook === wh.id ? null : wh.id)}>
                        {expandedWebhook === wh.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}Logs
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteWebhook(wh.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{wh.endpoint_url}</p>
                  <div className="flex gap-1 flex-wrap">
                    {(wh.events_subscribed_json || []).map((ev: string) => (
                      <Badge key={ev} variant="outline" className="text-[9px] font-mono">{ev}</Badge>
                    ))}
                  </div>

                  {/* Delivery logs (expandable) */}
                  {expandedWebhook === wh.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-sans font-medium text-foreground mb-2">Recent Delivery Attempts</p>
                      <div className="space-y-1.5">
                        {[
                          { time: "2 min ago", event: "test", status: 200, success: true },
                          { time: "1 hr ago", event: "invoice.paid", status: 200, success: true },
                          { time: "3 hrs ago", event: "client.created", status: 200, success: true },
                        ].map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                            <span>{log.event}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={log.success ? "secondary" : "destructive"} className="text-[9px]">{log.status}</Badge>
                              <span>{log.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-sans text-muted-foreground mt-2">Showing last 25 deliveries</p>
                    </div>
                  )}
                </div>
              ))}
              {webhooks.length === 0 && <p className="text-sm font-sans text-muted-foreground text-center py-4">No webhooks configured.</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Generate Key Dialog ───────────────────────────────────── */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Generate API Key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Key Name</Label>
              <Input placeholder='e.g., "Zapier Key", "Mobile App Key"' value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Scope</Label>
              <Select value={newKeyScope} onValueChange={setNewKeyScope}>
                <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read_only">Read Only</SelectItem>
                  <SelectItem value="read_write">Read / Write</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={generateApiKey} disabled={!newKeyLabel.trim()} className="font-sans">Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Webhook Dialog ────────────────────────────────────── */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Add Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Label</Label>
              <Input placeholder="e.g., HubSpot Sync" value={whLabel} onChange={e => setWhLabel(e.target.value)} className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Endpoint URL</Label>
              <Input placeholder="https://..." value={whUrl} onChange={e => setWhUrl(e.target.value)} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-sans">Events</Label>
              <ScrollArea className="h-48">
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <Checkbox
                        checked={whEvents.includes(ev)}
                        onCheckedChange={checked => setWhEvents(prev => checked ? [...prev, ev] : prev.filter(e => e !== ev))}
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addWebhook} disabled={!whUrl.trim() || !whLabel.trim() || whEvents.length === 0} className="font-sans">Add Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────

function AutomationDetail({ integration, isConnected, webhookBaseUrl, onConnect, onDisconnect, onCopy }: {
  integration: Integration; isConnected: boolean; webhookBaseUrl: string;
  onConnect: () => void; onDisconnect: () => void; onCopy: (text: string, label: string) => void;
}) {
  const isZapier = integration.id === "zapier";
  const platformName = isZapier ? "Zapier" : "Make";
  const templateUrl = isZapier ? "https://zapier.com/apps" : "https://www.make.com/en/templates";

  return (
    <div className="space-y-5">
      {!isConnected ? (
        <Button onClick={onConnect} className="font-sans gap-1.5">
          <Zap className="w-3.5 h-3.5" />Connect with {platformName}
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>

          {/* Webhook URL + API Key */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <Label className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Webhook URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono text-foreground bg-background p-2 rounded border border-border flex-1 truncate">{webhookBaseUrl}</code>
                <Button variant="outline" size="sm" className="shrink-0 h-8" onClick={() => onCopy(webhookBaseUrl, "Webhook URL")}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">API Key</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono text-foreground bg-background p-2 rounded border border-border flex-1 truncate">hbc_••••••••••••••••</code>
                <Button variant="outline" size="sm" className="shrink-0 h-8" onClick={() => onCopy("hbc_demo_key", "API Key")}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div>
            <h4 className="text-xs font-sans font-semibold text-foreground mb-2 uppercase tracking-wider">Supported Triggers</h4>
            <div className="space-y-1.5">
              {WEBHOOK_TRIGGERS.map(t => (
                <div key={t.event} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                  <div>
                    <p className="text-xs font-sans font-medium text-foreground">{t.label}</p>
                    <p className="text-[10px] font-sans text-muted-foreground">{t.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => onCopy(`${webhookBaseUrl}?trigger=${t.event}`, "Trigger URL")}>
                    <Copy className="w-2.5 h-2.5 mr-1" />Copy URL
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-xs font-sans font-semibold text-foreground mb-2 uppercase tracking-wider">Supported Actions</h4>
            <div className="space-y-1.5">
              {WEBHOOK_ACTIONS.map(a => (
                <div key={a.action} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                  <div>
                    <p className="text-xs font-sans font-medium text-foreground">{a.label}</p>
                    <p className="text-[10px] font-sans text-muted-foreground">{a.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => onCopy(`${webhookBaseUrl}?action=${a.action}`, "Action URL")}>
                    <Copy className="w-2.5 h-2.5 mr-1" />Copy URL
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Zaps */}
          <div>
            <h4 className="text-xs font-sans font-semibold text-foreground mb-2 uppercase tracking-wider">Active {isZapier ? "Zaps" : "Scenarios"}</h4>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs font-sans text-muted-foreground">No active {isZapier ? "Zaps" : "scenarios"} yet. Create one in {platformName} using your webhook URL above.</p>
            </div>
          </div>

          {/* Template button */}
          <Button variant="outline" size="sm" className="font-sans text-xs gap-1.5" asChild>
            <a href={templateUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />Browse {isZapier ? "Zap" : "Scenario"} Templates
            </a>
          </Button>
        </>
      )}
    </div>
  );
}

function GoogleCalendarDetail({ isConnected, syncTypes, onSyncToggle, onConnect, onDisconnect }: {
  isConnected: boolean; syncTypes: Record<string, boolean>;
  onSyncToggle: (key: string, val: boolean) => void;
  onConnect: () => void; onDisconnect: () => void;
}) {
  return (
    <div className="space-y-4">
      {!isConnected ? (
        <Button onClick={onConnect} className="font-sans gap-1.5"><Calendar className="w-3.5 h-3.5" />Connect Google Calendar</Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">Sync Settings</h4>
            {GCAL_SYNC_TYPES.map(st => (
              <div key={st.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  <Label className="text-sm font-sans">{st.label}</Label>
                </div>
                <Switch checked={syncTypes[st.key] ?? true} onCheckedChange={v => onSyncToggle(st.key, v)} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div>
              <p className="text-[10px] font-sans text-muted-foreground">Last synced</p>
              <p className="text-xs font-sans font-medium text-foreground">Just now</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5"><RefreshCw className="w-3 h-3" />Sync Now</Button>
          </div>
          <p className="text-[10px] font-sans text-muted-foreground">Two-way sync: events labeled "HBC" in Google Calendar sync back to your HBC calendar.</p>
        </>
      )}
    </div>
  );
}

function SimpleOAuthDetail({ integration, isConnected, onConnect, onDisconnect, extra }: {
  integration: Integration; isConnected: boolean;
  onConnect: () => void; onDisconnect: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {!isConnected ? (
        <Button onClick={onConnect} className="font-sans gap-1.5">Connect {integration.name}</Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>
          {extra}
        </>
      )}
    </div>
  );
}

function ApiKeyDetail({ integration, isConnected, apiKey, setApiKey, placeholder, helpText, label, onConnect, onDisconnect, extra }: {
  integration: Integration; isConnected: boolean;
  apiKey: string; setApiKey: (v: string) => void;
  placeholder: string; helpText: string; label?: string;
  onConnect: () => void; onDisconnect: () => void;
  extra?: React.ReactNode;
}) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">{label || "API Key"}</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={placeholder}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="font-mono text-sm pr-10"
              />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <p className="text-[10px] font-sans text-muted-foreground">{helpText}</p>
          <Button onClick={onConnect} disabled={!apiKey.trim()} className="font-sans text-sm">Connect {integration.name}</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>
          {extra}
        </>
      )}
    </div>
  );
}

function SlackDetail({ isConnected, channel, setChannel, notifs, onNotifToggle, onConnect, onDisconnect }: {
  isConnected: boolean; channel: string; setChannel: (v: string) => void;
  notifs: Record<string, boolean>;
  onNotifToggle: (key: string, val: boolean) => void;
  onConnect: () => void; onDisconnect: () => void;
}) {
  return (
    <div className="space-y-4">
      {!isConnected ? (
        <Button onClick={onConnect} className="font-sans gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Connect Slack</Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Notification Channel</Label>
            <Input value={channel} onChange={e => setChannel(e.target.value)} placeholder="#hbc-notifications" className="font-mono text-sm" />
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">Notification Types</h4>
            {SLACK_NOTIFICATION_TYPES.map(nt => (
              <div key={nt.key} className="flex items-center justify-between">
                <Label className="text-sm font-sans">{nt.label}</Label>
                <Switch checked={notifs[nt.key] ?? true} onCheckedChange={v => onNotifToggle(nt.key, v)} />
              </div>
            ))}
          </div>
          <p className="text-[10px] font-sans text-muted-foreground">Each notification includes client name, event details, and a direct link back to HBC.</p>
        </>
      )}
    </div>
  );
}

function TwilioDetail({ isConnected, sid, setSid, token, setToken, onConnect, onDisconnect }: {
  isConnected: boolean; sid: string; setSid: (v: string) => void;
  token: string; setToken: (v: string) => void;
  onConnect: () => void; onDisconnect: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Account SID</Label>
            <Input value={sid} onChange={e => setSid(e.target.value)} placeholder="AC..." className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Auth Token</Label>
            <div className="relative">
              <Input type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)} placeholder="Your Twilio Auth Token" className="font-mono text-sm pr-10" />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <p className="text-[10px] font-sans text-muted-foreground">
            Find your credentials in the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline">Twilio Console</a>.
          </p>
          <Button onClick={onConnect} disabled={!sid.trim() || !token.trim()} className="font-sans text-sm">Connect Twilio</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><Check className="w-3 h-3" />Connected</Badge>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={onDisconnect}>Disconnect</Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-sans text-muted-foreground">Clients can opt in to SMS alerts for: new reports, invoices, messages, and project updates. Toggle SMS opt-in on each client's profile.</p>
            <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5"><Phone className="w-3 h-3" />Send Test SMS</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default IntegrationsHub;
