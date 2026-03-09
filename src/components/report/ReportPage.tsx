import type { ReportPageData } from "@/data/reportContent";
import HealthBar from "./HealthBar";
import PricingTiers from "./PricingTiers";
import EditableSection from "@/components/editor/EditableSection";
import SaveIndicator from "./SaveIndicator";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import { toast } from "sonner";

interface ReportPageProps {
  page: ReportPageData;
}

const conditionColors: Record<string, string> = {
  Excellent: "text-accent",
  Good: "text-foreground",
  Fair: "text-muted-foreground",
  Poor: "text-orange-500",
  Critical: "text-destructive",
};

const ReportPage = ({ page }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, saveStatus, updatePageData, isLoading } = useReportPage(page.id, page);
  
  // Convert narrative array to HTML for editing
  const narrativeToHtml = (narrative: string[]) => 
    narrative.map(p => `<p>${p}</p>`).join("");
  
  // Convert HTML back to narrative array
  const htmlToNarrative = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll("p");
    return Array.from(paragraphs).map(p => p.textContent || "").filter(Boolean);
  };

  const handleNarrativeSave = (content: string, images: string[]) => {
    const newNarrative = htmlToNarrative(content);
    if (newNarrative.length > 0) {
      updatePageData({ narrative: newNarrative });
      toast.success("Content saved");
    }
    console.log("Saved images:", images);
  };

  const handleRecommendationsSave = (content: string, images: string[]) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const listItems = tempDiv.querySelectorAll("li");
    const recommendations = Array.from(listItems).map(li => li.textContent || "").filter(Boolean);
    
    if (recommendations.length > 0) {
      updatePageData({ recommendations });
      toast.success("Recommendations saved");
    }
    console.log("Saved images:", images);
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
    <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
      {/* Save indicator */}
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
        {pageData.title}
      </h2>

      {pageData.conditionRating && (
        <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-10 ${conditionColors[pageData.conditionRating]}`}>
          Condition: {pageData.conditionRating}
        </p>
      )}

      <EditableSection
        content={narrativeToHtml(pageData.narrative)}
        onSave={handleNarrativeSave}
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
          <div className="space-y-3">
            {pageData.specs.map((spec, i) => (
              <div key={i} className="flex justify-between border-b border-border py-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {spec.label}
                </span>
                <span className="text-sm text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pageData.tiers && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Investment Options</h3>
          <PricingTiers tiers={pageData.tiers} />
        </div>
      )}

      {pageData.timing && (
        <div className="mt-8">
          <h3 className="font-display text-2xl text-foreground mb-4">Strategic Timing</h3>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
            {pageData.timing}
          </p>
        </div>
      )}

      {pageData.recommendations && pageData.recommendations.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Recommendations</h3>
          <EditableSection
            content={`<ul>${pageData.recommendations.map(rec => `<li>${rec}</li>`).join("")}</ul>`}
            onSave={handleRecommendationsSave}
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
    </div>
  );
};

export default ReportPage;
