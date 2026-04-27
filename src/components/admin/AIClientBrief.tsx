import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Briefcase, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AIClientBriefProps {
  propertyId: string;
  propertyName: string;
}

const AIClientBrief = ({ propertyId, propertyName }: AIClientBriefProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);

  const generateBrief = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meeting-prep", {
        body: { propertyId },
      });
      if (error) throw error;
      setBrief(data.brief);
    } catch (err) {
      console.error("Meeting prep error:", err);
      toast.error("Failed to generate meeting brief");
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = () => {
    if (brief) {
      navigator.clipboard.writeText(brief);
      toast.success("Brief copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={() => { if (!brief) generateBrief(); }}>
          <Briefcase className="w-3.5 h-3.5" />Meeting Prep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Meeting Prep: {propertyName}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm font-sans text-muted-foreground">Generating brief...</span>
          </div>
        ) : brief ? (
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans" onClick={copyBrief}>
                <Copy className="w-3 h-3" />Copy
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans" onClick={generateBrief}>
                <RefreshCw className="w-3 h-3" />Regenerate
              </Button>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert font-sans">
              <ReactMarkdown>{brief}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-sans text-muted-foreground">Click to generate a meeting preparation brief.</p>
            <Button className="mt-4 font-sans" onClick={generateBrief}>Generate Brief</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIClientBrief;
