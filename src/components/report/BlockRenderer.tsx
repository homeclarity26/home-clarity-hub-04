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
  };
  images?: string[];
  dbPageId?: string;
  onUpdate: (updates: Partial<PageContent>) => void;
  onNavigate?: (pageKey: string) => void;
}

const BlockRenderer = ({
  blockConfig,
  pageData,
  images = [],
  dbPageId,
  onUpdate,
  onNavigate,
}: BlockRendererProps) => {
  const { canEdit } = useEditMode();

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
          <h3 className="font-display text-2xl text-foreground mb-6">
            System Specifications
          </h3>
          <EditableSpecs
            specs={pageData.specs}
            onSave={(specs) => onUpdate({ specs })}
          />
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
