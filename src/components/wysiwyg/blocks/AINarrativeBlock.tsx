import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AINarrativeContent } from "../types";
import { SanitizedHtml } from "@/components/ui/SanitizedHtml";

interface AINarrativeBlockProps {
  content: AINarrativeContent;
  editable?: boolean;
  onChange?: (content: AINarrativeContent) => void;
  propertyAddress?: string;
  pageSlug?: string;
}

const AINarrativeBlock = ({ content, editable, onChange, propertyAddress, pageSlug }: AINarrativeBlockProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNotes, setShowNotes] = useState(!content.html);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4] } }),
      Placeholder.configure({ placeholder: "AI-generated narrative will appear here..." }),
    ],
    content: content.html || "",
    editable: !!editable,
    onUpdate: ({ editor: e }) => {
      onChange?.({ ...content, html: e.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[80px]",
      },
    },
  });

  const handleGenerate = async () => {
    if (!content.fieldNotes?.trim()) {
      toast.error("Enter field notes first");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
        body: {
          pageSlug: pageSlug || "general",
          pageName: pageSlug || "Section",
          propertyAddress: propertyAddress || "",
          existingConditionRating: "",
          existingSpecs: {},
          fieldNotes: content.fieldNotes,
        },
      });
      if (error) throw error;
      const narrative = Array.isArray(data?.narrative) ? data.narrative.join("\n\n") : "";
      const html = narrative.split("\n\n").map((p: string) => `<p>${p}</p>`).join("");
      editor?.commands.setContent(html);
      onChange?.({ ...content, html });
      setShowNotes(false);
      toast.success("Narrative generated");
    } catch {
      toast.error("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!editable) {
    return (
      <SanitizedHtml
        html={content.html || "<p class='text-muted-foreground italic'>No narrative yet</p>"}
        className="prose prose-sm sm:prose-base max-w-none text-foreground"
      />
    );
  }

  return (
    <div className="space-y-3">
      {showNotes && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-foreground">
              AI Draft Assistant
            </span>
          </div>
          <textarea
            className="w-full bg-card border border-border rounded p-3 text-sm text-foreground outline-none resize-none min-h-[80px] focus:border-accent"
            value={content.fieldNotes || ""}
            onChange={(e) => onChange?.({ ...content, fieldNotes: e.target.value })}
            placeholder="Paste your field notes here..."
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate Narrative"}
          </button>
        </div>
      )}
      {!showNotes && editable && (
        <button
          onClick={() => setShowNotes(true)}
          className="flex items-center gap-1 text-xs text-accent hover:underline font-mono"
        >
          <Sparkles className="h-3 w-3" /> Show AI Notes Panel
        </button>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default AINarrativeBlock;
