import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, TrendingDown, FileCheck, HelpCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface InsuranceData {
  premium_risks: string[];
  premium_reducers: string[];
  documentation_checklist: string[];
  questions_for_insurer: string[];
}

interface InsuranceAssistantProps {
  propertyId: string;
}

const SECTIONS = [
  { key: "premium_risks" as const, title: "Items That May Raise Your Premium", icon: AlertTriangle, iconCls: "text-destructive" },
  { key: "premium_reducers" as const, title: "Upgrades That Could Lower Your Premium", icon: TrendingDown, iconCls: "text-accent" },
  { key: "documentation_checklist" as const, title: "Documentation You Should Have Ready", icon: FileCheck, iconCls: "text-primary" },
  { key: "questions_for_insurer" as const, title: "Questions to Ask Your Insurer", icon: HelpCircle, iconCls: "text-accent" },
];

const InsuranceAssistant = ({ propertyId }: InsuranceAssistantProps) => {
  const [data, setData] = useState<InsuranceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("insurance-assistant", {
        body: { propertyId },
      });
      if (error) throw error;
      setData(result);
      setExpanded(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate insurance review");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-20">
        <button
          onClick={generate}
          disabled={loading}
          className="w-full group bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 border border-border text-left cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Shield className="w-5 h-5 text-accent" />}
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground">Insurance Assistant</h3>
            <p className="font-sans text-sm text-muted-foreground">AI-powered review of your home's insurance profile</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Insurance Assistant</p>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-sans" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerate
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const items = data[section.key] || [];
            return (
              <Card key={section.key} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${section.iconCls}`} />
                  <h3 className="text-sm font-sans font-semibold text-foreground">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span className="font-sans text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsuranceAssistant;
