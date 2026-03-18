import { useMemo } from "react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import DigitalHomePanel from "./DigitalHomePanel";
import { CHAPTERS } from "./ReportChapterNav";
import {
  Home,
  Layers,
  Settings,
  Shield,
  Target,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

const conditionColor: Record<string, string> = {
  Excellent: "text-emerald-600",
  Good: "text-emerald-600",
  Fair: "text-amber-500",
  Poor: "text-red-500",
  Critical: "text-red-600",
};

const conditionBg: Record<string, string> = {
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
  estimatedValue?: number | null;
}

const ReportOverview = ({
  groups,
  pages,
  propertyName,
  propertyAddress,
  completionPercent,
  pdfData,
  onChapterSelect,
  onPageSelect,
  onSendMessage,
  hoverUrl,
  hoverPdfUrl,
  iguideUrl,
  iguidePdfUrl,
  estimatedValue,
}: ReportOverviewProps) => {
  // Calculate health scores
  const allPagesList = useMemo(() => Object.values(pages), [pages]);

  const overallScore = useMemo(() => {
    const rated = allPagesList.filter((p) => p.conditionRating && conditionScore[p.conditionRating]);
    if (rated.length === 0) return null;
    const total = rated.reduce((sum, p) => sum + (conditionScore[p.conditionRating!] || 0), 0);
    return Math.round(total / rated.length);
  }, [allPagesList]);

  const chapterScores = useMemo(() => {
    const scores: Record<string, { score: number; count: number; rated: number }> = {};
    for (const ch of CHAPTERS) {
      const chapterPages = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => pages[pid])
        .filter(Boolean);
      const rated = chapterPages.filter((p) => p?.conditionRating && conditionScore[p.conditionRating]);
      const total = rated.reduce((sum, p) => sum + (conditionScore[p!.conditionRating!] || 0), 0);
      scores[ch.id] = {
        score: rated.length > 0 ? Math.round(total / rated.length) : 0,
        count: chapterPages.length,
        rated: rated.length,
      };
    }
    return scores;
  }, [groups, pages]);

  // Priority action items: Poor/Critical pages
  const priorityItems = useMemo(() => {
    return allPagesList
      .filter(
        (p) =>
          p.conditionRating === "Poor" ||
          p.conditionRating === "Critical" ||
          p.timing === "Immediate" ||
          p.timing === "Year 1"
      )
      .sort((a, b) => (conditionScore[a.conditionRating || "Good"] || 75) - (conditionScore[b.conditionRating || "Good"] || 75))
      .slice(0, 8);
  }, [allPagesList]);

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const scoreRingColor = (score: number) => {
    if (score >= 75) return "stroke-emerald-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const circumference = 2 * Math.PI * 54;

  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-16 md:py-24 px-6 md:px-20 text-center relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-3">
          {propertyName}
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-tight text-primary-foreground mb-2">
          Home Clarity Report
        </h1>
        {propertyAddress && (
          <p className="font-sans text-sm text-primary-foreground/60 mb-3">{propertyAddress}</p>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40">
          Your Complete Home Stewardship Guide
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

      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-10 md:py-14 space-y-10">
        {/* Health Score + Chapter Scores */}
        {overallScore !== null && (
          <section className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* Main score gauge */}
            <div className="md:col-span-2 flex flex-col items-center">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    className={scoreRingColor(overallScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (overallScore / 100) * circumference}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${scoreColor(overallScore)}`}>
                    {overallScore}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
                Home Health Score
              </p>
            </div>

            {/* Chapter sub-scores */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CHAPTERS.filter((ch) => ch.id !== "strategy").map((ch) => {
                const s = chapterScores[ch.id];
                const Icon = chapterIcons[ch.id] || Home;
                return (
                  <Card
                    key={ch.id}
                    className="p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onChapterSelect(ch.id)}
                  >
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        {s.rated > 0 && (
                          <circle
                            cx="60" cy="60" r="54" fill="none"
                            className={scoreRingColor(s.score)}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (s.score / 100) * circumference}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${s.rated > 0 ? scoreColor(s.score) : "text-muted-foreground"}`}>
                          {s.rated > 0 ? s.score : "—"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground text-center">
                      {ch.label}
                    </span>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Market Value + Report Completion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estimatedValue && (
            <Card className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Current Market Value</p>
                <p className="font-display text-2xl text-foreground">
                  ${estimatedValue.toLocaleString()}
                </p>
              </div>
            </Card>
          )}
          <section className={estimatedValue ? "" : "col-span-2"}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Report Completion
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </section>
        </div>

        {/* Priority Action Items */}
        {priorityItems.length > 0 && (
          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Priority Action Items
            </h2>
            <div className="space-y-2">
              {priorityItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageSelect(item.id)}
                  className="w-full text-left bg-card rounded-lg px-5 py-4 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full ${
                        conditionBg[item.conditionRating || ""] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.conditionRating || "Review"}
                    </span>
                    <span className="font-sans text-sm text-foreground truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.timing && (
                      <span className="font-mono text-[9px] text-muted-foreground">{item.timing}</span>
                    )}
                    {item.tiers?.essential?.price && (
                      <span className="font-mono text-[10px] text-foreground font-medium">
                        {item.tiers.essential.price}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Chapter Cards Grid */}
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
            Report Chapters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAPTERS.map((ch) => {
              const Icon = chapterIcons[ch.id] || Target;
              const chapterPages = groups
                .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
                .flatMap((g) => g.pages)
                .map((pid) => pages[pid])
                .filter(Boolean);

              if (chapterPages.length === 0 && ch.id !== "strategy") return null;

              const ratings: Record<string, number> = {};
              chapterPages.forEach((p) => {
                if (p?.conditionRating) ratings[p.conditionRating] = (ratings[p.conditionRating] || 0) + 1;
              });

              const s = chapterScores[ch.id];
              const isStrategy = ch.id === "strategy";

              return (
                <button
                  key={ch.id}
                  onClick={() => onChapterSelect(ch.id)}
                  className={`group text-left bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border min-h-[180px] ${
                    isStrategy ? "border-border border-l-[3px] border-l-accent" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className={`w-5 h-5 ${isStrategy ? "text-accent" : "text-muted-foreground"}`} />
                    {s && s.rated > 0 && (
                      <span className={`font-mono text-lg font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-foreground leading-snug">{ch.label}</h3>
                  <p className="font-sans text-sm text-muted-foreground">
                    {chapterPages.length} section{chapterPages.length !== 1 ? "s" : ""}
                  </p>
                  {Object.keys(ratings).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(ratings).map(([rating, count]) => (
                        <span
                          key={rating}
                          className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full ${conditionBg[rating] || ""}`}
                        >
                          {count} {rating}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors mt-auto" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Digital Home */}
        <DigitalHomePanel
          propertyAddress={propertyAddress}
          hoverUrl={hoverUrl}
          hoverPdfUrl={hoverPdfUrl}
          iguideUrl={iguideUrl}
          iguidePdfUrl={iguidePdfUrl}
        />
      </div>
    </div>
  );
};

export default ReportOverview;
