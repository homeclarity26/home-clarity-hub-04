import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

export interface ChapterDef {
  id: string;
  label: string;
  groupIds: string[];
}

export const CHAPTERS: ChapterDef[] = [
  { id: "exterior", label: "Exterior", groupIds: ["exterior", "exterior-spaces"] },
  { id: "interior", label: "Interior", groupIds: ["interior", "interior-spaces"] },
  { id: "systems", label: "Systems", groupIds: ["systems"] },
  { id: "safety", label: "Safety", groupIds: ["safety"] },
  { id: "strategy", label: "Strategic Plan", groupIds: ["strategy"] },
];

interface ReportChapterNavProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  activeChapter: string;
  activePageId: string | null;
  onChapterChange: (chapterId: string) => void;
  onPageSelect: (pageId: string) => void;
}

const conditionDot: Record<string, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Poor: "bg-red-500",
  Critical: "bg-red-500",
};

const ReportChapterNav = ({
  groups,
  pages,
  activeChapter,
  activePageId,
  onChapterChange,
  onPageSelect,
}: ReportChapterNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Get sub-sections for the active chapter
  const chapter = CHAPTERS.find((c) => c.id === activeChapter);
  const subSections = chapter
    ? groups
        .filter((g) => chapter.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages)
        .map((pid) => ({ id: pid, page: pages[pid] }))
        .filter((s) => s.page)
    : [];

  return (
    <div className="sticky top-[80px] z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Row 1 — Chapter Pills */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-10">
        <div
          ref={pillsRef}
          className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide"
        >
          {CHAPTERS.map((ch) => {
            // Check if this chapter has any pages in the data
            const hasPages = groups.some((g) =>
              ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid))
            );
            if (!hasPages && ch.id !== "strategy") return null;

            return (
              <button
                key={ch.id}
                onClick={() => onChapterChange(ch.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full font-sans text-sm transition-all duration-200 ${
                  activeChapter === ch.id
                    ? "bg-accent text-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2 — Sub-sections (desktop: inline, mobile: dropdown) */}
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
                      onClick={() => {
                        onPageSelect(s.id);
                        setMobileOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm font-sans text-left transition-colors ${
                        activePageId === s.id
                          ? "text-accent bg-accent/5"
                          : "text-foreground hover:bg-muted"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportChapterNav;
