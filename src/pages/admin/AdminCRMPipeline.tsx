import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical, Plus, Users, Handshake } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useCRMClientsEnriched, useCRMTradePartnersEnriched, useUpdateCRMStage } from "@/hooks/useCRMData";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";

const CLIENT_STAGES = [
  { key: "lead", label: "Lead", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "onboarding", label: "Onboarding", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "active", label: "Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "proposal_out", label: "Proposal Out", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "project_running", label: "Project Running", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "completed", label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "at_risk", label: "At Risk", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "churned", label: "Churned", color: "bg-red-100 text-red-800 border-red-200" },
];

const PARTNER_STAGES = [
  { key: "prospecting", label: "Prospecting", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "vetting", label: "Vetting", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "active", label: "Active", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "preferred", label: "Preferred", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "inactive", label: "Inactive", color: "bg-red-100 text-red-800 border-red-200" },
];

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

interface PipelineCardProps {
  contact: any;
  type: "client" | "trade_partner";
  onDragStart: (id: string, type: "client" | "trade_partner") => void;
  onClick: () => void;
}

const PipelineCard = ({ contact, type, onDragStart, onClick }: PipelineCardProps) => {
  const daysInStage = contact.updated_at
    ? differenceInDays(new Date(), new Date(contact.updated_at))
    : 0;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(contact.id, type)}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3 h-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans font-medium text-foreground truncate">{contact.name}</p>
          {type === "client" && contact.property && (
            <p className="text-[11px] font-sans text-muted-foreground truncate">{contact.property}</p>
          )}
          {type === "trade_partner" && contact.specialty && (
            <p className="text-[11px] font-sans text-muted-foreground truncate">{contact.specialty}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {type === "client" && contact.healthScore > 0 && (
              <Badge variant="outline" className="text-[9px] h-4">
                HS: {contact.healthScore}
              </Badge>
            )}
            {type === "trade_partner" && contact.rating > 0 && (
              <Badge variant="outline" className="text-[9px] h-4">
                ★ {contact.rating}
              </Badge>
            )}
            {type === "client" && contact.lifetime_value > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4">
                {fmt(contact.lifetime_value)}
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px] h-4">
              {daysInStage}d
            </Badge>
          </div>
          {contact.last_contact_date && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Last: {format(new Date(contact.last_contact_date), "MMM d")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface StageColumnProps {
  stage: { key: string; label: string; color: string };
  contacts: any[];
  type: "client" | "trade_partner";
  onDragStart: (id: string, type: "client" | "trade_partner") => void;
  onDrop: (stageKey: string) => void;
  onCardClick: (id: string) => void;
}

const StageColumn = ({ stage, contacts, type, onDragStart, onDrop, onCardClick }: StageColumnProps) => {
  const [dragOver, setDragOver] = useState(false);
  const totalLTV = contacts.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);

  return (
    <div
      className={`flex-shrink-0 w-56 rounded-lg border transition-colors ${dragOver ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(stage.key); }}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <Badge className={`text-[10px] font-sans ${stage.color} border`}>{stage.label}</Badge>
          <span className="text-[11px] font-mono text-muted-foreground">{contacts.length}</span>
        </div>
        {type === "client" && totalLTV > 0 && (
          <p className="text-[10px] font-sans text-muted-foreground">LTV: {fmt(totalLTV)}</p>
        )}
      </div>
      <div className="p-2 space-y-2 min-h-[100px] max-h-[60vh] overflow-y-auto">
        {contacts.map((c) => (
          <PipelineCard
            key={c.id}
            contact={c}
            type={type}
            onDragStart={onDragStart}
            onClick={() => onCardClick(c.id)}
          />
        ))}
      </div>
    </div>
  );
};

const AdminCRMPipeline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clients, isLoading: loadingClients } = useCRMClientsEnriched();
  const { data: partners, isLoading: loadingPartners } = useCRMTradePartnersEnriched();
  const updateStage = useUpdateCRMStage();

  const [dragItem, setDragItem] = useState<{ id: string; type: "client" | "trade_partner" } | null>(null);

  const handleDragStart = useCallback((id: string, type: "client" | "trade_partner") => {
    setDragItem({ id, type });
  }, []);

  const handleDropClient = useCallback((stageKey: string) => {
    if (dragItem && dragItem.type === "client" && user) {
      updateStage.mutate({ contactId: dragItem.id, contactType: "client", newStage: stageKey, userId: user.id });
    }
    setDragItem(null);
  }, [dragItem, user, updateStage]);

  const handleDropPartner = useCallback((stageKey: string) => {
    if (dragItem && dragItem.type === "trade_partner" && user) {
      updateStage.mutate({ contactId: dragItem.id, contactType: "trade_partner", newStage: stageKey, userId: user.id });
    }
    setDragItem(null);
  }, [dragItem, user, updateStage]);

  const isLoading = loadingClients || loadingPartners;

  const clientsByStage = (stageKey: string) =>
    (clients || []).filter((c: any) => (c.client_stage || "lead") === stageKey);

  const partnersByStage = (stageKey: string) =>
    (partners || []).filter((c: any) => (c.partner_stage || "prospecting") === stageKey);

  // Summary stats
  const totalClients = (clients || []).length;
  const totalPartners = (partners || []).length;
  const totalLTV = (clients || []).reduce((s: number, c: any) => s + (c.lifetime_value || 0), 0);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "CRM", path: "/admin/crm" }, { label: "Pipeline" }]} />
      <div className="p-6 space-y-6">
        {/* Summary Bar */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-sans text-foreground font-medium">{totalClients} Clients</span>
          </div>
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-sans text-foreground font-medium">{totalPartners} Trade Partners</span>
          </div>
          <div className="text-sm font-sans text-muted-foreground">
            Total LTV: <span className="font-medium text-foreground">{fmt(totalLTV)}</span>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => navigate("/admin/crm")} className="text-xs font-sans gap-1">
              <Plus className="w-3 h-3" /> Add Contact
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-8">
            {/* Client Pipeline */}
            <div>
              <h2 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Client Pipeline
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {CLIENT_STAGES.map((stage) => (
                  <StageColumn
                    key={stage.key}
                    stage={stage}
                    contacts={clientsByStage(stage.key)}
                    type="client"
                    onDragStart={handleDragStart}
                    onDrop={handleDropClient}
                    onCardClick={(id) => navigate(`/admin/crm/clients/${id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Trade Partner Pipeline */}
            <div>
              <h2 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
                <Handshake className="w-4 h-4" /> Trade Partner Pipeline
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {PARTNER_STAGES.map((stage) => (
                  <StageColumn
                    key={stage.key}
                    stage={stage}
                    contacts={partnersByStage(stage.key)}
                    type="trade_partner"
                    onDragStart={handleDragStart}
                    onDrop={handleDropPartner}
                    onCardClick={(id) => navigate(`/admin/crm/trade-partners/${id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCRMPipeline;
