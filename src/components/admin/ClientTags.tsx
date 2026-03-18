import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Tag, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ClientTagsProps {
  propertyId: string;
}

const TAG_COLORS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
];

const SUGGESTED_TAGS = ["VIP", "New Client", "Needs Follow-Up", "High Priority", "Annual Member", "Referral", "Multi-Property", "Pre-Purchase"];

const ClientTags = ({ propertyId }: ClientTagsProps) => {
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [showInput, setShowInput] = useState(false);

  // Store tags in property metadata
  const { data: tags = [] } = useQuery({
    queryKey: ["client-tags", propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("metadata")
        .eq("id", propertyId)
        .single();
      return ((data?.metadata as any)?.tags as string[]) || [];
    },
  });

  const saveTags = async (updatedTags: string[]) => {
    const { data: current } = await supabase
      .from("properties")
      .select("metadata")
      .eq("id", propertyId)
      .single();
    
    const metadata = { ...(current?.metadata as Record<string, unknown> || {}), tags: updatedTags };
    const { error } = await supabase
      .from("properties")
      .update({ metadata })
      .eq("id", propertyId);

    if (error) {
      toast.error("Failed to update tags");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["client-tags", propertyId] });
  };

  const addTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    await saveTags([...tags, trimmed]);
    setNewTag("");
    setShowInput(false);
  };

  const removeTag = async (tag: string) => {
    await saveTags(tags.filter((t) => t !== tag));
  };

  const getColorForTag = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  };

  const unusedSuggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
      {tags.map((tag) => (
        <Badge
          key={tag}
          className={`text-[10px] font-sans border-none gap-1 pr-1 ${getColorForTag(tag)}`}
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 bg-transparent border-none cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(newTag); if (e.key === "Escape") setShowInput(false); }}
            placeholder="Tag name..."
            className="h-6 text-xs w-24 font-sans"
            autoFocus
          />
          {unusedSuggestions.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {unusedSuggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="text-[10px] font-sans text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded px-1.5 py-0.5 border-none cursor-pointer transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-0.5 text-[10px] font-sans text-muted-foreground hover:text-foreground bg-transparent border border-dashed border-border rounded px-1.5 py-0.5 cursor-pointer transition-colors"
        >
          <Plus className="w-2.5 h-2.5" />Add
        </button>
      )}
    </div>
  );
};

export default ClientTags;
