import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, AlertTriangle, HelpCircle, Mail, Phone, MapPin, Home, ExternalLink, Brain, Edit2, Save, X } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientIntelligenceCard from "./ClientIntelligenceCard";

interface ClientOverviewProps {
  client: AdminClient;
}

const propertyTypeLabels: Record<string, string> = {
  single_family: "Single-Family",
  multi_family: "Multi-Family",
  condo: "Condo",
  townhome: "Townhome",
};

const relationshipTypeLabels: Record<string, string> = {
  owner_occupied: "Owner-Occupied",
  recently_purchased: "Recently Purchased",
  pre_purchase: "Pre-Purchase",
  investment: "Investment",
};

function DigitalAssetStatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
    partial: { label: "Partial", className: "bg-amber-100 text-amber-800" },
    complete: { label: "Ready", className: "bg-emerald-100 text-emerald-800" },
  };
  const { label, className } = config[status || "not_started"] || config.not_started;
  return <Badge className={`text-[10px] font-mono ${className} hover:${className}`}>{label}</Badge>;
}

const ClientOverview = ({ client }: ClientOverviewProps) => {
  const [editingAssets, setEditingAssets] = useState(false);
  const [assetForm, setAssetForm] = useState({
    hoverUrl: client.hoverUrl || "",
    iguideUrl: client.iguideUrl || "",
  });
  const [savingAssets, setSavingAssets] = useState(false);

  const propertyDetails = [
    client.propertyType && propertyTypeLabels[client.propertyType],
    client.yearBuilt && `Built ${client.yearBuilt}`,
    client.sqft && `${client.sqft.toLocaleString()} sqft`,
    client.bedrooms && `${client.bedrooms}bd`,
    client.bathrooms && `${client.bathrooms}ba`,
  ].filter(Boolean).join(" · ") || "No property details";

  const locationDetails = [client.city, client.state, client.zip].filter(Boolean).join(", ");

  async function saveDigitalAssets() {
    setSavingAssets(true);
    try {
      const hasHover = !!assetForm.hoverUrl;
      const hasIguide = !!assetForm.iguideUrl;
      const digitalAssetsStatus = hasHover && hasIguide ? "complete" : hasHover || hasIguide ? "partial" : "not_started";

      const { error } = await supabase
        .from("properties")
        .update({
          hover_url: assetForm.hoverUrl || null,
          iguide_url: assetForm.iguideUrl || null,
          digital_assets_status: digitalAssetsStatus,
        })
        .eq("id", client.propertyId);

      if (error) throw error;
      toast.success("Digital assets updated.");
      setEditingAssets(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSavingAssets(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Email</p>
              <p className="text-sm font-sans text-foreground">{client.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Phone</p>
              <p className="text-sm font-sans text-foreground">{client.phone || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Address</p>
              <p className="text-sm font-sans text-foreground">{client.address}</p>
              {locationDetails && (
                <p className="text-xs font-sans text-muted-foreground">{locationDetails}{client.county ? ` · ${client.county} County` : ""}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Property</p>
              <p className="text-sm font-sans text-foreground">{propertyDetails}</p>
              {client.relationshipType && (
                <Badge variant="outline" className="text-[10px] font-mono mt-1">
                  {relationshipTypeLabels[client.relationshipType] || client.relationshipType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Digital Assets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-sans font-semibold text-foreground">Digital Assets</h3>
            <DigitalAssetStatusBadge status={client.digitalAssetsStatus} />
          </div>
          {!editingAssets ? (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setEditingAssets(true)}>
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setEditingAssets(false)}>
                <X className="w-3 h-3" />
                Cancel
              </Button>
              <Button size="sm" className="gap-1 text-xs" onClick={saveDigitalAssets} disabled={savingAssets}>
                <Save className="w-3 h-3" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-sans text-muted-foreground mb-1">Hover.to</p>
            {editingAssets ? (
              <Input
                placeholder="https://hover.to/project/..."
                value={assetForm.hoverUrl}
                onChange={(e) => setAssetForm((f) => ({ ...f, hoverUrl: e.target.value }))}
                className="font-mono text-xs"
              />
            ) : client.hoverUrl ? (
              <a href={client.hoverUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                View in Hover.to
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Not linked</p>
            )}
          </div>
          <div>
            <p className="text-xs font-sans text-muted-foreground mb-1">iGuide</p>
            {editingAssets ? (
              <Input
                placeholder="https://youriguide.com/..."
                value={assetForm.iguideUrl}
                onChange={(e) => setAssetForm((f) => ({ ...f, iguideUrl: e.target.value }))}
                className="font-mono text-xs"
              />
            ) : client.iguideUrl ? (
              <a href={client.iguideUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                View iGuide Tour
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Not linked</p>
            )}
          </div>
        </div>
      </Card>

      {/* Client Intelligence Summary */}
      {(client.discoveryNotes || client.clientIntelligenceSummary) && (
        <ClientIntelligenceCard
          propertyId={client.propertyId}
          discoveryNotes={client.discoveryNotes || ""}
          clientName={client.name}
          address={client.address}
          existingSummary={client.clientIntelligenceSummary}
        />
      )}

      <Card className="p-6">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Report Status</h3>
        <div className="flex items-center gap-3 mb-4">
          <Badge className={`text-xs font-sans border-none ${
            client.reportStatus === "published" ? "bg-primary text-primary-foreground" :
            client.reportStatus === "review" ? "bg-accent/20 text-accent-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {client.reportStatus === "published" ? "Published" : client.reportStatus === "review" ? "In Review" : "Draft"}
          </Badge>
          <span className="text-sm font-sans text-muted-foreground">Version {client.reportVersion}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.totalPages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Total Pages</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-foreground" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.completePages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Complete</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.flaggedPages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Flagged</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-accent" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.openQuestions}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Questions</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverview;
