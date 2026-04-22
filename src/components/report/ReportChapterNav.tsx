import { useState } from "react";
import { ChevronDown, List, X, Home } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import { Monogram, chapterToMonogram } from "@/components/ui/Monogram";

export interface ChapterDef {
  id: string;
  label: string;
  groupIds: string[];
}

/**
 * Report chapters — align 1:1 with the five HBC monograms (ES / EX / IN / SY / SP)
 * plus an implicit Safety chapter that lives under Systems in the data model.
 */
export const CHAPTERS: ChapterDef[] = [
  { id: "exterior", label: "Exterior", groupIds: ["exterior", "exterior-spaces", "exterior-structures"] },
  { id: "interior", label: "Interior", groupIds: ["interior", "interior-spaces", "interior-living", "interior-bedrooms", "interior-bathrooms", "interior-utility", "interior-unfinished", "interior-additional", "appliances"] },
  { id: "systems", label: "Systems", groupIds: ["systems", "systems-hvac", "systems-mechanical", "systems-additional"] },
  { id: "safety", label: "Safety", groupIds: ["safety", "safety-detection"] },
  { id: "strategy", label: "Strategic Plan", groupIds: ["strategy"] },
];

interface ReportChapterNavProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  activeChapter: string;
  activePageId: string | null;
  onChapterChange: (chapterId: string) => void;
  onPageSelect: (pageId: string) => void;
  onBackToHome?: () => void;
}

const conditionDot: Record<string, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Poor: "bg-red-500",
  Critical: "bg-red-500",
};

const conditionScore: Record<string, number> = {
  Excellent: 100,
  Good: 75,
  Fair: 50,
  Poor: 25,
  Critical: 10,
};

const ReportChapterNav = ({
  groups,
  pages,
  activeChapter,
  activePageId,
  onChapterChange,
  onPageSelect,
  onBackToHome,
}: ReportChapterNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  // Sub-sections for active chapter
  const chapter = CHAPTERS.find((c) => c.id === activeChapter);
  const subSections = chapter
    ? groups
        .filter((g) => chapter.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => ({ id: pid, page: pages[pid] }))
        .filter((s) => s.page)
    : [];

  // All pages grouped by chapter for the TOC drawer
  const tocChapters = CHAPTERS.map((ch) => {
    const chPages = groups
      .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
      .flatMap((g) => g.pages)
      .map((pid) => ({ id: pid, page: pages[pid] }))
      .filter((s) => s.page);
    return { ...ch, pages: chPages };
  }).filter((ch) => ch.pages.length > 0);

  return (
    <>
      {/* ── STICKY NAV BAR ── */}
      <div className="sticky top-[80px] z-30 bg-card border-b border-border">
        <div className="max-w-[1000px] mx-auto px-4 md:px-10">
          <div className="flex items-center gap-0 py-0">

            {/* Back to overview */}
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="flex-shrink-0 font-sans text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground hover:text-accent transition-colors pr-4 border-r border-border mr-2 py-4"
              >
                ← Overview
              </button>
            )}

            {/* Chapter tabs — underline style matching design reference */}
            <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-hide flex-1">
              {CHAPTERS.map((ch) => {
                const hasPages = groups.some((g) =>
                  ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid))
                );
                if (!hasPages) return null;
                const active = activeChapter === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => onChapterChange(ch.id)}
                    className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-4 font-sans text-[11px] tracking-[0.06em] transition-all duration-200 border-b-2 ${
                      active
                        ? "text-primary font-semibold border-accent"
                        : "text-hbc-text-muted hover:text-foreground border-transparent"
                    }`}
                  >
                    {active && (
                      <Monogram
                        code={chapterToMonogram(ch.id)}
                        size="xs"
                        variant="navy-on-gold"
                      />
                    )}
                    {ch.label}
                  </button>
                );
              })}
            </div>

            {/* Table of Contents button */}
            <button
              onClick={() => setTocOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-all font-sans text-[10px] uppercase tracking-wider ml-2"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contents</span>
            </button>
          </div>
        </div>

        {/* Sub-sections row */}
        {subSections.length > 0 && (
          <div className="max-w-[1000px] mx-auto px-4 md:px-10 border-t border-border/50">
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {subSections.map((s) => {
                const rating = s.page?.conditionRating;
                const isActive = activePageId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onPageSelect(s.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded text-[13px] font-sans transition-all ${
                      isActive
                        ? "text-accent font-medium border-b-2 border-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {rating && (
                      <span className={`w-2 h-2 rounded-full ${conditionDot[rating] || "bg-muted-foreground/30"}`} />
                    )}
                    {s.page?.title}
                  </button>
                );
              })}
            </div>

            {/* Mobile dropdown */}
            <div className="md:hidden py-2">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-muted text-sm font-sans text-foreground"
              >
                <span className="flex items-center gap-2">
                  {activePageId && pages[activePageId] ? (
                    <>
                      {pages[activePageId]?.conditionRating && (
                        <span className={`w-2 h-2 rounded-full ${conditionDot[pages[activePageId]?.conditionRating || ""] || ""}`} />
                      )}
                      {pages[activePageId]?.title}
                    </>
                  ) : (
                    "Select section"
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileOpen && (
                <div className="mt-1 bg-card rounded-md border border-border shadow-lg py-1">
                  {subSections.map((s) => {
                    const rating = s.page?.conditionRating;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { onPageSelect(s.id); setMobileOpen(false); }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm font-sans text-left transition-colors ${
                          activePageId === s.id ? "text-accent bg-accent/5" : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {rating && <span className={`w-2 h-2 rounded-full ${conditionDot[rating] || "bg-muted-foreground/30"}`} />}
                        {s.page?.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── TABLE OF CONTENTS DRAWER ── */}
      {tocOpen && (
        <>
          {/* Backdrop — clickable AND keyboard-dismissible */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Close table of contents"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm cursor-default"
            onClick={() => setTocOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setTocOpen(false); }}
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Navigation</p>
                <h2 className="font-display text-xl text-foreground mt-0.5">Table of Contents</h2>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Back to overview link */}
            {onBackToHome && (
              <button
                onClick={() => { setTocOpen(false); onBackToHome(); }}
                className="flex items-center gap-2 px-6 py-4 border-b border-border text-sm font-sans text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors text-left"
              >
                <Home className="w-4 h-4" />
                Back to Report Overview
              </button>
            )}

            {/* Chapter list — scrollable */}
            <div className="flex-1 overflow-y-auto py-4">
              {tocChapters.map((ch) => {
                return (
                  <div key={ch.id} className="mb-1">
                    {/* Chapter heading — now uses HBC monogram badge */}
                    <button
                      onClick={() => { onChapterChange(ch.id); setTocOpen(false); }}
                      className="flex items-center gap-3 w-full px-6 py-3 hover:bg-muted/60 transition-colors group min-h-[44px]"
                    >
                      <Monogram code={chapterToMonogram(ch.id)} size="sm" />
                      <span className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {ch.label}
                      </span>
                      <span className="ml-auto font-sans text-[10px] text-muted-foreground">
                        {ch.pages.length} sections
                      </span>
                    </button>

                    {/* Section items */}
                    {ch.pages.map((s) => {
                      const rating = s.page?.conditionRating;
                      const isActive = activePageId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { onPageSelect(s.id); setTocOpen(false); }}
                          className={`flex items-center gap-3 w-full pl-16 pr-6 py-2 text-left transition-colors ${
                            isActive
                              ? "text-accent bg-accent/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          {rating && (
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conditionDot[rating] || "bg-muted-foreground/30"}`} />
                          )}
                          <span className="font-sans text-sm truncate">{s.page?.title}</span>
                          {rating && (
                            <span className={`ml-auto font-mono text-[9px] uppercase tracking-wider flex-shrink-0 ${
                              conditionScore[rating] >= 75 ? "text-emerald-600" :
                              conditionScore[rating] >= 50 ? "text-amber-500" : "text-red-500"
                            }`}>
                              {rating}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ReportChapterNav;
