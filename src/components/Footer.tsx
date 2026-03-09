import { Home, Search } from "lucide-react";
import { Button } from "./ui/button";
import { useEditMode } from "@/contexts/EditModeContext";
import { useState, useRef } from "react";
import ChatPanel from "./chat/ChatPanel";

interface FooterProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  reportContext?: unknown;
  invoiceBalance?: number;
}

const Footer = ({ activeTab, onNavigate, reportContext, invoiceBalance = 0 }: FooterProps) => {
  const balanceStr = invoiceBalance > 0
    ? `Current balance: $${invoiceBalance.toLocaleString()}`
    : "No outstanding balance";

  const contextualInfo: Record<string, { primary: string; secondary: string }> = {
    home: { primary: "Welcome to the Portal", secondary: "Home Clarity Report in progress" },
    report: { primary: "Home Clarity Report", secondary: "Navigate sections using the header menu" },
    projects: { primary: "Project Management", secondary: "No active projects" },
    payments: { primary: "Financial History", secondary: balanceStr },
    contacts: { primary: "Your Home Team", secondary: "2 HBC contacts • 0 vendors assigned" },
    schedule: { primary: "Schedule & Timeline", secondary: "3 upcoming appointments" },
  };

  const info = contextualInfo[activeTab] || contextualInfo.home;
  const { editMode } = useEditMode();
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value?.trim();
    if (val) {
      setInitialQuery(val);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setInitialQuery(undefined);
    }
    setChatOpen(true);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 h-auto md:h-[100px] bg-card border-t border-border z-50 flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-6 md:py-0 gap-6 md:gap-0">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
            {info.primary}
            {editMode && <span className="ml-2 text-accent">• Edit Mode</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {info.secondary}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full md:mx-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask anything about your home..."
            className="w-full h-12 bg-background border border-border rounded-lg pl-12 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent font-sans"
            onFocus={() => {
              if (!inputRef.current?.value?.trim()) {
                setInitialQuery(undefined);
                setChatOpen(true);
              }
            }}
          />
        </form>

        <div className="flex items-center gap-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-4 font-sans text-sm">
            Contact Adam
          </Button>
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center justify-center text-foreground bg-transparent border-none cursor-pointer"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-10 bg-background flex items-center justify-center font-mono text-[10px] text-muted-foreground z-40 md:relative md:mt-[100px]">
        © 2026 Hometown Builders Club
        <a href="#" className="text-muted-foreground no-underline mx-2">Privacy</a>
        <a href="#" className="text-muted-foreground no-underline mx-2">Terms</a>
      </div>

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        reportContext={reportContext}
        initialQuery={initialQuery}
      />
    </>
  );
};

export default Footer;
