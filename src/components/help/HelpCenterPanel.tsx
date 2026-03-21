import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GettingStartedTab from "./GettingStartedTab";
import HowToGuidesTab from "./HowToGuidesTab";
import FAQTab from "./FAQTab";
import TutorialSearch from "./TutorialSearch";
import { allClientTutorials } from "@/data/tutorials/client";
import { clientFAQ } from "@/data/tutorials/client/faq";
import type { Tutorial, FAQItem } from "@/data/tutorials/types";

interface HelpCenterPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const HelpCenterPanel = ({ open, onClose, onNavigate }: HelpCenterPanelProps) => {
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>(allClientTutorials);
  const [filteredFAQ, setFilteredFAQ] = useState<FAQItem[]>(clientFAQ);
  const [isSearching, setIsSearching] = useState(false);

  const handleResults = (tutorials: Tutorial[], faq: FAQItem[]) => {
    setFilteredTutorials(tutorials);
    setFilteredFAQ(faq);
    setIsSearching(tutorials.length !== allClientTutorials.length || faq.length !== clientFAQ.length);
  };

  const handleNavigate = (tab: string) => {
    onClose();
    onNavigate(tab);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[420px] max-w-full p-0 bg-background border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-bold text-accent tracking-widest uppercase">HBC</span>
            <h2 className="font-display text-lg text-foreground">Help Center</h2>
          </div>
          <button onClick={onClose} className="p-1 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <TutorialSearch
            tutorials={allClientTutorials}
            faqItems={clientFAQ}
            onResults={handleResults}
            placeholder="Search help articles..."
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="started" className="flex flex-col h-full">
            <TabsList className="mx-5 mt-3 mb-0">
              <TabsTrigger value="started" className="text-xs font-sans">Getting Started</TabsTrigger>
              <TabsTrigger value="guides" className="text-xs font-sans">How-To Guides</TabsTrigger>
              <TabsTrigger value="faq" className="text-xs font-sans">FAQ</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-5">
              <TabsContent value="started" className="mt-0">
                <GettingStartedTab onNavigate={handleNavigate} />
              </TabsContent>
              <TabsContent value="guides" className="mt-0">
                <HowToGuidesTab tutorials={filteredTutorials} isSearching={isSearching} />
              </TabsContent>
              <TabsContent value="faq" className="mt-0">
                <FAQTab faqItems={filteredFAQ} isSearching={isSearching} onNavigate={handleNavigate} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpCenterPanel;
