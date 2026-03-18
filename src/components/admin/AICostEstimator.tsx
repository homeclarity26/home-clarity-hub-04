import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AICostEstimatorProps {
  propertyId: string;
  propertyAddress?: string;
  onSelectEstimate?: (amount: number) => void;
}

const AICostEstimator = ({ propertyId, propertyAddress, onSelectEstimate }: AICostEstimatorProps) => {
  const [projectType, setProjectType] = useState("");
  const [systemAge, setSystemAge] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [condition, setCondition] = useState("Fair");
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimates, setEstimates] = useState<{ conservative: any; recommended: any; premium: any } | null>(null);

  const generate = async () => {
    if (!projectType.trim()) { toast.error("Enter a project type"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("estimate-costs", {
        body: { projectType, systemAge: Number(systemAge) || 0, brandModel, condition, location: propertyAddress },
      });
      if (error) throw error;
      
      // Parse tiers from response
      const tiers = data?.tiers || data?.estimates || {};
      setEstimates({
        conservative: tiers.conservative || tiers.low || { amount: 0, description: "Basic scope" },
        recommended: tiers.recommended || tiers.mid || { amount: 0, description: "Standard scope" },
        premium: tiers.premium || tiers.high || { amount: 0, description: "Premium scope" },
      });

      await (supabase.from("ai_cost_estimates") as any).insert({
        client_id: propertyId,
        project_type: projectType,
        inputs_json: { projectType, systemAge, brandModel, condition, location: propertyAddress },
        estimates_json: tiers,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate estimate");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="p-5 border-l-[3px] border-l-accent">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">AI Cost Estimate</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><Label className="text-xs">Project Type *</Label><Input placeholder="e.g. Furnace Replacement" value={projectType} onChange={e => setProjectType(e.target.value)} className="text-sm" /></div>
        <div><Label className="text-xs">System Age (years)</Label><Input type="number" value={systemAge} onChange={e => setSystemAge(e.target.value)} className="text-sm" /></div>
        <div><Label className="text-xs">Brand/Model</Label><Input value={brandModel} onChange={e => setBrandModel(e.target.value)} className="text-sm" /></div>
        <div><Label className="text-xs">Condition</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Poor">Poor</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Good">Good</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generate} disabled={isGenerating || !projectType.trim()} className="gap-1.5 w-full mb-3">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Generate Estimate
      </Button>

      {estimates && (
        <div className="grid grid-cols-3 gap-2">
          {(["conservative", "recommended", "premium"] as const).map(tier => {
            const data = estimates[tier];
            const amount = typeof data === "object" ? data.amount : data;
            const desc = typeof data === "object" ? data.description : "";
            return (
              <Card key={tier} className={`p-3 text-center cursor-pointer hover:shadow-md transition-shadow ${tier === "recommended" ? "border-accent border-2" : ""}`} onClick={() => onSelectEstimate?.(Number(amount))}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{tier}</p>
                <p className="text-lg font-bold text-foreground">${Number(amount).toLocaleString()}</p>
                {desc && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{desc}</p>}
                {onSelectEstimate && <Button variant="ghost" size="sm" className="text-[10px] mt-1 h-6">Use This</Button>}
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AICostEstimator;
