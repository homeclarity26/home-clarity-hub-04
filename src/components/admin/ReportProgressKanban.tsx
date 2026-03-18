import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

interface Page {
  id: string;
  title: string;
  page_key: string;
  status: string;
  group_name: string;
  updated_at: string;
  condition_rating?: string | null;
}

const COLUMNS = [
  { id: "draft", label: "Draft", icon: Edit, color: "bg-muted text-muted-foreground" },
  { id: "needs_review", label: "Needs Review", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
  { id: "complete", label: "Complete", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  { id: "published", label: "Published", icon: Eye, color: "bg-primary/10 text-primary" },
];

const conditionDots: Record<string, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-blue-500",
  Fair: "bg-amber-500",
  Poor: "bg-orange-500",
  Critical: "bg-destructive",
};

interface Props {
  pages: Page[];
  onPageClick?: (pageKey: string) => void;
  propertyId?: string;
}

const ReportProgressKanban = ({ pages, onPageClick, propertyId }: Props) => {
  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      pages: pages.filter((p) => (p.status || "draft") === col.id),
    }));
  }, [pages]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const Icon = col.icon;
        return (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Badge className={`${col.color} text-[10px] font-sans font-medium border-none gap-1`}>
                <Icon className="w-3 h-3" />
                {col.label}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground">{col.pages.length}</span>
            </div>
            <div className="space-y-1.5 min-h-[60px]">
              {col.pages.map((page) => (
                <Card
                  key={page.id}
                  className="p-2.5 cursor-pointer hover:shadow-md transition-shadow border-border/50"
                  onClick={() => {
                    if (propertyId) {
                      window.open(`/portal/${propertyId}?edit=true&page=${page.page_key}`, "_blank");
                    }
                    onPageClick?.(page.page_key);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {page.condition_rating && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${conditionDots[page.condition_rating] || "bg-muted-foreground"}`} />
                    )}
                    <span className="text-xs font-sans font-medium truncate">{page.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
                    {page.group_name}
                  </span>
                </Card>
              ))}
              {col.pages.length === 0 && (
                <div className="text-[10px] text-muted-foreground font-sans text-center py-4 border border-dashed border-border rounded-md">
                  No pages
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportProgressKanban;
