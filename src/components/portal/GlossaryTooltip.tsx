import { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
}

// Global cache so we only fetch once
let termsCache: GlossaryTerm[] | null = null;
let termsCachePromise: Promise<GlossaryTerm[]> | null = null;

const fetchTerms = (): Promise<GlossaryTerm[]> => {
  if (termsCache) return Promise.resolve(termsCache);
  if (termsCachePromise) return termsCachePromise;

  termsCachePromise = (async () => {
    const { data } = await (supabase.from("glossary_terms" as any) as any)
      .select("id, term, definition, category")
      .order("term");
    termsCache = (data || []) as GlossaryTerm[];
    return termsCache;
  })();

  return termsCachePromise;
};

/** Renders text with glossary terms underlined and tooltip definitions */
const GlossaryText = ({ text }: { text: string }) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>(termsCache || []);

  useEffect(() => {
    fetchTerms().then(setTerms);
  }, []);

  if (terms.length === 0 || !text) return <>{text}</>;

  // Build regex from all terms (case insensitive, word boundary)
  const termMap = new Map<string, GlossaryTerm>();
  terms.forEach(t => termMap.set(t.term.toLowerCase(), t));

  const pattern = terms
    .map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length) // longest first
    .join("|");

  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

  const parts: (string | { term: GlossaryTerm; match: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const glossaryTerm = termMap.get(match[0].toLowerCase());
    if (glossaryTerm) {
      parts.push({ term: glossaryTerm, match: match[0] });
    } else {
      parts.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") return <span key={i}>{part}</span>;
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className="underline decoration-dotted decoration-accent/50 underline-offset-2 cursor-help">
                {part.match}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-display text-sm font-semibold mb-1">{part.term.term}</p>
              <p className="font-sans text-xs leading-relaxed">{part.term.definition}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
};

/** Full glossary list view for Help Center */
const GlossaryList = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms().then(t => { setTerms(t); setLoading(false); });
  }, []);

  const filtered = search
    ? terms.filter(t => t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()))
    : terms;

  const categories = Array.from(new Set(filtered.map(t => t.category))).sort();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search terms..."
        className="w-full px-3 py-2 border border-input rounded-md text-sm font-sans bg-background text-foreground placeholder:text-muted-foreground"
      />

      {categories.map(cat => (
        <div key={cat}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-2 capitalize">{cat}</p>
          <div className="space-y-2">
            {filtered.filter(t => t.category === cat).map(term => (
              <div key={term.id} className="bg-card rounded-md p-3 border border-border">
                <p className="font-display text-sm text-foreground mb-1">{term.term}</p>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{term.definition}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export { GlossaryText, GlossaryList, fetchTerms };
export default GlossaryText;
