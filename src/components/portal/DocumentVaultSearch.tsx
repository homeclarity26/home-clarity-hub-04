import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  similarity?: number;
}

interface DocumentVaultSearchProps {
  propertyId: string;
  onAskBobby?: (prefill: string) => void;
}

export function DocumentVaultSearch({ propertyId, onAskBobby }: DocumentVaultSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("retrieve-similar", {
        body: {
          query: query.trim(),
          sources: ["report_pages", "home_knowledge_base"],
          filter: { property_id: propertyId },
          match_count: 8,
        },
      });
      if (error) throw error;

      const merged: SearchResult[] = [];
      const resultSources = data?.results ?? {};
      for (const [source, items] of Object.entries(resultSources)) {
        for (const item of items as Array<{ id: string; title?: string; page_key?: string; content?: string; similarity?: number }>) {
          merged.push({
            id: item.id,
            title: item.title || item.page_key || "Untitled",
            snippet: typeof item.content === "string" ? item.content.slice(0, 160) : "",
            source,
            similarity: item.similarity,
          });
        }
      }
      merged.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
      setResults(merged.slice(0, 10));
    } catch (err) {
      console.warn("[DocumentVaultSearch] semantic search failed", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your home knowledge (semantic)..."
            className="pl-9 font-sans text-sm"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={searching || !query.trim()}
          className="min-h-[44px]"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {searching && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs font-sans text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching knowledge base...
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <p className="text-xs font-sans text-muted-foreground text-center py-4">
          No matching results found.
        </p>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <Card key={r.id} className="p-4 flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-medium text-foreground truncate">
                  {r.title}
                </p>
                {r.snippet && (
                  <p className="text-xs font-sans text-muted-foreground mt-0.5 line-clamp-2">
                    {r.snippet}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {r.source.replace("_", " ")}
                  </span>
                  {r.similarity != null && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {(r.similarity * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
              </div>
              {onAskBobby && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[36px] text-xs shrink-0"
                  onClick={() => onAskBobby(`Tell me about ${r.title}`)}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  Ask Bobby
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
