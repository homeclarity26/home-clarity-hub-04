import type { ReportPageData } from "@/data/reportContent";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import CreatorBar from "./CreatorBar";
import BlockRenderer from "./BlockRenderer";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import type { PageContent } from "@/lib/templateUtils";

interface ReportPageProps {
  page: ReportPageData;
  onNavigate?: (pageId: string) => void;
  dbPageId?: string;
  images?: string[];
  pdfData?: PDFReportData;
  reportId?: string;
}

const ReportPage = ({ page, onNavigate, dbPageId, images: propImages, pdfData, reportId }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, blockConfig, status, saveStatus, updatePageData, updateStatus, isLoading } = useReportPage(page.id, page, reportId);

  const handleUpdate = (updates: Partial<PageContent>) => {
    updatePageData(updates as Partial<ReportPageData>);
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
        />
      )}

      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <BlockRenderer
          blockConfig={blockConfig}
          pageData={extendedPageData}
          images={resolvedImages}
          dbPageId={dbPageId}
          onUpdate={handleUpdate}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};

export default ReportPage;
