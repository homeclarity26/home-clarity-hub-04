import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Quick search / command palette" },
  { keys: ["⌘", "N"], description: "New report" },
  { keys: ["⌘", "D"], description: "Go to dashboard" },
  { keys: ["⌘", "C"], description: "Go to clients list" },
  { keys: ["⌘", "?"], description: "Show this shortcuts panel" },
  { keys: ["Esc"], description: "Close dialogs / panels" },
  { keys: ["⌘", "Enter"], description: "Save / submit current form" },
  { keys: ["Tab"], description: "Navigate between fields" },
  { keys: ["↑", "↓"], description: "Navigate lists and menus" },
  { keys: ["⌘", "Shift", "E"], description: "Toggle edit mode (in report)" },
];

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Keyboard shortcuts">
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 mt-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-1 rounded hover:bg-muted/50">
              <span className="text-sm font-sans text-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono font-medium rounded border border-border bg-muted text-muted-foreground">
                      {key}
                    </kbd>
                    {j < s.keys.length - 1 && <span className="text-muted-foreground mx-0.5 text-[10px]">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-sans text-muted-foreground mt-3 text-center">
          Press <kbd className="px-1 py-0.5 text-[10px] rounded border border-border bg-muted">⌘ ?</kbd> anytime to open this panel
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcuts;
