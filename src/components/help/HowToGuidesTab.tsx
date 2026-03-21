import { useMemo } from "react";
import TutorialCategory from "./TutorialCategory";
import { clientCategories, allClientTutorials } from "@/data/tutorials/client";
import type { Tutorial } from "@/data/tutorials/types";

interface HowToGuidesTabProps {
  tutorials?: Tutorial[];
  isSearching?: boolean;
}

const HowToGuidesTab = ({ tutorials = allClientTutorials, isSearching = false }: HowToGuidesTabProps) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Tutorial[]>();
    for (const cat of clientCategories) map.set(cat, []);
    for (const t of tutorials) {
      const arr = map.get(t.category);
      if (arr) arr.push(t);
    }
    return map;
  }, [tutorials]);

  if (isSearching && tutorials.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No guides match your search.</p>;
  }

  return (
    <div className="space-y-5">
      {Array.from(grouped.entries()).map(([cat, items]) => (
        <TutorialCategory key={cat} category={cat} tutorials={items} />
      ))}
    </div>
  );
};

export default HowToGuidesTab;
