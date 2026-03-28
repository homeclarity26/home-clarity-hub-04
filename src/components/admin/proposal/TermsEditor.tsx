import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export interface TermItem {
  label: string;
  value: string;
}

interface TermsEditorProps {
  terms: TermItem[];
  onChange: (terms: TermItem[]) => void;
}

const DEFAULT_TERMS: TermItem[] = [
  { label: "Payment Terms", value: "50% deposit, 50% upon completion" },
  { label: "Warranty", value: "1-year workmanship warranty" },
  { label: "Change Orders", value: "Written approval required for any scope changes" },
  { label: "Permits", value: "Included where applicable" },
  { label: "Work Hours", value: "Monday through Friday, 8:00 AM to 5:00 PM" },
  { label: "Valid Until", value: "30 days from proposal date" },
];

const TermsEditor = ({ terms, onChange }: TermsEditorProps) => {
  const addTerm = () => {
    onChange([...terms, { label: "", value: "" }]);
  };

  const removeTerm = (idx: number) => {
    onChange(terms.filter((_, i) => i !== idx));
  };

  const updateTerm = (idx: number, field: "label" | "value", val: string) => {
    const next = [...terms];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const loadDefaults = () => {
    onChange(DEFAULT_TERMS);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Terms appear in a 2-column grid in the proposal document.</p>

      {terms.length === 0 && (
        <Button variant="outline" size="sm" className="text-xs" onClick={loadDefaults}>
          Load Default Terms
        </Button>
      )}

      <div className="space-y-1.5">
        {terms.length > 0 && (
          <div className="grid grid-cols-[1fr_2fr_28px] gap-1.5">
            <Label className="text-[10px] text-muted-foreground">Label</Label>
            <Label className="text-[10px] text-muted-foreground">Value</Label>
            <span />
          </div>
        )}
        {terms.map((term, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_2fr_28px] gap-1.5">
            <Input value={term.label} onChange={(e) => updateTerm(idx, "label", e.target.value)} className="text-xs font-medium" placeholder="Payment Terms" />
            <Input value={term.value} onChange={(e) => updateTerm(idx, "value", e.target.value)} className="text-xs" placeholder="50% deposit, 50% upon completion" />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeTerm(idx)}>
              <Trash2 className="w-2.5 h-2.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addTerm}>
        <Plus className="w-3 h-3" /> Add Term
      </Button>
    </div>
  );
};

export default TermsEditor;
