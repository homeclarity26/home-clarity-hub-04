import { useState } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import CreatorBar from "./CreatorBar";
import BlockRenderer from "./BlockRenderer";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import { toast } from "sonner";
import type { BlockConfig, PageContent } from "@/lib/templateUtils";

interface ReportPageProps {
  page: ReportPageData;
  onNavigate?: (pageId: string) => void;
  dbPageId?: string;
  pdfData?: PDFReportData;
}

const ReportPage = ({ page, onNavigate, dbPageId, pdfData }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, status, saveStatus, updatePageData, updateStatus, isLoading } = useReportPage(page.id, page);
  
  // Track images from the DB
  const [images, setImages] = useState<string[]>([]);

  const handleUpdate = (updates: Partial<PageContent>) => {
    // Handle images separately
    if ('images' in updates && updates.images) {
      setImages(updates.images as string[]);
    }
    
    // Map PageContent updates to ReportPageData updates
    const pageDataUpdates: Partial<ReportPageData> = {};
    if (updates.title) pageDataUpdates.title = updates.title;
    if (updates.conditionRating) pageDataUpdates.conditionRating = updates.conditionRating as ReportPageData["conditionRating"];
    if (updates.narrative) pageDataUpdates.narrative = updates.narrative;
    if (updates.specs) pageDataUpdates.specs = updates.specs;
    if (updates.tiers) pageDataUpdates.tiers = updates.tiers as ReportPageData["tiers"];
    if (updates.timing) pageDataUpdates.timing = updates.timing;
    
    // Handle extended fields through updatePageData
    updatePageData({
      ...pageDataUpdates,
      ...(updates.key_observations && { key_observations: updates.key_observations }),
      ...(updates.risks && { risks: updates.risks }),
      ...(updates.dependencies && { dependencies: updates.dependencies }),
      ...(updates.maintenance && { maintenance: updates.maintenance }),
      ...(updates.creator_notes && { creator_notes: updates.creator_notes }),
    } as Partial<ReportPageData>);
    
    toast.success("Changes saved");
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

  // Extend pageData with additional fields for BlockRenderer
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
        />
      )}

      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <BlockRenderer
          blockConfig={null}
          blockConfig={blockConfig as BlockConfig | null}
          pageData={extendedPageData}
          images={images}
          dbPageId={dbPageId}
          onUpdate={handleUpdate}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};

export default ReportPage;
