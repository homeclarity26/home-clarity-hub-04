import { useState } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import CreatorBar from "./CreatorBar";
import QACoachPanel from "@/components/admin/QACoachPanel";
import BlockRenderer from "./BlockRenderer";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import type { PageContent } from "@/lib/templateUtils";
import type { PropertyContext } from "@/components/tabs/ReportTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportPageProps {
  page: ReportPageData;
  onNavigate?: (pageId: string) => void;
  dbPageId?: string;
  images?: string[];
  pdfData?: PDFReportData;
  reportId?: string;
  propertyId?: string;
  propertyAddress?: string;
  propertyContext?: PropertyContext;
}

const ReportPage = ({ page, onNavigate, dbPageId, images: propImages, pdfData, reportId, propertyId, propertyAddress, propertyContext }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, blockConfig, status, saveStatus, updatePageData, updateStatus, isLoading } = useReportPage(page.id, page, reportId);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleUpdate = (updates: Partial<PageContent>) => {
    updatePageData(updates as Partial<ReportPageData>);
  };

  const handleDraftNarrative = async () => {
    setIsDrafting(true);
    try {
      const intelligenceParsed = (() => {
        try { return JSON.parse(propertyContext?.clientIntelligenceSummary || ""); } catch { return null; }
      })();

      const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
        body: {
          pageSlug: page.id,
          pageName: page.title,
          propertyAddress: propertyAddress || "",
          yearBuilt: propertyContext?.yearBuilt,
          sqft: propertyContext?.sqft,
          bedrooms: propertyContext?.bedrooms,
          bathrooms: propertyContext?.bathrooms,
          propertyType: propertyContext?.propertyType,
          relationshipType: propertyContext?.relationshipType,
          clientIntelligenceSummary: intelligenceParsed?.summary || propertyContext?.clientIntelligenceSummary || "",
          clientGoals: intelligenceParsed?.goals || [],
          clientPriorities: intelligenceParsed?.priorities || [],
          existingConditionRating: pageData.conditionRating,
          existingSpecs: (pageData.specs as unknown as Record<string, unknown>) || undefined,
        },
      });

      if (error) throw error;

      const updates: Partial<ReportPageData> = {};
      if (data.narrative?.length) updates.narrative = data.narrative;
      if (data.key_observations?.length) (updates as Record<string, unknown>).key_observations = data.key_observations;

      updatePageData(updates);
      toast.success("Draft generated — review and edit as needed.");
    } catch (err) {
      console.error("Draft narrative failed:", err);
      toast.error("Could not generate draft. Check that the edge function is deployed.");
    } finally {
      setIsDrafting(false);
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

  // Use images from props (portal) or from pageData
  const resolvedImages = propImages || (pageData as unknown as Record<string, unknown>).images as string[] || [];

  // Build extended page data for BlockRenderer
  const extendedPageData = {
    ...pageData,
    key_observations: (pageData as unknown as Record<string, unknown>).key_observations as string[] | undefined,
    dependencies: (pageData as unknown as Record<string, unknown>).dependencies as { pageKey: string; title: string; type: "before" | "after" }[] | undefined,
    risks: (pageData as unknown as Record<string, unknown>).risks as string[] | undefined,
    maintenance: (pageData as unknown as Record<string, unknown>).maintenance as { frequency?: string; tasks: string[] } | undefined,
    creator_notes: (pageData as unknown as Record<string, unknown>).creator_notes as string | undefined,
  };

  return (
    <div>
      {canEdit && (
        <CreatorBar
          status={status}
          onStatusChange={updateStatus}
          saveStatus={saveStatus}
          currentPageId={page.id}
          onNavigate={(pageId) => onNavigate?.(pageId)}
          pdfData={pdfData}
          onDraftNarrative={handleDraftNarrative}
          isDrafting={isDrafting}
          qaCoachSlot={dbPageId ? <QACoachPanel page={{ id: dbPageId, title: page.title, condition_rating: pageData.conditionRating, narrative: pageData.narrative, specs: pageData.specs, tiers: pageData.tiers, findings: (pageData as unknown as Record<string, unknown>).findings, key_observations: extendedPageData.key_observations, images: resolvedImages }} /> : undefined}
        />
      )}

      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <BlockRenderer
          blockConfig={blockConfig}
          pageData={extendedPageData}
          images={resolvedImages}
          dbPageId={dbPageId}
          propertyId={propertyId}
          reportId={reportId}
          onUpdate={handleUpdate}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};

export default ReportPage;
