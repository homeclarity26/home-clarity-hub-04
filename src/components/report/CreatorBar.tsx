import { ChevronLeft, ChevronRight, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SaveIndicator from "./SaveIndicator";
import type { SaveStatus } from "@/hooks/useReportPage";
import { reportGroups } from "@/data/reportContent";
import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface CreatorBarProps {
  status: "draft" | "complete" | "needs_review";
  onStatusChange: (status: "draft" | "complete" | "needs_review") => void;
  saveStatus: SaveStatus;
  currentPageId: string;
  onNavigate: (pageId: string) => void;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  complete: "Complete",
  needs_review: "Needs Review",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  complete: "bg-accent/20 text-accent",
  needs_review: "bg-orange-500/20 text-orange-500",
};

const CreatorBar = ({
  status,
  onStatusChange,
  saveStatus,
  currentPageId,
  onNavigate,
}: CreatorBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromAdmin = searchParams.get("from") === "admin";
  const clientId = searchParams.get("clientId");

  const allPageIds = useMemo(
    () => reportGroups.flatMap((g) => g.pages),
    []
  );

  const currentIndex = allPageIds.indexOf(currentPageId);
  const prevPageId = currentIndex > 0 ? allPageIds[currentIndex - 1] : null;
  const nextPageId =
    currentIndex < allPageIds.length - 1 ? allPageIds[currentIndex + 1] : null;

  return (
    <div className="sticky top-0 z-20 h-10 bg-primary/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 gap-3">
      {/* Left: back to admin + navigation */}
      <div className="flex items-center gap-1">
        {fromAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-primary-foreground hover:bg-primary-foreground/10 text-xs font-sans gap-1 mr-2"
            onClick={() => navigate(clientId ? `/admin/clients/${clientId}` : "/admin")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
          disabled={!prevPageId}
          onClick={() => prevPageId && onNavigate(prevPageId)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono text-primary-foreground/70 min-w-[80px] text-center">
          {currentIndex + 1} / {allPageIds.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
          disabled={!nextPageId}
          onClick={() => nextPageId && onNavigate(nextPageId)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Center: status badge */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as "draft" | "complete" | "needs_review")}>
        <SelectTrigger className={`h-7 w-auto min-w-[120px] text-xs font-mono uppercase tracking-wider border-0 ${statusColors[status]}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">{statusLabels.draft}</SelectItem>
          <SelectItem value="complete">{statusLabels.complete}</SelectItem>
          <SelectItem value="needs_review">{statusLabels.needs_review}</SelectItem>
        </SelectContent>
      </Select>

      {/* Right: save indicator */}
      <SaveIndicator status={saveStatus} />
    </div>
  );
};

export default CreatorBar;
