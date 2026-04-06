import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import { CHAPTERS } from "./ReportChapterNav";
import {
  Home,
  Layers,
  Settings,
  Shield,
  Target,
  ChevronRight,
  ArrowRight,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

const chapterIcons: Record<string, typeof Home> = {
  exterior: Home,
  interior: Layers,
  systems: Settings,
  safety: Shield,
  strategy: Target,
};

const conditionScore: Record<string, number> = {
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

const scoreColor = (score: number) => {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const scoreRingColor = (score: number) => {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
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
        (p) => p?.conditionRating && conditionScore[p.conditionRating]
      );
      const total = rated.reduce(
        (sum, p) => sum + (conditionScore[p!.conditionRating!] || 0),
        0
      );
      const score = rated.length > 0 ? Math.round(total / rated.length) : null;

      // Condition breakdown counts
      const counts: Record<string, number> = {};
      for (const p of chapterPages) {
        const r = p?.conditionRating;
        if (r) counts[r] = (counts[r] || 0) + 1;
      }

      // First page id for navigation
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

  // First page of the entire report
  const firstPageId = useMemo(() => {
    return groups.flatMap((g) => g.pages)[0] || null;
  }, [groups]);

  // Priority items (Poor/Critical or Immediate timing)
  const priorityItems = useMemo(() => {
    return allPagesList
      .filter(
        (p) =>
          p.conditionRating === "Poor" ||
          p.conditionRating === "Critical" ||
          p.timing === "Immediate" ||
          p.timing === "Year 1"
      )
      .sort(
        (a, b) =>
          (conditionScore[a.conditionRating || "Good"] || 75) -
          (conditionScore[b.conditionRating || "Good"] || 75)
      )
      .slice(0, 3);
  }, [allPagesList]);

  // Auto-generated advisor note if none provided
  const displayNote = useMemo(() => {
    if (advisorNote) return advisorNote;
    const poorCount = allPagesList.filter(
      (p) => p.conditionRating === "Poor" || p.conditionRating === "Critical"
    ).length;
    const goodCount = allPagesList.filter(
      (p) => p.conditionRating === "Good" || p.conditionRating === "Excellent"
    ).length;
    const totalRated = allPagesList.filter((p) => p.conditionRating).length;
    if (totalRated === 0) {
      return `I've completed a thorough review of ${propertyName || "your home"} and put together this report to give you a clear picture of where things stand. Take your time reading through each section — I'm here if you have any questions.`;
    }
    return `I've completed a thorough review of ${propertyName || "your home"} and this report covers all ${totalRated} systems and components in detail. ${goodCount > 0 ? `The good news: ${goodCount} area${goodCount > 1 ? "s are" : " is"} in solid condition.` : ""} ${poorCount > 0 ? `There are ${poorCount} item${poorCount > 1 ? "s" : ""} that need your attention — I've highlighted those at the top.` : "Overall the home is in good shape."} Read through each chapter and reach out with any questions.`;
  }, [advisorNote, allPagesList, propertyName]);

  const circumference = 2 * Math.PI * 28;

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <div className="relative bg-primary overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px"
          }}
        />
        <div className="relative px-6 md:px-16 py-14 md:py-20 max-w-4xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-4">
            Home Clarity Report
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-primary-foreground leading-tight mb-2">
            {propertyName}
          </h1>
          {propertyAddress && (
            <p className="font-sans text-sm text-primary-foreground/60 mb-8">
              {propertyAddress}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            {firstPageId && (
              <button
                onClick={() => onPageSelect(firstPageId)}
                className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-md font-sans text-sm font-medium hover:bg-accent/90 transition-colors"
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

      <div className="max-w-4xl mx-auto px-6 md:px-16 py-10 space-y-12">

        {/* ── ADAM'S NOTE ── */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                {creatorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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

        {/* ── PRIORITY ITEMS (only if any exist) ── */}
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
                // Find the page key for this item
                const pageKey = Object.entries(pages).find(
                  ([, v]) => v === item
                )?.[0];
                return (
                  <button
                    key={pageKey}
                    onClick={() => pageKey && onPageSelect(pageKey)}
                    className="w-full flex items-center justify-between bg-card border border-border rounded-lg px-5 py-4 text-left hover:border-accent/40 hover:bg-accent/5 transition-all group"
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
                    "I have a question about the priority items in my report."
                  )
                }
                className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
              >
                Ask about these →
              </button>
            )}
          </div>
        )}

        {/* ── CHAPTER CARDS ── */}
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
              .map((ch) => {
                const Icon = chapterIcons[ch.id] || Home;
                const ring = ch.score ? scoreRingColor(ch.score) : "#e5e7eb";
                const r = 28;
                const circ = 2 * Math.PI * r;
                const dash = ch.score ? (ch.score / 100) * circ : 0;

                return (
                  <button
                    key={ch.id}
                    onClick={() => onChapterSelect(ch.id)}
                    className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 text-left hover:border-accent/40 hover:bg-accent/5 transition-all group"
                  >
                    {/* Score ring */}
                    <div className="relative flex-shrink-0">
                      <svg width="64" height="64" className="-rotate-90">
                        <circle
                          cx="32" cy="32" r={r}
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="4"
                        />
                        <circle
                          cx="32" cy="32" r={r}
                          fill="none"
                          stroke={ring}
                          strokeWidth="4"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {ch.score ? (
                          <span className={`font-mono text-xs font-semibold ${scoreColor(ch.score)}`}>
                            {ch.score}
                          </span>
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base text-foreground group-hover:text-accent transition-colors">
                        {ch.label}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {ch.sectionCount} section{ch.sectionCount !== 1 ? "s" : ""}
                        {Object.entries(ch.counts).length > 0 && (
                          <span className="ml-2">
                            ·{" "}
                            {Object.entries(ch.counts)
                              .sort(
                                ([a], [b]) =>
                                  (conditionScore[a] || 0) -
                                  (conditionScore[b] || 0)
                              )
                              .map(([cond, count]) => `${count} ${cond}`)
                              .join(", ")}
                          </span>
                        )}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── BEGIN REPORT FOOTER CTA ── */}
        {firstPageId && (
          <div className="border-t border-border pt-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg text-foreground">Ready to read through your report?</p>
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
