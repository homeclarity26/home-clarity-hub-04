import { useRef, useState } from "react";
import type { ReportPageData } from "@/data/reportContent";
import { useEditMode } from "@/contexts/EditModeContext";
import type { BlockConfig, PageContent } from "@/lib/templateUtils";
import EditableField from "./EditableField";
import EditableDropdown from "./EditableDropdown";
import EditableSection from "@/components/editor/EditableSection";
import EditableSpecs from "./EditableSpecs";
import EditableTiers from "./EditableTiers";
import PricingTiers from "./PricingTiers";
import HealthBar from "./HealthBar";
import KeyObservations from "./KeyObservations";
import DependenciesList from "./DependenciesList";
import RisksConcerns from "./RisksConcerns";
import MaintenanceNotes from "./MaintenanceNotes";
import CreatorNotes from "./CreatorNotes";
import CommentsSection from "./CommentsSection";
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

const conditionColors: Record<string, string> = {
  Excellent: "text-accent",
  Good: "text-foreground",
  Fair: "text-muted-foreground",
  Poor: "text-orange-500",
  Critical: "text-destructive",
  "N/A": "text-muted-foreground",
};

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
  onUpdate: (updates: Partial<PageContent>) => void;
  onNavigate?: (pageKey: string) => void;
}

const BlockRenderer = ({
  blockConfig,
  pageData,
  images = [],
  dbPageId,
  propertyId,
  onUpdate,
  onNavigate,
}: BlockRendererProps) => {
  const { canEdit } = useEditMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [equipmentSaved, setEquipmentSaved] = useState(false);

  const handleScanSerialPlate = async (file: File) => {
    setIsScanning(true);
    try {
      // Convert file to base64
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

      // Map extracted data to specs format
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
            (s: { key: string }) => s.key?.toLowerCase() === label.toLowerCase()
          );
          if (existingIndex >= 0) {
            newSpecs[existingIndex] = { ...newSpecs[existingIndex], value: data[key] };
          } else {
            newSpecs.push({ key: label, value: data[key] });
          }
        }
      });

      onUpdate({ specs: newSpecs });

      // Store scan result for optional "Save to Equipment Registry" prompt
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

  // Helper to check if a block should be rendered
  const shouldRender = (blockName: keyof BlockConfig): boolean => {
    if (!blockConfig) return true; // Render all if no config
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

  return (
    <div className="space-y-8">
      {/* Page Header Block */}
      {shouldRender("page_header") && (
        <div>
          <EditableField
            value={pageData.title}
            onSave={(title) => onUpdate({ title })}
            className="font-display text-3xl md:text-4xl text-foreground mb-4 block"
            tag="h2"
          />
          {pageData.conditionRating && (
            <EditableDropdown
              value={pageData.conditionRating}
              options={conditionOptions}
              onSave={(v) =>
                onUpdate({ conditionRating: v as ReportPageData["conditionRating"] })
              }
              className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-10 ${
                conditionColors[pageData.conditionRating]
              }`}
              renderValue={(v) => `Condition: ${v}`}
            />
          )}
        </div>
      )}

      {/* Narrative Block */}
      {shouldRender("narrative") && pageData.narrative && (
        <EditableSection
          content={narrativeToHtml(pageData.narrative)}
          images={images}
          onSave={handleNarrativeSave}
          contentType="narrative"
        >
          {pageData.narrative.map((paragraph, i) => (
            <p
              key={i}
              className="text-base text-foreground max-w-[65ch] mb-6 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </EditableSection>
      )}

      {/* Key Observations Block */}
      {shouldRender("key_observations") && pageData.key_observations && (
        <KeyObservations
          observations={pageData.key_observations}
          onSave={(observations) => onUpdate({ key_observations: observations })}
        />
      )}

      {/* Health Bar Block */}
      {shouldRender("health_bar") && pageData.healthBar && (
        <HealthBar {...pageData.healthBar} />
      )}

      {/* Specs Block */}
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
          <EditableSpecs
            specs={pageData.specs}
            onSave={(specs) => onUpdate({ specs })}
          />

          {/* Save to Equipment Registry prompt — shown after a successful scan */}
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

      {/* Investment Tiers Block */}
      {shouldRender("tiers") && pageData.tiers && (
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
            <PricingTiers tiers={pageData.tiers} />
          )}
        </div>
      )}

      {/* Strategic Timing Block */}
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

      {/* Dependencies Block */}
      {shouldRender("dependencies") && pageData.dependencies && (
        <DependenciesList
          dependencies={pageData.dependencies}
          onSave={(dependencies) => onUpdate({ dependencies })}
          onNavigate={onNavigate}
        />
      )}

      {/* Risks & Concerns Block */}
      {shouldRender("risks") && pageData.risks && (
        <RisksConcerns
          risks={pageData.risks}
          onSave={(risks) => onUpdate({ risks })}
        />
      )}

      {/* Photos Block */}
      {shouldRender("photos") && images.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-2xl text-foreground mb-4">Photos</h3>
          <ImageGrid images={images} />
        </div>
      )}

      {/* Maintenance Notes Block */}
      {shouldRender("maintenance") && pageData.maintenance && (
        <MaintenanceNotes
          maintenance={pageData.maintenance}
          onSave={(maintenance) => onUpdate({ maintenance })}
        />
      )}

      {/* Recommendations Block (legacy support) */}
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

      {/* Creator Notes Block (only visible to creators) */}
      {shouldRender("creator_notes") && (
        <CreatorNotes
          notes={pageData.creator_notes || ""}
          onSave={(notes) => onUpdate({ creator_notes: notes })}
        />
      )}

      {/* Client Comments Block */}
      {shouldRender("client_comments") && dbPageId && (
        <CommentsSection reportPageId={dbPageId} />
      )}
    </div>
  );
};

export default BlockRenderer;
