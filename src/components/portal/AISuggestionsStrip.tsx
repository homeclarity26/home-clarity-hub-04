import { useState, useMemo } from "react";
import { Sparkles, Wrench, FileText, AlertTriangle, Calendar, X, ChevronRight } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";

interface AISuggestionsStripProps {
  onNavigate: (tab: string, pageId?: string) => void;
  reportPages?: Record<string, ReportPageData>;
}

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  headline: string;
  action: string;
  tab: string;
  pageId?: string;
}

const cardBase = "bg-card rounded-lg shadow-hbc-sm border border-border";

const AISuggestionsStrip = ({ onNavigate, reportPages }: AISuggestionsStripProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    if (reportPages) {
      const pages = Object.values(reportPages);
      const poorPages = pages.filter((p) => p.conditionRating && ["poor", "critical"].includes(p.conditionRating.toLowerCase()));
      for (const page of poorPages.slice(0, 2)) {
        items.push({
          id: `condition-${page.id}`,
          icon: <AlertTriangle className="w-5 h-5 text-accent" />,
          headline: `${page.title} rated ${page.conditionRating?.toLowerCase()}: review recommendations`,
          action: "View",
          tab: "report",
          pageId: page.id,
        });
      }
    }

    // Only show data-driven suggestions — no hardcoded filler items

    return items;
  }, [reportPages]);

  const visible = suggestions.filter((s) => !dismissed.has(s.id));
  const displayItems = showAll ? visible : visible.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Your Concierge Suggests</p>
      <div className={cardBase}>
        {displayItems.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-4 px-6 py-4 group ${
              i < displayItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="shrink-0">{s.icon}</div>
            <p className="font-sans text-sm text-foreground flex-1">{s.headline}</p>
            <button
              onClick={() => onNavigate(s.tab, s.pageId)}
              className="shrink-0 flex items-center gap-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              {s.action}
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
              className="shrink-0 p-1 rounded-full bg-transparent hover:bg-muted text-muted-foreground/30 hover:text-foreground transition-colors cursor-pointer border-none opacity-0 group-hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {visible.length > 3 && !showAll && (
          <div className="px-6 py-3 border-t border-border">
            <button
              onClick={() => setShowAll(true)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              See all ({visible.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsStrip;
