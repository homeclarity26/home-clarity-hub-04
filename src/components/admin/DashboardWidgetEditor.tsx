import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Settings2, Save, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WidgetConfig {
  key: string;
  label: string;
  description: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { key: "daily-brief", label: "Daily Brief", description: "Urgent items needing attention", defaultVisible: true, defaultOrder: 0 },
  { key: "setup-checklist", label: "Setup Checklist", description: "Onboarding progress for new admins", defaultVisible: true, defaultOrder: 1 },
  { key: "stats", label: "Stats Overview", description: "Active clients, reports, questions", defaultVisible: true, defaultOrder: 2 },
  { key: "overdue-actions", label: "Overdue Action Center", description: "Overdue invoices and tasks", defaultVisible: true, defaultOrder: 3 },
  { key: "revenue", label: "Revenue Analytics", description: "Invoiced, collected, outstanding", defaultVisible: true, defaultOrder: 4 },
  { key: "weekly-digest", label: "Weekly AI Digest", description: "AI-generated weekly summary", defaultVisible: true, defaultOrder: 5 },
  { key: "cross-report", label: "Cross-Report Analytics", description: "Condition trends across properties", defaultVisible: true, defaultOrder: 6 },
  { key: "property-map", label: "Property Map", description: "Geographic view of all properties", defaultVisible: true, defaultOrder: 7 },
  { key: "tasks-activity", label: "Tasks & Activity", description: "Recent tasks and activity feed", defaultVisible: true, defaultOrder: 8 },
  { key: "attention", label: "Needs Attention", description: "Clients with unread items", defaultVisible: true, defaultOrder: 9 },
  { key: "nps", label: "NPS Overview", description: "Client satisfaction scores", defaultVisible: true, defaultOrder: 10 },
  { key: "warranty-calendar", label: "Warranty Calendar", description: "Upcoming equipment warranties", defaultVisible: true, defaultOrder: 11 },
  { key: "recent-clients", label: "Recent Clients", description: "Latest client activity table", defaultVisible: true, defaultOrder: 12 },
];

export interface WidgetState {
  key: string;
  visible: boolean;
  order: number;
}

interface DashboardWidgetEditorProps {
  onSave: (widgets: WidgetState[]) => void;
  currentWidgets?: WidgetState[];
}

const DashboardWidgetEditor = ({ onSave, currentWidgets }: DashboardWidgetEditorProps) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (currentWidgets && currentWidgets.length > 0) {
      setWidgets(currentWidgets);
    } else {
      setWidgets(DEFAULT_WIDGETS.map((w) => ({ key: w.key, visible: w.defaultVisible, order: w.defaultOrder })));
    }
  }, [currentWidgets]);

  const toggleVisibility = (key: string) => {
    setWidgets((prev) => prev.map((w) => w.key === key ? { ...w, visible: !w.visible } : w));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...widgets];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setWidgets(updated.map((w, i) => ({ ...w, order: i })));
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Delete existing configs
      await (supabase.from("dashboard_widget_configs" as any) as any).delete().eq("admin_id", user.id);
      // Insert new configs
      const rows = widgets.map((w) => ({
        admin_id: user.id,
        widget_key: w.key,
        sort_order: w.order,
        is_visible: w.visible,
      }));
      await (supabase.from("dashboard_widget_configs" as any) as any).insert(rows);
      onSave(widgets);
      toast.success("Dashboard layout saved");
    } catch {
      toast.error("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS.map((w) => ({ key: w.key, visible: w.defaultVisible, order: w.defaultOrder })));
  };

  const getWidgetMeta = (key: string) => DEFAULT_WIDGETS.find((w) => w.key === key);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Customize Dashboard</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs font-sans gap-1">
            <RotateCcw className="w-3.5 h-3.5" />Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs font-sans gap-1">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {widgets.sort((a, b) => a.order - b.order).map((w, idx) => {
          const meta = getWidgetMeta(w.key);
          return (
            <div
              key={w.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-grab ${
                dragIdx === idx ? "bg-primary/5 border-primary/30" : "border-border hover:bg-muted/30"
              } ${!w.visible ? "opacity-50" : ""}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-medium text-foreground">{meta?.label || w.key}</p>
                <p className="text-[10px] font-sans text-muted-foreground">{meta?.description}</p>
              </div>
              <Switch checked={w.visible} onCheckedChange={() => toggleVisibility(w.key)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DashboardWidgetEditor;
export { DEFAULT_WIDGETS };
