import { useState } from "react";
import type {
  RecurringServicesRegisterContent,
  RecurringServiceRow,
  ConciergeTier,
} from "../types";

// HCR palette anchors used inline (tailwind tokens are HSL-based; these
// exact hex values are the v2-locked brand signature).
const NAVY = "#0A1628";
const GOLD = "#B87333";
const RUST = "#B7410E";
const CREAM_LIGHT = "#F5F2EE";
const WARN_BG = "#FBF1DD";

// HBC tier monthly $ add-on per Master Spec 5.5 / Caldwell mock report.
// HONEST framing: these are time/frustration savings, NOT money savings.
const TIER_MONTHLY: Record<ConciergeTier, number> = {
  none: 0,
  tier_200: 200,
  tier_400: 400,
  tier_600: 600,
};

const TIER_LABEL: Record<ConciergeTier, string> = {
  none: "Not on a plan",
  tier_200: "$200/mo plan",
  tier_400: "$400/mo plan",
  tier_600: "$600/mo plan",
};

// Category enum from M3 schema. Display label is title-cased + spaces.
const CATEGORY_LABELS: Record<string, string> = {
  lawn_landscaping: "Lawn & Landscaping",
  pest_control: "Pest Control",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roof_gutters: "Roof & Gutters",
  pool_spa: "Pool & Spa",
  cleaning: "Cleaning",
  security: "Security",
  pool_chemicals: "Pool Chemicals",
  tree_care: "Tree Care",
  snow_removal: "Snow Removal",
  septic: "Septic",
  well_water: "Well Water",
  other: "Other",
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Biannual",
  annual: "Annual",
  as_needed: "As needed",
};

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

interface RecurringServicesRegisterBlockProps {
  content: RecurringServicesRegisterContent;
  editable?: boolean;
  onChange?: (content: RecurringServicesRegisterContent) => void;
}

const RecurringServicesRegisterBlock = ({
  content,
  editable,
  onChange,
}: RecurringServicesRegisterBlockProps) => {
  const update = (patch: Partial<RecurringServicesRegisterContent>) =>
    onChange?.({ ...content, ...patch });

  const services = content.services ?? [];
  const tier: ConciergeTier = content.conciergeTier ?? "none";
  const tierMonthly = TIER_MONTHLY[tier];
  const showIfManaged = content.showIfManagedColumn ?? true;

  // Group by category for collapsible sections
  const grouped = services.reduce<Record<string, RecurringServiceRow[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  // All-categories expand state — defaults to expanded for non-empty categories
  const initialExpanded = Object.fromEntries(
    Object.keys(grouped).map((cat) => [cat, true])
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);
  const toggleCat = (cat: string) =>
    setExpanded((p) => ({ ...p, [cat]: !p[cat] }));

  // Totals
  const totalMonthly = services.reduce((s, x) => s + (x.monthlyCost ?? 0), 0);
  const totalAnnual = totalMonthly * 12;
  const totalIfManaged = totalMonthly + tierMonthly;
  const overdueCount = services.filter((s) => s.status === "overdue").length;

  // Distinct vendor count (for the "today" stat sub-line)
  const vendorCount = new Set(
    services.map((s) => s.vendorName?.trim() || "(unnamed)").filter(Boolean)
  ).size;

  // Locked HONEST-framing pitch — saves time/frustration NOT money
  const defaultPitch =
    services.length > 0 && tier !== "none"
      ? `With ${services.length} services, the ${TIER_LABEL[tier]} fits. Today: ${fmtMoney(totalMonthly)}/mo. Add ${fmtMoney(tierMonthly)}/mo Concierge for a total of <strong>${fmtMoney(totalIfManaged)}/mo</strong>. You pay more. You stop doing this: scheduling, chasing receipts, remembering due dates, coordinating between vendors, vetting new providers when one falls through. We do all of it. Your AI Concierge handles the routine questions automatically. You stay in one app, one phone number, one bill. The math does not save money. It saves time and frustration. That is the trade.`
      : `Once your services are captured, HBC Concierge can take over the scheduling, the calling, the receipt-chasing, and the vendor coordination. You stay in one app with one bill. The trade is honest: you pay more, you spend less time managing it.`;

  return (
    <div className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          {services.length} {services.length === 1 ? "service" : "services"} captured
          {services.length > 0 && " · doubles as financial budget tool"}
        </div>
        {editable ? (
          <input
            className="w-full mt-1 bg-transparent font-display text-xl sm:text-2xl text-foreground outline-none"
            value={content.title ?? "Recurring Services Register"}
            onChange={(e) => update({ title: e.target.value })}
          />
        ) : (
          <h3 className="mt-1 font-display text-xl sm:text-2xl text-foreground">
            {content.title ?? "Recurring Services Register"}
          </h3>
        )}
      </div>

      {/* 3 stat cards per [v2.39] */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Today's Spend"
          value={`${fmtMoney(totalMonthly)}/mo`}
          sub={`${fmtMoney(totalAnnual)}/year across ${vendorCount} vendor${vendorCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="If HBC Managed"
          value={`${fmtMoney(totalIfManaged)}/mo`}
          sub={
            tier === "none"
              ? "Not yet on a Concierge plan"
              : `+ ${fmtMoney(tierMonthly)}/mo Concierge · ${TIER_LABEL[tier]}`
          }
          highlight
        />
        <StatCard
          label="Time Spent Coordinating"
          value={
            content.estimatedHoursMonthly != null
              ? `~${content.estimatedHoursMonthly} hrs/mo`
              : "Not estimated"
          }
          sub="Estimated · scheduling, calling, paying, chasing receipts"
          warn={overdueCount > 0}
          warnNote={overdueCount > 0 ? `${overdueCount} services overdue` : undefined}
        />
      </div>

      {/* HBC Concierge pitch — full-width navy card directly above table */}
      <div className="rounded-lg p-5" style={{ background: NAVY, color: "#EDE9E1" }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: GOLD }}>
          HBC Concierge — honest pricing
        </div>
        <div className="font-display text-xl sm:text-2xl mb-3">
          One bill. One number. One conversation.
        </div>
        {editable ? (
          <textarea
            className="w-full bg-transparent text-[13px] leading-relaxed border-b outline-none resize-none"
            style={{
              color: "rgba(237, 233, 225, 0.85)",
              borderColor: "rgba(237, 233, 225, 0.2)",
            }}
            rows={4}
            value={content.conciergePitchHtml ?? defaultPitch}
            onChange={(e) => update({ conciergePitchHtml: e.target.value })}
          />
        ) : (
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "rgba(237, 233, 225, 0.85)" }}
            dangerouslySetInnerHTML={{ __html: content.conciergePitchHtml ?? defaultPitch }}
          />
        )}
      </div>

      {/* View toggle + admin controls */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showIfManaged}
            onChange={() => update({ showIfManagedColumn: !showIfManaged })}
          />
          Show "if HBC managed" column
        </label>
        {editable && (
          <>
            <span>·</span>
            <label className="flex items-center gap-2">
              Tier:
              <select
                className="bg-transparent border-b border-border outline-none text-foreground"
                value={tier}
                onChange={(e) => update({ conciergeTier: e.target.value as ConciergeTier })}
              >
                <option value="none">none</option>
                <option value="tier_200">tier_200 ($200/mo)</option>
                <option value="tier_400">tier_400 ($400/mo)</option>
                <option value="tier_600">tier_600 ($600/mo)</option>
              </select>
            </label>
            <span>·</span>
            <label className="flex items-center gap-2">
              Hours/mo:
              <input
                type="number"
                className="w-16 bg-transparent border-b border-border outline-none text-foreground text-xs"
                value={content.estimatedHoursMonthly ?? ""}
                onChange={(e) =>
                  update({
                    estimatedHoursMonthly: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      {/* Collapsible category sections */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-sm italic text-muted-foreground p-4 text-center border border-dashed border-border rounded-md">
          No services captured yet. {editable && "Use the + Add service button below."}
        </div>
      ) : (
        Object.entries(grouped).map(([cat, rows]) => {
          const catTotal = rows.reduce((s, x) => s + (x.monthlyCost ?? 0), 0);
          const catOverdue = rows.filter((s) => s.status === "overdue").length;
          const isExpanded = expanded[cat] ?? true;
          const catLabel = CATEGORY_LABELS[cat] ?? cat;

          return (
            <div key={cat} className="bg-card border border-border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: CREAM_LIGHT, color: NAVY }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: GOLD }}>
                    {isExpanded ? "▾" : "▸"}
                  </span>
                  <span className="text-sm font-medium">{catLabel}</span>
                  <span className="text-[11px] text-muted-foreground">
                    · {rows.length} service{rows.length === 1 ? "" : "s"}
                  </span>
                  {catOverdue > 0 && (
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                      style={{ background: RUST, color: "#EDE9E1" }}
                    >
                      {catOverdue} overdue
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-foreground">
                  {fmtMoney(catTotal)}/mo
                </div>
              </button>
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <Th>Service</Th>
                        <Th>Vendor</Th>
                        <Th>Frequency</Th>
                        <Th>Next Due</Th>
                        <Th align="right">$/mo</Th>
                        {showIfManaged && <Th align="right" gold>If HBC</Th>}
                        {editable && <Th align="right">·</Th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s, i) => {
                        const idx = services.indexOf(s);
                        const overdue = s.status === "overdue";
                        return (
                          <tr key={s.id ?? `${cat}-${i}`} className="border-b border-border">
                            <Td bold>
                              {editable ? (
                                <input
                                  className="bg-transparent border-b border-border outline-none w-full text-xs"
                                  value={s.serviceName}
                                  onChange={(e) => {
                                    const arr = [...services];
                                    arr[idx] = { ...s, serviceName: e.target.value };
                                    update({ services: arr });
                                  }}
                                />
                              ) : (
                                s.serviceName
                              )}
                            </Td>
                            <Td muted>
                              {editable ? (
                                <input
                                  className="bg-transparent border-b border-border outline-none w-full text-xs"
                                  value={s.vendorName ?? ""}
                                  onChange={(e) => {
                                    const arr = [...services];
                                    arr[idx] = { ...s, vendorName: e.target.value };
                                    update({ services: arr });
                                  }}
                                  placeholder="vendor"
                                />
                              ) : (
                                s.vendorName ?? "—"
                              )}
                            </Td>
                            <Td muted>
                              {editable ? (
                                <select
                                  className="bg-transparent border-b border-border outline-none text-xs"
                                  value={s.frequency}
                                  onChange={(e) => {
                                    const arr = [...services];
                                    arr[idx] = { ...s, frequency: e.target.value };
                                    update({ services: arr });
                                  }}
                                >
                                  {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                  ))}
                                </select>
                              ) : (
                                FREQUENCY_LABELS[s.frequency] ?? s.frequency
                              )}
                            </Td>
                            <Td color={overdue ? RUST : undefined}>
                              {editable ? (
                                <input
                                  type="date"
                                  className="bg-transparent border-b border-border outline-none text-xs"
                                  value={s.nextDueDate ?? ""}
                                  onChange={(e) => {
                                    const arr = [...services];
                                    arr[idx] = { ...s, nextDueDate: e.target.value };
                                    update({ services: arr });
                                  }}
                                />
                              ) : (
                                s.nextDueDate ?? "—"
                              )}
                            </Td>
                            <Td align="right">
                              {editable ? (
                                <input
                                  type="number"
                                  className="w-20 bg-transparent border-b border-border outline-none text-xs text-right"
                                  value={s.monthlyCost ?? ""}
                                  onChange={(e) => {
                                    const arr = [...services];
                                    arr[idx] = {
                                      ...s,
                                      monthlyCost: e.target.value ? Number(e.target.value) : undefined,
                                    };
                                    update({ services: arr });
                                  }}
                                />
                              ) : s.monthlyCost ? (
                                fmtMoney(s.monthlyCost)
                              ) : (
                                "—"
                              )}
                            </Td>
                            {showIfManaged && (
                              <Td align="right" color={GOLD}>
                                {editable ? (
                                  <label className="text-xs flex items-center gap-1 justify-end">
                                    <input
                                      type="checkbox"
                                      checked={!!s.hbcManaged}
                                      onChange={(e) => {
                                        const arr = [...services];
                                        arr[idx] = { ...s, hbcManaged: e.target.checked };
                                        update({ services: arr });
                                      }}
                                    />
                                    HBC
                                  </label>
                                ) : s.hbcManaged ? (
                                  "HBC handles"
                                ) : (
                                  "—"
                                )}
                              </Td>
                            )}
                            {editable && (
                              <Td align="right">
                                <button
                                  type="button"
                                  onClick={() => update({ services: services.filter((_, j) => j !== idx) })}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  aria-label="Remove service"
                                >
                                  ✕
                                </button>
                              </Td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {editable && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              update({
                services: [
                  ...services,
                  {
                    category: "other",
                    serviceName: "New service",
                    frequency: "monthly",
                    status: "current",
                    hbcManaged: false,
                  } as RecurringServiceRow,
                ],
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            + Add service
          </button>
        </div>
      )}

      {/* Annual spend by category visualization */}
      {Object.keys(grouped).length > 0 && (
        <div className="bg-card border border-border rounded-md p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>
            Annual spend by category
          </div>
          {Object.entries(grouped).map(([cat, rows]) => {
            const catAnnual = rows.reduce((s, x) => s + (x.monthlyCost ?? 0), 0) * 12;
            const pct = totalAnnual > 0 ? (catAnnual / totalAnnual) * 100 : 0;
            return (
              <div key={cat} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="text-muted-foreground">
                    {fmtMoney(catAnnual)}/yr · {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-2 rounded-sm overflow-hidden" style={{ background: CREAM_LIGHT }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: GOLD }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Local helper components ──────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  highlight,
  warn,
  warnNote,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  warn?: boolean;
  warnNote?: string;
}) => (
  <div
    className="rounded-md p-4 border"
    style={{
      background: warn ? WARN_BG : highlight ? "rgba(184, 115, 51, 0.08)" : undefined,
      borderColor: warn ? "#B58A1F" : highlight ? GOLD : "hsl(var(--border))",
    }}
  >
    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
      {label}
    </div>
    <div className="font-display text-xl sm:text-2xl text-foreground">{value}</div>
    <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    {warnNote && (
      <div className="text-[11px] mt-1 font-medium" style={{ color: RUST }}>
        {warnNote}
      </div>
    )}
  </div>
);

const Th = ({ children, align, gold }: { children: React.ReactNode; align?: "left" | "right"; gold?: boolean }) => (
  <th
    className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] ${
      align === "right" ? "text-right" : "text-left"
    }`}
    style={{ color: gold ? GOLD : "hsl(var(--muted-foreground))" }}
  >
    {children}
  </th>
);

const Td = ({
  children,
  align,
  bold,
  muted,
  color,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  bold?: boolean;
  muted?: boolean;
  color?: string;
}) => (
  <td
    className={`px-3 py-2 text-xs ${align === "right" ? "text-right" : "text-left"}`}
    style={{
      color: color ?? (muted ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))"),
      fontWeight: bold ? 500 : undefined,
    }}
  >
    {children}
  </td>
);

export default RecurringServicesRegisterBlock;
