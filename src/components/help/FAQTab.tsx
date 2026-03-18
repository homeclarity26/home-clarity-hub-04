import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqItems = [
  { q: "What is a Home Clarity Report?", a: "A Home Clarity Report is a comprehensive assessment of your home's condition, prepared by your HBC advisor following a physical walkthrough. It evaluates every major system and area of your home — Exterior, Interior, and Systems — and scores each one on a five-point condition scale. It also includes a Strategic Plan outlining what to prioritize over the next 1-5 years and an overall Home Health Score from 0 to 100." },
  { q: "How often will my report be updated?", a: "Your report is updated by your advisor whenever a re-assessment is completed, typically on an annual basis or after major projects are finished. When your advisor publishes an updated report, you'll see the changes reflected in your Home Health Score, condition ratings, and Priority Action Items. You can view previous versions of your report through the Report page." },
  { q: "What does 'Poor' condition mean for my HVAC?", a: "A Poor condition rating means the item is functioning but showing significant wear and will likely need replacement or major service within the next 12 months. For HVAC specifically, this often means the system is aging beyond its efficient lifespan, repair costs are increasing, and budgeting for replacement soon is strongly recommended. Your advisor will have created a project or consideration for this in your Projects section." },
  { q: "How do I download my report as a PDF?", a: "Go to the Report page and click the \"Download PDF\" button in the top right corner. The PDF will include your full Home Clarity Report with all findings, scores, photos, and the Strategic Plan formatted for print or sharing." },
  { q: "Who can see my portal?", a: "Only you and your Home Clarity Hub advisor team can access your portal. Your portal is protected by a secure login. No one else — including other HBC clients — can see your data, documents, or report." },
  { q: "Can I share my portal with my spouse or partner?", a: "At this time, each portal has one login. If you'd like to give a spouse, partner, or co-owner access, contact your advisor via the Messages section and they can set up access for an additional user." },
  { q: "What happens when a project is completed?", a: "When a project is marked complete by your advisor, they will update the related finding in your Home Clarity Report, adjust the condition rating if applicable, and potentially update your Home Health Score. The completed project remains visible in your Projects section for your records." },
  { q: "How does the home value estimate work?", a: "The estimated value shown on your Home page is based on your advisor's assessment of your home's condition combined with local market data for your area. It is an advisory estimate, not a formal appraisal. It is updated by your advisor when your report is revised." },
  { q: "Can I request a new home assessment?", a: "Yes. Send your advisor a message through the Messages section to request a re-assessment or a specific consultation. Your advisor will review your request and follow up to schedule a time." },
  { q: "What is the Home Clarity Hub membership?", a: "Your HBC membership gives you ongoing access to this portal, your Home Clarity Report, all project tracking, document storage, the equipment registry, your maintenance calendar, and direct advisor communication. Membership is billed annually and invoiced through the Payments section." },
  { q: "How do I contact support?", a: "For questions about your home and report, message your advisor directly in the Messages section. For billing or technical support, send a message to the HBC Support Team — their contact info is in your Contacts section." },
];

interface FAQTabProps {
  onNavigate: (tab: string) => void;
}

const FAQTab = ({ onNavigate }: FAQTabProps) => {
  const [search, setSearch] = useState("");

  const filtered = faqItems.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm font-sans h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-sans text-muted-foreground mb-2">No articles match your search.</p>
          <button
            onClick={() => onNavigate("messages")}
            className="text-sm font-sans text-accent hover:text-accent/80 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1 mx-auto"
          >
            Send a message to your advisor in Messages <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-1">
          {filtered.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-sans font-medium text-foreground hover:text-accent py-3 px-1 text-left [&[data-state=open]]:text-accent">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-4">
                <p className="text-xs font-sans text-muted-foreground leading-relaxed">{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FAQTab;
