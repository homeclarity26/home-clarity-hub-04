import type { ConditionRating, RoomRecordContent, RoomLinkedVisionProject } from "../types";

// Locked palette for the inline ConditionDot — same source-of-truth as
// ConditionRatingBlock (see that file's RATING_COLORS comment for why these
// are inline instead of in tailwind.config).
const RATING_COLORS: Record<ConditionRating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

const RATINGS: ConditionRating[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];

// Hardcoded paint catalog per Master Plan B2 ("use a hardcoded fallback list
// of 20 SW colors"). Future ticket will source from a real paint_catalog
// table — when that lands, this list moves there and the dropdown queries
// the table instead of this constant. Kept short on purpose: 20 of the most-
// requested SW interior colors so admin can pick fast on a walkthrough.
const PAINT_CATALOG: string[] = [
  "SW 7029 — Agreeable Gray",
  "SW 7036 — Accessible Beige",
  "SW 7008 — Alabaster",
  "SW 6385 — Dover White",
  "SW 7757 — High Reflective White",
  "SW 7009 — Pearly White",
  "SW 7642 — Pavestone",
  "SW 7016 — Mindful Gray",
  "SW 7048 — Urbane Bronze",
  "SW 6207 — Retreat",
  "SW 6244 — Naval",
  "SW 6258 — Tricorn Black",
  "SW 7005 — Pure White",
  "SW 6204 — Sea Salt",
  "SW 7551 — Greek Villa",
  "SW 6385 — Dover White (trim)",
  "SW 7102 — White Flour",
  "SW 7506 — Loggia",
  "SW 6087 — Trusty Tan",
  "SW 9166 — Drift of Mist",
];

interface RoomRecordBlockProps {
  content: RoomRecordContent;
  editable?: boolean;
  onChange?: (content: RoomRecordContent) => void;
}

// ─── Small helpers (kept inline — block components in this codebase don't
//     extract sub-components by convention; one file = one block) ─────────

interface SpecRowProps {
  label: string;
  value?: string | number;
  emptyHint?: string;  // shown muted when value is blank
}

const SpecRow = ({ label, value, emptyHint = "Not yet documented" }: SpecRowProps) => {
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-sm mt-0.5 ${hasValue ? "text-foreground" : "italic text-muted-foreground"}`}
      >
        {hasValue ? String(value) : emptyHint}
      </div>
    </div>
  );
};

interface FieldEditorProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  paintCatalog?: boolean;  // true = render datalist of SW colors
}

const FieldEditor = ({ label, value, onChange, placeholder, paintCatalog }: FieldEditorProps) => {
  const listId = paintCatalog ? `paint-catalog-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined;
  return (
    <div>
      <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground block">
        {label}
      </label>
      <input
        className="w-full bg-transparent text-sm text-foreground border-b border-border outline-none focus:border-foreground py-0.5"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Not yet documented"}
        list={listId}
      />
      {paintCatalog && (
        <datalist id={listId}>
          {PAINT_CATALOG.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}
    </div>
  );
};

// ─── Main block ──────────────────────────────────────────────────────────

const RoomRecordBlock = ({ content, editable, onChange }: RoomRecordBlockProps) => {
  const update = (patch: Partial<RoomRecordContent>) => onChange?.({ ...content, ...patch });
  const updateVisionProjects = (next: RoomLinkedVisionProject[]) =>
    update({ linkedVisionProjects: next });

  const rating = content.conditionRating ?? "Good";
  const ratingColor = RATING_COLORS[rating];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Hero strip — only when imageUrl is set; matches v2 prototype line 1313 */}
      {content.imageUrl && (
        <div
          className="h-44 sm:h-56 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 50%, rgba(10,22,40,0.4) 100%)",
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border">
        {(content.roomGroup || editable) && (
          editable ? (
            <input
              className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground outline-none"
              value={content.roomGroup ?? ""}
              onChange={(e) => update({ roomGroup: e.target.value })}
              placeholder="Spaces · Group (e.g. Bedrooms & Suites)"
            />
          ) : (
            <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--hbc-gold, #B87333)" }}>
              {content.roomGroup}
            </div>
          )
        )}

        {editable ? (
          <input
            className="w-full mt-1 bg-transparent font-display text-2xl sm:text-[28px] text-foreground outline-none"
            value={content.roomName}
            onChange={(e) => update({ roomName: e.target.value })}
            placeholder="Room name"
          />
        ) : (
          <h1 className="mt-1 font-display text-2xl sm:text-[28px] text-foreground">
            {content.roomName}
          </h1>
        )}

        {/* Meta line: dims · sqft · ceiling · floor */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {editable ? (
            <>
              <input
                className="bg-transparent border-b border-border outline-none"
                value={content.dimensions ?? ""}
                onChange={(e) => update({ dimensions: e.target.value })}
                placeholder="Dimensions (e.g. 14 x 16)"
                size={20}
              />
              <input
                className="bg-transparent border-b border-border outline-none w-24"
                type="number"
                value={content.floorSqft ?? ""}
                onChange={(e) =>
                  update({ floorSqft: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="sqft"
              />
              <input
                className="bg-transparent border-b border-border outline-none"
                value={content.ceiling ?? ""}
                onChange={(e) => update({ ceiling: e.target.value })}
                placeholder="Ceiling (e.g. 10ft)"
                size={14}
              />
              <input
                className="bg-transparent border-b border-border outline-none"
                value={content.floorLabel ?? ""}
                onChange={(e) => update({ floorLabel: e.target.value })}
                placeholder="Floor"
                size={16}
              />
            </>
          ) : (
            <>
              {content.dimensions && <span>{content.dimensions}</span>}
              {content.floorSqft != null && <span>{content.floorSqft} sqft</span>}
              {content.ceiling && <span>{content.ceiling}</span>}
              {content.floorLabel && <span>{content.floorLabel}</span>}
            </>
          )}
        </div>

        {/* Condition rating badge */}
        <div className="mt-3 flex items-center gap-2">
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: ratingColor,
              display: "inline-block",
            }}
          />
          {editable ? (
            <select
              className="bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none cursor-pointer"
              value={rating}
              onChange={(e) =>
                update({ conditionRating: e.target.value as ConditionRating })
              }
              style={{ color: ratingColor }}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.15em]"
              style={{ color: ratingColor }}
            >
              {rating}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 py-6 space-y-6">
        {/* Finishes */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
            Finishes
          </h3>
          {editable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldEditor label="Wall Paint" value={content.wallPaint} onChange={(v) => update({ wallPaint: v })} paintCatalog />
              <FieldEditor label="Trim Paint" value={content.trimPaint} onChange={(v) => update({ trimPaint: v })} paintCatalog />
              <FieldEditor label="Ceiling Paint" value={content.ceilingPaint} onChange={(v) => update({ ceilingPaint: v })} paintCatalog />
              <FieldEditor label="Flooring" value={content.flooring} onChange={(v) => update({ flooring: v })} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SpecRow label="Wall Paint" value={content.wallPaint} />
              <SpecRow label="Trim Paint" value={content.trimPaint} />
              <SpecRow label="Ceiling Paint" value={content.ceilingPaint} />
              <SpecRow label="Flooring" value={content.flooring} />
            </div>
          )}
        </section>

        {/* Power, light, openings */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
            Fixtures, Power & Openings
          </h3>
          {editable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldEditor label="Light Fixtures" value={content.lightFixtures} onChange={(v) => update({ lightFixtures: v })} />
              <FieldEditor label="Outlets" value={content.outlets} onChange={(v) => update({ outlets: v })} />
              <FieldEditor label="Switches" value={content.switches} onChange={(v) => update({ switches: v })} />
              <FieldEditor label="Windows" value={content.windows} onChange={(v) => update({ windows: v })} />
              <FieldEditor label="Doors" value={content.doors} onChange={(v) => update({ doors: v })} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SpecRow label="Light Fixtures" value={content.lightFixtures} />
              <SpecRow label="Outlets" value={content.outlets} />
              <SpecRow label="Switches" value={content.switches} />
              <SpecRow label="Windows" value={content.windows} />
              <SpecRow label="Doors" value={content.doors} />
            </div>
          )}
        </section>

        {/* Observations */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
            Observations
          </h3>
          {editable ? (
            <textarea
              className="w-full bg-transparent text-sm text-foreground border border-border rounded p-3 outline-none focus:border-foreground"
              rows={5}
              value={content.observationsHtml ?? ""}
              onChange={(e) => update({ observationsHtml: e.target.value })}
              placeholder="What did you notice during the walkthrough? Universal expanding container — write as much as the page needs; no truncation, no inner scroll."
            />
          ) : content.observationsHtml ? (
            <div
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: content.observationsHtml }}
            />
          ) : (
            <p className="text-sm italic text-muted-foreground">Not yet documented.</p>
          )}
        </section>

        {/* Linked vision projects */}
        {(editable || (content.linkedVisionProjects && content.linkedVisionProjects.length > 0)) && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
              Linked Vision Projects
            </h3>
            <div className="space-y-2">
              {(content.linkedVisionProjects ?? []).map((vp, i) => (
                <div
                  key={vp.id ?? i}
                  className="rounded-md p-3 border-l-2 flex items-center gap-3"
                  style={{
                    background: "var(--hbc-cream-light, #F5F2EE)",
                    borderLeftColor: "var(--hbc-gold, #B87333)",
                  }}
                >
                  <div className="flex-1">
                    {editable ? (
                      <input
                        className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                        value={vp.title}
                        onChange={(e) => {
                          const next = [...(content.linkedVisionProjects ?? [])];
                          next[i] = { ...vp, title: e.target.value };
                          updateVisionProjects(next);
                        }}
                        placeholder="Vision project title"
                      />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{vp.title}</div>
                    )}
                    {(editable || vp.priority) && (
                      editable ? (
                        <input
                          className="w-full bg-transparent text-xs text-muted-foreground outline-none mt-0.5"
                          value={vp.priority ?? ""}
                          onChange={(e) => {
                            const next = [...(content.linkedVisionProjects ?? [])];
                            next[i] = { ...vp, priority: e.target.value };
                            updateVisionProjects(next);
                          }}
                          placeholder="Priority (e.g. Year 1-2)"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground mt-0.5">{vp.priority}</div>
                      )
                    )}
                  </div>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = (content.linkedVisionProjects ?? []).filter((_, j) => j !== i);
                        updateVisionProjects(next);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                      aria-label="Remove vision project link"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    updateVisionProjects([
                      ...(content.linkedVisionProjects ?? []),
                      { title: "", priority: "" },
                    ])
                  }
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  + Add linked vision project
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RoomRecordBlock;
