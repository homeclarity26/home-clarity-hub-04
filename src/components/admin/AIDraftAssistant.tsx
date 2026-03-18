import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AIDraftAssistantProps {
  propertyId: string;
  propertyContext?: Record<string, any>;
  onInsert?: (text: string, section: string) => void;
}

const SECTIONS = ["Exterior", "Interior — Kitchen", "Interior — Bathrooms", "Interior — Living Spaces", "Systems — HVAC", "Systems — Electrical", "Systems — Plumbing", "Strategic Plan", "Executive Summary"];

const AIDraftAssistant = ({ propertyId, propertyContext, onInsert }: AIDraftAssistantProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [section, setSection] = useState(SECTIONS[0]);
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    if (!notes.trim()) { toast.error("Enter some field notes first"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-draft-assistant", {
        body: { notes, sectionType: section, propertyContext },
      });
      if (error) throw error;
      setGeneratedText(data.generatedText || "");

      // Save to history
      await (supabase.from("ai_draft_history") as any).insert({
        client_id: propertyId,
        section_type: section,
        input_notes: notes,
        generated_text: data.generatedText || "",
        admin_id: user?.id,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft");
    }
    setIsGenerating(false);
  };

  const handleInsert = () => {
    if (generatedText && onInsert) {
      onInsert(generatedText, section);
      toast.success(`Inserted into ${section}`);
    }
  };

  return (
    <Card className="p-5 border-l-[3px] border-l-accent">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">AI Draft Assistant</h3>
      </div>

      <div className="space-y-3">
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

        <Textarea placeholder="Paste your field notes here (e.g., 'roof is 14 years old, two missing shingles on south face, flashing looks ok, gutters clogged')" value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[100px] text-sm" />

        <Button onClick={generate} disabled={isGenerating || !notes.trim()} className="gap-1.5 w-full">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Draft
        </Button>

        {generatedText && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Generated Draft</p>
              <Textarea value={generatedText} onChange={e => setGeneratedText(e.target.value)} className="min-h-[80px] text-sm bg-card" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedText); toast.success("Copied"); }} className="gap-1">
                <Copy className="w-3.5 h-3.5" />Copy
              </Button>
              {onInsert && (
                <Button size="sm" onClick={handleInsert} className="gap-1">
                  <ArrowDown className="w-3.5 h-3.5" />Insert into Report Section
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIDraftAssistant;
