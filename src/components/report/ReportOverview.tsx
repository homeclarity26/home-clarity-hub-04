import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import { CHAPTERS } from "./ReportChapterNav";
import HCRLogo from "@/components/brand/HCRLogo";

const CHAPTER_DESCRIPTIONS: Record<string, string> = {
  "information": "Welcome letter, executive summary, top priorities, vision inventory, at-a-glance specs",
  "interior-spaces": "Every room inside your home — your home's living record",
  "exterior-spaces": "Roof, siding, windows, structures, landscape — everything outside your home",
  "systems-appliances": "Every furnace, condenser, water heater, fridge, range, and major appliance with its full lifecycle",
  "strategy": "Your 10-year capital plan, maintenance calendar, vision projects, and recurring services",
};

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
    return CHAPTERS.map((ch, idx) => {
      const chapterPages = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => pages[pid])
        .filter(Boolean);

      return {
        ...ch,
        num: String(idx + 1).padStart(2, "0"),
        sectionCount: chapterPages.length,
        description: CHAPTER_DESCRIPTIONS[ch.id] || "",
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
      <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 pt-10 md:pt-16 pb-14">
        {/* Header */}
        <HCRLogo size="md" className="mb-8" />

        <div className="font-mono uppercase text-[10px] tracking-[0.12em] text-accent mb-2">
          Your Home Clarity Report
        </div>
        <h1 className="font-display text-[28px] sm:text-[36px] text-primary font-semibold leading-tight mb-3">
          Read by chapter
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[720px] mb-8">
          Your report is organized into five chapters. Start with Information for the big picture. Browse any room or system to see the full record. Use Strategy to see what's coming and when.
        </p>

        {reportEmpty ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="font-mono uppercase text-[10px] tracking-[0.12em] text-accent mb-3">
              In Preparation
            </p>
            <p className="font-display text-lg text-foreground mb-2 leading-snug">
              Your Home Clarity Report is being prepared by {creatorName}.
            </p>
            <p className="text-sm text-muted-foreground">
              You'll get an email when it's ready.
            </p>
          </div>
        ) : (
          <>
            {/* Chapter cards — 2x2 grid + 5th full-width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chapterData.slice(0, 4).map((ch) => (
                <ChapterCard
                  key={ch.id}
                  num={ch.num}
                  title={ch.label}
                  description={ch.description}
                  pageCount={ch.sectionCount}
                  onClick={() => onChapterSelect(ch.id)}
                />
              ))}
              {chapterData[4] && (
                <div className="sm:col-span-2">
                  <ChapterCard
                    num={chapterData[4].num}
                    title={chapterData[4].label}
                    description={chapterData[4].description}
                    pageCount={chapterData[4].sectionCount}
                    onClick={() => onChapterSelect(chapterData[4].id)}
                  />
                </div>
              )}
            </div>

            {/* Begin reading CTA */}
            {firstPageId && (
              <button
                onClick={() => onPageSelect(firstPageId)}
                className="w-full mt-8 bg-primary text-primary-foreground py-4 rounded-lg font-sans text-sm font-semibold tracking-[0.04em] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[52px]"
              >
                Begin reading
                <span className="text-accent font-bold text-base">→</span>
              </button>
            )}

            {/* Footer note */}
            <div className="mt-8 p-5 bg-white rounded-lg border border-border" style={{ borderLeft: "3px solid hsl(var(--accent))" }}>
              <div className="font-mono uppercase text-[10px] tracking-[0.12em] text-accent mb-2">
                How this report stays alive
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                This isn't a static document. It's an evolving record. Every service call, every renovation, every paint touch-up updates the record. Every year we walk through together and catch the changes. Your report grows with the home.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface ChapterCardProps {
  num: string;
  title: string;
  description: string;
  pageCount: number;
  onClick: () => void;
}

const ChapterCard = ({ num, title, description, pageCount, onClick }: ChapterCardProps) => (
  <button
    onClick={onClick}
    className="bg-white rounded-[10px] p-6 border border-border text-left cursor-pointer hover:border-accent/40 transition-colors w-full"
  >
    <div className="font-mono uppercase text-[10px] tracking-[0.12em] text-accent mb-1">
      Section {num}
    </div>
    <h2 className="font-display text-[24px] sm:text-[26px] text-primary mb-2">{title}</h2>
    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{description}</p>
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-muted-foreground">
        {pageCount} {pageCount === 1 ? "page" : "pages"}
      </span>
      <span className="text-[13px] text-accent font-medium">Open →</span>
    </div>
  </button>
);

export default ReportOverview;
