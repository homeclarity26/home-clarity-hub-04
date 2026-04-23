import { useRef, useState, useEffect } from "react";
import type { ReportPageData } from "@/data/reportContent";
import { useEditMode } from "@/contexts/EditModeContext";
import type { BlockConfig, PageContent } from "@/lib/templateUtils";
import EditableField from "./EditableField";
import EditableDropdown from "./EditableDropdown";
import EditableSection from "@/components/editor/EditableSection";
import EditableSpecs from "./EditableSpecs";
import EditableTiers from "./EditableTiers";
import PricingTiers from "./PricingTiers";
import KeyObservations from "./KeyObservations";
import DependenciesList from "./DependenciesList";
import RisksConcerns from "./RisksConcerns";
import MaintenanceNotes from "./MaintenanceNotes";
import CreatorNotes from "./CreatorNotes";
import CommentsSection from "./CommentsSection";
import RecommendedVendors from "./RecommendedVendors";
import ImageGrid from "@/components/editor/ImageGrid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScanLine, Loader2, Save, X, CheckCircle2 } from "lucide-react";

interface ScanResult {
  brand?: string;
  model?: string;
  serial?: string;
  manufactured?: string;
  efficiency?: string;
  capacity?: string;
  voltage?: string;
  refrigerant?: string;
  [key: string]: string | undefined;
}

function inferCategory(slug?: string): string {
  if (!slug) return "other";
  const s = slug.toLowerCase();
  if (s.includes("furnace") || s.includes("hvac") || s.includes("air-condition") || s.includes("heat-pump") || s.includes("boiler") || s.includes("duct")) return "hvac";
  if (s.includes("electric")) return "electrical";
  if (s.includes("water-heater") || s.includes("plumbing") || s.includes("softener")) return "plumbing";
  if (s.includes("appliance") || s.includes("kitchen") || s.includes("refrigerator") || s.includes("washer") || s.includes("dryer")) return "appliances";
  if (s.includes("roof") || s.includes("siding") || s.includes("window") || s.includes("door") || s.includes("gutter")) return "exterior";
  if (s.includes("smoke") || s.includes("detector") || s.includes("alarm") || s.includes("fire") || s.includes("co2")) return "safety";
  return "other";
}

const conditionOptions = ["Excellent", "Good", "Fair", "Poor", "Critical", "N/A"];

// ── Condition badge pill styles ──────────────────────────────────────────────
const conditionBadgeStyles: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Good: "bg-primary/10 text-primary border-primary/20",
  Fair: "bg-accent/15 text-[#7a612a] border-accent/30",
  Poor: "bg-orange-100 text-orange-700 border-orange-200",
  Critical: "bg-[#B5450B]/10 text-[#B5450B] border-[#B5450B]/25",
  "N/A": "bg-muted text-muted-foreground border-border",
};

// Legacy color map used in EditableDropdown className (kept for compat)
const conditionColors: Record<string, string> = {
  Excellent: "text-emerald-600",
  Good: "text-foreground",
  Fair: "text-accent",
  Poor: "text-orange-500",
  Critical: "text-[#B5450B]",
  "N/A": "text-muted-foreground",
};

// ── System Cliff Gauge ───────────────────────────────────────────────────────
interface SystemCliffGaugeProps {
  label: string;
  currentAge: number;
  lifespan: number;
  equipmentName?: string;
  replacementHorizon?: string;
}

const SystemCliffGauge = ({
  label,
  currentAge,
  lifespan,
  equipmentName,
  replacementHorizon,
}: SystemCliffGaugeProps) => {
  const pct = Math.min((currentAge / lifespan) * 100, 100);
  const isOverdue = currentAge > lifespan;
  const yearsLeft = lifespan - currentAge;

  // Zone color for the fill bar
  const fillColor =
    pct <= 50 ? "#4CAF81" : pct <= 75 ? "#C4A265" : "#B5450B";

  return (
    <div
      className="rounded-lg border border-border/60 shadow-sm overflow-hidden mb-8"
      style={{ background: "#F8F6F2" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        {equipmentName && (
          <p
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1"
            style={{ color: "#8A8E99" }}
          >
            {equipmentName}
          </p>
        )}
        <h4
          className="font-display text-xl"
          style={{ color: "#1B2B4D" }}
        >
          {label} — Service Life
        </h4>
      </div>

      {/* Age / lifespan labels */}
      <div className="px-6 pb-1 flex justify-between">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.12em]"
          style={{ color: "#1B2B4D" }}
        >
          Install: yr {currentAge}
        </span>
        <span
          className="font-mono text-[11px] uppercase tracking-[0.12em]"
          style={{ color: "#1B2B4D" }}
        >
          Expected: {lifespan} yrs
        </span>
      </div>

      {/* Track */}
      <div className="px-6 pb-2">
        <div
          className="relative w-full h-7 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #4CAF81 0%, #4CAF81 50%, #C4A265 50%, #C4A265 75%, #B5450B 75%, #B5450B 100%)",
          }}
        >
          {/* Marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 z-10"
            style={{
              left: `${Math.min(pct, 100)}%`,
              background: "#1B2B4D",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.6)",
            }}
          />
          {isOverdue && (
            <div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: `${Math.min(((currentAge - lifespan) / lifespan) * 100, 20)}%`,
                background:
                  "repeating-linear-gradient(90deg, #B5450B 0px, #B5450B 6px, #8a2c06 6px, #8a2c06 12px)",
                borderLeft: "2px dashed rgba(255,255,255,0.5)",
              }}
            />
          )}
        </div>

        {/* Zone labels */}
        <div className="flex mt-1">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.1em]"
            style={{ width: "50%", color: "#4CAF81" }}
          >
            Good
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.1em]"
            style={{ width: "25%", color: "#C4A265" }}
          >
            Watch
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.1em]"
            style={{ width: "25%", color: "#B5450B" }}
          >
            Replace
          </span>
        </div>
      </div>

      {/* Callout */}
      <div className="px-6 pb-5">
        <div
          className="rounded-lg px-5 py-3 flex flex-wrap items-center justify-center gap-6"
          style={{ background: isOverdue ? "#B5450B" : fillColor }}
        >
          <span
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-white"
          >
            Age: {currentAge} / {lifespan} yrs
          </span>
          {isOverdue ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
              ⚠ Past Expected Life
            </span>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
              {yearsLeft} yr{yearsLeft !== 1 ? "s" : ""} remaining
            </span>
          )}
          {replacementHorizon && (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
              Replace by: {replacementHorizon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Condition Badge Pill ─────────────────────────────────────────────────────
const ConditionBadge = ({ rating }: { rating: string }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-[0.12em] font-medium ${conditionBadgeStyles[rating] || conditionBadgeStyles["N/A"]}`}
  >
    {rating}
  </span>
);

interface BlockRendererProps {
  blockConfig: BlockConfig | null;
  pageData: ReportPageData & {
    key_observations?: string[];
    dependencies?: { pageKey: string; title: string; type: "before" | "after" }[];
    risks?: string[];
    maintenance?: { frequency?: string; tasks: string[] };
    creator_notes?: string;
    pageSlug?: string;
  };
  images?: string[];
  dbPageId?: string;
  propertyId?: string;
  reportId?: string;
  onUpdate: (updates: Partial<PageContent>) => void;
  onNavigate?: (pageKey: string) => void;
}

const BlockRenderer = ({
  blockConfig,
  pageData,
  images = [],
  dbPageId,
  propertyId,
  reportId,
  onUpdate,
  onNavigate,
}: BlockRendererProps) => {
  const { canEdit } = useEditMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [equipmentSaved, setEquipmentSaved] = useState(false);
  const [allReportPages, setAllReportPages] = useState<{ pageKey: string; title: string }[]>([]);

  // Load all pages in this report so the admin can set page dependencies
  useEffect(() => {
    if (!reportId || !canEdit) return;
    supabase
      .from("report_pages")
      .select("page_key, title")
      .eq("report_id", reportId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setAllReportPages(
            data.map((p) => ({ pageKey: p.page_key, title: p.title }))
          );
        }
      });
  }, [reportId, canEdit]);

  const handleScanSerialPlate = async (file: File) => {
    setIsScanning(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("extract-serial-plate", {
        body: {
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          pageSlug: pageData.pageSlug || pageData.title?.toLowerCase().replace(/\s+/g, "-"),
        },
      });

      if (error) throw error;

      const existingSpecs = Array.isArray(pageData.specs) ? pageData.specs : [];
      const specKeyMap: Record<string, string> = {
        brand: "Brand",
        model: "Model",
        serial: "Serial Number",
        manufactured: "Manufactured",
        efficiency: "Efficiency",
        capacity: "Capacity",
        voltage: "Voltage",
        refrigerant: "Refrigerant",
        weight: "Weight",
        country: "Country of Origin",
        certifications: "Certifications",
        notes: "Notes",
      };

      const newSpecs = [...existingSpecs];
      Object.entries(specKeyMap).forEach(([key, label]) => {
        if (data[key]) {
          const existingIndex = newSpecs.findIndex(
            (s: any) => s.key?.toLowerCase() === label.toLowerCase() || s.label?.toLowerCase() === label.toLowerCase()
          );
          if (existingIndex >= 0) {
            newSpecs[existingIndex] = { ...newSpecs[existingIndex], value: data[key] };
          } else {
            newSpecs.push({ label: label, value: data[key] } as any);
          }
        }
      });

      onUpdate({ specs: newSpecs });
      setScanResult(data as ScanResult);
      setEquipmentSaved(false);

      const fields = Object.keys(specKeyMap).filter((k) => data[k]).length;
      toast({
        title: "Serial plate scanned",
        description: `${fields} field${fields !== 1 ? "s" : ""} extracted and added to specs.`,
      });
    } catch (err) {
      console.error("Serial plate scan failed:", err);
      toast({
        title: "Scan failed",
        description: "Could not read the equipment label. Try a clearer photo.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveEquipment = async () => {
    if (!scanResult || !propertyId) return;
    setIsSavingEquipment(true);
    try {
      const slug = pageData.pageSlug || pageData.title?.toLowerCase().replace(/\s+/g, "-");
      const name = [scanResult.brand, scanResult.model].filter(Boolean).join(" ") || pageData.title || "Equipment";

      const { error } = await supabase.from("equipment").insert({
        property_id: propertyId,
        name,
        category: inferCategory(slug),
        brand: scanResult.brand || null,
        model: scanResult.model || null,
        serial_number: scanResult.serial || null,
        condition: "unknown",
        report_page_id: dbPageId || null,
        notes: [
          scanResult.efficiency ? `Efficiency: ${scanResult.efficiency}` : null,
          scanResult.capacity ? `Capacity: ${scanResult.capacity}` : null,
          scanResult.voltage ? `Voltage: ${scanResult.voltage}` : null,
          scanResult.refrigerant ? `Refrigerant: ${scanResult.refrigerant}` : null,
          scanResult.manufactured ? `Manufactured: ${scanResult.manufactured}` : null,
        ].filter(Boolean).join(" · ") || null,
      });

      if (error) throw error;
      setEquipmentSaved(true);
      toast({ title: "Saved to Equipment Registry", description: `${name} added to this property's registry.` });
    } catch (err) {
      console.error("Save equipment failed:", err);
      toast({ title: "Save failed", description: "Could not save to equipment registry.", variant: "destructive" });
    } finally {
      setIsSavingEquipment(false);
    }
  };

  const shouldRender = (blockName: keyof BlockConfig): boolean => {
    if (!blockConfig) return true;
    const config = blockConfig[blockName];
    return config?.active ?? false;
  };

  const narrativeToHtml = (narrative: string[]) =>
    narrative.map((p) => `<p>${p}</p>`).join("");

  const htmlToNarrative = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll("p");
    return Array.from(paragraphs)
      .map((p) => p.textContent || "")
      .filter(Boolean);
  };

  const handleNarrativeSave = (content: string, newImages: string[]) => {
    const newNarrative = htmlToNarrative(content);
    if (newNarrative.length > 0) {
      onUpdate({ narrative: newNarrative });
    }
    if (newImages.length > 0) {
      onUpdate({ images: newImages } as Partial<PageContent>);
    }
  };

  const handleRecommendationsSave = (content: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const listItems = tempDiv.querySelectorAll("li");
    const recommendations = Array.from(listItems)
      .map((li) => li.textContent || "")
      .filter(Boolean);
    if (recommendations.length > 0) {
      onUpdate({ key_observations: recommendations });
    }
  };

  // ── Derive healthBar data from pageData ──────────────────────────────────
  const healthBarData = (pageData as unknown as Record<string, unknown>).healthBar as
    | { label?: string; current?: number; total?: number; unit?: string; currentAge?: number; lifespan?: number; equipmentName?: string; replacementHorizon?: string }
    | undefined;

  return (
    <div className="space-y-8">
      {/* ── Page Header Block ─────────────────────────────────────────── */}
      {shouldRender("page_header") && (
        <div>
          <EditableField
            value={pageData.title}
            onSave={(title) => onUpdate({ title })}
            className="font-display text-3xl md:text-4xl text-foreground mb-3 block"
            tag="h2"
          />
          {pageData.conditionRating && (
            <div className="flex items-center gap-3 mb-10">
              <ConditionBadge rating={pageData.conditionRating} />
              {/* Keep the editable dropdown hidden so edit mode still works */}
              {canEdit && (
                <EditableDropdown
                  value={pageData.conditionRating}
                  options={conditionOptions}
                  onSave={(v) =>
                    onUpdate({ conditionRating: v as ReportPageData["conditionRating"] })
                  }
                  className={`font-mono text-[11px] uppercase tracking-[0.15em] ${
                    conditionColors[pageData.conditionRating]
                  }`}
                  renderValue={(v) => `Edit: ${v}`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Narrative Block ───────────────────────────────────────────── */}
      {shouldRender("narrative") && pageData.narrative && (
        <EditableSection
          content={narrativeToHtml(pageData.narrative)}
          images={images}
          onSave={handleNarrativeSave}
          contentType="narrative"
        >
          <div className="space-y-0">
            {pageData.narrative.map((paragraph, i) => (
              <p
                key={i}
                className={`text-base text-foreground max-w-[65ch] mb-5 leading-relaxed font-sans ${
                  i === 0
                    ? "pl-4 border-l-2"
                    : ""
                }`}
                style={i === 0 ? { borderLeftColor: "#C4A265" } : undefined}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </EditableSection>
      )}

      {/* ── Key Observations Block ────────────────────────────────────── */}
      {shouldRender("key_observations") && pageData.key_observations && (
        <div>
          {/* Enhanced gold-accented observation list wrapping the existing component */}
          <KeyObservations
            observations={pageData.key_observations}
            onSave={(observations) => onUpdate({ key_observations: observations })}
          />
        </div>
      )}

      {/* ── System Cliff Gauge (enhanced HealthBar) ───────────────────── */}
      {false && shouldRender("health_bar") && healthBarData && (
        <>
          {/* New System Cliff Gauge when currentAge + lifespan available */}
          {(healthBarData.currentAge !== undefined || healthBarData.current !== undefined) &&
          (healthBarData.lifespan !== undefined || healthBarData.total !== undefined) ? (
            <SystemCliffGauge
              label={healthBarData.label || pageData.title || "System"}
              currentAge={healthBarData.currentAge ?? healthBarData.current ?? 0}
              lifespan={healthBarData.lifespan ?? healthBarData.total ?? 20}
              equipmentName={healthBarData.equipmentName}
              replacementHorizon={healthBarData.replacementHorizon}
            />
          ) : (
            /* Fallback: original HealthBar minimal render */
            <div className="my-8">
              <div className="w-full h-1 bg-border relative">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.min(
                      ((healthBarData.current ?? 0) / (healthBarData.total ?? 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
                {healthBarData.label}: {healthBarData.current} / {healthBarData.total} {healthBarData.unit}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Specs Block ───────────────────────────────────────────────── */}
      {shouldRender("specs") && pageData.specs && pageData.specs.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl text-foreground">
              System Specifications
            </h3>
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanSerialPlate(file);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted/50 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Take a photo of the equipment label to auto-populate specs"
                >
                  {isScanning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ScanLine className="w-3.5 h-3.5" />
                  )}
                  {isScanning ? "Scanning..." : "Scan Label"}
                </button>
              </>
            )}
          </div>

          {/* Enhanced spec table wrapper */}
          <div className="rounded-lg border border-border/60 shadow-sm overflow-hidden bg-card">
            <EditableSpecs
              specs={pageData.specs}
              onSave={(specs) => onUpdate({ specs })}
            />
          </div>

          {/* Save to Equipment Registry prompt */}
          {canEdit && scanResult && propertyId && (
            <div className={`mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm font-sans transition-colors ${
              equipmentSaved
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-accent/30 bg-accent/5 text-foreground"
            }`}>
              {equipmentSaved ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Saved to Equipment Registry</span>
                </div>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    Save <strong className="text-foreground">
                      {[scanResult.brand, scanResult.model].filter(Boolean).join(" ") || "this equipment"}
                    </strong> to the Equipment Registry?
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleSaveEquipment}
                      disabled={isSavingEquipment}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-mono uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {isSavingEquipment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {isSavingEquipment ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Investment Tiers Block ────────────────────────────────────── */}
      {/*
        Shape guard: `pageData.tiers` is `jsonb`. Historically it gets stored
        as either the expected { essential, enhanced, signature } object or
        as `[]` when the page has no pricing yet. A bare `&& pageData.tiers`
        check lets `[]` through (it's truthy), and then PricingTiers crashes
        with "Cannot read properties of undefined (reading 'price')" on its
        first tierKeys[key] lookup. This took down the client-facing report
        reader on day one of Sarah's report. Check the shape, not just truthy.
      */}
      {shouldRender("tiers") && pageData.tiers && !Array.isArray(pageData.tiers) && (pageData.tiers as { essential?: unknown }).essential && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">
            Investment Options
          </h3>
          {canEdit ? (
            <EditableTiers
              tiers={pageData.tiers}
              onSave={(tiers) => onUpdate({ tiers })}
            />
          ) : (
            <PricingTiers
              tiers={pageData.tiers}
              pageTitle={pageData.title}
              propertyId={propertyId}
            />
          )}
        </div>
      )}

      {/* ── Strategic Timing Block ────────────────────────────────────── */}
      {shouldRender("timing") && pageData.timing && (
        <div className="mt-8">
          <h3 className="font-display text-2xl text-foreground mb-4">
            Strategic Timing
          </h3>
          <EditableField
            value={pageData.timing}
            onSave={(timing) => onUpdate({ timing })}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent"
            tag="p"
          />
        </div>
      )}

      {/* ── Dependencies Block ────────────────────────────────────────── */}
      {shouldRender("dependencies") && (
        <DependenciesList
          dependencies={pageData.dependencies || []}
          allPages={allReportPages.filter((p) => p.pageKey !== pageData.id)}
          onSave={(dependencies) => onUpdate({ dependencies })}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Risks & Concerns Block ────────────────────────────────────── */}
      {shouldRender("risks") && pageData.risks && (
        <RisksConcerns
          risks={pageData.risks}
          onSave={(risks) => onUpdate({ risks })}
        />
      )}

      {/* ── Photos Block ──────────────────────────────────────────────── */}
      {shouldRender("photos") && images.length > 0 && (
        <div className="mt-8">
          <h3
            className="font-display text-2xl mb-5"
            style={{ color: "#1B2B4D" }}
          >
            Photos
          </h3>
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Photo ${i + 1}`}
                className="w-full rounded-sm shadow-sm object-cover break-inside-avoid"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Maintenance Notes Block ───────────────────────────────────── */}
      {shouldRender("maintenance") && pageData.maintenance && (
        <MaintenanceNotes
          maintenance={pageData.maintenance}
          onSave={(maintenance) => onUpdate({ maintenance })}
        />
      )}

      {/* ── Recommendations Block (legacy support) ────────────────────── */}
      {pageData.recommendations && pageData.recommendations.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">
            Recommendations
          </h3>
          <EditableSection
            content={`<ul>${pageData.recommendations
              .map((rec) => `<li>${rec}</li>`)
              .join("")}</ul>`}
            onSave={handleRecommendationsSave}
            contentType="recommendations"
          >
            <ul className="space-y-3">
              {pageData.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="text-base text-foreground pl-4 border-l-2 border-accent py-1"
                >
                  {rec}
                </li>
              ))}
            </ul>
          </EditableSection>
        </div>
      )}

      {/* ── Recommended Vendors Block ─────────────────────────────────── */}
      {propertyId && (
        <RecommendedVendors
          propertyId={propertyId}
          pageSlug={pageData.id}
        />
      )}

      {/* ── Creator Notes Block ───────────────────────────────────────── */}
      {shouldRender("creator_notes") && (
        <CreatorNotes
          notes={pageData.creator_notes || ""}
          onSave={(notes) => onUpdate({ creator_notes: notes })}
        />
      )}

      {/* ── Client Comments Block ─────────────────────────────────────── */}
      {shouldRender("client_comments") && dbPageId && (
        <CommentsSection reportPageId={dbPageId} />
      )}
    </div>
  );
};

export default BlockRenderer;
