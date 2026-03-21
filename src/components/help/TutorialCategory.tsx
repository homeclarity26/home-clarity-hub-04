import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Tutorial } from "@/data/tutorials/types";
import TutorialGuide from "./TutorialGuide";

interface TutorialCategoryProps {
  category: string;
  tutorials: Tutorial[];
}

const TutorialCategory = ({ category, tutorials }: TutorialCategoryProps) => {
  if (tutorials.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-1 mb-2">{category}</h3>
      <Accordion type="single" collapsible className="space-y-1">
        {tutorials.map((tutorial) => (
          <AccordionItem key={tutorial.id} value={tutorial.id} className="border-b border-border/50">
            <AccordionTrigger className="text-sm font-sans font-medium text-foreground hover:text-accent py-3 px-1 text-left [&[data-state=open]]:text-accent">
              {tutorial.title}
            </AccordionTrigger>
            <AccordionContent className="px-1 pb-4">
              <TutorialGuide tutorial={tutorial} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default TutorialCategory;
