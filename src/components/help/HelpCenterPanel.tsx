import { useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GettingStartedTab from "./GettingStartedTab";
import HowToGuidesTab from "./HowToGuidesTab";
import FAQTab from "./FAQTab";

interface HelpCenterPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const tabs = ["Getting Started", "How-To Guides", "FAQ"] as const;

const HelpCenterPanel = ({ open, onClose, onNavigate }: HelpCenterPanelProps) => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Getting Started");

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

        {/* Tab bar */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-sans font-medium transition-colors bg-transparent border-none cursor-pointer ${
                activeTab === tab
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "Getting Started" && <GettingStartedTab onNavigate={handleNavigate} />}
          {activeTab === "How-To Guides" && <HowToGuidesTab />}
          {activeTab === "FAQ" && <FAQTab onNavigate={handleNavigate} />}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpCenterPanel;
