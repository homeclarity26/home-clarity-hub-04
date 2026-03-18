import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { toast } from "sonner";

interface QACoachPanelProps {
  page: {
    id: string;
    title: string;
    condition_rating?: string | null;
    narrative?: unknown;
    specs?: unknown;
    tiers?: unknown;
    findings?: unknown;
    key_observations?: unknown;
    images?: unknown;
  };
}

interface Suggestion {
  severity: "error" | "warning" | "info";
  message: string;
  category: string;
}

const severityConfig = {
  error: { icon: AlertCircle, className: "text-destructive bg-destructive/5 border-destructive/20" },
  warning: { icon: AlertTriangle, className: "text-amber-600 bg-amber-50 border-amber-200" },
  info: { icon: Info, className: "text-primary bg-primary/5 border-primary/20" },
};

const QACoachPanel = ({ page }: QACoachPanelProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const runQA = async () => {
    setLoading(true);
    setVisible(true);
    try {
      const { data, error } = await supabase.functions.invoke("qa-coach", {
        body: { page },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
      if (!data?.suggestions?.length) {
        toast.success("Page looks great! No issues found.");
      }
    } catch (err) {
      console.error("QA Coach error:", err);
      toast.error("Failed to run QA check.");
    } finally {
      setLoading(false);
    }
  };

  const errorCount = suggestions.filter((s) => s.severity === "error").length;
  const warningCount = suggestions.filter((s) => s.severity === "warning").length;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={runQA}
        disabled={loading}
        className="gap-1.5 text-xs font-sans"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        QA Check
      </Button>

      {visible && suggestions.length > 0 && (
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-sans font-semibold text-foreground">QA Coach</h4>
              {errorCount > 0 && (
                <span className="text-[10px] font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setVisible(false)} className="h-6 w-6 p-0">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const config = severityConfig[s.severity];
              const Icon = config.icon;
              return (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-md border ${config.className}`}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-sans">{s.message}</p>
                    <span className="text-[10px] font-mono opacity-60">{s.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QACoachPanel;
