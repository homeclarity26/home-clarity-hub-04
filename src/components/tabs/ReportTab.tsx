import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";
import ImageGrid from "@/components/editor/ImageGrid";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";

interface ReportTabProps {
  activePageId: string | null;
  onNavigate?: (pageId: string) => void;
  groups?: PortalGroup[];
  pages?: Record<string, ReportPageData>;
  pageKeyToDbId?: Record<string, string>;
  pageImages?: Record<string, string[]>;
  propertyName?: string;
  pdfData?: PDFReportData;
}

const ReportTab = ({
  activePageId,
  onNavigate,
  groups,
  pages,
  pageKeyToDbId = {},
  pageImages = {},
  propertyName = "The Johnson Residence",
}: ReportTabProps) => {
  const reportGroups = groups || staticGroups;
  const reportPages = pages || staticPages;

  const page = activePageId ? reportPages[activePageId] : null;

  if (page) {
    const dbPageId = pageKeyToDbId[activePageId!];
    const images = pageImages[activePageId!] || [];
    return (
      <div>
        <ReportPage page={page} onNavigate={onNavigate} dbPageId={dbPageId} />
        {images.length > 0 && (
          <div className="max-w-[800px] mx-auto px-6 md:px-20 pb-16">
            <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
            <ImageGrid images={images} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-primary text-primary-foreground py-16 md:py-24 px-6 md:px-20 text-center relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
          {propertyName}
        </p>
        <h1 className="font-display text-3xl md:text-[48px] text-primary-foreground">
          Home Clarity Report
        </h1>
        <button
          onClick={() => window.print()}
          className="no-print absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-mono uppercase tracking-wider transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download PDF
        </button>
      </div>
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <h2 className="font-display text-3xl text-foreground mb-10">
          Table of Contents
        </h2>
        <div className="space-y-8">
          {reportGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.pages.map((pageId) => {
                  const p = reportPages[pageId];
                  if (!p) return null;
                  return (
                    <button
                      key={pageId}
                      onClick={() => onNavigate?.(pageId)}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                    >
                      <span className="text-base text-foreground font-sans group-hover:text-accent transition-colors">
                        {p.title}
                      </span>
                      {p.conditionRating && (
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider ${
                            p.conditionRating === "Excellent"
                              ? "text-accent"
                              : p.conditionRating === "Good"
                              ? "text-foreground"
                              : p.conditionRating === "Fair"
                              ? "text-muted-foreground"
                              : p.conditionRating === "Poor"
                              ? "text-orange-500"
                              : "text-destructive"
                          }`}
                        >
                          {p.conditionRating}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
