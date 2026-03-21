import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Tutorial, FAQItem } from "@/data/tutorials/types";

interface TutorialSearchProps {
  tutorials: Tutorial[];
  faqItems?: FAQItem[];
  onResults: (tutorials: Tutorial[], faq: FAQItem[]) => void;
  placeholder?: string;
}

const TutorialSearch = ({ tutorials, faqItems = [], onResults, placeholder = "Search tutorials..." }: TutorialSearchProps) => {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      onResults(tutorials, faqItems);
      return;
    }
    const q = value.toLowerCase();
    const filteredTutorials = tutorials.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.steps.some((s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
    );
    const filteredFAQ = faqItems.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.keywords.some((k) => k.includes(q))
    );
    onResults(filteredTutorials, filteredFAQ);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 text-sm font-sans h-9"
      />
    </div>
  );
};

export default TutorialSearch;
