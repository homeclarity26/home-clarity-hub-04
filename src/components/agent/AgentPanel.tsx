import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AgentChat from "./AgentChat";
import type { AgentContextOverride } from "./AgentChat";

export function useAgentContext(): AgentContextOverride {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  let currentEntityType = "";
  let currentEntityId = "";
  let currentEntityName = "";

  if (path.match(/\/admin\/clients\/([^/]+)/)) {
    currentEntityType = "client";
    currentEntityId = path.match(/\/admin\/clients\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/crm\/clients\/([^/]+)/)) {
    currentEntityType = "client";
    currentEntityId = path.match(/\/admin\/crm\/clients\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/projects\/([^/]+)/)) {
    currentEntityType = "project";
    currentEntityId = path.match(/\/admin\/projects\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/crm\/trade-partners\/([^/]+)/)) {
    currentEntityType = "vendor";
    currentEntityId = path.match(/\/admin\/crm\/trade-partners\/([^/]+)/)?.[1] || "";
  } else if (path === "/admin") {
    currentEntityType = "dashboard";
  } else if (path.startsWith("/admin/crm")) {
    currentEntityType = "crm";
  }

  return {
    userId: user?.id || "",
    role: "creator",
    currentPage: path,
    currentEntityType,
    currentEntityId,
    currentEntityName,
  };
}

const AgentPanel = () => {
  const [open, setOpen] = useState(false);
  const agentContext = useAgentContext();
  const location = useLocation();

  // Hide the global FAB when on a client detail page (workspace has its own rail)
  const isClientWorkspace = /\/admin\/clients\/[^/]+/.test(location.pathname);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (isClientWorkspace) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center border-none cursor-pointer"
        aria-label="Open HBC Agent"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[440px] max-w-full p-0 flex flex-col">
          <div className="flex items-center justify-end px-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <AgentChat contextOverride={agentContext} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AgentPanel;
