import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Download, Copy, Send, History, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ScopeGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

const SCOPE_SECTIONS = [
  { key: "materials", label: "Materials Specification" },
  { key: "sequence", label: "Sequence of Work" },
  { key: "quality", label: "Quality Standards" },
  { key: "exclusions", label: "Exclusions" },
  { key: "assumptions", label: "Assumptions" },
  { key: "permits", label: "Permit Requirements" },
  { key: "warranty", label: "Warranty Requirements" },
  { key: "payment", label: "Payment Schedule" },
];

const ScopeGeneratorModal = ({ open, onOpenChange, projectId, projectTitle }: ScopeGeneratorModalProps) => {
  const qc = useQueryClient();
  const [detailLevel, setDetailLevel] = useState("standard");
  const [selectedSections, setSelectedSections] = useState(SCOPE_SECTIONS.map((s) => s.key));
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState("");
  const [currentScope, setCurrentScope] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const { data: scopes, refetch: refetchScopes } = useQuery({
    queryKey: ["project-scopes", projectId],
    enabled: open && !!projectId,
    queryFn: async () => {
      const { data } = await supabase.from("project_scopes")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    if (scopes?.length && !currentScope) {
      const current = scopes.find((s: any) => s.is_current) || scopes[0];
      setCurrentScope(current);
      setEditableMarkdown(current.formatted_markdown);
    }
  }, [scopes]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scope", {
        body: {
          project_id: projectId,
          scope_detail_level: detailLevel,
          sections_to_include: selectedSections,
          special_instructions: specialInstructions || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCurrentScope(data.scope);
      setEditableMarkdown(data.markdown);
      setShowPreview(true);
      refetchScopes();
      toast.success(`Scope v${data.scope.version_number} generated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate scope");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentScope) return;
    const { error } = await supabase.from("project_scopes")
      .update({ formatted_markdown: editableMarkdown })
      .eq("id", currentScope.id);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Scope saved");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMarkdown);
    toast.success("Copied to clipboard");
  };

  const handleRestoreVersion = async (scope: any) => {
    await supabase.from("project_scopes")
      .update({ is_current: false })
      .eq("project_id", projectId);
    await supabase.from("project_scopes")
      .update({ is_current: true })
      .eq("id", scope.id);
    setCurrentScope(scope);
    setEditableMarkdown(scope.formatted_markdown);
    setShowHistory(false);
    refetchScopes();
    toast.success(`Restored version ${scope.version_number}`);
  };

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Scope of Work — {projectTitle}
            {currentScope && (
              <Badge variant="secondary" className="text-[10px] font-sans">v{currentScope.version_number}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Generation Controls */}
          {!currentScope && !generating && (
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-sans text-xs">Detail Level</Label>
                  <Select value={detailLevel} onValueChange={setDetailLevel}>
                    <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (1-2 pages)</SelectItem>
                      <SelectItem value="standard">Standard (3-5 pages)</SelectItem>
                      <SelectItem value="detailed">Detailed (5-10 pages)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-sans text-xs">Sections to Include</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {SCOPE_SECTIONS.map((s) => (
                      <label key={s.key} className="flex items-center gap-1.5 text-xs font-sans text-foreground cursor-pointer">
                        <Checkbox checked={selectedSections.includes(s.key)} onCheckedChange={() => toggleSection(s.key)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="font-sans text-xs">Special Instructions (optional)</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any additional context or requirements..."
                  rows={2}
                  className="font-sans text-sm"
                />
              </div>
              <Button onClick={handleGenerate} className="w-full gap-2 font-sans">
                <Sparkles className="w-4 h-4" />Generate Scope of Work
              </Button>
            </Card>
          )}

          {generating && (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm font-sans text-foreground font-medium">Generating Scope of Work...</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">Analyzing project data, report findings, and equipment records</p>
            </Card>
          )}

          {/* Scope Content */}
          {currentScope && !generating && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1 text-xs font-sans">
                  {showPreview ? "Edit" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} className="gap-1 text-xs font-sans">
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1 text-xs font-sans">
                  <Copy className="w-3 h-3" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1 text-xs font-sans">
                  <History className="w-3 h-3" />Versions
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setCurrentScope(null); setEditableMarkdown(""); }}
                  className="gap-1 text-xs font-sans"
                >
                  <Sparkles className="w-3 h-3" />Regenerate
                </Button>
              </div>

              {showHistory && scopes && scopes.length > 1 && (
                <Card className="p-3 space-y-2">
                  <h4 className="text-xs font-sans font-semibold text-foreground">Version History</h4>
                  {scopes.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm font-sans font-medium">v{s.version_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.detail_level}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                        {s.is_current && <Badge className="ml-2 text-[9px]">Current</Badge>}
                      </div>
                      {!s.is_current && (
                        <Button variant="ghost" size="sm" onClick={() => handleRestoreVersion(s)} className="text-xs font-sans">
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              <ScrollArea className="flex-1 min-h-0 border rounded-md">
                {showPreview ? (
                  <div className="p-4 prose prose-sm max-w-none dark:prose-invert font-sans">
                    <ReactMarkdown>{editableMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <Textarea
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="min-h-[400px] border-0 font-mono text-xs resize-none"
                  />
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScopeGeneratorModal;
