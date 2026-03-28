import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScopeBullet {
  label: string;
  desc: string | null;
}

export interface ScopeSection {
  number: string;
  title: string;
  bullets: ScopeBullet[];
}

interface ScopeSectionBuilderProps {
  sections: ScopeSection[];
  onChange: (sections: ScopeSection[]) => void;
  lineItems?: any[];
  projectType?: string;
}

const PROJECT_TYPE_FRAMEWORKS: Record<string, { number: string; title: string }[]> = {
  bathroom: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Demolition and Wall Removal" },
    { number: "Section 03", title: "Framing, Electrical and Plumbing Rough-In" },
    { number: "Section 04", title: "Subfloor, Waterproofing and Tile Backer" },
    { number: "Section 05", title: "Custom Tile Shower" },
    { number: "Section 06", title: "Freestanding Tub and Wall Recess" },
    { number: "Section 07", title: "Vanity, Cabinetry and Floor Tile" },
    { number: "Section 08", title: "Lighting, Fans and Electrical Finish" },
    { number: "Section 09", title: "Drywall, Paint and Final Finish" },
  ],
  kitchen: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Demolition" },
    { number: "Section 03", title: "Framing, Electrical and Plumbing Rough-In" },
    { number: "Section 04", title: "Drywall and Prep" },
    { number: "Section 05", title: "Cabinet Installation" },
    { number: "Section 06", title: "Countertop and Backsplash" },
    { number: "Section 07", title: "Flooring" },
    { number: "Section 08", title: "Appliance Installation" },
    { number: "Section 09", title: "Lighting, Electrical Finish and Hardware" },
    { number: "Section 10", title: "Paint and Final Finish" },
  ],
  basement: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Framing and Insulation" },
    { number: "Section 03", title: "Electrical Rough-In" },
    { number: "Section 04", title: "Plumbing Rough-In" },
    { number: "Section 05", title: "Drywall and Ceilings" },
    { number: "Section 06", title: "Flooring" },
    { number: "Section 07", title: "Trim, Doors and Hardware" },
    { number: "Section 08", title: "Electrical Finish and Lighting" },
    { number: "Section 09", title: "Paint and Final Finish" },
  ],
  addition: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Demolition" },
    { number: "Section 03", title: "Foundation and Structural" },
    { number: "Section 04", title: "Framing and Roof" },
    { number: "Section 05", title: "Windows, Doors and Exterior" },
    { number: "Section 06", title: "Insulation and Waterproofing" },
    { number: "Section 07", title: "Electrical and Plumbing Rough-In" },
    { number: "Section 08", title: "Interior Finish" },
    { number: "Section 09", title: "Trim, Paint and Final Finish" },
  ],
  flooring: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Subfloor Prep" },
    { number: "Section 03", title: "Flooring Installation" },
    { number: "Section 04", title: "Trim and Transitions" },
    { number: "Section 05", title: "Final Cleanup" },
  ],
  general: [
    { number: "Section 01", title: "Site Protection and Prep" },
    { number: "Section 02", title: "Assessment and Planning" },
    { number: "Section 03", title: "Core Work" },
    { number: "Section 04", title: "Finish Work" },
    { number: "Section 05", title: "Final Inspection and Cleanup" },
  ],
};

const ScopeSectionBuilder = ({ sections, onChange, lineItems, projectType }: ScopeSectionBuilderProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(projectType || "");

  const addSection = () => {
    const num = String(sections.length + 1).padStart(2, "0");
    onChange([...sections, { number: `Section ${num}`, title: "", bullets: [{ label: "", desc: null }] }]);
  };

  const removeSection = (idx: number) => {
    const next = sections.filter((_, i) => i !== idx);
    // Re-number
    onChange(next.map((s, i) => ({ ...s, number: `Section ${String(i + 1).padStart(2, "0")}` })));
  };

  const updateSection = (idx: number, field: string, value: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const addBullet = (sIdx: number) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], bullets: [...next[sIdx].bullets, { label: "", desc: null }] };
    onChange(next);
  };

  const removeBullet = (sIdx: number, bIdx: number) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], bullets: next[sIdx].bullets.filter((_, i) => i !== bIdx) };
    onChange(next);
  };

  const updateBullet = (sIdx: number, bIdx: number, field: "label" | "desc", value: string) => {
    const next = [...sections];
    const bullets = [...next[sIdx].bullets];
    bullets[bIdx] = { ...bullets[bIdx], [field]: value || null };
    next[sIdx] = { ...next[sIdx], bullets };
    onChange(next);
  };

  const loadFramework = (type: string) => {
    const framework = PROJECT_TYPE_FRAMEWORKS[type];
    if (!framework) return;
    setSelectedFramework(type);
    onChange(framework.map(f => ({ ...f, bullets: [{ label: "", desc: null }] })));
    toast.success(`Loaded ${type} framework`);
  };

  const aiGenerateScope = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-draft-assistant", {
        body: {
          task: "scope_sections",
          context: {
            projectType: selectedFramework || projectType,
            lineItems: lineItems?.map((li: any) => li.description).join(", "),
            existingSections: sections.map(s => s.title).join(", "),
          },
        },
      });
      if (error) throw error;
      if (data?.sections) {
        onChange(data.sections);
        toast.success("AI generated scope sections");
      }
    } catch {
      toast.error("AI scope generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Framework selector */}
      <div className="flex gap-2 flex-wrap items-center">
        <Label className="text-xs font-sans">Project Type Framework:</Label>
        {Object.keys(PROJECT_TYPE_FRAMEWORKS).map(type => (
          <Button
            key={type}
            size="sm"
            variant={selectedFramework === type ? "default" : "outline"}
            className="text-[10px] h-7 capitalize"
            onClick={() => loadFramework(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <Card key={sIdx} className="p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{section.number}</span>
            <Input
              value={section.title}
              onChange={(e) => updateSection(sIdx, "title", e.target.value)}
              className="text-xs flex-1 font-semibold"
              placeholder="Section title..."
            />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeSection(sIdx)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Bullets */}
          <div className="pl-6 space-y-1.5">
            {section.bullets.map((bullet, bIdx) => (
              <div key={bIdx} className="flex gap-1.5 items-start">
                <Input
                  value={bullet.label}
                  onChange={(e) => updateBullet(sIdx, bIdx, "label", e.target.value)}
                  className="text-xs w-[40%] font-medium"
                  placeholder="Bold label"
                />
                <Input
                  value={bullet.desc || ""}
                  onChange={(e) => updateBullet(sIdx, bIdx, "desc", e.target.value)}
                  className="text-xs flex-1"
                  placeholder="Description after colon (optional)"
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeBullet(sIdx, bIdx)}>
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => addBullet(sIdx)}>
              <Plus className="w-2.5 h-2.5" /> Add Bullet
            </Button>
          </div>
        </Card>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addSection}>
          <Plus className="w-3 h-3" /> Add Section
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={aiGenerateScope} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Generate Scope
        </Button>
      </div>
    </div>
  );
};

export default ScopeSectionBuilder;
