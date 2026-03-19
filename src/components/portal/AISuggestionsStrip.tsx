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

const AISuggestionsStrip = ({ onNavigate, reportPages }: AISuggestionsStripProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    if (reportPages) {
      const pages = Object.values(reportPages);
      const poorPages = pages.filter((p) => p.conditionRating && ["poor", "critical"].includes(p.conditionRating.toLowerCase()));
      for (const page of poorPages.slice(0, 2)) {
        items.push({
          id: `condition-${page.id}`,
          icon: <AlertTriangle className="w-3.5 h-3.5 text-destructive" />,
          headline: `${page.title} rated ${page.conditionRating?.toLowerCase()} — review recommendations`,
          action: "View",
          tab: "report",
          pageId: page.id,
        });
      }
    }

    items.push(
      {
        id: "hvac-service",
        icon: <Wrench className="w-3.5 h-3.5 text-accent" />,
        headline: "Your HVAC hasn't been serviced in 11 months — schedule now",
        action: "Schedule",
        tab: "equipment",
      },
      {
        id: "roof-inspection",
        icon: <Calendar className="w-3.5 h-3.5 text-accent" />,
        headline: "Roof inspection recommended before summer",
        action: "View",
        tab: "report",
        pageId: "roof",
      },
      {
        id: "overdue-tasks",
        icon: <FileText className="w-3.5 h-3.5 text-accent" />,
        headline: "3 maintenance tasks are overdue from last season",
        action: "Act",
        tab: "schedule",
      }
    );

    return items;
  }, [reportPages]);

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) return null;

  return (
    <div className="w-full px-6 md:px-20 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground/50" />
        <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-normal">Your AI Concierge Suggests</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {visible.map((s) => (
          <div
            key={s.id}
            className="shrink-0 flex items-center gap-3 group relative pr-6"
          >
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
              className="absolute -top-1 right-0 p-0.5 rounded-full bg-transparent hover:bg-muted text-muted-foreground/30 hover:text-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100 border-none"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="shrink-0">{s.icon}</div>
            <p className="font-sans text-xs text-muted-foreground leading-snug whitespace-nowrap">{s.headline}</p>
            <button
              onClick={() => onNavigate(s.tab, s.pageId)}
              className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              {s.action}
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestionsStrip;
