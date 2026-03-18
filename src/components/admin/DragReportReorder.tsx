import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Save, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Page {
  id: string;
  title: string;
  group_name: string;
  sort_order: number;
  status: string;
  condition_rating: string | null;
}

interface DragReportReorderProps {
  pages: Page[];
  reportId: string;
}

const statusColors: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-700",
  published: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  needs_review: "bg-amber-100 text-amber-700",
  inactive: "bg-muted/50 text-muted-foreground",
};

const DragReportReorder = ({ pages: initialPages, reportId }: DragReportReorderProps) => {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState<Page[]>([...initialPages].sort((a, b) => a.sort_order - b.sort_order));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...pages];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setPages(updated);
    setDragIdx(idx);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = pages.map((p, i) => 
        supabase.from("report_pages").update({ sort_order: i }).eq("id", p.id)
      );
      await Promise.all(updates);
      toast.success("Page order saved");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["admin-report-pages", reportId] });
    } catch {
      toast.error("Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPages([...initialPages].sort((a, b) => a.sort_order - b.sort_order));
    setHasChanges(false);
  };

  const groups = [...new Set(pages.map((p) => p.group_name))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Drag to Reorder Pages</h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs font-sans gap-1">
              <RotateCcw className="w-3.5 h-3.5" />Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs font-sans gap-1">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Order
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-grab active:cursor-grabbing ${
              dragIdx === idx ? "bg-primary/5 border-primary/30" : "bg-background border-border hover:bg-muted/30"
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground w-5">{idx + 1}</span>
            <span className="text-sm font-sans font-medium text-foreground flex-1">{page.title}</span>
            {page.condition_rating && (
              <span className="text-[10px] font-sans text-muted-foreground">{page.condition_rating}</span>
            )}
            <Badge className={`${statusColors[page.status] || statusColors.draft} text-[10px] border-none`}>
              {page.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DragReportReorder;
