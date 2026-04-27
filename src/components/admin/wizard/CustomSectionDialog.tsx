import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TocSection, TocSectionKey } from "@/contexts/WizardContext";

// "Add Custom Section" dialog (W2). Custom sections live alongside the
// canonical four and are stored on the wizard envelope. Pages added to
// a custom section get is_custom = true at the page level too.

interface CustomSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (section: TocSection) => void;
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom-section";

export function CustomSectionDialog({
  open,
  onOpenChange,
  onAdd,
}: CustomSectionDialogProps) {
  const [label, setLabel] = useState("");

  const reset = () => setLabel("");

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    // Custom sections store under a synthetic key; we cast to TocSectionKey
    // so downstream union-typed maps still type-check. No new union member
    // is created — the renderer treats unknown keys as pass-through.
    const key = `custom-${slugify(trimmed)}-${Date.now().toString(36)}` as TocSectionKey;
    onAdd({ key, label: trimmed, pages: [] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a custom section</DialogTitle>
          <DialogDescription>
            Use this when the property has a coherent group of pages that does
            not fit Information, Spaces, Systems and Appliances, or Strategy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Section name *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Outdoor Living"
              className="text-xs"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="min-h-[44px]"
          >
            Add section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
