import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import { CHAPTERS } from "./ReportChapterNav";
import { Monogram, chapterToMonogram } from "@/components/ui/Monogram";
import { HealthScoreRing } from "@/components/ui/HealthScoreRing";
import {
  ChevronRight,
  ArrowRight,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

const CONDITION_SCORE: Record<string, number> = {
  Excellent: 100,
  Good: 75,
  Fair: 50,
  Poor: 25,
  Critical: 10,
};

const conditionBadgeStyle: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700",
  Good: "bg-emerald-100 text-emerald-700",
  Fair: "bg-amber-100 text-amber-700",
  Poor: "bg-red-100 text-red-700",
  Critical: "bg-red-100 text-red-700",
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
}

const ReportOverview = ({
  groups,
  pages,
  propertyName,
  propertyAddress,
  pdfData,
  onChapterSelect,
  onPageSelect,
  onSendMessage,
  heroImageUrl,
  creatorName = "Adam Kilgore",
  advisorNote,
}: ReportOverviewProps) => {
  const allPagesList = useMemo(() => Object.values(pages), [pages]);

  // Chapter scores + section counts
  const chapterData = useMemo(() => {
    return CHAPTERS.map((ch) => {
      const chapterPages = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => pages[pid])
        .filter(Boolean);

      const rated = chapterPages.filter(
        (p) => p?.conditionRating && CONDITION_SCORE[p.conditionRating],
      );
      const total = rated.reduce(
        (sum, p) => sum + (CONDITION_SCORE[p!.conditionRating!] || 0),
        0,
      );
      const score = rated.length > 0 ? Math.round(total / rated.length) : null;

      const counts: Record<string, number> = {};
      for (const p of chapterPages) {
        const r = p?.conditionRating;
        if (r) counts[r] = (counts[r] || 0) + 1;
      }

      const firstPageId = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)[0];

      return {
        ...ch,
        score,
        sectionCount: chapterPages.length,
        counts,
        firstPageId,
      };
    });
  }, [groups, pages]);

  const firstPageId = useMemo(
    () => groups.flatMap((g) => g.pages)[0] || null,
    [groups],
  );

  // Overall score — the average across all chapters with ratings. Anchors the cover.
  const overallScore = useMemo(() => {
    const scores = chapterData.map((c) => c.score).filter((s): s is number => s != null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [chapterData]);

  const reportDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [],
  );

  const priorityItems = useMemo(() => {
    return allPagesList
      .filter(
        (p) =>
          p.conditionRating === "Poor" ||
          p.conditionRating === "Critical" ||
          p.timing === "Immediate" ||
          p.timing === "Year 1",
      )
      .sort(
        (a, b) =>
          (CONDITION_SCORE[a.conditionRating || "Good"] || 75) -
          (CONDITION_SCORE[b.conditionRating || "Good"] || 75),
      )
      .slice(0, 3);
  }, [allPagesList]);

  const displayNote = useMemo(() => {
    if (advisorNote) return advisorNote;
    const poorCount = allPagesList.filter(
      (p) => p.conditionRating === "Poor" || p.conditionRating === "Critical",
    ).length;
    const goodCount = allPagesList.filter(
      (p) => p.conditionRating === "Good" || p.conditionRating === "Excellent",
    ).length;
    const totalRated = allPagesList.filter((p) => p.conditionRating).length;
    if (totalRated === 0) {
      return `I've completed a thorough review of ${propertyName || "your home"} and put together this report to give you a clear picture of where things stand. Take your time reading through each section — I'm here if you have any questions.`;
    }
    return `I've completed a thorough review of ${propertyName || "your home"} and this report covers all ${totalRated} systems and components in detail. ${goodCount > 0 ? `The good news: ${goodCount} area${goodCount > 1 ? "s are" : " is"} in solid condition.` : ""} ${poorCount > 0 ? `There are ${poorCount} item${poorCount > 1 ? "s" : ""} that need your attention — I've highlighted those at the top.` : "Overall the home is in good shape."} Read through each chapter and reach out with any questions.`;
  }, [advisorNote, allPagesList, propertyName]);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          REPORT COVER — Architectural title page.
          Full-bleed property photo, navy gradient, monogram visual TOC.
          The "WOW" moment on report open.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-primary overflow-hidden h-[70vh] min-h-[520px]">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={propertyAddress || propertyName}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
            decoding="async"
            // @ts-expect-error - fetchpriority is a valid HTML attr
            fetchpriority="high"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
        )}
        {/* Navy wash for legibility, pulled in from top & bottom */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/70 to-primary"
        />

        <div className="relative z-10 h-full flex flex-col justify-between max-w-4xl mx-auto px-6 md:px-16 py-12 md:py-16">
          {/* Top — edition + author */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Home Clarity Report
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/55 mt-2">
              Prepared {reportDate} by {creatorName}
            </p>
          </div>

          {/* Middle — property identity */}
          <div className="space-y-3">
            <h1 className="font-display text-5xl md:text-7xl text-primary-foreground leading-[0.95] max-w-3xl">
              {propertyName}
            </h1>
            {propertyAddress && (
              <p className="font-sans text-base md:text-lg text-primary-foreground/70">
                {propertyAddress}
              </p>
            )}
            {overallScore != null && (
              <div className="flex items-center gap-3 pt-3">
                <HealthScoreRing
                  score={overallScore}
                  size={64}
                  strokeWidth={5}
                  animate
                  trackClassName="text-white/15"
                  numberClassName="text-white font-display"
                />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                    Overall Home Condition
                  </p>
                  <p className="font-display text-primary-foreground text-xl leading-tight mt-0.5">
                    {overallScore}/100
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom — visual monogram TOC */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-foreground/50 mb-4">
              Chapters
            </p>
            <div className="grid grid-cols-5 gap-3 md:gap-6 max-w-md">
              {chapterData
                .filter((c) => c.sectionCount > 0)
                .slice(0, 5)
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => onChapterSelect(ch.id)}
                    className="group flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer text-left hover:opacity-90 transition-opacity"
                    aria-label={`Open ${ch.label}`}
                  >
                    <Monogram code={chapterToMonogram(ch.id)} size="lg" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-primary-foreground/60 group-hover:text-accent transition-colors">
                      {ch.label}
                    </span>
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              {firstPageId && (
                <button
                  onClick={() => onPageSelect(firstPageId)}
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-sans text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Begin Reading
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {pdfData && (
                <PDFDownloadButton
                  data={pdfData}
                  variant="ghost"
                  size="sm"
                  className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-mono uppercase tracking-wider border border-primary-foreground/20"
                  label="Download PDF"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 md:px-16 py-12 space-y-12">
        {/* A NOTE FROM YOUR ADVISOR */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent-readable font-semibold">
                {creatorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                A note from {creatorName}
              </p>
              <p className="font-sans text-base text-foreground leading-relaxed">
                {displayNote}
              </p>
            </div>
          </div>
        </div>

        {/* PRIORITY ITEMS */}
        {priorityItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
                Needs Your Attention
              </h2>
            </div>
            <div className="space-y-2">
              {priorityItems.map((item) => {
                const pageKey = Object.entries(pages).find(
                  ([, v]) => v === item,
                )?.[0];
                return (
                  <button
                    key={pageKey}
                    onClick={() => pageKey && onPageSelect(pageKey)}
                    className="w-full flex items-center justify-between bg-card border border-border border-l-4 border-l-red-500 rounded-lg px-5 py-4 text-left hover:border-accent/40 hover:bg-accent/5 transition-all group min-h-[64px]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                          conditionBadgeStyle[item.conditionRating || "Fair"]
                        }`}
                      >
                        {item.conditionRating}
                      </span>
                      <span className="font-sans text-sm text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.timing && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:block">
                          {item.timing}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
            {onSendMessage && (
              <button
                onClick={() =>
                  onSendMessage(
                    "I have a question about the priority items in my report.",
                  )
                }
                className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
              >
                Ask about these →
              </button>
            )}
          </div>
        )}

        {/* CHAPTER CARDS — monograms + animated score rings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
              Report Chapters
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chapterData
              .filter((ch) => ch.sectionCount > 0)
              .map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onChapterSelect(ch.id)}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 text-left hover:border-accent/40 hover:bg-accent/5 transition-all group min-h-[88px]"
                >
                  <div className="relative">
                    <Monogram code={chapterToMonogram(ch.id)} size="md" />
                    {ch.score != null && (
                      <span className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full px-1.5 text-[9px] font-mono text-foreground">
                        {ch.score}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base text-foreground group-hover:text-accent transition-colors">
                      {ch.label}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 truncate">
                      {ch.sectionCount} section{ch.sectionCount !== 1 ? "s" : ""}
                      {Object.entries(ch.counts).length > 0 && (
                        <span className="ml-2">
                          ·{" "}
                          {Object.entries(ch.counts)
                            .sort(
                              ([a], [b]) =>
                                (CONDITION_SCORE[a] || 0) -
                                (CONDITION_SCORE[b] || 0),
                            )
                            .map(([cond, count]) => `${count} ${cond}`)
                            .join(", ")}
                        </span>
                      )}
                    </p>
                  </div>

                  {ch.score != null && (
                    <HealthScoreRing
                      score={ch.score}
                      size={48}
                      strokeWidth={4}
                      animate
                      showNumber={false}
                    />
                  )}

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 transition-colors" />
                </button>
              ))}
          </div>
        </div>

        {/* BEGIN READING FOOTER */}
        {firstPageId && (
          <div className="border-t border-border pt-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg text-foreground">
                Ready to read through your report?
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                Each section has full details, photos, cost estimates, and recommendations.
              </p>
            </div>
            <button
              onClick={() => onPageSelect(firstPageId)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-sans text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Start Reading
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportOverview;
