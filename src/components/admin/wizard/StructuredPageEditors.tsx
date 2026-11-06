import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  RoomPageContent,
  RoomFinishes,
  RoomFixtures,
  SystemPageContent,
  ReplacementBriefing,
  VisionPageContent,
  Tier,
  TierSet,
} from "@/lib/reportPageSchemas";

// Phase 5b — per-page-type structured editors for Step 3 Authoring
// (prototype screens 8-15). Plain controlled inputs bound to
// `PageAuthoring.structured`; values may hold empty strings mid-edit —
// publish mapping strips those so an untouched field stays
// "Not yet documented". No new dependencies; shadcn primitives only.

export const EVOLVING_PLACEHOLDER = "Not yet documented, client can add later";

// ─── Shared scaffold ───────────────────────────────────────────────────────

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
        {label}
      </div>
      <div className="rounded-lg border border-hbc-border bg-white p-4">
        {children}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-sans text-hbc-grey">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-xs bg-white min-h-[44px]"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-sans text-hbc-grey">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : undefined);
        }}
        placeholder={placeholder}
        className="text-xs bg-white min-h-[44px]"
      />
    </div>
  );
}

function ComputedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-sans text-hbc-grey">{label}</Label>
      <Input
        value={value}
        readOnly
        disabled
        aria-label={`${label} (computed)`}
        className="text-xs bg-hbc-surface text-hbc-grey min-h-[44px]"
      />
    </div>
  );
}

// ─── Tier set editor (Essential / Enhanced / Signature) ───────────────────

export const EMPTY_TIER: Tier = { priceLow: 0, priceHigh: 0, description: "" };

export function emptyTierSet(): TierSet {
  return {
    essential: { ...EMPTY_TIER },
    enhanced: { ...EMPTY_TIER, recommended: true },
    signature: { ...EMPTY_TIER },
  };
}

const TIER_LABELS: { key: keyof TierSet; label: string }[] = [
  { key: "essential", label: "Essential" },
  { key: "enhanced", label: "Enhanced" },
  { key: "signature", label: "Signature" },
];

function TierSetEditor({
  value,
  onChange,
}: {
  value: TierSet | undefined;
  onChange: (next: TierSet) => void;
}) {
  const tiers = value ?? emptyTierSet();
  const patchTier = (key: keyof TierSet, patch: Partial<Tier>) => {
    onChange({ ...tiers, [key]: { ...tiers[key], ...patch } });
  };
  const setRecommended = (key: keyof TierSet) => {
    onChange({
      essential: { ...tiers.essential, recommended: key === "essential" },
      enhanced: { ...tiers.enhanced, recommended: key === "enhanced" },
      signature: { ...tiers.signature, recommended: key === "signature" },
    });
  };
  return (
    <div className="space-y-3">
      {TIER_LABELS.map(({ key, label }) => {
        const tier = tiers[key];
        const recommended = Boolean(tier.recommended);
        return (
          <div
            key={key}
            className={`rounded-lg border p-3 space-y-2.5 ${
              recommended ? "border-hbc-gold" : "border-hbc-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
                {label}
              </span>
              <button
                type="button"
                role="radio"
                aria-checked={recommended}
                aria-label={`Mark ${label} as recommended`}
                onClick={() => setRecommended(key)}
                className={`rounded-sm border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] min-h-[32px] transition-colors ${
                  recommended
                    ? "border-hbc-gold bg-hbc-gold text-white"
                    : "border-hbc-border bg-white text-hbc-grey hover:bg-hbc-surface"
                }`}
              >
                {recommended ? "Recommended" : "Set recommended"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Price low ($)"
                value={tier.priceLow || undefined}
                onChange={(v) => patchTier(key, { priceLow: v ?? 0 })}
                placeholder="0"
              />
              <NumberField
                label="Price high ($)"
                value={tier.priceHigh || undefined}
                onChange={(v) => patchTier(key, { priceHigh: v ?? 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans text-hbc-grey">
                Description
              </Label>
              <Textarea
                value={tier.description}
                onChange={(e) =>
                  patchTier(key, { description: e.target.value })
                }
                rows={2}
                placeholder="What this tier covers, in one or two sentences."
                className="text-xs bg-white"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Room editor (screens 8-9) ─────────────────────────────────────────────

// One selectable vision page from the Step 2 TOC (plus its authored
// priority window, when the vision editor has one).
export interface VisionLinkOption {
  pageKey: string;
  title: string;
  priority?: string;
}

export function RoomStructuredEditor({
  value,
  onChange,
  roomName,
  onRenameRoom,
  visionOptions = [],
}: {
  value: RoomPageContent;
  onChange: (next: RoomPageContent) => void;
  roomName: string;
  onRenameRoom: (next: string) => void;
  /** Vision pages in the TOC, offered by the LINKED VISION PROJECT select. */
  visionOptions?: VisionLinkOption[];
}) {
  const patch = (p: Partial<RoomPageContent>) => onChange({ ...value, ...p });
  const patchFinishes = (p: Partial<RoomFinishes>) =>
    patch({ finishes: { ...(value.finishes ?? {}), ...p } });
  const patchFixtures = (p: Partial<RoomFixtures>) =>
    patch({ fixtures: { ...(value.fixtures ?? {}), ...p } });

  const linkedKey = value.linkedVisionProjects?.[0]?.pageKey ?? "";
  const setLinkedVision = (pageKey: string) => {
    if (!pageKey) {
      patch({ linkedVisionProjects: [] });
      return;
    }
    const option = visionOptions.find((o) => o.pageKey === pageKey);
    if (!option) return;
    patch({
      linkedVisionProjects: [
        {
          pageKey: option.pageKey,
          title: option.title,
          priority: option.priority,
        },
      ],
    });
  };

  return (
    <>
      <FieldGroup label="Room Identity">
        <TextField label="Room Name" value={roomName} onChange={onRenameRoom} />
      </FieldGroup>

      <FieldGroup label="Dimensions & Specs">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Length × Width"
            value={value.dims}
            onChange={(v) => patch({ dims: v })}
            placeholder="18 x 22"
          />
          <NumberField
            label="Floor sqft"
            value={value.floorSqft}
            onChange={(v) => patch({ floorSqft: v })}
            placeholder="396"
          />
          <TextField
            label="Ceiling Height & Type"
            value={value.ceiling}
            onChange={(v) => patch({ ceiling: v })}
            placeholder="10ft"
          />
          <TextField
            label="Floor level"
            value={value.floorLevel}
            onChange={(v) => patch({ floorLevel: v })}
            placeholder="Floor 1"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Finishes (Evolving Fields, Fill Now or Later)">
        <div className="space-y-3">
          <TextField
            label="Wall Paint Color"
            value={value.finishes?.wallPaint}
            onChange={(v) => patchFinishes({ wallPaint: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Trim Paint Color"
            value={value.finishes?.trimPaint}
            onChange={(v) => patchFinishes({ trimPaint: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Ceiling Paint"
            value={value.finishes?.ceilingPaint}
            onChange={(v) => patchFinishes({ ceilingPaint: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Flooring"
            value={value.finishes?.flooring}
            onChange={(v) => patchFinishes({ flooring: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Fixtures & Power">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Light Fixtures"
            value={value.fixtures?.lighting}
            onChange={(v) => patchFixtures({ lighting: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Outlets"
            value={value.fixtures?.outlets}
            onChange={(v) => patchFixtures({ outlets: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Windows"
            value={value.fixtures?.windows}
            onChange={(v) => patchFixtures({ windows: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Doors"
            value={value.fixtures?.doors}
            onChange={(v) => patchFixtures({ doors: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
        </div>
      </FieldGroup>

      {visionOptions.length > 0 && (
        <FieldGroup label="Linked Vision Project">
          <div className="space-y-1.5">
            <Label
              htmlFor="linked-vision-select"
              className="text-xs font-sans text-hbc-grey"
            >
              Vision page this room points to (renders as a callout on the
              client page)
            </Label>
            <select
              id="linked-vision-select"
              value={linkedKey}
              onChange={(e) => setLinkedVision(e.target.value)}
              className="w-full rounded-md border border-hbc-border bg-white px-3 text-xs font-sans text-foreground min-h-[44px]"
            >
              <option value="">No linked vision project</option>
              {visionOptions.map((o) => (
                <option key={o.pageKey} value={o.pageKey}>
                  {o.title}
                  {o.priority ? ` (${o.priority})` : ""}
                </option>
              ))}
            </select>
          </div>
        </FieldGroup>
      )}
    </>
  );
}

// ─── System editor (screens 10-12) ─────────────────────────────────────────

// Derives an "Estimated End-of-Life" window from install year + lifespan,
// e.g. install 2009 + 20 years → "2029-2031" (prototype screen 10 shows a
// two-year planning window, not a cliff date).
export function estimatedEndOfLife(
  installDate: string | undefined,
  lifespanYears: number | undefined,
): string {
  const installYear = installDate
    ? Number.parseInt(installDate.slice(0, 4), 10)
    : Number.NaN;
  if (!Number.isFinite(installYear) || !lifespanYears) return "";
  const eol = installYear + lifespanYears;
  return `${eol}-${eol + 2}`;
}

export function SystemStructuredEditor({
  value,
  onChange,
  conditionControl,
  showBriefing,
  photosGroup,
}: {
  value: SystemPageContent;
  onChange: (next: SystemPageContent) => void;
  /** The shared condition segmented control, rendered inside LIFECYCLE. */
  conditionControl: ReactNode;
  /** Appliances share this editor but skip the replacement briefing. */
  showBriefing: boolean;
  /**
   * Phase 4 — the PHOTOS (REQUIRED) field group, rendered between
   * LIFECYCLE and the replacement briefing per prototype screens 10-11.
   */
  photosGroup?: ReactNode;
}) {
  const patch = (p: Partial<SystemPageContent>) => onChange({ ...value, ...p });
  const patchBriefing = (p: Partial<ReplacementBriefing>) =>
    patch({ replacementBriefing: { ...(value.replacementBriefing ?? {}), ...p } });
  const briefing = value.replacementBriefing ?? {};
  const eol = estimatedEndOfLife(value.installDate, value.lifespanYears);

  return (
    <>
      <FieldGroup label="Identification">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Make"
            value={value.make}
            onChange={(v) => patch({ make: v })}
            placeholder="Lennox"
          />
          <TextField
            label="Model"
            value={value.model}
            onChange={(v) => patch({ model: v })}
            placeholder="SLP99V-090"
          />
          <TextField
            label="Serial Number"
            value={value.serial}
            onChange={(v) => patch({ serial: v })}
            placeholder={EVOLVING_PLACEHOLDER}
          />
          <TextField
            label="Install Date"
            value={value.installDate}
            onChange={(v) => patch({ installDate: v })}
            placeholder="YYYY-MM or YYYY"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Lifecycle">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Typical Lifespan (years)"
              value={value.lifespanYears}
              onChange={(v) => patch({ lifespanYears: v })}
              placeholder="20"
            />
            <ComputedField
              label="Estimated End-of-Life"
              value={eol || "Needs install date + lifespan"}
            />
          </div>
          {conditionControl}
        </div>
      </FieldGroup>

      {photosGroup}

      {showBriefing && (
        <FieldGroup label="Replacement Briefing Package">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Required Capacity"
                value={briefing.capacity}
                onChange={(v) => patchBriefing({ capacity: v })}
                placeholder={EVOLVING_PLACEHOLDER}
              />
              <TextField
                label="Voltage Available"
                value={briefing.voltage}
                onChange={(v) => patchBriefing({ voltage: v })}
                placeholder={EVOLVING_PLACEHOLDER}
              />
              <TextField
                label="Gas Line"
                value={briefing.gasLine}
                onChange={(v) => patchBriefing({ gasLine: v })}
                placeholder={EVOLVING_PLACEHOLDER}
              />
              <TextField
                label="Condensate"
                value={briefing.condensate}
                onChange={(v) => patchBriefing({ condensate: v })}
                placeholder={EVOLVING_PLACEHOLDER}
              />
            </div>
            <TextField
              label="Ductwork Notes"
              value={briefing.ductworkNotes}
              onChange={(v) => patchBriefing({ ductworkNotes: v })}
              placeholder={EVOLVING_PLACEHOLDER}
            />
            <TextField
              label="Access Notes"
              value={briefing.accessNotes}
              onChange={(v) => patchBriefing({ accessNotes: v })}
              placeholder={EVOLVING_PLACEHOLDER}
            />
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
                Replacement Tiers
              </div>
              <TierSetEditor
                value={briefing.tiers}
                onChange={(tiers) => patchBriefing({ tiers })}
              />
            </div>
          </div>
        </FieldGroup>
      )}
    </>
  );
}

// ─── Vision editor (screens 13-14) ─────────────────────────────────────────

// Locked AKR execution-path copy, read-only in the editor per prototype
// screen 13; publish falls back to the vision_project template default.
const EXECUTION_PATH_COPY =
  "When ready, executed through AK Renovations (Adam's in-house remodeling division, transparently disclosed) or by a vetted HBC trade partner of your choice.";

export function VisionStructuredEditor({
  value,
  onChange,
}: {
  value: VisionPageContent;
  onChange: (next: VisionPageContent) => void;
}) {
  const patch = (p: Partial<VisionPageContent>) => onChange({ ...value, ...p });

  return (
    <>
      <FieldGroup label="Why Design Matters First">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans text-hbc-grey">
              Design-first education for the client
            </Label>
            <Textarea
              value={value.whyDesignFirst ?? ""}
              onChange={(e) => patch({ whyDesignFirst: e.target.value })}
              rows={4}
              placeholder="Why this project starts with a design phase, in Adam's voice."
              className="text-xs bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Design phase (weeks)"
              value={value.designPhaseWeeks}
              onChange={(v) => patch({ designPhaseWeeks: v })}
              placeholder="4"
            />
            <NumberField
              label="Design phase cost ($)"
              value={value.designPhaseCost}
              onChange={(v) => patch({ designPhaseCost: v })}
              placeholder="4500"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Investment Ranges">
        <TierSetEditor
          value={value.tiers}
          onChange={(tiers) => patch({ tiers })}
        />
      </FieldGroup>

      <FieldGroup label="Execution Path">
        <p className="text-xs font-sans text-foreground leading-relaxed">
          {EXECUTION_PATH_COPY}
        </p>
        <p className="text-[10px] font-sans text-muted-foreground mt-2">
          Locked disclosure language; rendered on the client page automatically.
        </p>
      </FieldGroup>

      <FieldGroup label="Priority & Category">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Priority window"
            value={value.priorityWindow}
            onChange={(v) => patch({ priorityWindow: v })}
            placeholder="Year 1-2"
          />
          <TextField
            label="Category"
            value={value.category}
            onChange={(v) => patch({ category: v })}
            placeholder="Lifestyle"
          />
        </div>
      </FieldGroup>
    </>
  );
}

// ─── Executive Summary editor (screen 15) ──────────────────────────────────

export function ExecutiveSummaryEditor({
  personalNote,
  onChangeNote,
  topThemes,
  onChangeThemes,
}: {
  personalNote: string;
  onChangeNote: (next: string) => void;
  topThemes: string;
  onChangeThemes: (next: string) => void;
}) {
  return (
    <>
      <FieldGroup label="Welcome">
        <div className="space-y-1.5">
          <Label className="text-xs font-sans text-hbc-grey">
            Personal Note from Adam
          </Label>
          <Textarea
            value={personalNote}
            onChange={(e) => onChangeNote(e.target.value)}
            rows={5}
            placeholder="Thank the family and set up what this report is."
            className="text-xs bg-white"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Top Themes">
        <div className="space-y-1.5">
          <Label className="text-xs font-sans text-hbc-grey">Themes (3-5)</Label>
          <Textarea
            value={topThemes}
            onChange={(e) => onChangeThemes(e.target.value)}
            rows={7}
            placeholder={"One theme per line, e.g.\n1. Your home is in excellent overall condition."}
            className="text-xs bg-white"
          />
        </div>
      </FieldGroup>
    </>
  );
}
