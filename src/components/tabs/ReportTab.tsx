import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";
import ImageGrid from "@/components/editor/ImageGrid";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

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
  pdfData,
}: ReportTabProps) => {
  const reportGroups = groups || staticGroups;
  const reportPages = pages || staticPages;

  const page = activePageId ? reportPages[activePageId] : null;

  if (page) {
    const dbPageId = pageKeyToDbId[activePageId!];
    const images = pageImages[activePageId!] || [];
    const group = reportGroups.find(g => g.pages.includes(activePageId!));
    return (
      <div>
        <div className="max-w-[800px] mx-auto px-6 md:px-20 pt-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em]"
                  onClick={() => onNavigate?.("")}
                >
                  Report
                </BreadcrumbLink>
              </BreadcrumbItem>
              {group && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      {group.title}
                    </span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono text-[11px] uppercase tracking-[0.15em]">
                  {page.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <ReportPage page={page} onNavigate={onNavigate} dbPageId={dbPageId} pdfData={pdfData} />
        {images.length > 0 && (
          <div className="max-w-[800px] mx-auto px-6 md:px-20 pb-16">
            <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
            <ImageGrid images={images} />
          </div>
        )}
      </div>
    );
  }

  // Cover page
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-20 md:py-32 px-6 md:px-20 text-center relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
          {propertyName}
        </p>
        <h1 className="font-display text-4xl md:text-[56px] leading-tight text-primary-foreground mb-6">
          Home Clarity Report
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary-foreground/50">
          Your complete home stewardship guide
        </p>
        {pdfData && (
          <div className="absolute top-6 right-6">
            <PDFDownloadButton
              data={pdfData}
              variant="ghost"
              size="sm"
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-mono uppercase tracking-wider"
              label="Download PDF"
            />
          </div>
        )}
      </div>

      {/* Welcome section */}
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-20 border-b border-border">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
          Welcome to Your Home Clarity Report
        </h2>
        <p className="font-sans text-base text-muted-foreground leading-relaxed mb-4">
          This report is your family's definitive guide to understanding and stewarding your home. Each section provides a detailed assessment of a key system or area — including condition ratings, recommended maintenance, and investment options.
        </p>
        <p className="font-sans text-base text-muted-foreground leading-relaxed">
          Use the links below to navigate directly to any section of your report.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-20">
        <h2 className="font-display text-2xl text-foreground mb-10">
          Report Sections
        </h2>
        <div className="space-y-10">
          {reportGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4 pb-2 border-b border-border">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.pages.map((pageId, index) => {
                  const p = reportPages[pageId];
                  if (!p) return null;
                  return (
                    <button
                      key={pageId}
                      onClick={() => onNavigate?.(pageId)}
                      className="w-full text-left px-4 py-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] text-muted-foreground/50 w-5 text-right">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-base text-foreground font-sans group-hover:text-accent transition-colors">
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
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
                        <span className="font-mono text-[10px] text-muted-foreground/30 group-hover:text-accent transition-colors">→</span>
                      </div>
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
