import { useState } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import HealthBar from "./HealthBar";
import PricingTiers from "./PricingTiers";
import EditableSection from "@/components/editor/EditableSection";
import CreatorBar from "./CreatorBar";
import EditableField from "./EditableField";
import EditableDropdown from "./EditableDropdown";
import EditableSpecs from "./EditableSpecs";
import EditableTiers from "./EditableTiers";
import CommentsSection from "./CommentsSection";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import { toast } from "sonner";

interface ReportPageProps {
  page: ReportPageData;
  onNavigate?: (pageId: string) => void;
  dbPageId?: string;
}

const conditionOptions = ["Excellent", "Good", "Fair", "Poor", "Critical"];

const conditionColors: Record<string, string> = {
  Excellent: "text-accent",
  Good: "text-foreground",
  Fair: "text-muted-foreground",
  Poor: "text-orange-500",
  Critical: "text-destructive",
};

const ReportPage = ({ page, onNavigate, dbPageId }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, status, saveStatus, updatePageData, updateStatus, isLoading } = useReportPage(page.id, page);
  
  // Track images from the DB (stored on pageData but not in ReportPageData type — use separate state)
  const [images, setImages] = useState<string[]>([]);

  const narrativeToHtml = (narrative: string[]) => 
    narrative.map(p => `<p>${p}</p>`).join("");
  
  const htmlToNarrative = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll("p");
    return Array.from(paragraphs).map(p => p.textContent || "").filter(Boolean);
  };

  const handleNarrativeSave = (content: string, newImages: string[]) => {
    const newNarrative = htmlToNarrative(content);
    if (newNarrative.length > 0) {
      updatePageData({ narrative: newNarrative });
      toast.success("Content saved");
    }
    if (newImages.length > 0) {
      setImages(newImages);
      // Save images to DB via the generic updatePageData path
      // useReportPage handles arbitrary fields via the update call
    }
  };

  const handleRecommendationsSave = (content: string, newImages: string[]) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const listItems = tempDiv.querySelectorAll("li");
    const recommendations = Array.from(listItems).map(li => li.textContent || "").filter(Boolean);
    if (recommendations.length > 0) {
      updatePageData({ recommendations });
      toast.success("Recommendations saved");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="space-y-2 mt-10">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {canEdit && (
        <CreatorBar
          status={status}
          onStatusChange={updateStatus}
          saveStatus={saveStatus}
          currentPageId={page.id}
          onNavigate={(pageId) => onNavigate?.(pageId)}
        />
      )}

      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <EditableField
          value={pageData.title}
          onSave={(title) => updatePageData({ title })}
          className="font-display text-3xl md:text-4xl text-foreground mb-4 block"
          tag="h2"
        />

        {pageData.conditionRating && (
          <EditableDropdown
            value={pageData.conditionRating}
            options={conditionOptions}
            onSave={(v) => updatePageData({ conditionRating: v as ReportPageData["conditionRating"] })}
            className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-10 ${conditionColors[pageData.conditionRating]}`}
            renderValue={(v) => `Condition: ${v}`}
          />
        )}

        <EditableSection
          content={narrativeToHtml(pageData.narrative)}
          images={images}
          onSave={handleNarrativeSave}
          contentType="narrative"
        >
          {pageData.narrative.map((paragraph, i) => (
            <p key={i} className="text-base text-foreground max-w-[65ch] mb-6 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </EditableSection>

        {pageData.healthBar && <HealthBar {...pageData.healthBar} />}

        {pageData.specs && pageData.specs.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">System Specifications</h3>
            <EditableSpecs
              specs={pageData.specs}
              onSave={(specs) => updatePageData({ specs })}
            />
          </div>
        )}

        {pageData.tiers && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">Investment Options</h3>
            {canEdit ? (
              <EditableTiers
                tiers={pageData.tiers}
                onSave={(tiers) => updatePageData({ tiers })}
              />
            ) : (
              <PricingTiers tiers={pageData.tiers} />
            )}
          </div>
        )}

        {pageData.timing && (
          <div className="mt-8">
            <h3 className="font-display text-2xl text-foreground mb-4">Strategic Timing</h3>
            <EditableField
              value={pageData.timing}
              onSave={(timing) => updatePageData({ timing })}
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent"
              tag="p"
            />
          </div>
        )}

        {pageData.recommendations && pageData.recommendations.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">Recommendations</h3>
            <EditableSection
              content={`<ul>${pageData.recommendations.map(rec => `<li>${rec}</li>`).join("")}</ul>`}
              onSave={handleRecommendationsSave}
              contentType="recommendations"
            >
              <ul className="space-y-3">
                {pageData.recommendations.map((rec, i) => (
                  <li key={i} className="text-base text-foreground pl-4 border-l-2 border-accent py-1">
                    {rec}
                  </li>
                ))}
              </ul>
            </EditableSection>
          </div>
        )}

        {dbPageId && <CommentsSection reportPageId={dbPageId} />}
      </div>
    </div>
  );
};

export default ReportPage;
