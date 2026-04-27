import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock, TrendingUp, Wrench, ChevronDown, ChevronUp } from "lucide-react";

interface PageAction {
  pageTitle: string;
  pageKey: string;
  conditionRating?: string;
  group: string;
  recommendations: string[];
  urgency: "urgent" | "near-term" | "planned";
}

interface ActionGroup {
  id: "urgent" | "near-term" | "planned";
  label: string;
  timeframe: string;
  description: string;
  icon: typeof AlertCircle;
  accentClass: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  items: PageAction[];
}

const conditionToUrgency = (condition?: string): "urgent" | "near-term" | "planned" => {
  if (condition === "Critical" || condition === "Poor") return "urgent";
  if (condition === "Fair") return "near-term";
  return "planned";
};

const conditionDot: Record<string, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-primary",
  Fair: "bg-orange-400",
  Poor: "bg-destructive",
  Critical: "bg-destructive",
};

const urgencyConfig: Record<"urgent" | "near-term" | "planned", { label: string; class: string }> = {
  urgent: { label: "Urgent", class: "bg-destructive/10 text-destructive" },
  "near-term": { label: "Near-Term", class: "bg-orange-100 text-orange-700" },
  planned: { label: "Planned", class: "bg-accent/10 text-accent" },
};

interface ActionPlanPageProps {
  reportId?: string;
}

const ActionPlanPage = ({ reportId }: ActionPlanPageProps) => {
  const [actions, setActions] = useState<PageAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["urgent", "near-term", "planned"]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadPages() {
      if (!reportId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("report_pages")
          .select("page_key, title, group_name, condition_rating, recommendations, sort_order")
          .eq("report_id", reportId)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        const pageActions: PageAction[] = (data || [])
          .filter((p) => {
            const recs = p.recommendations as unknown as string[] | null;
            return Array.isArray(recs) && recs.length > 0;
          })
          .map((p) => ({
            pageTitle: p.title,
            pageKey: p.page_key,
            conditionRating: (p.condition_rating as string) || undefined,
            group: p.group_name,
            recommendations: (p.recommendations as unknown as string[]) || [],
            urgency: conditionToUrgency(p.condition_rating as string | undefined),
          }));

        // Sort: urgent first, then by condition severity
        const urgencyOrder = { urgent: 0, "near-term": 1, planned: 2 };
        pageActions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

        setActions(pageActions);
      } catch (err) {
        console.error("Failed to load action plan pages:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPages();
  }, [reportId]);

  const groups: ActionGroup[] = [
    {
      id: "urgent",
      label: "Urgent Actions",
      timeframe: "Act Now — Within 12 Months",
      description: "These items are in critical or poor condition. Delaying action risks safety issues, structural damage, or significantly higher repair costs.",
      icon: AlertCircle,
      accentClass: "text-destructive",
      badgeClass: "bg-destructive/10 text-destructive",
      borderClass: "border-destructive/20",
      bgClass: "bg-destructive/5",
      items: actions.filter((a) => a.urgency === "urgent"),
    },
    {
      id: "near-term",
      label: "Near-Term Improvements",
      timeframe: "Year 2–3",
      description: "These systems show wear and should be addressed before they deteriorate further. Plan and budget for these within the next 2–3 years.",
      icon: Clock,
      accentClass: "text-orange-500",
      badgeClass: "bg-orange-100 text-orange-700",
      borderClass: "border-orange-200",
      bgClass: "bg-orange-50/50",
      items: actions.filter((a) => a.urgency === "near-term"),
    },
    {
      id: "planned",
      label: "Long-Term Planning",
      timeframe: "Year 4–5+",
      description: "These items are currently in good condition but will need attention over the next 5+ years. Strategic planning now reduces future surprises.",
      icon: TrendingUp,
      accentClass: "text-accent",
      badgeClass: "bg-accent/10 text-accent",
      borderClass: "border-accent/20",
      bgClass: "bg-accent/5",
      items: actions.filter((a) => a.urgency === "planned"),
    },
  ];

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleItem = (pageKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(pageKey)) next.delete(pageKey);
      else next.add(pageKey);
      return next;
    });
  };

  const totalActions = actions.reduce((sum, a) => sum + a.recommendations.length, 0);

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 text-center">
        <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-sans text-base font-medium text-foreground mb-2">No recommendations yet</h3>
        <p className="font-sans text-sm text-muted-foreground">
          Add recommendations to individual report pages and they'll automatically populate here with priority ordering.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-20 py-12 space-y-8">

      {/* Header */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-2">Prioritized Next Steps</p>
        <h1 className="font-display text-3xl text-foreground mb-3">Action Plan</h1>
        <p className="font-sans text-base text-muted-foreground">
          {totalActions} recommended action{totalActions !== 1 ? "s" : ""} across {actions.length} area{actions.length !== 1 ? "s" : ""} of your home, organized by urgency and sequenced for maximum impact.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {groups.map((g) => (
          <div key={g.id} className={`rounded-lg border ${g.borderClass} ${g.bgClass} px-4 py-3`}>
            <p className={`font-mono text-[10px] uppercase tracking-[0.12em] mb-1 ${g.accentClass}`}>{g.label}</p>
            <p className="font-display text-xl text-foreground">{g.items.length}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {g.items.reduce((s, i) => s + i.recommendations.length, 0)} action{g.items.reduce((s, i) => s + i.recommendations.length, 0) !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groups.map((group) => {
        if (group.items.length === 0) return null;
        const GroupIcon = group.icon;
        const isExpanded = expandedGroups.has(group.id);

        return (
          <div key={group.id} className="space-y-3">
            {/* Group header — clickable to collapse */}
            <button
              className="w-full flex items-start justify-between gap-4 text-left group"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-start gap-2.5">
                <GroupIcon className={`w-5 h-5 ${group.accentClass} flex-shrink-0 mt-0.5`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-sans text-base font-semibold text-foreground">{group.label}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${group.badgeClass}`}>
                      {group.timeframe}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground mt-0.5 pr-4">{group.description}</p>
                </div>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="space-y-2 pl-7">
                {group.items.map((item) => {
                  const isItemExpanded = expandedItems.has(item.pageKey);
                  const cfg = urgencyConfig[item.urgency];

                  return (
                    <div
                      key={item.pageKey}
                      className="rounded-lg border border-border bg-background overflow-hidden"
                    >
                      {/* Item header */}
                      <button
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleItem(item.pageKey)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.conditionRating && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conditionDot[item.conditionRating] || "bg-muted-foreground"}`} />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-sans text-sm font-medium text-foreground">{item.pageTitle}</p>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${cfg.class}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground capitalize mt-0.5">
                              {item.group}
                              {item.conditionRating && ` · ${item.conditionRating}`}
                              {` · ${item.recommendations.length} action${item.recommendations.length !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                        </div>
                        {isItemExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        }
                      </button>

                      {/* Recommendations list */}
                      {isItemExpanded && (
                        <div className="px-4 pb-3 border-t border-border bg-muted/20">
                          <ul className="space-y-2 pt-3">
                            {item.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                                <p className="font-sans text-sm text-foreground">{rec}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <p className="font-sans text-xs text-muted-foreground border-t border-border pt-6">
        Priority classifications are based on current condition ratings. As work is completed and conditions improve,
        items will be reclassified. Work with your HBC advisor to update this plan as your home evolves.
      </p>
    </div>
  );
};

export default ActionPlanPage;
