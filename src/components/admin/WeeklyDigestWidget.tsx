import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Newspaper, RefreshCw, DollarSign, MessageSquare, CheckCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface WeeklyDigestStats {
  totalPaid: number;
  totalOverdue: number;
  unreadMessages: number;
  completedTasks: number;
  totalTasks: number;
  publishedReports: number;
  totalActivities: number;
}

const WeeklyDigestWidget = () => {
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [stats, setStats] = useState<WeeklyDigestStats | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generateDigest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-weekly-digest");
      if (error) throw error;
      setDigest(data.digest);
      setStats(data.stats);
      setExpanded(true);
    } catch (err) {
      console.error("Weekly digest error:", err);
      toast.error("Failed to generate weekly digest");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Weekly AI Digest</h3>
          <Badge className="bg-accent/20 text-accent-foreground text-[10px] font-mono border-none">AI</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-sans gap-1"
          onClick={generateDigest}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {digest ? "Refresh" : "Generate"}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
            <p className="text-sm font-sans font-bold text-foreground">{fmt(stats.totalPaid)}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Collected</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-destructive" />
            <p className="text-sm font-sans font-bold text-foreground">{fmt(stats.totalOverdue)}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center">
            <MessageSquare className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
            <p className="text-sm font-sans font-bold text-foreground">{stats.unreadMessages}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Unread</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
            <p className="text-sm font-sans font-bold text-foreground">{stats.completedTasks}/{stats.totalTasks}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Tasks</p>
          </div>
        </div>
      )}

      {loading && !digest && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm font-sans text-muted-foreground">Analyzing your week...</span>
        </div>
      )}

      {digest && expanded && (
        <div className="prose prose-sm max-w-none dark:prose-invert font-sans border-t border-border pt-4 max-h-80 overflow-y-auto">
          <ReactMarkdown>{digest}</ReactMarkdown>
        </div>
      )}

      {digest && !expanded && (
        <Button variant="ghost" size="sm" className="text-xs font-sans w-full" onClick={() => setExpanded(true)}>
          Show Full Digest
        </Button>
      )}
    </Card>
  );
};

export default WeeklyDigestWidget;
