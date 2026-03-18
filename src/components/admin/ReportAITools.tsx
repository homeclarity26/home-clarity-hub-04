import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Image, DollarSign, FileSearch, ShieldCheck, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportAIToolsProps {
  reportId: string;
  propertyId: string;
  propertyContext: {
    propertyAddress?: string;
    yearBuilt?: number | null;
    sqft?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    propertyType?: string | null;
  };
}

const ReportAITools = ({ reportId, propertyId, propertyContext }: ReportAIToolsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});

  const runTool = async (toolName: string, body: Record<string, unknown>) => {
    setLoading(toolName);
    try {
      const { data, error } = await supabase.functions.invoke(toolName, { body });
      if (error) throw error;
      setResults((prev) => ({ ...prev, [toolName]: data }));
      toast.success(`${toolName.replace(/-/g, " ")} completed`);
    } catch (err) {
      console.error(`${toolName} error:`, err);
      toast.error(`Failed to run ${toolName.replace(/-/g, " ")}`);
    } finally {
      setLoading(null);
    }
  };

  const tools = [
    {
      id: "pre-inspection-brief",
      label: "Pre-Inspection Brief",
      icon: FileSearch,
      description: "AI generates focus areas based on property data before inspection",
      action: () => runTool("pre-inspection-brief", {
        address: propertyContext.propertyAddress,
        yearBuilt: propertyContext.yearBuilt,
        sqft: propertyContext.sqft,
        propertyType: propertyContext.propertyType,
      }),
    },
    {
      id: "consistency-check",
      label: "Consistency Check",
      icon: ShieldCheck,
      description: "Scan all pages for contradictions, missing data, and inconsistencies",
      action: () => runTool("consistency-check", { reportId }),
    },
    {
      id: "generate-exec-summary",
      label: "Executive Summary",
      icon: FileText,
      description: "Auto-generate a one-page executive summary from all report pages",
      action: () => runTool("generate-exec-summary", { reportId }),
    },
    {
      id: "estimate-costs",
      label: "Cost Estimator",
      icon: DollarSign,
      description: "Get tiered cost estimates for all recommended repairs",
      action: () => runTool("estimate-costs", {
        reportId,
        region: propertyContext.propertyAddress,
        sqft: propertyContext.sqft,
      }),
    },
  ];

  return (
    <Card className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-accent/20 text-accent-foreground text-[10px] font-mono border-none">AI</Badge>
          <h4 className="text-sm font-sans font-semibold text-foreground">Report AI Tools</h4>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isRunning = loading === tool.id;
            const result = results[tool.id];

            return (
              <div key={tool.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="text-xs font-sans font-semibold text-foreground">{tool.label}</span>
                </div>
                <p className="text-[11px] font-sans text-muted-foreground">{tool.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-sans w-full gap-1.5"
                  onClick={tool.action}
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                  {isRunning ? "Running…" : "Run"}
                </Button>
                {result && (
                  <div className="mt-2 text-[11px] font-sans text-foreground bg-muted/50 rounded p-2 max-h-40 overflow-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ReportAITools;
