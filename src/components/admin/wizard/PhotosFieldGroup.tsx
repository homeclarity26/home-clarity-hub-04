import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Plus, X } from "lucide-react";
import { FieldGroup } from "./StructuredPageEditors";
import type {
  IntakeFileRef,
  SystemPhotoSlotKey,
  WizardPhotoSlots,
} from "@/contexts/WizardContext";

// Phase 4 — Step 3 PHOTOS field group (prototype screens 10-11). Shows the
// photos currently assigned to the active page as cream chips (thumbnail
// icon + filename + remove X). System pages additionally render the three
// labeled slots from the prototype: Unit Photo, Serial Plate (gold REQUIRED
// pill), Install Location. "Assign photos" opens a picker over every photo
// uploaded in Step 1 intake; assignments ride the normal authoring autosave.

export const SLOT_LABELS: { key: SystemPhotoSlotKey; label: string }[] = [
  { key: "unit", label: "Unit Photo" },
  { key: "serialPlate", label: "Serial Plate" },
  { key: "installLocation", label: "Install Location" },
];

const NO_SLOT = "none";

interface PhotosFieldGroupProps {
  /** System pages get the labeled slot rows + REQUIRED framing. */
  isSystem: boolean;
  /** Photos assigned to this page (excluding slot assignments). */
  assigned: IntakeFileRef[];
  onChangeAssigned: (next: IntakeFileRef[]) => void;
  /** System photo slots; ignored when isSystem is false. */
  slots: WizardPhotoSlots | undefined;
  onChangeSlots: (next: WizardPhotoSlots) => void;
  /** Every photo uploaded in Step 1 intake (the assignable pool). */
  allPhotos: IntakeFileRef[];
  /** Optional suggestion hook rendered inside the picker (Phase 4 step 3). */
  onSuggest?: (
    current: Record<string, SystemPhotoSlotKey | null>,
  ) => Record<string, SystemPhotoSlotKey | null>;
}

// Cream chip row shared by slot rows and the plain assigned list.
function PhotoChip({
  label,
  filename,
  required,
  highlight,
  onRemove,
}: {
  label?: string;
  filename: string;
  required?: boolean;
  highlight?: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md border bg-hbc-surface px-3 py-2 ${
        highlight ? "border-hbc-gold" : "border-hbc-border"
      }`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-hbc-grey-500/20 text-hbc-grey"
      >
        <ImageIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {label && (
          <div className="text-[10px] font-sans text-hbc-grey">{label}</div>
        )}
        <div className="truncate text-xs font-sans font-semibold text-hbc-navy">
          {filename}
        </div>
      </div>
      {required && (
        <span className="shrink-0 rounded-sm bg-hbc-gold px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
          Required
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="min-h-[36px] min-w-[36px] shrink-0 text-hbc-grey"
        aria-label={`Remove ${filename}`}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

// Empty slot row — same layout, honest empty copy, no fake thumbnail.
function EmptySlotRow({
  label,
  required,
  onAssign,
}: {
  label: string;
  required?: boolean;
  onAssign: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md border border-dashed bg-white px-3 py-2 ${
        required ? "border-hbc-gold" : "border-hbc-border"
      }`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-hbc-surface text-hbc-grey"
      >
        <ImageIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-sans text-hbc-grey">{label}</div>
        <div className="text-xs font-sans italic text-hbc-grey">
          Not yet assigned
        </div>
      </div>
      {required && (
        <span className="shrink-0 rounded-sm bg-hbc-gold px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
          Required
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAssign}
        className="min-h-[36px] shrink-0 text-xs text-hbc-navy"
      >
        Assign
      </Button>
    </div>
  );
}

export function PhotosFieldGroup({
  isSystem,
  assigned,
  onChangeAssigned,
  slots,
  onChangeSlots,
  allPhotos,
  onSuggest,
}: PhotosFieldGroupProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Picker draft: fileId → slot (null = assigned without a slot). Presence
  // in the map means the photo is selected.
  const [draft, setDraft] = useState<
    Record<string, SystemPhotoSlotKey | null>
  >({});

  const effectiveSlots: WizardPhotoSlots = slots ?? {};

  const openPicker = () => {
    const next: Record<string, SystemPhotoSlotKey | null> = {};
    for (const photo of assigned) next[photo.id] = null;
    if (isSystem) {
      for (const { key } of SLOT_LABELS) {
        const ref = effectiveSlots[key];
        if (ref) next[ref.id] = key;
      }
    }
    setDraft(next);
    setPickerOpen(true);
  };

  const toggleSelected = (fileId: string, checked: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (checked) next[fileId] = next[fileId] ?? null;
      else delete next[fileId];
      return next;
    });
  };

  const setDraftSlot = (fileId: string, slot: SystemPhotoSlotKey | null) => {
    setDraft((prev) => {
      const next: Record<string, SystemPhotoSlotKey | null> = {};
      for (const [id, s] of Object.entries(prev)) {
        // A slot holds exactly one photo — claiming it releases the old one
        // back to the plain assigned list.
        next[id] = slot !== null && s === slot && id !== fileId ? null : s;
      }
      next[fileId] = slot;
      return next;
    });
  };

  const commitPicker = () => {
    const nextSlots: WizardPhotoSlots = {};
    const nextAssigned: IntakeFileRef[] = [];
    // Preserve intake upload order for the plain assigned list.
    for (const photo of allPhotos) {
      const slot = draft[photo.id];
      if (slot === undefined) continue;
      if (isSystem && slot !== null) nextSlots[slot] = photo;
      else nextAssigned.push(photo);
    }
    onChangeAssigned(nextAssigned);
    if (isSystem) onChangeSlots(nextSlots);
    setPickerOpen(false);
  };

  const clearSlot = (key: SystemPhotoSlotKey) => {
    const next = { ...effectiveSlots };
    delete next[key];
    onChangeSlots(next);
  };

  const removeAssigned = (fileId: string) => {
    onChangeAssigned(assigned.filter((p) => p.id !== fileId));
  };

  const applySuggestions = () => {
    if (!onSuggest) return;
    setDraft((prev) => onSuggest(prev));
  };

  return (
    <FieldGroup label={isSystem ? "Photos (Required)" : "Photos"}>
      <div className="space-y-2">
        {isSystem &&
          SLOT_LABELS.map(({ key, label }) => {
            const ref = effectiveSlots[key];
            const required = key === "serialPlate";
            return ref ? (
              <PhotoChip
                key={key}
                label={label}
                filename={ref.name}
                required={required}
                highlight={required}
                onRemove={() => clearSlot(key)}
              />
            ) : (
              <EmptySlotRow
                key={key}
                label={label}
                required={required}
                onAssign={openPicker}
              />
            );
          })}

        {assigned.map((photo) => (
          <PhotoChip
            key={photo.id}
            filename={photo.name}
            onRemove={() => removeAssigned(photo.id)}
          />
        ))}

        {!isSystem && assigned.length === 0 && (
          <p className="text-xs font-sans italic text-hbc-grey">
            No photos assigned to this page yet.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openPicker}
          className="min-h-[44px] w-full border-hbc-border text-hbc-navy"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Assign photos
        </Button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-hbc-navy">
              Assign photos to this page
            </DialogTitle>
            <DialogDescription className="text-xs font-sans text-hbc-grey">
              Every photo uploaded in Step 1 intake is listed here. Check the
              ones that belong on this page
              {isSystem ? ", and pick a slot for the key shots." : "."}
            </DialogDescription>
          </DialogHeader>

          {allPhotos.length === 0 ? (
            <p className="text-xs font-sans text-hbc-grey">
              No photos uploaded yet. Add them on Step 1 intake (Photos card)
              and they will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {allPhotos.map((photo) => {
                const isChecked = photo.id in draft;
                const slot = draft[photo.id] ?? null;
                return (
                  <li
                    key={photo.id}
                    className="flex items-center gap-3 rounded-md border border-hbc-border bg-hbc-surface px-3 py-2"
                  >
                    <Checkbox
                      id={`photo-pick-${photo.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        toggleSelected(photo.id, checked === true)
                      }
                      aria-label={`Assign ${photo.name}`}
                    />
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-hbc-grey-500/20 text-hbc-grey"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <label
                      htmlFor={`photo-pick-${photo.id}`}
                      className="min-w-0 flex-1 cursor-pointer truncate text-xs font-sans font-semibold text-hbc-navy"
                    >
                      {photo.name}
                    </label>
                    {isSystem && isChecked && (
                      <Select
                        value={slot ?? NO_SLOT}
                        onValueChange={(value) =>
                          setDraftSlot(
                            photo.id,
                            value === NO_SLOT
                              ? null
                              : (value as SystemPhotoSlotKey),
                          )
                        }
                      >
                        <SelectTrigger
                          className="h-9 w-[150px] shrink-0 bg-white text-xs"
                          aria-label={`Slot for ${photo.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_SLOT}>Gallery</SelectItem>
                          {SLOT_LABELS.map(({ key, label }) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {onSuggest && allPhotos.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={applySuggestions}
                className="min-h-[44px] text-hbc-gold-readable"
              >
                Suggest assignments
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(false)}
                className="min-h-[44px] border-hbc-border bg-white text-hbc-navy"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={commitPicker}
                className="min-h-[44px] bg-hbc-navy text-white hover:bg-[hsl(var(--hbc-navy)/0.92)]"
              >
                Assign
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldGroup>
  );
}
