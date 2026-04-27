import type {
  ConditionRating,
  SystemRecordContent,
  SystemMaintenanceLogEntry,
  SystemRoutineCareItem,
} from "../types";

// Same byte-identical 5-color palette as ConditionRatingBlock and
// RoomRecordBlock — single source of truth for the rating dot.
const RATING_COLORS: Record<ConditionRating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

const RATINGS: ConditionRating[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];

// LifecycleBar urgency banding. Master Spec 5.1.2 enumerates four states:
//   well_within_life | approaching_eol | overdue | critical
// We derive from age/lifespan ratio. The replacement_briefing block (B4)
// uses the same source data so the two displays always agree.
type Urgency = "well_within_life" | "approaching_eol" | "overdue" | "critical";

function deriveUrgency(age: number, lifespan: number): Urgency {
  if (lifespan <= 0) return "well_within_life";
  const pct = age / lifespan;
  if (pct >= 1.0) return "critical";
  if (pct >= 0.85) return "overdue";
  if (pct >= 0.7) return "approaching_eol";
  return "well_within_life";
}

const URGENCY_BAR_GRADIENT: Record<Urgency, string> = {
  well_within_life: "linear-gradient(90deg, #2F6E40 0%, #5A8A4F 100%)",
  approaching_eol: "linear-gradient(90deg, #2F6E40 0%, #B58A1F 100%)",
  overdue: "linear-gradient(90deg, #2F6E40 0%, #B58A1F 60%, #B7410E 100%)",
  critical: "#B7410E",
};

interface SystemRecordBlockProps {
  content: SystemRecordContent;
  editable?: boolean;
  onChange?: (content: SystemRecordContent) => void;
}

// ─── Local helpers (one-file convention per existing blocks) ─────────────

const SpecRow = ({ label, value }: { label: string; value?: string | number }) => {
  const has = value !== undefined && value !== null && value !== "";
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className={`text-sm mt-0.5 ${has ? "text-foreground" : "italic text-muted-foreground"}`}>
        {has ? String(value) : "Not yet documented"}
      </div>
    </div>
  );
};

const FieldEditor = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) => (
  <div>
    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground block">
      {label}
    </label>
    <input
      type={type}
      className="w-full bg-transparent text-sm text-foreground border-b border-border outline-none focus:border-foreground py-0.5"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Not yet documented"}
    />
  </div>
);

interface PhotoSlotProps {
  role: keyof NonNullable<SystemRecordContent["photos"]>;
  label: string;
  url?: string;
  editable: boolean;
  onChange: (url: string) => void;
}

const PhotoSlot = ({ role, label, url, editable, onChange }: PhotoSlotProps) => (
  <div className="aspect-[4/3] bg-muted rounded border border-border overflow-hidden relative">
    {url ? (
      <img
        src={url}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-3 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em]">{label}</span>
        <span className="text-[10px] mt-1 italic">Photo not yet uploaded</span>
      </div>
    )}
    {editable && (
      <input
        type="url"
        className="absolute bottom-0 left-0 right-0 bg-background/90 text-[10px] px-2 py-1 outline-none border-t border-border"
        value={url ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label} URL`}
        aria-label={`${label} URL`}
        // role goes nowhere here — kept in props for future per-role hooks
        data-role={role}
      />
    )}
  </div>
);

// ─── Main block ──────────────────────────────────────────────────────────

const SystemRecordBlock = ({ content, editable, onChange }: SystemRecordBlockProps) => {
  const update = (patch: Partial<SystemRecordContent>) => onChange?.({ ...content, ...patch });
  const updatePhotos = (slot: keyof NonNullable<SystemRecordContent["photos"]>, url: string) =>
    update({ photos: { ...(content.photos ?? {}), [slot]: url || undefined } });

  const rating = content.conditionRating ?? "Good";
  const ratingColor = RATING_COLORS[rating];

  // Lifecycle math
  const installYear = content.installDate
    ? parseInt(content.installDate.slice(0, 4), 10)
    : undefined;
  const currentYear = new Date().getFullYear();
  const age = installYear && !isNaN(installYear) ? currentYear - installYear : undefined;
  const lifespan = content.typicalLifespanYears;
  const eolYear =
    content.expectedEolYear ??
    (installYear && lifespan ? installYear + lifespan : undefined);
  const urgency = age != null && lifespan ? deriveUrgency(age, lifespan) : "well_within_life";
  const urgencyShowsAlert = urgency === "approaching_eol" || urgency === "overdue" || urgency === "critical";
  const lifecycleFillPct =
    age != null && lifespan && lifespan > 0
      ? Math.min((age / lifespan) * 100, 100)
      : 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Hero strip */}
      {content.imageUrl && (
        <div
          className="h-44 sm:h-52 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 60%, rgba(10,22,40,0.5) 100%)",
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--hbc-gold, #B87333)" }}>
          {editable ? (
            <span className="inline-flex gap-2 items-center">
              <input
                className="bg-transparent border-b border-border outline-none w-32"
                value={content.category ?? ""}
                onChange={(e) => update({ category: e.target.value })}
                placeholder="Category"
              />
              <select
                className="bg-transparent outline-none cursor-pointer"
                value={content.isAppliance ? "Appliance" : "System"}
                onChange={(e) => update({ isAppliance: e.target.value === "Appliance" })}
              >
                <option value="System">System</option>
                <option value="Appliance">Appliance</option>
              </select>
            </span>
          ) : (
            <>
              {content.category} {content.isAppliance ? "Appliance" : "System"}
            </>
          )}
        </div>
        {editable ? (
          <input
            className="w-full mt-1 bg-transparent font-display text-2xl sm:text-[26px] text-foreground outline-none"
            value={content.systemName}
            onChange={(e) => update({ systemName: e.target.value })}
            placeholder="System name"
          />
        ) : (
          <h1 className="mt-1 font-display text-2xl sm:text-[26px] text-foreground">
            {content.systemName}
          </h1>
        )}

        {/* Condition + status */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
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
              onChange={(e) => update({ conditionRating: e.target.value as ConditionRating })}
              style={{ color: ratingColor }}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>{r}</option>
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
          {(content.status || editable) && (
            editable ? (
              <input
                className="bg-transparent border-b border-border text-xs text-muted-foreground outline-none"
                value={content.status ?? ""}
                onChange={(e) => update({ status: e.target.value })}
                placeholder="Status (e.g. Operational)"
                size={28}
              />
            ) : (
              <span className="text-xs text-muted-foreground">{content.status}</span>
            )
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 py-6 space-y-6">
        {/* Identification grid */}
        <section>
          {editable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldEditor label="Make" value={content.make} onChange={(v) => update({ make: v })} />
              <FieldEditor label="Model" value={content.model} onChange={(v) => update({ model: v })} />
              <FieldEditor label="Serial Number" value={content.serial} onChange={(v) => update({ serial: v })} />
              <FieldEditor label="Install Date" value={content.installDate} onChange={(v) => update({ installDate: v })} placeholder="YYYY-MM-DD or YYYY" />
              <FieldEditor label="Installer" value={content.installer} onChange={(v) => update({ installer: v })} />
              <FieldEditor label="Warranty Status" value={content.warrantyStatus} onChange={(v) => update({ warrantyStatus: v })} />
              <FieldEditor label="Typical Lifespan (years)" type="number" value={content.typicalLifespanYears ?? ""} onChange={(v) => update({ typicalLifespanYears: v ? Number(v) : undefined })} />
              <FieldEditor label="Expected EOL Year" type="number" value={content.expectedEolYear ?? ""} onChange={(v) => update({ expectedEolYear: v ? Number(v) : undefined })} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SpecRow label="Make" value={content.make} />
              <SpecRow label="Model" value={content.model} />
              <SpecRow label="Serial" value={content.serial} />
              <SpecRow label="Installed" value={content.installDate} />
              <SpecRow label="Installer" value={content.installer} />
              <SpecRow label="Warranty" value={content.warrantyStatus} />
              <SpecRow label="Typical Lifespan" value={lifespan ? `${lifespan} years` : undefined} />
              <SpecRow label="Current Age" value={age != null ? `${age} years` : undefined} />
            </div>
          )}
        </section>

        {/* Lifecycle Timeline */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
            Lifecycle Timeline
          </h3>
          <div
            className="relative h-8 rounded-2xl overflow-hidden"
            style={{ background: "var(--hbc-cream-light, #F5F2EE)" }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${lifecycleFillPct}%`,
                background: URGENCY_BAR_GRADIENT[urgency],
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3.5 text-[11px] font-medium text-foreground">
              <span>{installYear ?? "Install year unknown"}</span>
              <span>{age != null ? `Today · ${age} years` : "Age unknown"}</span>
              <span>{eolYear ? `EOL ~${eolYear}` : "EOL unknown"}</span>
            </div>
          </div>

          {urgencyShowsAlert && (
            <div
              className="mt-4 p-4 rounded-md border-l-2"
              style={{
                background: "#FBF1DD",
                borderLeftColor: "#B58A1F",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: "#B58A1F" }}>
                Proactive Lifecycle Alert
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                This system is {age} years old, with a typical lifespan of {lifespan} years. Now is the right time to start planning replacement on your terms, not on a January night when it fails. Use the Replacement Briefing block to give the trade partner everything they need on the first visit.
              </p>
            </div>
          )}
        </section>

        {/* Specifications (free-form rows) */}
        {(editable || (content.specifications && content.specifications.length > 0)) && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
              Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(content.specifications ?? []).map((spec, i) => (
                editable ? (
                  <div key={i} className="flex gap-2 items-end">
                    <input
                      className="flex-1 bg-transparent text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground border-b border-border outline-none"
                      value={spec.label}
                      onChange={(e) => {
                        const next = [...(content.specifications ?? [])];
                        next[i] = { ...spec, label: e.target.value };
                        update({ specifications: next });
                      }}
                      placeholder="Label"
                    />
                    <input
                      className="flex-[2] bg-transparent text-sm text-foreground border-b border-border outline-none"
                      value={spec.value}
                      onChange={(e) => {
                        const next = [...(content.specifications ?? [])];
                        next[i] = { ...spec, value: e.target.value };
                        update({ specifications: next });
                      }}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => update({ specifications: (content.specifications ?? []).filter((_, j) => j !== i) })}
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                      aria-label="Remove spec"
                    >✕</button>
                  </div>
                ) : (
                  <SpecRow key={i} label={spec.label} value={spec.value} />
                )
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={() => update({ specifications: [...(content.specifications ?? []), { label: "", value: "" }] })}
                  className="text-xs text-muted-foreground hover:text-foreground text-left"
                >+ Add specification</button>
              )}
            </div>
          </section>
        )}

        {/* Photos — always render the four slots; URL fills them when present */}
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
            Photos {editable && <span className="text-muted-foreground normal-case tracking-normal text-[10px]">(paste URLs to fill slots)</span>}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PhotoSlot role="unit" label="Unit" url={content.photos?.unit} editable={!!editable} onChange={(u) => updatePhotos("unit", u)} />
            <PhotoSlot role="serialPlate" label="Serial Plate" url={content.photos?.serialPlate} editable={!!editable} onChange={(u) => updatePhotos("serialPlate", u)} />
            <PhotoSlot role="installLocation" label="Install Location" url={content.photos?.installLocation} editable={!!editable} onChange={(u) => updatePhotos("installLocation", u)} />
            <PhotoSlot role="failureSignal" label="Failure Signal (optional)" url={content.photos?.failureSignal} editable={!!editable} onChange={(u) => updatePhotos("failureSignal", u)} />
          </div>
        </section>

        {/* Routine care items */}
        {(editable || (content.routineCareItems && content.routineCareItems.length > 0)) && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
              Routine Care
            </h3>
            <div className="space-y-2">
              {(content.routineCareItems ?? []).map((item, i) => (
                <div key={i} className="flex gap-3 items-center text-sm">
                  {editable ? (
                    <>
                      <input
                        className="flex-1 bg-transparent border-b border-border outline-none"
                        value={item.description}
                        onChange={(e) => {
                          const next = [...(content.routineCareItems ?? [])];
                          next[i] = { ...item, description: e.target.value };
                          update({ routineCareItems: next });
                        }}
                        placeholder="Care item (e.g. Replace MERV 11 filter)"
                      />
                      <input
                        type="number"
                        className="w-20 bg-transparent border-b border-border outline-none text-xs"
                        value={item.frequencyMonths ?? ""}
                        onChange={(e) => {
                          const next = [...(content.routineCareItems ?? [])];
                          next[i] = { ...item, frequencyMonths: e.target.value ? Number(e.target.value) : undefined };
                          update({ routineCareItems: next });
                        }}
                        placeholder="Months"
                        aria-label="Frequency in months"
                      />
                      <input
                        type="date"
                        className="bg-transparent border-b border-border outline-none text-xs"
                        value={item.lastDoneDate ?? ""}
                        onChange={(e) => {
                          const next = [...(content.routineCareItems ?? [])];
                          next[i] = { ...item, lastDoneDate: e.target.value };
                          update({ routineCareItems: next });
                        }}
                        aria-label="Last done date"
                      />
                      <button
                        type="button"
                        onClick={() => update({ routineCareItems: (content.routineCareItems ?? []).filter((_, j) => j !== i) })}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        aria-label="Remove care item"
                      >✕</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-foreground">{item.description}</span>
                      {item.frequencyMonths && (
                        <span className="text-xs text-muted-foreground">every {item.frequencyMonths} mo</span>
                      )}
                      {item.lastDoneDate && (
                        <span className="text-xs text-muted-foreground">last {item.lastDoneDate}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={() => update({ routineCareItems: [...(content.routineCareItems ?? []), { description: "" } as SystemRoutineCareItem] })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >+ Add care item</button>
              )}
            </div>
          </section>
        )}

        {/* Maintenance log (history) */}
        {(editable || (content.maintenanceLog && content.maintenanceLog.length > 0)) && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--hbc-gold, #B87333)" }}>
              Maintenance Log
            </h3>
            <div className="space-y-2">
              {(content.maintenanceLog ?? []).map((entry, i) => (
                <div key={i} className="flex gap-3 items-center text-sm">
                  {editable ? (
                    <>
                      <input
                        type="date"
                        className="bg-transparent border-b border-border outline-none text-xs w-32"
                        value={entry.date}
                        onChange={(e) => {
                          const next = [...(content.maintenanceLog ?? [])];
                          next[i] = { ...entry, date: e.target.value };
                          update({ maintenanceLog: next });
                        }}
                        aria-label="Service date"
                      />
                      <input
                        className="flex-1 bg-transparent border-b border-border outline-none"
                        value={entry.description}
                        onChange={(e) => {
                          const next = [...(content.maintenanceLog ?? [])];
                          next[i] = { ...entry, description: e.target.value };
                          update({ maintenanceLog: next });
                        }}
                        placeholder="What was done"
                      />
                      <input
                        type="number"
                        className="w-24 bg-transparent border-b border-border outline-none text-xs"
                        value={entry.cost ?? ""}
                        onChange={(e) => {
                          const next = [...(content.maintenanceLog ?? [])];
                          next[i] = { ...entry, cost: e.target.value ? Number(e.target.value) : undefined };
                          update({ maintenanceLog: next });
                        }}
                        placeholder="$"
                        aria-label="Cost"
                      />
                      <button
                        type="button"
                        onClick={() => update({ maintenanceLog: (content.maintenanceLog ?? []).filter((_, j) => j !== i) })}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        aria-label="Remove entry"
                      >✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{entry.date}</span>
                      <span className="flex-1 text-foreground">{entry.description}</span>
                      {entry.cost != null && (
                        <span className="text-xs font-mono text-muted-foreground">${entry.cost.toLocaleString()}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      maintenanceLog: [
                        ...(content.maintenanceLog ?? []),
                        { date: new Date().toISOString().slice(0, 10), description: "" } as SystemMaintenanceLogEntry,
                      ],
                    })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground"
                >+ Log a service event</button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SystemRecordBlock;
