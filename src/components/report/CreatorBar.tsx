import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Sparkles, Loader2, AlertCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SaveIndicator from "./SaveIndicator";
import type { SaveStatus } from "@/hooks/useReportPage";
import { reportGroups } from "@/data/reportContent";
import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatorBarProps {
  status: "draft" | "complete" | "needs_review";
  onStatusChange: (status: "draft" | "complete" | "needs_review") => void;
  saveStatus: SaveStatus;
  currentPageId: string;
  onNavigate: (pageId: string) => void;
  pdfData?: PDFReportData;
  onDraftNarrative?: () => void;
  isDrafting?: boolean;
  qaCoachSlot?: React.ReactNode;
  // QA gate context — page data needed to run the QA check
  qaPageContext?: {
    id: string;
    title: string;
    condition_rating?: string | null;
    narrative?: unknown;
    specs?: unknown;
    tiers?: unknown;
    findings?: unknown;
    key_observations?: unknown;
    images?: unknown;
  };
}

interface Suggestion {
  severity: "error" | "warning" | "info";
  message: string;
  category: string;
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
  pdfData,
  onDraftNarrative,
  isDrafting,
  qaCoachSlot,
  qaPageContext,
}: CreatorBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromAdmin = searchParams.get("from") === "admin";
  const clientId = searchParams.get("clientId");

  // QA gate dialog state
  const [qaDialogOpen, setQaDialogOpen] = useState(false);
  const [qaErrors, setQaErrors] = useState<Suggestion[]>([]);
  const [qaWarnings, setQaWarnings] = useState<Suggestion[]>([]);
  const [isRunningQA, setIsRunningQA] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"draft" | "complete" | "needs_review" | null>(null);

  const allPageIds = useMemo(
    () => reportGroups.flatMap((g) => g.pages),
    []
  );

  const currentIndex = allPageIds.indexOf(currentPageId);
  const prevPageId = currentIndex > 0 ? allPageIds[currentIndex - 1] : null;
  const nextPageId =
    currentIndex < allPageIds.length - 1 ? allPageIds[currentIndex + 1] : null;

  // ── QA gate logic ────────────────────────────────────────────────────────
  const runQAAndGate = async (newStatus: "draft" | "complete" | "needs_review") => {
    // Only gate when transitioning to "complete" (published equivalent)
    if (newStatus !== "complete" || !qaPageContext) {
      onStatusChange(newStatus);
      return;
    }

    setIsRunningQA(true);
    setPendingStatus(newStatus);

    try {
      const { data, error } = await supabase.functions.invoke("qa-coach", {
        body: { page: qaPageContext },
      });

      if (error) throw error;

      const suggestions: Suggestion[] = data?.suggestions || [];
      const errors = suggestions.filter((s) => s.severity === "error");
      const warnings = suggestions.filter((s) => s.severity === "warning");

      if (errors.length === 0 && warnings.length === 0) {
        // No issues — proceed immediately
        onStatusChange(newStatus);
        toast.success("QA passed — page marked complete.");
        return;
      }

      // Show dialog
      setQaErrors(errors);
      setQaWarnings(warnings);
      setQaDialogOpen(true);
    } catch (err) {
      console.error("QA gate check failed:", err);
      // Don't block status change if QA call fails — just warn
      toast.warning("QA check failed. Proceeding anyway.");
      onStatusChange(newStatus);
    } finally {
      setIsRunningQA(false);
    }
  };

  const handlePublishAnyway = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
      toast.warning(`Published with ${qaWarnings.length} warning${qaWarnings.length !== 1 ? "s" : ""}.`);
    }
    setQaDialogOpen(false);
    setPendingStatus(null);
    setQaErrors([]);
    setQaWarnings([]);
  };

  const handleDismissDialog = () => {
    setQaDialogOpen(false);
    setPendingStatus(null);
    setQaErrors([]);
    setQaWarnings([]);
  };

  return (
    <>
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

        {/* Center: status badge with QA gate */}
        <div className="flex items-center gap-1.5">
          {isRunningQA && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground/70" />
          )}
          <Select
            value={status}
            onValueChange={(v) => runQAAndGate(v as "draft" | "complete" | "needs_review")}
            disabled={isRunningQA}
          >
            <SelectTrigger className={`h-7 w-auto min-w-[120px] text-xs font-mono uppercase tracking-wider border-0 ${statusColors[status]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{statusLabels.draft}</SelectItem>
              <SelectItem value="complete">{statusLabels.complete}</SelectItem>
              <SelectItem value="needs_review">{statusLabels.needs_review}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: draft + QA slot + save indicator + PDF */}
        <div className="flex items-center gap-2">
          {qaCoachSlot}
          {onDraftNarrative && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-primary-foreground hover:bg-primary-foreground/10 text-xs font-mono gap-1"
              onClick={onDraftNarrative}
              disabled={isDrafting}
            >
              {isDrafting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isDrafting ? "Drafting..." : "Draft"}
            </Button>
          )}
          <SaveIndicator status={saveStatus} />
          {pdfData && (
            <PDFDownloadButton
              data={pdfData}
              variant="ghost"
              size="sm"
              className="h-7 text-primary-foreground hover:bg-primary-foreground/10 text-xs no-print"
              label="PDF"
            />
          )}
        </div>
      </div>

      {/* ── QA Gate Dialog ─────────────────────────────────────────────── */}
      <Dialog open={qaDialogOpen} onOpenChange={setQaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl text-foreground">
              {qaErrors.length > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  Fix {qaErrors.length} issue{qaErrors.length !== 1 ? "s" : ""} before publishing
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  Publishing with {qaWarnings.length} warning{qaWarnings.length !== 1 ? "s" : ""}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 my-2 max-h-64 overflow-y-auto">
            {/* Errors */}
            {qaErrors.map((e, i) => (
              <div
                key={`err-${i}`}
                className="flex items-start gap-2.5 p-3 rounded-md border border-destructive/20 bg-destructive/5"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-destructive" />
                <div>
                  <p className="text-xs font-sans text-destructive">{e.message}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{e.category}</span>
                </div>
              </div>
            ))}
            {/* Warnings */}
            {qaWarnings.map((w, i) => (
              <div
                key={`warn-${i}`}
                className="flex items-start gap-2.5 p-3 rounded-md border border-amber-200 bg-amber-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-sans text-amber-800">{w.message}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{w.category}</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={handleDismissDialog} className="gap-1.5 text-xs font-mono">
              <X className="w-3.5 h-3.5" />
              Go Back
            </Button>
            {/* Only show "Publish Anyway" if only warnings (no blocking errors) */}
            {qaErrors.length === 0 && (
              <Button
                size="sm"
                onClick={handlePublishAnyway}
                className="text-xs font-mono gap-1.5"
                style={{ background: "#C4A265", color: "#1B2B4D" }}
              >
                Publish Anyway
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorBar;
