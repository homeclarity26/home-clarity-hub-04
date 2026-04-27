import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type {
  CapitalPlanContent,
  CapitalPlanItem,
  CapitalPlanPhase,
} from "../types";

// HCR brand anchors. Inline hex (rather than tailwind tokens) keeps the
// color signature locked across themes — same convention as the other
// recently-merged blocks (RoomRecordBlock / SystemRecordBlock).
const NAVY = "#0A1628";
const GOLD = "#B87333";
const CREAM_LIGHT = "#F5F2EE";
const BORDER_SOFT = "#E5DFD5";

// Phase palette per [v1.16] — Defense / Offense / Expansion. Hex chosen
// to harmonize with the 5-color condition palette so cards on the same
// page look like one system.
const PHASE_COLORS: Record<CapitalPlanPhase, string> = {
  defense: "#5A8A4F",   // green — protect what's there
  offense: "#B87333",   // gold — upgrade
  expansion: "#7E5BB0", // muted purple — add footprint
};

const PHASE_LABELS: Record<CapitalPlanPhase, string> = {
  defense: "Defense",
  offense: "Offense",
  expansion: "Expansion",
};

const PHASES: CapitalPlanPhase[] = ["defense", "offense", "expansion"];

const HORIZON_YEARS = 10;

// Money helpers — show ranges as "$10k - $14k" for readability. Single
// values render as "$10k". The desktop chips and bottom row both use
// these so totals stay visually compatible with single-cost items.
const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
};
const fmtRange = (low?: number, high?: number) => {
  if (low == null && high == null) return "Cost TBD";
  if (low != null && high != null && low !== high) return `${fmtCompact(low)} - ${fmtCompact(high)}`;
  const v = high ?? low ?? 0;
  return fmtCompact(v);
};
// Average for the cash-flow row — when only one of low/high is set, use that.
const avgCost = (i: CapitalPlanItem) => {
  if (i.costLow != null && i.costHigh != null) return (i.costLow + i.costHigh) / 2;
  return i.costHigh ?? i.costLow ?? 0;
};

interface CapitalPlanBlockProps {
  content: CapitalPlanContent;
  editable?: boolean;
  onChange?: (content: CapitalPlanContent) => void;
  // reportId/propertyId are accepted (forwarded by SharedBlockRenderer for
  // future seeding flows) but not currently used inside the block — the
  // per-item DB id is what we need for the drag-drop persist round-trip.
  reportId?: string;
  propertyId?: string;
}

// ─── Sortable card (used in both Gantt year columns and mobile rows) ────

interface ProjectCardProps {
  item: CapitalPlanItem;
  editable: boolean;
  variant: "gantt" | "mobile";
  onChange: (patch: Partial<CapitalPlanItem>) => void;
  onRemove: () => void;
}

const ProjectCard = ({
  item,
  editable,
  variant,
  onChange,
  onRemove,
}: ProjectCardProps) => {
  const id = item.id ?? `local-${item.projectName}-${item.yearStart}`;
  const sortable = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  } as const;

  const phaseColor = PHASE_COLORS[item.phase];
  const span = Math.max(1, item.yearEnd - item.yearStart + 1);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`relative bg-card border rounded-md ${
        variant === "gantt" ? "p-2" : "p-3 flex items-start gap-3"
      }`}
    >
      {/* Drag handle — 44x44 mobile per Section 6.3.3 */}
      <button
        type="button"
        aria-label={`Drag ${item.projectName}`}
        {...sortable.attributes}
        {...sortable.listeners}
        className={`text-muted-foreground hover:text-foreground touch-none ${
          variant === "mobile" ? "w-11 h-11 flex items-center justify-center -ml-1" : "absolute top-1 right-1 p-1"
        }`}
      >
        <GripVertical size={variant === "mobile" ? 18 : 14} />
      </button>

      {/* Phase stripe (left edge) */}
      <span
        aria-hidden
        style={{
          background: phaseColor,
          width: 3,
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
        }}
      />

      <div className={`flex-1 min-w-0 ${variant === "gantt" ? "pl-2 pr-5" : "pl-2"}`}>
        {editable ? (
          <input
            className="w-full bg-transparent text-sm font-medium text-foreground border-b border-border outline-none focus:border-foreground"
            value={item.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="Project name"
          />
        ) : (
          <div className="text-sm font-medium text-foreground truncate">{item.projectName}</div>
        )}

        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          {editable ? (
            <select
              className="bg-transparent outline-none cursor-pointer"
              value={item.phase}
              onChange={(e) => onChange({ phase: e.target.value as CapitalPlanPhase })}
              style={{ color: phaseColor }}
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>{PHASE_LABELS[p]}</option>
              ))}
            </select>
          ) : (
            <span style={{ color: phaseColor }}>{PHASE_LABELS[item.phase]}</span>
          )}
          {span > 1 && <span>· {span} yrs</span>}
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          {editable ? (
            <span className="inline-flex items-center gap-1">
              <span>$</span>
              <input
                type="number"
                aria-label="Low cost"
                className="w-16 bg-transparent border-b border-border outline-none"
                value={item.costLow ?? ""}
                onChange={(e) => onChange({ costLow: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="low"
              />
              <span>-</span>
              <input
                type="number"
                aria-label="High cost"
                className="w-16 bg-transparent border-b border-border outline-none"
                value={item.costHigh ?? ""}
                onChange={(e) => onChange({ costHigh: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="high"
              />
            </span>
          ) : (
            <span>{fmtRange(item.costLow, item.costHigh)}</span>
          )}
        </div>

        {editable && variant === "gantt" && (
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <label className="flex items-center gap-1">
              <span>End yr</span>
              <input
                type="number"
                aria-label="Year end"
                className="w-14 bg-transparent border-b border-border outline-none text-foreground"
                value={item.yearEnd}
                min={item.yearStart}
                onChange={(e) => {
                  const next = Math.max(item.yearStart, Number(e.target.value) || item.yearStart);
                  onChange({ yearEnd: next });
                }}
              />
            </label>
          </div>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove project"
          className={`text-muted-foreground hover:text-destructive ${
            variant === "mobile" ? "w-11 h-11 flex items-center justify-center" : "absolute bottom-1 right-1 p-1"
          }`}
        >
          <Trash2 size={variant === "mobile" ? 16 : 12} />
        </button>
      )}
    </div>
  );
};

// ─── Persistence helper ─────────────────────────────────────────────────
// Writes year_start / year_end / display_order back to capital_plan_items
// for items that have a real DB id. Non-persisted local items (no id) are
// skipped — they get persisted when the editor saves the whole report
// (the wysiwyg block content roundtrips through the report row).

async function persistDragChange(items: CapitalPlanItem[]) {
  const persisted = items.filter((i) => i.id);
  if (persisted.length === 0) return;

  // Single per-item update; the table is small (one report = ~10-30 rows)
  // so N round-trips is acceptable here. If we ever see this become hot
  // we can switch to an upsert-batch RPC.
  await Promise.all(
    persisted.map((i) =>
      supabase
        .from("capital_plan_items")
        .update({
          year_start: i.yearStart,
          year_end: i.yearEnd,
          display_order: i.displayOrder ?? 0,
        })
        .eq("id", i.id as string)
    )
  );
}

// ─── Main block ─────────────────────────────────────────────────────────

const CapitalPlanBlock = ({ content, editable, onChange }: CapitalPlanBlockProps) => {
  const update = (patch: Partial<CapitalPlanContent>) => onChange?.({ ...content, ...patch });
  const items = content.items ?? [];

  const startYear = content.startYear ?? new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: HORIZON_YEARS }, (_, i) => startYear + i),
    [startYear]
  );

  // Sensors: pointer + keyboard for accessibility. The pointer activation
  // distance keeps single-tap edit clicks from accidentally starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derive the per-year buckets. Sorting-by-displayOrder happens here so
  // the dnd-kit SortableContext gets a stable id list per column.
  const byYear = useMemo(() => {
    const map = new Map<number, CapitalPlanItem[]>();
    for (const y of years) map.set(y, []);
    for (const item of items) {
      const y = item.yearStart;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }
    return map;
  }, [items, years]);

  // Annual totals = avg cost of each item that *crosses* this year, divided
  // across its span (so a $40k 2-year project spreads $20k/yr). Per the spec
  // this row is the only sum on the block — no overall total at the top.
  const annualSpend = useMemo(() => {
    const out: Record<number, number> = {};
    for (const y of years) out[y] = 0;
    for (const item of items) {
      const span = Math.max(1, item.yearEnd - item.yearStart + 1);
      const perYear = avgCost(item) / span;
      for (let y = item.yearStart; y <= item.yearEnd; y++) {
        if (out[y] != null) out[y] += perYear;
      }
    }
    return out;
  }, [items, years]);

  // Phase totals (Defense / Offense / Expansion). Sum of avg cost across
  // full project lifespan — useful for "where is this household leaning."
  const phaseTotals = useMemo(() => {
    const out: Record<CapitalPlanPhase, number> = { defense: 0, offense: 0, expansion: 0 };
    for (const item of items) out[item.phase] += avgCost(item);
    return out;
  }, [items]);

  // ── Drag-end handler ────────────────────────────────────────────────
  // We support two modes:
  //   1. Mobile (vertical list, all years stacked) — drop a card in a new
  //      year section to retarget yearStart / yearEnd.
  //   2. Desktop (per-year columns) — drag across columns retargets year;
  //      drag within a column reorders displayOrder.
  // Both use a single onDragEnd; we infer mode from the over.id format.

  const moveItem = async (
    activeId: string,
    overId: string,
    targetYearOverride?: number,
    targetIndexOverride?: number
  ) => {
    const activeItem = items.find((i) => (i.id ?? `local-${i.projectName}-${i.yearStart}`) === activeId);
    if (!activeItem) return;

    let targetYear = targetYearOverride ?? activeItem.yearStart;
    let targetIndex = targetIndexOverride;

    if (targetYear === undefined) {
      // overId may be either another item id or a column id "year-2027"
      if (overId.startsWith("year-")) {
        targetYear = Number(overId.slice("year-".length));
      } else {
        const overItem = items.find((i) => (i.id ?? `local-${i.projectName}-${i.yearStart}`) === overId);
        if (!overItem) return;
        targetYear = overItem.yearStart;
        const colItems = (byYear.get(overItem.yearStart) ?? []);
        targetIndex = colItems.findIndex(
          (x) => (x.id ?? `local-${x.projectName}-${x.yearStart}`) === overId
        );
      }
    }

    const span = Math.max(1, activeItem.yearEnd - activeItem.yearStart + 1);
    const newYearStart = targetYear;
    const newYearEnd = targetYear + (span - 1);

    // Reassemble: pull the moved item out, then insert into its new column
    // at the target index (or push to the end of that column).
    const without = items.filter((i) => i !== activeItem);
    const updated: CapitalPlanItem = {
      ...activeItem,
      yearStart: newYearStart,
      yearEnd: newYearEnd,
    };
    // Renumber displayOrder for both old and new column.
    const newColExisting = without.filter((i) => i.yearStart === newYearStart);
    const insertAt = targetIndex ?? newColExisting.length;
    newColExisting.splice(insertAt, 0, updated);
    newColExisting.forEach((it, idx) => (it.displayOrder = idx));

    const oldColRemaining = without.filter((i) => i.yearStart === activeItem.yearStart && i.yearStart !== newYearStart);
    oldColRemaining.forEach((it, idx) => (it.displayOrder = idx));

    // Items not in either affected column stay as-is.
    const otherItems = without.filter(
      (i) => i.yearStart !== newYearStart && i.yearStart !== activeItem.yearStart
    );

    const nextItems = [...otherItems, ...newColExisting, ...oldColRemaining.filter((i) => !newColExisting.includes(i))];

    update({ items: nextItems });
    // Fire-and-forget DB persistence; UI doesn't block on it. Errors get
    // surfaced via console (the report editor save flow will catch missed
    // writes on the next full save).
    void persistDragChange(nextItems).catch((err) => {
      console.error("[CapitalPlanBlock] persist failed", err);
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    void moveItem(String(active.id), String(over.id));
  };

  // ── Add / remove helpers ────────────────────────────────────────────

  const addProject = (year: number, phase: CapitalPlanPhase = "defense") => {
    const colItems = byYear.get(year) ?? [];
    const newItem: CapitalPlanItem = {
      projectName: "New project",
      phase,
      yearStart: year,
      yearEnd: year,
      displayOrder: colItems.length,
    };
    update({ items: [...items, newItem] });
  };

  const updateItem = (target: CapitalPlanItem, patch: Partial<CapitalPlanItem>) => {
    update({
      items: items.map((i) => (i === target ? { ...i, ...patch } : i)),
    });
  };

  const removeItem = (target: CapitalPlanItem) => {
    const next = items.filter((i) => i !== target);
    update({ items: next });
    if (target.id) {
      void supabase
        .from("capital_plan_items")
        .delete()
        .eq("id", target.id)
        .then(({ error }) => {
          if (error) console.error("[CapitalPlanBlock] delete failed", error);
        });
    }
  };

  // Row of all sortable ids (for SortableContext when in mobile mode)
  const allIds = items.map((i) => i.id ?? `local-${i.projectName}-${i.yearStart}`);

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      data-block-type="capital_plan"
    >
      {/* Header */}
      <div
        className="px-6 sm:px-8 pt-6 pb-4 border-b"
        style={{ borderColor: BORDER_SOFT }}
      >
        {editable ? (
          <input
            className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none"
            value={content.eyebrow ?? ""}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="Strategic Roadmap"
            style={{ color: GOLD }}
          />
        ) : (
          <div
            className="font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: GOLD }}
          >
            {content.eyebrow ?? "Strategic Roadmap"}
          </div>
        )}
        {editable ? (
          <input
            className="w-full mt-1 bg-transparent font-display text-2xl sm:text-[26px] outline-none"
            style={{ color: NAVY }}
            value={content.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="10-Year Capital Plan"
          />
        ) : (
          <h1
            className="mt-1 font-display text-2xl sm:text-[26px]"
            style={{ color: NAVY }}
          >
            {content.title ?? "10-Year Capital Plan"}
          </h1>
        )}

        {/* Phase totals row — explicit pills, no top-level sum */}
        <div className="mt-4 flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <div
              key={p}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: CREAM_LIGHT, border: `1px solid ${BORDER_SOFT}` }}
            >
              <span
                aria-hidden
                style={{ width: 8, height: 8, borderRadius: 4, background: PHASE_COLORS[p] }}
              />
              <span className="font-mono uppercase tracking-[0.12em] text-[10px]" style={{ color: PHASE_COLORS[p] }}>
                {PHASE_LABELS[p]}
              </span>
              <span className="text-foreground font-medium">{fmtCompact(phaseTotals[p])}</span>
            </div>
          ))}
        </div>

        {editable && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>Anchor year</span>
            <input
              type="number"
              className="w-20 bg-transparent border-b border-border outline-none text-foreground"
              value={startYear}
              onChange={(e) => update({ startYear: Number(e.target.value) || startYear })}
              aria-label="Plan start year"
            />
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Desktop / md+ : horizontal Gantt with year columns */}
        <div className="hidden md:block px-4 sm:px-6 py-6">
          <div
            className="grid gap-3 overflow-x-auto pb-2"
            style={{
              gridTemplateColumns: `repeat(${HORIZON_YEARS}, minmax(140px, 1fr))`,
            }}
          >
            {years.map((year) => {
              const colItems = byYear.get(year) ?? [];
              const colIds = colItems.map(
                (i) => i.id ?? `local-${i.projectName}-${i.yearStart}`
              );
              return (
                <div key={year} className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: GOLD }}
                    >
                      {year}
                    </span>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => addProject(year)}
                        aria-label={`Add project in ${year}`}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  <SortableContext id={`year-${year}`} items={colIds} strategy={rectSortingStrategy}>
                    <div
                      data-year-column={year}
                      id={`year-${year}`}
                      className="min-h-[60px] rounded-md p-1.5 space-y-2"
                      style={{ background: CREAM_LIGHT }}
                    >
                      {colItems.length === 0 && (
                        <div className="text-[10px] text-muted-foreground italic text-center py-3">
                          {editable ? "Drop or add" : ""}
                        </div>
                      )}
                      {colItems.map((item, idx) => (
                        <ProjectCard
                          key={item.id ?? `local-${item.projectName}-${idx}`}
                          item={item}
                          editable={!!editable}
                          variant="gantt"
                          onChange={(patch) => updateItem(item, patch)}
                          onRemove={() => removeItem(item)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          {/* Annual cash flow row — bottom of Gantt, locked grid-aligned */}
          <div
            className="mt-4 pt-3 border-t"
            style={{ borderColor: BORDER_SOFT }}
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Annual cash flow
            </div>
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${HORIZON_YEARS}, minmax(140px, 1fr))`,
              }}
            >
              {years.map((year) => (
                <div key={year} className="text-center">
                  <div className={`text-sm font-medium ${annualSpend[year] > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {annualSpend[year] > 0 ? fmtCompact(annualSpend[year]) : "$0"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile : vertical stacked list, year-grouped */}
        <div className="md:hidden px-4 py-4">
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-5">
              {years.map((year) => {
                const colItems = byYear.get(year) ?? [];
                if (!editable && colItems.length === 0) return null;
                return (
                  <div key={year}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.15em]"
                        style={{ color: GOLD }}
                      >
                        Year {year}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {annualSpend[year] > 0 ? fmtCompact(annualSpend[year]) : "$0"}
                      </span>
                    </div>
                    <div
                      id={`year-${year}`}
                      className="space-y-2 rounded-md p-2"
                      style={{ background: CREAM_LIGHT }}
                    >
                      {colItems.length === 0 && (
                        <div className="text-[11px] text-muted-foreground italic py-2 text-center">
                          {editable ? "Tap + to add a project" : ""}
                        </div>
                      )}
                      {colItems.map((item, idx) => (
                        <ProjectCard
                          key={item.id ?? `local-${item.projectName}-${idx}`}
                          item={item}
                          editable={!!editable}
                          variant="mobile"
                          onChange={(patch) => updateItem(item, patch)}
                          onRemove={() => removeItem(item)}
                        />
                      ))}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => addProject(year)}
                          className="w-full mt-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded py-2 inline-flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Add project to {year}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SortableContext>

          {/* Mobile cash-flow strip — compact roll-up, no top-level sum */}
          <div
            className="mt-5 pt-3 border-t"
            style={{ borderColor: BORDER_SOFT }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Annual cash flow
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {years.map((year) => (
                <div
                  key={year}
                  className="shrink-0 text-center px-2 py-1 rounded"
                  style={{ background: CREAM_LIGHT, minWidth: 64 }}
                >
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    {year}
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {annualSpend[year] > 0 ? fmtCompact(annualSpend[year]) : "$0"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default CapitalPlanBlock;
