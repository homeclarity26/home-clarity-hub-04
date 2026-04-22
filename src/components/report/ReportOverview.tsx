import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import { CHAPTERS } from "./ReportChapterNav";

interface ReportOverviewProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  propertyName: string;
  propertyAddress: string;
  completionPercent: number;
  pdfData?: PDFReportData;
  onChapterSelect: (chapterId: string) => void;
  onPageSelect: (pageId: string) => void;
  onSendMessage?: (msg: string) => void;
  hoverUrl?: string | null;
  hoverPdfUrl?: string | null;
  iguideUrl?: string | null;
  iguidePdfUrl?: string | null;
  heroImageUrl?: string | null;
  estimatedValue?: number | null;
  propertyId?: string;
  creatorName?: string;
  advisorNote?: string | null;
  isReportEmpty?: boolean;
}

const ReportOverview = ({
  groups,
  pages,
  propertyName,
  propertyAddress,
  onChapterSelect,
  onPageSelect,
  creatorName = "Adam Kilgore",
}: ReportOverviewProps) => {
  const chapterData = useMemo(() => {
    return CHAPTERS.map((ch) => {
      const chapterPages = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => pages[pid])
        .filter(Boolean);

      return {
        ...ch,
        sectionCount: chapterPages.length,
      };
    });
  }, [groups, pages]);

  const firstPageId = useMemo(
    () => groups.flatMap((g) => g.pages)[0] || null,
    [groups],
  );

  const hasChapters = chapterData.some((c) => c.sectionCount > 0);

  const reportDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-7 pt-10 pb-14 max-w-[480px] mx-auto">

        {/* HCR logo mark */}
        <div className="flex items-start gap-0 mb-8">
          <div className="flex flex-col items-start">
            <span className="font-display text-2xl font-bold text-primary leading-none tracking-tight">HCR</span>
            <div className="w-full h-[1.5px] bg-accent my-1.5" />
            <span className="font-sans text-[8px] uppercase tracking-[0.22em] text-primary leading-none font-semibold">Home Clarity</span>
            <span className="font-sans text-[7px] tracking-[0.12em] text-accent leading-none mt-0.5">Report</span>
          </div>
        </div>

        {/* Report label cap */}
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] font-semibold text-muted-foreground mb-5">
          Home Clarity Report · {reportDate}
        </p>

        {/* Property name */}
        <h1 className="font-display text-[50px] text-primary font-semibold leading-[1.0] mb-2">
          {propertyName || "Your Home"}
        </h1>

        {/* Property address — italic display secondary */}
        {propertyAddress && (
          <p className="font-display italic text-[20px] text-muted-foreground leading-snug mb-7">
            {propertyAddress}
          </p>
        )}

        {/* Rule */}
        <div className="border-t border-border mb-6" />

        {/* Metadata rows */}
        <div className="space-y-3 mb-6">
          {propertyAddress && (
            <div className="flex gap-5">
              <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-24 flex-shrink-0">Address</span>
              <span className="font-sans text-sm text-foreground">{propertyAddress}</span>
            </div>
          )}
          <div className="flex gap-5">
            <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-24 flex-shrink-0">Prepared by</span>
            <span className="font-sans text-sm text-foreground">{creatorName}</span>
          </div>
        </div>

        {/* Rule */}
        <div className="border-t border-border mb-6" />

        {/* Report chapters */}
        {hasChapters && (
          <>
            <p className="font-sans text-[9px] uppercase tracking-[0.28em] font-semibold text-muted-foreground mb-3">
              Report Chapters
            </p>
            <div>
              {chapterData
                .filter((ch) => ch.sectionCount > 0)
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => onChapterSelect(ch.id)}
                    className="flex items-center justify-between w-full py-3.5 border-b border-border/60 text-left hover:opacity-75 transition-opacity group"
                  >
                    <span className="font-display text-[20px] text-primary leading-none">
                      {ch.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-accent font-semibold">
                        {ch.sectionCount} Section{ch.sectionCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-accent font-semibold text-base leading-none">›</span>
                    </div>
                  </button>
                ))}
            </div>
          </>
        )}

        {/* Begin reading CTA */}
        {firstPageId && (
          <button
            onClick={() => onPageSelect(firstPageId)}
            className="w-full mt-8 bg-primary text-primary-foreground py-4 rounded font-sans text-sm font-semibold tracking-[0.04em] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[52px]"
          >
            Begin reading
            <span className="text-accent font-bold text-base">→</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportOverview;
