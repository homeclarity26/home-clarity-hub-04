import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import { CHAPTERS } from "./ReportChapterNav";
import HCRLogo from "@/components/brand/HCRLogo";

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
  isReportEmpty = false,
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
  const reportEmpty = isReportEmpty || !hasChapters;

  const reportDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-6 sm:px-8 md:px-10 pt-10 md:pt-16 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* ── Left column: document cover ─────────────────────────── */}
          <div className="lg:col-span-7">
            <HCRLogo size="md" className="mb-8" />

            <p className="font-sans text-[10px] uppercase tracking-[0.25em] font-semibold text-muted-foreground mb-5">
              Home Clarity Report · {reportDate}
            </p>

            <h1 className="font-display text-[38px] md:text-[50px] lg:text-[64px] text-primary font-semibold leading-[1.0] mb-3">
              {propertyName || "Your Home"}
            </h1>

            {propertyAddress && (
              <p className="font-display italic text-[18px] md:text-[22px] text-muted-foreground leading-snug mb-7">
                {propertyAddress}
              </p>
            )}

            <div className="border-t border-border mb-6" />

            <div className="space-y-3 mb-6">
              {propertyAddress && (
                <div className="flex gap-5">
                  <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-24 flex-shrink-0">
                    Address
                  </span>
                  <span className="font-sans text-sm text-foreground">{propertyAddress}</span>
                </div>
              )}
              <div className="flex gap-5">
                <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-24 flex-shrink-0">
                  Prepared by
                </span>
                <span className="font-sans text-sm text-foreground">{creatorName}</span>
              </div>
              <div className="flex gap-5">
                <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-24 flex-shrink-0">
                  Issued
                </span>
                <span className="font-sans text-sm text-foreground">{reportDate}</span>
              </div>
            </div>
          </div>

          {/* ── Right column: chapter list + CTA ────────────────────── */}
          <div className="lg:col-span-5">
            {reportEmpty ? (
              <div className="bg-card border border-border rounded p-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
                  In Preparation
                </p>
                <p className="font-display text-lg text-foreground mb-2 leading-snug">
                  Your Home Clarity Report is being prepared by {creatorName}.
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  You'll get an email when it's ready.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded">
                  <p className="font-sans text-[9px] uppercase tracking-[0.28em] font-semibold text-muted-foreground px-5 pt-5 pb-3">
                    Report Chapters
                  </p>
                  <div>
                    {chapterData
                      .filter((ch) => ch.sectionCount > 0)
                      .map((ch, idx, arr) => (
                        <button
                          key={ch.id}
                          onClick={() => onChapterSelect(ch.id)}
                          className={`flex items-center justify-between w-full px-5 py-4 text-left hover:bg-accent/5 transition-colors group ${
                            idx < arr.length - 1 ? "border-b border-border/60" : ""
                          }`}
                        >
                          <span className="font-display text-[20px] text-primary leading-none">
                            {ch.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-accent font-semibold">
                              {ch.sectionCount} Section{ch.sectionCount !== 1 ? "s" : ""}
                            </span>
                            <span className="text-accent font-semibold text-base leading-none group-hover:translate-x-0.5 transition-transform">
                              ›
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {firstPageId && (
                  <button
                    onClick={() => onPageSelect(firstPageId)}
                    className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded font-sans text-sm font-semibold tracking-[0.04em] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[52px]"
                  >
                    Begin reading
                    <span className="text-accent font-bold text-base">→</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;
