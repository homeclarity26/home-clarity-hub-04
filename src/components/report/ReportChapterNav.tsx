import { useState, useMemo, useEffect } from "react";
import { ChevronDown, List, X, Home, Search } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

export interface ChapterDef {
  id: string;
  label: string;
  groupIds: string[];
}

export const CHAPTERS: ChapterDef[] = [
  { id: "information", label: "Information",
    groupIds: ["information"] },
  { id: "interior-spaces", label: "Interior Spaces",
    groupIds: ["interior-living", "interior-bedrooms", "interior-bathrooms",
               "interior-utility", "interior-unfinished", "interior-additional",
               "spaces"] },
  { id: "exterior-spaces", label: "Exterior Spaces",
    groupIds: ["exterior", "exterior-structures"] },
  { id: "systems-appliances", label: "Systems & Appliances",
    groupIds: ["systems-hvac", "systems-mechanical", "systems-additional",
               "safety-detection", "appliances", "systems-and-appliances"] },
  { id: "strategy", label: "Strategy",
    groupIds: ["strategy"] },
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

// HCR token-bound condition dots — gold for attention, secondary for good,
// text-muted for N/A. No emerald/amber/red.
const conditionDot: Record<string, string> = {
  Excellent: "bg-[hsl(var(--hbc-text-secondary))]",
  Good: "bg-[hsl(var(--hbc-text-secondary))]",
  Fair: "bg-accent",
  Poor: "bg-accent",
  Critical: "bg-accent",
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
  const [tocSearch, setTocSearch] = useState("");

  // Close drawer on Escape
  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTocOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tocOpen]);

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
  const tocChapters = useMemo(() => {
    const all = CHAPTERS.map((ch) => {
      const chPages = groups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => ({ id: pid, page: pages[pid] }))
        .filter((s) => s.page);
      return { ...ch, pages: chPages };
    }).filter((ch) => ch.pages.length > 0);

    if (!tocSearch.trim()) return all;
    const q = tocSearch.toLowerCase();
    return all
      .map((ch) => ({
        ...ch,
        pages: ch.pages.filter((s) =>
          (s.page?.title || "").toLowerCase().includes(q) ||
          ch.label.toLowerCase().includes(q)
        ),
      }))
      .filter((ch) => ch.pages.length > 0);
  }, [groups, pages, tocSearch]);

  return (
    <>
      {/* ── STICKY NAV BAR ── */}
      <div className="sticky top-[80px] z-30 bg-card border-b border-border">
        <div className="max-w-[1040px] mx-auto px-4 md:px-10">
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

            {/* Chapter tabs — underline style */}
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
                        : "text-[hsl(var(--hbc-text-muted))] hover:text-foreground border-transparent"
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>

            {/* Contents button — single TOC entry point */}
            <button
              onClick={() => setTocOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-all font-sans text-[10px] uppercase tracking-wider ml-2 min-h-[36px]"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contents</span>
            </button>
          </div>
        </div>

        {/* Sub-sections row */}
        {subSections.length > 0 && (
          <div className="max-w-[1040px] mx-auto px-4 md:px-10 border-t border-border/50">
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
                      <span className={`w-2 h-2 rounded-full ${conditionDot[rating] || "bg-[hsl(var(--hbc-text-muted))]"}`} />
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
                className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-muted text-sm font-sans text-foreground min-h-[44px]"
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
                        className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-sans text-left transition-colors min-h-[44px] ${
                          activePageId === s.id ? "text-accent bg-accent/5" : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {rating && <span className={`w-2 h-2 rounded-full ${conditionDot[rating] || "bg-[hsl(var(--hbc-text-muted))]"}`} />}
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
          <div
            role="button"
            tabIndex={0}
            aria-label="Close table of contents"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm cursor-default"
            onClick={() => setTocOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setTocOpen(false); }}
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] bg-card shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Navigation</p>
                <h2 className="font-display text-xl text-foreground mt-0.5">Contents</h2>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={tocSearch}
                  onChange={(e) => setTocSearch(e.target.value)}
                  placeholder="Search sections"
                  className="w-full pl-9 pr-3 py-2 rounded border border-border bg-background text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>
            </div>

            {/* Back to overview link */}
            {onBackToHome && (
              <button
                onClick={() => { setTocOpen(false); onBackToHome(); }}
                className="flex items-center gap-2 px-6 py-4 border-b border-border text-sm font-sans text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors text-left min-h-[44px]"
              >
                <Home className="w-4 h-4" />
                Report Overview
              </button>
            )}

            {/* Chapter list — scrollable */}
            <div className="flex-1 overflow-y-auto py-2">
              {tocChapters.map((ch) => (
                <div key={ch.id} className="mb-1">
                  <button
                    onClick={() => { onChapterChange(ch.id); setTocOpen(false); }}
                    className="flex items-center gap-3 w-full px-6 py-3 hover:bg-muted/60 transition-colors group min-h-[44px]"
                  >
                    <span className="font-display text-base text-foreground group-hover:text-accent transition-colors">
                      {ch.label}
                    </span>
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent font-sans text-[10px] uppercase tracking-[0.14em] font-semibold">
                      {ch.pages.length} section{ch.pages.length === 1 ? "" : "s"}
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
                        className={`flex items-center gap-3 w-full pl-10 pr-6 py-3 text-left transition-colors min-h-[44px] ${
                          isActive
                            ? "text-accent bg-accent/5 border-l-2 border-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-l-2 border-transparent"
                        }`}
                      >
                        {rating && (
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conditionDot[rating] || "bg-[hsl(var(--hbc-text-muted))]"}`} />
                        )}
                        <span className="font-sans text-sm truncate flex-1">{s.page?.title}</span>
                        {rating && (
                          <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-muted-foreground flex-shrink-0">
                            {rating}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {tocChapters.length === 0 && (
                <p className="px-6 py-8 text-center font-sans text-sm text-muted-foreground">
                  No sections match "{tocSearch}".
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ReportChapterNav;
