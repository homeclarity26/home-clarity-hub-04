
import { useState } from "react";
import ChatPanel from "./chat/ChatPanel";

interface FooterProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  reportContext?: unknown;
  invoiceBalance?: number;
}

const Footer = ({ activeTab, onNavigate, reportContext }: FooterProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuery] = useState<string | undefined>();

  return (
    <>
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
