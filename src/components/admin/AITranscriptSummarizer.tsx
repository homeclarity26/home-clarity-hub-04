import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FileText, AlertTriangle, Target, User, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AITranscriptSummarizerProps {
  propertyId: string;
  onPreFill?: (sections: any[]) => void;
}

const AITranscriptSummarizer = ({ propertyId, onPreFill }: AITranscriptSummarizerProps) => {
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const analyze = async () => {
    if (!transcript.trim()) { toast.error("Enter or paste a transcript"); return; }
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-transcript-summarizer", {
        body: { transcript },
      });
      if (error) throw error;
      setSummary(data.summary || {});

      await supabase.from("ai_transcript_summaries").insert({
        client_id: propertyId,
        transcript_text: transcript,
        summary_json: data.summary || {},
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze transcript");
    }
    setIsAnalyzing(false);
  };

  const URGENCY_COLORS = { high: "destructive", medium: "default", low: "secondary" } as const;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Discovery Call Analyzer</h3>
      </div>

      <Textarea placeholder="Paste a transcript of the discovery call here..." value={transcript} onChange={e => setTranscript(e.target.value)} className="min-h-[120px] text-sm mb-3" />

      <Button onClick={analyze} disabled={isAnalyzing || !transcript.trim()} className="gap-1.5 w-full">
        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Analyze Transcript
      </Button>

      {summary && (
        <div className="mt-4 space-y-4">
          {/* Urgency */}
          {summary.urgency_level && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Urgency:</span>
              <Badge variant={URGENCY_COLORS[summary.urgency_level as keyof typeof URGENCY_COLORS] || "secondary"}>{summary.urgency_level}</Badge>
            </div>
          )}

          {/* Key Findings */}
          {summary.key_findings?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1"><Target className="w-3.5 h-3.5" />Key Findings</h4>
              <ul className="space-y-1">{summary.key_findings.map((f: string, i: number) => <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-accent">{f}</li>)}</ul>
            </div>
          )}

          {/* Red Flags */}
          {summary.red_flags?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-destructive mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Red Flags</h4>
              <ul className="space-y-1">{summary.red_flags.map((f: string, i: number) => <li key={i} className="text-xs text-destructive/80 pl-3 relative before:content-['⚠'] before:absolute before:left-0">{f}</li>)}</ul>
            </div>
          )}

          {/* Client Goals */}
          {summary.client_goals?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1"><Target className="w-3.5 h-3.5 text-accent" />Client Goals</h4>
              <ul className="space-y-1">{summary.client_goals.map((g: string, i: number) => <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['→'] before:absolute before:left-0 before:text-accent">{g}</li>)}</ul>
            </div>
          )}

          {/* Personality Notes */}
          {summary.client_personality_notes && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1"><User className="w-3.5 h-3.5" />Client Notes</h4>
              <p className="text-xs text-muted-foreground italic">{summary.client_personality_notes}</p>
            </div>
          )}

          {/* Pre-fill button */}
          {summary.recommended_report_sections?.length > 0 && onPreFill && (
            <Button variant="outline" size="sm" onClick={() => onPreFill(summary.recommended_report_sections)} className="gap-1 text-xs w-full">
              <FileText className="w-3.5 h-3.5" />Pre-Fill Report Sections ({summary.recommended_report_sections.length})
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default AITranscriptSummarizer;
