import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, Send, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowUpAction {
  urgency: string;
  action: string;
  reason: string;
  draft_message: string;
}

interface FollowUpData {
  engagement_score: number;
  engagement_status: string;
  actions: FollowUpAction[];
}

interface AIFollowUpSuggestionsProps {
  propertyId: string;
  clientName: string;
}

const urgencyColor: Record<string, string> = {
  immediate: "bg-destructive/10 text-destructive",
  this_week: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  next_week: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  this_month: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700",
  cooling: "bg-yellow-500/10 text-yellow-700",
  at_risk: "bg-orange-500/10 text-orange-700",
  dormant: "bg-destructive/10 text-destructive",
};

const AIFollowUpSuggestions = ({ propertyId, clientName }: AIFollowUpSuggestionsProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FollowUpData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-auto-follow-up", {
        body: { propertyId },
      });
      if (error) throw error;
      setData(result.result);
      setExpanded(true);
    } catch (err) {
      console.error("Follow-up suggestions error:", err);
      toast.error("Failed to generate follow-up suggestions");
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (msg: string, idx: number) => {
    navigator.clipboard.writeText(msg);
    setCopiedIdx(idx);
    toast.success("Draft copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card className="p-4">
      <button onClick={() => data ? setExpanded(!expanded) : analyze()} className="flex items-center justify-between w-full text-left bg-transparent border-none cursor-pointer">
        <div className="flex items-center gap-2">
          <Badge className="bg-accent/20 text-accent-foreground text-[10px] font-mono border-none">AI</Badge>
          <h4 className="text-sm font-sans font-semibold text-foreground">Follow-Up Suggestions</h4>
          {data && (
            <Badge className={`text-[10px] border-none ${statusColor[data.engagement_status] || ""}`}>
              {data.engagement_status} · {data.engagement_score}/100
            </Badge>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && data && (
        <div className="mt-4 space-y-3">
          {data.actions.map((action, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border-none ${urgencyColor[action.urgency] || ""}`}>
                    {action.urgency.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-sans font-semibold text-foreground">{action.action}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] font-sans gap-1"
                  onClick={() => copyMessage(action.draft_message, i)}
                >
                  {copiedIdx === i ? <UserCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedIdx === i ? "Copied" : "Copy Draft"}
                </Button>
              </div>
              <p className="text-[11px] font-sans text-muted-foreground">{action.reason}</p>
              <div className="bg-muted/50 rounded p-2 text-[11px] font-sans text-foreground italic">
                "{action.draft_message}"
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AIFollowUpSuggestions;
