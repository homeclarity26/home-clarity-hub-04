import { Search, MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import ChatPanel from "./chat/ChatPanel";

interface FooterProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  reportContext?: unknown;
  invoiceBalance?: number;
}

const Footer = ({ activeTab, onNavigate, reportContext }: FooterProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>();
  const [fabOpen, setFabOpen] = useState(false);
  const fabInputRef = useRef<HTMLInputElement>(null);
  const fabPanelRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = fabInputRef.current?.value?.trim();
    if (val) {
      setInitialQuery(val);
      if (fabInputRef.current) fabInputRef.current.value = "";
    } else {
      setInitialQuery(undefined);
    }
    setChatOpen(true);
    setFabOpen(false);
  };

  // Close FAB popup when clicking outside
  useEffect(() => {
    if (!fabOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fabPanelRef.current && !fabPanelRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fabOpen]);

  return (
    <>
      {/* ── FAB on all tabs ── */}
      <div ref={fabPanelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Popup panel */}
        {fabOpen && (
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 w-[320px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={fabInputRef}
                type="text"
                placeholder="Ask about your home..."
                className="w-full h-10 bg-background border border-border rounded-lg pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent font-sans"
                autoFocus
              />
            </form>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans text-sm"
              onClick={() => {
                setChatOpen(true);
                setFabOpen(false);
              }}
            >
              Contact Adam
            </Button>
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label={fabOpen ? "Close assistant" : "Open assistant"}
        >
          {fabOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </button>
      </div>

      {/* Copyright bar */}
      <div className="relative mt-8 bg-background flex items-center justify-center font-mono text-[10px] text-muted-foreground py-3">
        © 2026 Home Clarity Hub
        <a href="/privacy" className="text-muted-foreground no-underline mx-2 hover:text-foreground transition-colors">Privacy</a>
        <a href="/terms" className="text-muted-foreground no-underline mx-2 hover:text-foreground transition-colors">Terms</a>
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
