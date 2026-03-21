import { useState } from "react";
import { Sparkles, Loader2, FileText, Copy, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIMeetingPrepProps {
  clientId: string;
  clientName: string;
  propertyAddress?: string;
}

interface PrepData {
  agenda: string[];
  talking_points: string[];
  recent_activity: string[];
  open_items: string[];
  suggested_next_steps: string[];
}

const AIMeetingPrep = ({ clientId, clientName, propertyAddress }: AIMeetingPrepProps) => {
  const [prep, setPrep] = useState<PrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meeting-prep", {
        body: { clientId, clientName, propertyAddress },
      });
      if (error) throw error;
      setPrep(data);
    } catch {
      toast.error("Failed to generate meeting prep");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!prep) return;
    const text = [
      `Meeting Prep — ${clientName}`,
      `${propertyAddress || ""}`,
      "",
      "AGENDA",
      ...prep.agenda.map((a) => `• ${a}`),
      "",
      "TALKING POINTS",
      ...prep.talking_points.map((t) => `• ${t}`),
      "",
      "OPEN ITEMS",
      ...prep.open_items.map((o) => `• ${o}`),
      "",
      "SUGGESTED NEXT STEPS",
      ...prep.suggested_next_steps.map((s) => `• ${s}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  if (!prep) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <div>
              <h3 className="text-sm font-sans font-semibold text-foreground">AI Meeting Prep</h3>
              <p className="text-xs font-sans text-muted-foreground">Generate a briefing for your next client meeting</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate
          </Button>
        </div>
      </Card>
    );
  }

  const sections = [
    { title: "Agenda", items: prep.agenda },
    { title: "Talking Points", items: prep.talking_points },
    { title: "Open Items", items: prep.open_items },
    { title: "Suggested Next Steps", items: prep.suggested_next_steps },
  ];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Meeting Prep — {clientName}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans" onClick={copyToClipboard}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs font-sans" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {prep.recent_activity.length > 0 && (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Recent Activity</p>
          {prep.recent_activity.map((a, i) => (
            <p key={i} className="text-xs font-sans text-muted-foreground">• {a}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{section.title}</p>
            <ul className="space-y-1">
              {section.items.map((item, i) => (
                <li key={i} className="text-xs font-sans text-foreground flex items-start gap-1.5">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AIMeetingPrep;
