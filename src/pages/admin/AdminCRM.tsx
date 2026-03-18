import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Sparkles, LayoutGrid, Kanban, TableIcon, MapPin, ChevronDown, Star, Download, MoreHorizontal, Tag, MessageSquare, ArrowRight } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useCRMClientsEnriched, useCRMTradePartnersEnriched } from "@/hooks/useCRMData";
import { exportClientsToCSV } from "@/lib/csvExport";
import CRMAIAssistant from "@/components/admin/CRMAIAssistant";
import { format } from "date-fns";

type ViewMode = "table" | "kanban" | "grid" | "map";

const CLIENT_STAGES = ["lead", "onboarding", "active", "proposal_out", "project_running", "completed", "at_risk", "churned"];
const PARTNER_STAGES = ["prospecting", "vetting", "approved", "active", "preferred", "inactive"];

const stageLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const stageColor = (s: string) => {
  const colors: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800", onboarding: "bg-indigo-100 text-indigo-800",
    active: "bg-emerald-100 text-emerald-800", proposal_out: "bg-amber-100 text-amber-800",
    project_running: "bg-cyan-100 text-cyan-800", completed: "bg-green-100 text-green-800",
    at_risk: "bg-orange-100 text-orange-800", churned: "bg-red-100 text-red-800",
    prospecting: "bg-blue-100 text-blue-800", vetting: "bg-yellow-100 text-yellow-800",
    approved: "bg-emerald-100 text-emerald-800", preferred: "bg-purple-100 text-purple-800",
    inactive: "bg-gray-100 text-gray-600",
  };
  return colors[s] || "bg-muted text-muted-foreground";
};

const AdminCRM = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"clients" | "trade_partners">("clients");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);

  const { data: clients, isLoading: clientsLoading } = useCRMClientsEnriched();
  const { data: partners, isLoading: partnersLoading } = useCRMTradePartnersEnriched();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); /* focus add contact */ }
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); document.getElementById("crm-search")?.focus(); }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setAiOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredClients = (clients || []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.property?.toLowerCase().includes(search.toLowerCase()) || c.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPartners = (partners || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.company?.toLowerCase().includes(search.toLowerCase()) || p.specialty?.toLowerCase().includes(search.toLowerCase()) || p.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelected(prev => {
      if (ids.every(id => prev.has(id))) return new Set();
      return new Set(ids);
    });
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "CRM" }]} />
      <div className="p-6 space-y-4 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="crm-search" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 font-sans" />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {([["table", TableIcon], ["kanban", Kanban], ["grid", LayoutGrid], ["map", MapPin]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`p-1.5 rounded transition-colors ${viewMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="gap-1.5 font-sans">
              <Sparkles className="w-4 h-4" /> AI Assistant
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 font-sans">
                  <Plus className="w-4 h-4" /> Add Contact <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/admin/clients/new")}>New Client</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/crm?tab=trade_partners&add=true")}>New Trade Partner</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <Card className="p-3 flex items-center gap-3 bg-primary/5 border-primary/20">
            <span className="text-sm font-sans font-medium">{selected.size} selected</span>
            <Button variant="outline" size="sm" className="gap-1 font-sans text-xs"><Tag className="w-3 h-3" /> Tag</Button>
            <Button variant="outline" size="sm" className="gap-1 font-sans text-xs"><MessageSquare className="w-3 h-3" /> Message</Button>
            <Button variant="outline" size="sm" className="gap-1 font-sans text-xs"><ArrowRight className="w-3 h-3" /> Move Stage</Button>
            <Button variant="outline" size="sm" className="gap-1 font-sans text-xs"><Download className="w-3 h-3" /> Export</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-sans">Clear</Button>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => { setTab(v as any); setSelected(new Set()); }}>
          <TabsList>
            <TabsTrigger value="clients" className="text-xs font-sans">Clients {clients?.length ? `(${clients.length})` : ""}</TabsTrigger>
            <TabsTrigger value="trade_partners" className="text-xs font-sans">Trade Partners {partners?.length ? `(${partners.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            {clientsLoading ? <TableSkeleton /> : filteredClients.length === 0 ? (
              <EmptyState type="client" onAdd={() => navigate("/admin/clients/new")} />
            ) : viewMode === "table" ? (
              <ClientsTable data={filteredClients} selected={selected} onToggle={toggleSelect} onToggleAll={() => toggleAll(filteredClients.map(c => c.id))} onRowClick={id => navigate(`/admin/crm/clients/${id}`)} />
            ) : viewMode === "kanban" ? (
              <KanbanView data={filteredClients} stages={CLIENT_STAGES} stageKey="client_stage" onCardClick={id => navigate(`/admin/crm/clients/${id}`)} />
            ) : viewMode === "grid" ? (
              <CardGrid data={filteredClients} type="client" onCardClick={id => navigate(`/admin/crm/clients/${id}`)} />
            ) : (
              <div className="bg-muted/50 rounded-xl p-12 text-center text-muted-foreground font-sans text-sm">Map view coming soon</div>
            )}
          </TabsContent>

          <TabsContent value="trade_partners">
            {partnersLoading ? <TableSkeleton /> : filteredPartners.length === 0 ? (
              <EmptyState type="trade_partner" onAdd={() => navigate("/admin/crm?tab=trade_partners&add=true")} />
            ) : viewMode === "table" ? (
              <PartnersTable data={filteredPartners} selected={selected} onToggle={toggleSelect} onToggleAll={() => toggleAll(filteredPartners.map(p => p.id))} onRowClick={id => navigate(`/admin/crm/trade-partners/${id}`)} />
            ) : viewMode === "kanban" ? (
              <KanbanView data={filteredPartners} stages={PARTNER_STAGES} stageKey="partner_stage" onCardClick={id => navigate(`/admin/crm/trade-partners/${id}`)} />
            ) : viewMode === "grid" ? (
              <CardGrid data={filteredPartners} type="trade_partner" onCardClick={id => navigate(`/admin/crm/trade-partners/${id}`)} />
            ) : (
              <div className="bg-muted/50 rounded-xl p-12 text-center text-muted-foreground font-sans text-sm">Map view coming soon</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant */}
      <CRMAIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
};

// ─── Sub-components ───

const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
  </div>
);

const EmptyState = ({ type, onAdd }: { type: string; onAdd: () => void }) => (
  <Card className="p-12 flex flex-col items-center gap-4 text-center">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
      <Plus className="w-8 h-8 text-primary" />
    </div>
    <h3 className="font-sans font-semibold text-lg text-foreground">No {type === "client" ? "clients" : "trade partners"} yet</h3>
    <p className="text-sm text-muted-foreground font-sans max-w-sm">
      {type === "client" ? "Add your first client to start managing relationships, projects, and reports." : "Add trade partners to track vendors, bids, and project assignments."}
    </p>
    <Button onClick={onAdd} className="gap-1.5 font-sans">
      <Plus className="w-4 h-4" /> Add {type === "client" ? "Client" : "Trade Partner"}
    </Button>
  </Card>
);

const ClientsTable = ({ data, selected, onToggle, onToggleAll, onRowClick }: { data: any[]; selected: Set<string>; onToggle: (id: string) => void; onToggleAll: () => void; onRowClick: (id: string) => void }) => (
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"><Checkbox checked={data.length > 0 && data.every(d => selected.has(d.id))} onCheckedChange={onToggleAll} /></TableHead>
          <TableHead className="font-sans text-xs">Client</TableHead>
          <TableHead className="font-sans text-xs">Property</TableHead>
          <TableHead className="font-sans text-xs">Stage</TableHead>
          <TableHead className="font-sans text-xs">Last Contact</TableHead>
          <TableHead className="font-sans text-xs text-right">Projects</TableHead>
          <TableHead className="font-sans text-xs text-right">Balance</TableHead>
          <TableHead className="font-sans text-xs">Tags</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(c => (
          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(c.id)}>
            <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(c.id)} onCheckedChange={() => onToggle(c.id)} /></TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-sans font-medium shrink-0">
                  {(c.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">{c.name}</p>
                  <p className="font-sans text-[11px] text-muted-foreground">{c.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="font-sans text-sm text-muted-foreground">{c.property || "—"}</TableCell>
            <TableCell><Badge className={`text-[10px] font-sans ${stageColor(c.client_stage || "lead")}`}>{stageLabel(c.client_stage || "lead")}</Badge></TableCell>
            <TableCell className="font-sans text-xs text-muted-foreground">{c.last_contact_date ? format(new Date(c.last_contact_date), "MMM d") : "—"}</TableCell>
            <TableCell className="font-sans text-sm text-right">{c.activeProjects}</TableCell>
            <TableCell className="font-sans text-sm text-right">{c.balanceDue > 0 ? `$${c.balanceDue.toLocaleString()}` : "—"}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {(c.tags || []).slice(0, 2).map((t: string) => <Badge key={t} variant="outline" className="text-[10px] font-sans">{t}</Badge>)}
              </div>
            </TableCell>
            <TableCell onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRowClick(c.id)}>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Send Message</DropdownMenuItem>
                  <DropdownMenuItem>Add Tag</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const PartnersTable = ({ data, selected, onToggle, onToggleAll, onRowClick }: { data: any[]; selected: Set<string>; onToggle: (id: string) => void; onToggleAll: () => void; onRowClick: (id: string) => void }) => (
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"><Checkbox checked={data.length > 0 && data.every(d => selected.has(d.id))} onCheckedChange={onToggleAll} /></TableHead>
          <TableHead className="font-sans text-xs">Name</TableHead>
          <TableHead className="font-sans text-xs">Company</TableHead>
          <TableHead className="font-sans text-xs">Specialty</TableHead>
          <TableHead className="font-sans text-xs">Rating</TableHead>
          <TableHead className="font-sans text-xs">Tier</TableHead>
          <TableHead className="font-sans text-xs">Availability</TableHead>
          <TableHead className="font-sans text-xs">Last Engagement</TableHead>
          <TableHead className="font-sans text-xs">Tags</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(p => (
          <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(p.id)}>
            <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(p.id)} onCheckedChange={() => onToggle(p.id)} /></TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-sans font-medium shrink-0">
                  {(p.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <p className="font-sans text-sm font-medium text-foreground">{p.name}</p>
              </div>
            </TableCell>
            <TableCell className="font-sans text-sm text-muted-foreground">{p.company || "—"}</TableCell>
            <TableCell className="font-sans text-xs text-muted-foreground">{p.specialty || "—"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < (p.rating || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}
              </div>
            </TableCell>
            <TableCell><Badge className={`text-[10px] font-sans ${stageColor(p.tier || "approved")}`}>{stageLabel(p.tier || "approved")}</Badge></TableCell>
            <TableCell className="font-sans text-xs text-muted-foreground">{p.availability || "—"}</TableCell>
            <TableCell className="font-sans text-xs text-muted-foreground">{p.last_contact_date ? format(new Date(p.last_contact_date), "MMM d") : "—"}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {(p.tags || []).slice(0, 2).map((t: string) => <Badge key={t} variant="outline" className="text-[10px] font-sans">{t}</Badge>)}
              </div>
            </TableCell>
            <TableCell onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRowClick(p.id)}>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Send Message</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const KanbanView = ({ data, stages, stageKey, onCardClick }: { data: any[]; stages: string[]; stageKey: string; onCardClick: (id: string) => void }) => (
  <div className="flex gap-3 overflow-x-auto pb-4">
    {stages.map(stage => {
      const items = data.filter(d => (d[stageKey] || stages[0]) === stage);
      return (
        <div key={stage} className="min-w-[240px] max-w-[280px] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Badge className={`text-[10px] font-sans ${stageColor(stage)}`}>{stageLabel(stage)}</Badge>
            <span className="text-xs text-muted-foreground font-sans">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onCardClick(item.id)}>
                <p className="font-sans text-sm font-medium text-foreground">{item.name}</p>
                <p className="font-sans text-[11px] text-muted-foreground mt-1">{item.email || item.company || ""}</p>
                {item.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.tags.slice(0, 2).map((t: string) => <Badge key={t} variant="outline" className="text-[9px] font-sans">{t}</Badge>)}
                  </div>
                )}
              </Card>
            ))}
            {items.length === 0 && <div className="text-xs text-muted-foreground font-sans text-center py-4 bg-muted/30 rounded-lg">No contacts</div>}
          </div>
        </div>
      );
    })}
  </div>
);

const CardGrid = ({ data, type, onCardClick }: { data: any[]; type: string; onCardClick: (id: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {data.map(item => (
      <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onCardClick(item.id)}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${type === "client" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"} flex items-center justify-center text-sm font-sans font-medium`}>
            {(item.name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-medium text-foreground truncate">{item.name}</p>
            <p className="font-sans text-[11px] text-muted-foreground truncate">{item.email || item.company || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] font-sans ${stageColor(item.client_stage || item.partner_stage || item.tier || "lead")}`}>
            {stageLabel(item.client_stage || item.partner_stage || item.tier || "lead")}
          </Badge>
          {item.tags?.slice(0, 1).map((t: string) => <Badge key={t} variant="outline" className="text-[9px] font-sans">{t}</Badge>)}
        </div>
      </Card>
    ))}
  </div>
);

export default AdminCRM;
