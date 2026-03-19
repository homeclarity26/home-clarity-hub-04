import { useEffect, useState, useMemo } from "react";
import {
  FileText, Hammer, Receipt, Calendar, Shield, Wrench,
  AlertTriangle, Clock, Bookmark, ChevronRight
} from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";

interface SmartActionTilesProps {
  onNavigate: (tab: string, pageId?: string) => void;
  propertyId?: string;
  reportPages?: Record<string, ReportPageData>;
}

type TileType = "urgent" | "recent" | "frequent";

interface ActionTile {
  id: string;
  type: TileType;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  tab: string;
  pageId?: string;
}

const STORAGE_KEY_VISITS = "hbc_section_visits";
const STORAGE_KEY_RECENT = "hbc_recent_sections";

function getVisitData(): Record<string, { count: number; lastVisit: number }> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_VISITS) || "{}");
  } catch { return {}; }
}

function getRecentSections(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RECENT) || "[]");
  } catch { return []; }
}

export function trackSectionVisit(section: string) {
  const visits = getVisitData();
  visits[section] = {
    count: (visits[section]?.count || 0) + 1,
    lastVisit: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits));

  const recent = getRecentSections().filter((s) => s !== section);
  recent.unshift(section);
  localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent.slice(0, 6)));
}

const SECTION_META: Record<string, { icon: React.ReactNode; label: string; defaultSubtitle: string }> = {
  report: { icon: <FileText className="w-5 h-5" />, label: "Home Report", defaultSubtitle: "Your complete assessment" },
  projects: { icon: <Hammer className="w-5 h-5" />, label: "Projects", defaultSubtitle: "Track improvements" },
  payments: { icon: <Receipt className="w-5 h-5" />, label: "Payments", defaultSubtitle: "Invoices & billing" },
  schedule: { icon: <Calendar className="w-5 h-5" />, label: "Schedule", defaultSubtitle: "Appointments & timeline" },
  equipment: { icon: <Shield className="w-5 h-5" />, label: "Equipment", defaultSubtitle: "Your home systems" },
  documents: { icon: <FileText className="w-5 h-5" />, label: "Documents", defaultSubtitle: "Files & records" },
  messages: { icon: <FileText className="w-5 h-5" />, label: "Messages", defaultSubtitle: "Chat with your advisor" },
  contacts: { icon: <FileText className="w-5 h-5" />, label: "Home Team", defaultSubtitle: "Advisors & vendors" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

const SmartActionTiles = ({ onNavigate, propertyId, reportPages }: SmartActionTilesProps) => {
  const [, setTick] = useState(0);
  useEffect(() => setTick(1), []);

  const tiles = useMemo<ActionTile[]>(() => {
    const result: ActionTile[] = [];
    const usedIds = new Set<string>();

    // Urgent tiles from report data
    if (reportPages) {
      const poorPages = Object.values(reportPages).filter(
        (p) => p.conditionRating && ["poor", "critical"].includes(p.conditionRating.toLowerCase())
      );
      if (poorPages.length > 0) {
        result.push({
          id: "urgent-conditions",
          type: "urgent",
          icon: <AlertTriangle className="w-5 h-5" />,
          label: "Items Need Attention",
          subtitle: `${poorPages.length} system${poorPages.length > 1 ? "s" : ""} rated poor or critical`,
          tab: "report",
        });
        usedIds.add("urgent-conditions");
      }
    }

    // Placeholder urgent tiles
    if (result.length < 2) {
      if (!usedIds.has("urgent-maintenance")) {
        result.push({
          id: "urgent-maintenance",
          type: "urgent",
          icon: <Wrench className="w-5 h-5" />,
          label: "Overdue Maintenance",
          subtitle: "HVAC service past due",
          tab: "equipment",
        });
        usedIds.add("urgent-maintenance");
      }
    }

    // Recent tiles
    const recent = getRecentSections();
    const visits = getVisitData();
    for (const section of recent) {
      if (result.length >= 6) break;
      if (usedIds.has(`recent-${section}`)) continue;
      const meta = SECTION_META[section];
      if (!meta) continue;
      const visitInfo = visits[section];
      result.push({
        id: `recent-${section}`,
        type: "recent",
        icon: meta.icon,
        label: meta.label,
        subtitle: visitInfo ? `Last visited ${timeAgo(visitInfo.lastVisit)}` : meta.defaultSubtitle,
        tab: section,
      });
      usedIds.add(`recent-${section}`);
    }

    // Frequent tiles
    const sortedByFreq = Object.entries(visits)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([k]) => k);
    for (const section of sortedByFreq) {
      if (result.length >= 6) break;
      if (usedIds.has(`recent-${section}`) || usedIds.has(`frequent-${section}`)) continue;
      const meta = SECTION_META[section];
      if (!meta) continue;
      const visitInfo = visits[section];
      result.push({
        id: `frequent-${section}`,
        type: "frequent",
        icon: meta.icon,
        label: meta.label,
        subtitle: visitInfo ? `Visited ${visitInfo.count} times` : meta.defaultSubtitle,
        tab: section,
      });
      usedIds.add(`frequent-${section}`);
    }

    // Fill remaining with defaults
    const defaults = ["report", "projects", "payments", "schedule", "equipment", "messages"];
    for (const section of defaults) {
      if (result.length >= 6) break;
      if (usedIds.has(`recent-${section}`) || usedIds.has(`frequent-${section}`) || usedIds.has(`default-${section}`)) continue;
      const meta = SECTION_META[section];
      if (!meta) continue;
      result.push({
        id: `default-${section}`,
        type: "frequent",
        icon: meta.icon,
        label: meta.label,
        subtitle: meta.defaultSubtitle,
        tab: section,
      });
      usedIds.add(`default-${section}`);
    }

    return result.slice(0, 6);
  }, [reportPages]);

  const borderColor = (type: TileType) => {
    switch (type) {
      case "urgent": return "border-l-destructive";
      case "recent": return "border-l-muted-foreground/30";
      case "frequent": return "border-l-primary/40";
    }
  };

  const badgeFor = (type: TileType) => {
    switch (type) {
      case "urgent":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-destructive">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            Action Needed
          </span>
        );
      case "recent":
        return <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Recent</span>;
      case "frequent":
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary/60">
            <Bookmark className="w-3 h-3" />
            Favorite
          </span>
        );
    }
  };

  return (
    <div className="w-full px-6 md:px-20 max-w-[1400px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Your Command Center</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => {
              trackSectionVisit(tile.tab);
              onNavigate(tile.tab, tile.pageId);
            }}
            className={`group bg-card rounded-lg p-5 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4 border border-border border-l-[3px] ${borderColor(tile.type)} text-left w-full cursor-pointer`}
          >
            <div className="text-accent mt-0.5 shrink-0">{tile.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-display text-base text-foreground truncate">{tile.label}</h3>
                {badgeFor(tile.type)}
              </div>
              <p className="font-sans text-sm text-muted-foreground truncate">{tile.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-accent shrink-0 mt-1 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartActionTiles;
