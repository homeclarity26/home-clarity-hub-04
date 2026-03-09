import { useState } from "react";
import type { ReportPageData } from "@/data/reportContent";
import HealthBar from "./HealthBar";
import PricingTiers from "./PricingTiers";
import EditableSection from "@/components/editor/EditableSection";
import { useEditMode } from "@/contexts/EditModeContext";
import { toast } from "sonner";

interface ReportPageProps {
  page: ReportPageData;
}

const conditionColors: Record<string, string> = {
  Excellent: "text-green-600",
  Good: "text-foreground",
  Fair: "text-accent",
  Poor: "text-orange-600",
  Critical: "text-destructive",
};

const ReportPage = ({ page }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const [localPage, setLocalPage] = useState(page);
  
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
    setLocalPage(prev => ({
      ...prev,
      narrative: newNarrative.length > 0 ? newNarrative : prev.narrative,
      // Store images in page data (would be saved to DB in real implementation)
    }));
    toast.success("Content saved successfully");
    console.log("Saved images:", images);
  };

  const handleRecommendationsSave = (content: string, images: string[]) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const listItems = tempDiv.querySelectorAll("li");
    const recommendations = Array.from(listItems).map(li => li.textContent || "").filter(Boolean);
    
    if (recommendations.length > 0) {
      setLocalPage(prev => ({ ...prev, recommendations }));
      toast.success("Recommendations saved");
    }
    console.log("Saved images:", images);
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
      <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
        {localPage.title}
      </h2>

      {localPage.conditionRating && (
        <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-10 ${conditionColors[localPage.conditionRating]}`}>
          Condition: {localPage.conditionRating}
        </p>
      )}

      <EditableSection
        content={narrativeToHtml(localPage.narrative)}
        onSave={handleNarrativeSave}
      >
        {localPage.narrative.map((paragraph, i) => (
          <p key={i} className="text-base text-foreground max-w-[65ch] mb-6 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </EditableSection>

      {localPage.healthBar && <HealthBar {...localPage.healthBar} />}

      {localPage.specs && localPage.specs.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">System Specifications</h3>
          <div className="space-y-3">
            {localPage.specs.map((spec, i) => (
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

      {localPage.tiers && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Investment Options</h3>
          <PricingTiers tiers={localPage.tiers} />
        </div>
      )}

      {localPage.timing && (
        <div className="mt-8">
          <h3 className="font-display text-2xl text-foreground mb-4">Strategic Timing</h3>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
            {localPage.timing}
          </p>
        </div>
      )}

      {localPage.recommendations && localPage.recommendations.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Recommendations</h3>
          <EditableSection
            content={`<ul>${localPage.recommendations.map(rec => `<li>${rec}</li>`).join("")}</ul>`}
            onSave={handleRecommendationsSave}
          >
            <ul className="space-y-3">
              {localPage.recommendations.map((rec, i) => (
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
