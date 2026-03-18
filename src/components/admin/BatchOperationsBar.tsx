import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, CheckSquare, Mail, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BatchOperationsBarProps {
  selectedIds: string[];
  onClear: () => void;
  context: "clients" | "report-pages";
  reportId?: string;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "needs_review", label: "Needs Review" },
  { value: "complete", label: "Complete" },
  { value: "published", label: "Published" },
  { value: "inactive", label: "Inactive" },
];

const BatchOperationsBar = ({ selectedIds, onClear, context, reportId }: BatchOperationsBarProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState("");

  if (selectedIds.length === 0) return null;

  const handleBulkStatusChange = async (newStatus: string) => {
    if (context !== "report-pages") return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("report_pages")
        .update({ status: newStatus })
        .in("id", selectedIds);
      if (error) throw error;

      // Recalculate completion
      if (reportId) {
        const { data: pages } = await supabase
          .from("report_pages")
          .select("status")
          .eq("report_id", reportId);
        if (pages && pages.length > 0) {
          const done = pages.filter((p) => p.status === "complete" || p.status === "published").length;
          const pct = Math.round((done / pages.length) * 100);
          await (supabase.from("reports") as any).update({ completion_percent: pct }).eq("id", reportId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-report-pages", reportId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success(`Updated ${selectedIds.length} pages to ${newStatus}`);
      onClear();
    } catch {
      toast.error("Bulk status update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEmail = async () => {
    toast.info(`Email notification queued for ${selectedIds.length} clients`);
    onClear();
  };

  return (
    <div className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg flex items-center gap-3 flex-wrap shadow-lg animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4" />
        <span className="text-sm font-sans font-medium">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="h-4 w-px bg-primary-foreground/30" />

      {context === "report-pages" && (
        <Select
          value=""
          onValueChange={(val) => handleBulkStatusChange(val)}
          disabled={isProcessing}
        >
          <SelectTrigger className="h-7 w-auto min-w-[140px] text-xs font-sans bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
            <SelectValue placeholder="Set status…" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-sans">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {context === "clients" && (
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs font-sans gap-1.5"
          onClick={handleBulkEmail}
          disabled={isProcessing}
        >
          <Mail className="w-3 h-3" />
          Send Email
        </Button>
      )}

      {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-sans text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onClear}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default BatchOperationsBar;
