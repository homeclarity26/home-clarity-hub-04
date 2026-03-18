import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle, AlertTriangle, HelpCircle, Mail, Phone, MapPin, Home, ExternalLink, Edit2, Save, X } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientIntelligenceCard from "./ClientIntelligenceCard";
import OnboardingTracker from "./OnboardingTracker";

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

const PROPERTY_TYPES = [
  { value: "single_family", label: "Single-Family" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
];
const RELATIONSHIP_TYPES = [
  { value: "owner_occupied", label: "Owner-Occupied" },
  { value: "recently_purchased", label: "Recently Purchased" },
  { value: "pre_purchase", label: "Pre-Purchase" },
  { value: "investment", label: "Investment" },
];

const ClientOverview = ({ client }: ClientOverviewProps) => {
  const [editingAssets, setEditingAssets] = useState(false);
  const [assetForm, setAssetForm] = useState({
    hoverUrl: client.hoverUrl || "",
    iguideUrl: client.iguideUrl || "",
  });
  const [savingAssets, setSavingAssets] = useState(false);

  // Property edit state
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    phone: client.phone || "",
    city: client.city || "",
    state: client.state || "",
    zip: client.zip || "",
    county: client.county || "",
    propertyType: client.propertyType || "",
    relationshipType: client.relationshipType || "",
    yearBuilt: client.yearBuilt ? String(client.yearBuilt) : "",
    sqft: client.sqft ? String(client.sqft) : "",
    bedrooms: client.bedrooms ? String(client.bedrooms) : "",
    bathrooms: client.bathrooms ? String(client.bathrooms) : "",
  });

  async function savePropertyInfo() {
    setSavingInfo(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          property_type: infoForm.propertyType || null,
          relationship_type: infoForm.relationshipType || null,
          city: infoForm.city || null,
          state: infoForm.state || null,
          zip: infoForm.zip || null,
          county: infoForm.county || null,
          metadata: {
            year_built: infoForm.yearBuilt ? parseInt(infoForm.yearBuilt) : null,
            sqft: infoForm.sqft ? parseInt(infoForm.sqft) : null,
            bedrooms: infoForm.bedrooms ? parseInt(infoForm.bedrooms) : null,
            bathrooms: infoForm.bathrooms ? parseInt(infoForm.bathrooms) : null,
            client_name: client.name,
            client_email: client.email,
            client_phone: infoForm.phone,
          },
        })
        .eq("id", client.propertyId);
      if (error) throw error;
      toast.success("Property info updated.");
      setEditingInfo(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingInfo(false);
    }
  }

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
      <OnboardingTracker client={client} />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-sans font-semibold text-foreground">Client & Property Info</h3>
          {!editingInfo ? (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setEditingInfo(true)}>
              <Edit2 className="w-3 h-3" />Edit
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setEditingInfo(false)}>
                <X className="w-3 h-3" />Cancel
              </Button>
              <Button size="sm" className="gap-1 text-xs" onClick={savePropertyInfo} disabled={savingInfo}>
                <Save className="w-3 h-3" />Save
              </Button>
            </div>
          )}
        </div>

        {!editingInfo ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Phone</Label>
              <Input value={infoForm.phone} onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Property Type</Label>
              <Select value={infoForm.propertyType} onValueChange={(v) => setInfoForm({ ...infoForm, propertyType: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Relationship Type</Label>
              <Select value={infoForm.relationshipType} onValueChange={(v) => setInfoForm({ ...infoForm, relationshipType: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{RELATIONSHIP_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">City</Label>
              <Input value={infoForm.city} onChange={(e) => setInfoForm({ ...infoForm, city: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">State</Label>
                <Input value={infoForm.state} onChange={(e) => setInfoForm({ ...infoForm, state: e.target.value })} className="h-8 text-sm" maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">ZIP</Label>
                <Input value={infoForm.zip} onChange={(e) => setInfoForm({ ...infoForm, zip: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">County</Label>
                <Input value={infoForm.county} onChange={(e) => setInfoForm({ ...infoForm, county: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Year Built</Label>
                <Input type="number" value={infoForm.yearBuilt} onChange={(e) => setInfoForm({ ...infoForm, yearBuilt: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Sq Ft</Label>
                <Input type="number" value={infoForm.sqft} onChange={(e) => setInfoForm({ ...infoForm, sqft: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Bedrooms</Label>
                <Input type="number" value={infoForm.bedrooms} onChange={(e) => setInfoForm({ ...infoForm, bedrooms: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Bathrooms</Label>
                <Input type="number" value={infoForm.bathrooms} onChange={(e) => setInfoForm({ ...infoForm, bathrooms: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
          </div>
        )}
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
