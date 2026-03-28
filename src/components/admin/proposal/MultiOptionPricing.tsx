import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

export interface OptionPrice {
  label: string;
  sub: string;
  base: string;
  upgrade: string | null;
}

interface MultiOptionPricingProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  options: OptionPrice[];
  onChange: (options: OptionPrice[]) => void;
}

const MultiOptionPricing = ({ enabled, onToggle, options, onChange }: MultiOptionPricingProps) => {
  const addOption = () => {
    onChange([...options, { label: `Option ${options.length + 1}`, sub: "", base: "", upgrade: null }]);
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: keyof OptionPrice, value: string | null) => {
    const next = [...options];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-sans">Multi-Option Proposal</Label>
          <p className="text-[10px] text-muted-foreground">Present multiple build options with separate pricing</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <Card key={idx} className="p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(idx, "label", e.target.value)}
                  className="text-xs font-semibold w-32"
                  placeholder="Option 1"
                />
                <Input
                  value={opt.sub}
                  onChange={(e) => updateOption(idx, "sub", e.target.value)}
                  className="text-xs flex-1"
                  placeholder="Short description"
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeOption(idx)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Base Price</Label>
                  <Input
                    value={opt.base}
                    onChange={(e) => updateOption(idx, "base", e.target.value)}
                    className="text-xs font-mono"
                    placeholder="$28,500"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Upgrade Price (optional)</Label>
                  <Input
                    value={opt.upgrade || ""}
                    onChange={(e) => updateOption(idx, "upgrade", e.target.value || null)}
                    className="text-xs font-mono"
                    placeholder="$31,300"
                  />
                </div>
              </div>
            </Card>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addOption}>
            <Plus className="w-3 h-3" /> Add Option
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiOptionPricing;
