import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { clientFAQ as defaultFAQ } from "@/data/tutorials/client/faq";
import type { FAQItem } from "@/data/tutorials/types";

interface FAQTabProps {
  faqItems?: FAQItem[];
  isSearching?: boolean;
  onNavigate: (tab: string) => void;
}

const FAQTab = ({ faqItems = defaultFAQ, isSearching = false, onNavigate }: FAQTabProps) => {
  if (isSearching && faqItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm font-sans text-muted-foreground mb-2">No articles match your search.</p>
        <button
          onClick={() => onNavigate("messages")}
          className="text-sm font-sans text-accent hover:text-accent/80 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1 mx-auto"
        >
          Send a message to your advisor in Messages <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-1">
      {faqItems.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-sans font-medium text-foreground hover:text-accent py-3 px-1 text-left [&[data-state=open]]:text-accent">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="px-1 pb-4">
            <p className="text-xs font-sans text-muted-foreground leading-relaxed">{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FAQTab;
