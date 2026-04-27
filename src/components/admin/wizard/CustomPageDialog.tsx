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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TocSectionKey, TocPage } from "@/contexts/WizardContext";

// "Add Custom Page" dialog (W2). Admin picks the section and gives the
// page a title — we attach a fresh page_key locally and mark it
// is_custom = true. The downstream save path will INSERT into report_pages
// when the wizard transitions to Step 3.

interface CustomPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: { key: TocSectionKey; label: string }[];
  onAdd: (section: TocSectionKey, page: TocPage) => void;
  defaultSection?: TocSectionKey;
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "custom";

export function CustomPageDialog({
  open,
  onOpenChange,
  sections,
  onAdd,
  defaultSection,
}: CustomPageDialogProps) {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<TocSectionKey>(
    defaultSection ?? sections[0]?.key ?? "spaces",
  );

  const reset = () => {
    setTitle("");
    setSection(defaultSection ?? sections[0]?.key ?? "spaces");
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const page: TocPage = {
      page_key: `custom-${slugify(trimmed)}-${Date.now().toString(36)}`,
      title: trimmed,
      group: section,
      selected: true,
      ai_recommended: false,
      is_custom: true,
    };
    onAdd(section, page);
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
          <DialogTitle>Add a custom page</DialogTitle>
          <DialogDescription>
            Pick a section and give the page a title. You can fill in the
            content during Step 3.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Page title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Outdoor kitchen"
              className="text-xs"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Section</Label>
            <Select
              value={section}
              onValueChange={(v) => setSection(v as TocSectionKey)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.key} value={s.key} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={!title.trim()}
            className="min-h-[44px]"
          >
            Add page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
