import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  notes: string;
}

interface Props {
  reportPageId: string;
  pageTitle: string;
}

const InspectionChecklist = ({ reportPageId, pageTitle }: Props) => {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, [reportPageId]);

  const loadChecklist = async () => {
    try {
      const { data } = await (supabase.from("inspection_checklists" as any) as any)
        .select("*")
        .eq("report_page_id", reportPageId)
        .limit(1);
      if (data && data.length > 0) {
        setChecklistId(data[0].id);
        setItems((data[0].items as CheckItem[]) || []);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: newItem.trim(), checked: false, notes: "" }]);
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, notes } : i));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const completed = items.filter((i) => i.checked).length;
      const payload = { report_page_id: reportPageId, items: items as any, completed_count: completed, total_count: items.length };
      if (checklistId) {
        await (supabase.from("inspection_checklists" as any) as any).update(payload).eq("id", checklistId);
      } else {
        const { data } = await (supabase.from("inspection_checklists" as any) as any).insert(payload).select().single();
        if (data) setChecklistId(data.id);
      }
      toast.success("Checklist saved");
    } catch { toast.error("Failed to save checklist"); }
    finally { setIsSaving(false); }
  };

  const completedCount = items.filter((i) => i.checked).length;

  if (isLoading) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-sans font-semibold">Inspection Checklist</h4>
          {items.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{completedCount}/{items.length}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 font-sans" onClick={save} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </Button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className={`flex items-start gap-2 p-2 rounded-md transition-colors ${item.checked ? "bg-emerald-50/50" : "hover:bg-muted/30"}`}>
            <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-sans ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
              <Input
                value={item.notes}
                onChange={(e) => updateNotes(item.id, e.target.value)}
                placeholder="Notes…"
                className="h-6 text-[10px] mt-1 border-dashed"
              />
            </div>
            <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add inspection item…"
          className="h-8 text-xs"
          onKeyDown={(e) => e.key === "Enter" && addItem()}
        />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};

export default InspectionChecklist;
