import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, FileText, CheckCircle } from "lucide-react";
import { useAdminClients } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BulkReportGenerator = () => {
  const { data: clients } = useAdminClients();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [results, setResults] = useState<{ name: string; pagesGenerated: number; error?: string }[]>([]);

  const eligibleClients = (clients || []).filter((c) => c.reportId && c.totalPages > 0);

  const toggleClient = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.length === eligibleClients.length ? [] : eligibleClients.map((c) => c.id));
  };

  const handleBulkGenerate = async () => {
    const selected = eligibleClients.filter((c) => selectedIds.includes(c.id));
    if (selected.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setProgress({ current: 0, total: selected.length, currentName: "" });

    for (let i = 0; i < selected.length; i++) {
      const client = selected[i];
      setProgress({ current: i + 1, total: selected.length, currentName: client.propertyName });

      try {
        // Fetch pages for this client's report
        const { data: pages } = await supabase
          .from("report_pages")
          .select("id, page_key, title, condition_rating, specs, narrative")
          .eq("report_id", client.reportId!);

        if (!pages || pages.length === 0) {
          setResults((prev) => [...prev, { name: client.propertyName, pagesGenerated: 0, error: "No pages" }]);
          continue;
        }

        // Filter to pages needing narrative
        const needsDraft = pages.filter((p) => {
          const narr = (p.narrative as unknown as string[] | null) || [];
          return narr.join(" ").split(/\s+/).filter(Boolean).length < 30;
        });

        let generated = 0;
        for (const page of needsDraft) {
          try {
            const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
              body: {
                pageSlug: page.page_key,
                pageName: page.title,
                propertyAddress: client.address,
                yearBuilt: client.yearBuilt,
                sqft: client.sqft,
                propertyType: client.propertyType,
                existingConditionRating: page.condition_rating,
                existingSpecs: page.specs,
              },
            });
            if (!error && data?.narrative?.length) {
              await supabase.from("report_pages").update({ narrative: data.narrative as any }).eq("id", page.id);
              generated++;
            }
          } catch {
            // Skip failed pages
          }
        }
        setResults((prev) => [...prev, { name: client.propertyName, pagesGenerated: generated }]);
      } catch (err) {
        setResults((prev) => [...prev, { name: client.propertyName, pagesGenerated: 0, error: "Failed" }]);
      }
    }

    setIsRunning(false);
    setProgress(null);
    toast.success("Bulk generation complete");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-base font-sans font-semibold text-foreground">Bulk Report Generator</h2>
        </div>
        {!isRunning && selectedIds.length > 0 && (
          <Button onClick={handleBulkGenerate} className="gap-1.5 text-xs font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            Generate for {selectedIds.length} Client{selectedIds.length !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {isRunning && progress && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span className="text-sm font-sans text-foreground">
              Processing {progress.current}/{progress.total}: {progress.currentName}
            </span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Results</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <span className="text-sm font-sans text-foreground">{r.name}</span>
                {r.error ? (
                  <Badge className="bg-destructive/10 text-destructive text-[10px] border-none">{r.error}</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-none gap-1">
                    <CheckCircle className="w-3 h-3" />{r.pagesGenerated} pages drafted
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Client Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-sans text-muted-foreground">
            Select clients with reports to batch-generate AI narratives
          </p>
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs font-sans">
            {selectedIds.length === eligibleClients.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {eligibleClients.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                selectedIds.includes(c.id) ? "bg-primary/5" : "hover:bg-muted/30"
              }`}
            >
              <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleClient(c.id)} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-sans text-foreground">{c.propertyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-sans">{c.completePages}/{c.totalPages} pages</Badge>
                <Badge variant="outline" className="text-[10px] font-sans capitalize">{c.reportStatus}</Badge>
              </div>
            </label>
          ))}
          {eligibleClients.length === 0 && (
            <p className="text-sm font-sans text-muted-foreground text-center py-4">No clients with reports found</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BulkReportGenerator;
