import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ReportPage {
  id: string;
  page_key: string;
  title: string;
  group_name?: string;
  status?: string;
  condition_rating?: string;
  sort_order?: number;
}

interface ReportBuildProgressProps {
  reportId: string;
  propertyId?: string;
  currentPageId?: string;
  onNavigate?: (pageKey: string) => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  draft: {
    icon: <FileText className="w-3.5 h-3.5" />,
    label: "Draft",
    color: "text-muted-foreground",
  },
  in_progress: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "In Progress",
    color: "text-amber-600",
  },
  ready_for_review: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: "Review",
    color: "text-[#C4A265]",
  },
  published: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Published",
    color: "text-green-600",
  },
};

const CONDITION_COLORS: Record<string, string> = {
  Excellent: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  Fair: "bg-amber-100 text-amber-700",
  Poor: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-800",
  "Not assessed": "bg-muted text-muted-foreground",
};

const ReportBuildProgress = ({
  reportId,
  propertyId,
  currentPageId,
  onNavigate,
}: ReportBuildProgressProps) => {
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftingPageId, setDraftingPageId] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    fetchPages();

    // Real-time updates
    const channel = supabase
      .channel("report-build-progress")
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "report_pages",
        filter: `report_id=eq.${reportId}`,
      }, () => {
        fetchPages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  const fetchPages = async () => {
    const { data, error } = await (supabase.from("report_pages" as any) as any)
      .select("id, page_key, title, group_name, status, condition_rating, sort_order")
      .eq("report_id", reportId)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setPages(data);
    }
    setLoading(false);
  };

  const handleAIDraft = async (page: ReportPage) => {
    setDraftingPageId(page.id);
    try {
      const { error } = await supabase.functions.invoke("draft-page-narrative", {
        body: {
          pageSlug: page.page_key,
          pageName: page.title,
          propertyId: propertyId || null,
          reportId,
          dbPageId: page.id,
        },
      });
      if (error) throw error;
      toast.success(`AI draft generated for "${page.title}"`);
      fetchPages();
    } catch (err) {
      console.error("[ReportBuildProgress] AI draft error:", err);
      toast.error("Failed to generate AI draft. Please try again.");
    } finally {
      setDraftingPageId(null);
    }
  };

  // Group pages by group_name
  const grouped = pages.reduce<Record<string, ReportPage[]>>((acc, page) => {
    const group = page.group_name || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(page);
    return acc;
  }, {});

  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.status === "published").length;
  const assessedPages = pages.filter((p) => p.condition_rating && p.condition_rating !== "Not assessed").length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-sans">Loading pages...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress summary */}
      <div className="px-4 py-4 border-b border-border bg-muted/30">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Report Progress
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-muted-foreground">Published</span>
              <span className="font-mono text-[10px] text-foreground font-medium">
                {publishedPages}/{totalPages}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: totalPages > 0 ? `${(publishedPages / totalPages) * 100}%` : "0%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-muted-foreground">Assessed</span>
              <span className="font-mono text-[10px] text-foreground font-medium">
                {assessedPages}/{totalPages}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4A265] rounded-full transition-all"
                style={{ width: totalPages > 0 ? `${(assessedPages / totalPages) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page list grouped */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([group, groupPages]) => (
          <div key={group}>
            <div className="px-4 py-2 bg-muted/20 border-b border-border sticky top-0 z-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                {group}
              </p>
            </div>
            {groupPages.map((page) => {
              const statusKey = page.status || "draft";
              const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.draft;
              const conditionLabel = page.condition_rating || "Not assessed";
              const conditionColor = CONDITION_COLORS[conditionLabel] || CONDITION_COLORS["Not assessed"];
              const isCurrent = page.page_key === currentPageId || page.id === currentPageId;
              const isDrafting = draftingPageId === page.id;

              return (
                <div
                  key={page.id}
                  className={`flex items-start gap-2 px-4 py-3 border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/40 ${
                    isCurrent ? "bg-[#C4A265]/10 border-l-2 border-l-[#C4A265]" : ""
                  }`}
                  onClick={() => onNavigate?.(page.page_key || page.id)}
                >
                  {/* Status icon */}
                  <div className={`mt-0.5 shrink-0 ${statusCfg.color}`}>
                    {statusCfg.icon}
                  </div>

                  {/* Page info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs font-medium text-foreground leading-snug truncate">
                      {page.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded ${conditionColor}`}
                      >
                        {conditionLabel}
                      </span>
                      <span className={`font-mono text-[9px] ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* AI Draft button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIDraft(page);
                    }}
                    disabled={isDrafting}
                    className="shrink-0 flex items-center gap-1 font-mono text-[9px] text-[#C4A265] hover:text-[#C4A265]/80 border border-[#C4A265]/30 hover:border-[#C4A265]/60 rounded px-1.5 py-1 transition-all disabled:opacity-40 bg-transparent"
                    title="AI Draft this page"
                  >
                    {isDrafting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {isDrafting ? "" : "Draft"}
                  </button>

                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportBuildProgress;
