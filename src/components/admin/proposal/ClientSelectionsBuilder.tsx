import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SelectionItem {
  name: string;
  desc: string;
  shop: string;
}

export interface SelectionCategory {
  label: string;
  items: SelectionItem[];
}

interface ClientSelectionsBuilderProps {
  selections: SelectionCategory[];
  onChange: (selections: SelectionCategory[]) => void;
  projectType?: string;
}

const ClientSelectionsBuilder = ({ selections, onChange, projectType }: ClientSelectionsBuilderProps) => {
  const [aiLoading, setAiLoading] = useState(false);

  const addCategory = () => {
    onChange([...selections, { label: "", items: [{ name: "", desc: "", shop: "" }] }]);
  };

  const removeCategory = (idx: number) => {
    onChange(selections.filter((_, i) => i !== idx));
  };

  const updateCategoryLabel = (idx: number, label: string) => {
    const next = [...selections];
    next[idx] = { ...next[idx], label };
    onChange(next);
  };

  const addItem = (cIdx: number) => {
    const next = [...selections];
    next[cIdx] = { ...next[cIdx], items: [...next[cIdx].items, { name: "", desc: "", shop: "" }] };
    onChange(next);
  };

  const removeItem = (cIdx: number, iIdx: number) => {
    const next = [...selections];
    next[cIdx] = { ...next[cIdx], items: next[cIdx].items.filter((_, i) => i !== iIdx) };
    onChange(next);
  };

  const updateItem = (cIdx: number, iIdx: number, field: keyof SelectionItem, value: string) => {
    const next = [...selections];
    const items = [...next[cIdx].items];
    items[iIdx] = { ...items[iIdx], [field]: value };
    next[cIdx] = { ...next[cIdx], items };
    onChange(next);
  };

  const aiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-draft-assistant", {
        body: {
          task: "client_selections",
          context: { projectType },
        },
      });
      if (error) throw error;
      if (data?.selections) {
        onChange(data.selections);
        toast.success("AI suggested client selections");
      }
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Items the client selects and purchases separately. Organized by category.</p>

      {selections.map((cat, cIdx) => (
        <Card key={cIdx} className="p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              value={cat.label}
              onChange={(e) => updateCategoryLabel(cIdx, e.target.value)}
              className="text-xs font-semibold uppercase flex-1"
              placeholder="CATEGORY NAME (e.g., SHOWER)"
            />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeCategory(cIdx)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-1.5 pl-2">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-1.5">
              <Label className="text-[10px] text-muted-foreground">Item Name</Label>
              <Label className="text-[10px] text-muted-foreground">What to Look For</Label>
              <Label className="text-[10px] text-muted-foreground">Where to Shop</Label>
              <span />
            </div>
            {cat.items.map((item, iIdx) => (
              <div key={iIdx} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-1.5">
                <Input value={item.name} onChange={(e) => updateItem(cIdx, iIdx, "name", e.target.value)} className="text-xs" placeholder="Shower head" />
                <Input value={item.desc} onChange={(e) => updateItem(cIdx, iIdx, "desc", e.target.value)} className="text-xs" placeholder="Rain style, chrome" />
                <Input value={item.shop} onChange={(e) => updateItem(cIdx, iIdx, "shop", e.target.value)} className="text-xs" placeholder="Home Depot" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeItem(cIdx, iIdx)}>
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => addItem(cIdx)}>
              <Plus className="w-2.5 h-2.5" /> Add Item
            </Button>
          </div>
        </Card>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addCategory}>
          <Plus className="w-3 h-3" /> Add Category
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={aiSuggest} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Suggest Selections
        </Button>
      </div>
    </div>
  );
};

export default ClientSelectionsBuilder;
