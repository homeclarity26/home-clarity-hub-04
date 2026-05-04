import type { VisionProjectContent, ReplacementBriefingTier } from "../types";

// HCR palette per Master Spec 5.2 — vision project hero is navy gradient,
// section dividers + eyebrows are gold, body copy on cream-light cards.
const NAVY = "#0A1628";
const NAVY_SOFT = "rgba(10, 22, 40, 0.85)";
const GOLD = "#B87333";
const CREAM = "#EDE9E1";
const CREAM_LIGHT = "#F5F2EE";
const RUST = "#B7410E";

interface VisionProjectBlockProps {
  content: VisionProjectContent;
  editable?: boolean;
  onChange?: (content: VisionProjectContent) => void;
}

function fmtRange(low?: number, high?: number): string {
  if (low == null && high == null) return "Pricing pending";
  const fmt = (n: number) => "$" + n.toLocaleString();
  if (low != null && high != null) return `${fmt(low)} to ${fmt(high)}`;
  if (low != null) return `from ${fmt(low)}`;
  return `up to ${fmt(high!)}`;
}

// Inline tier card — same structural pattern as ReplacementBriefingBlock's
// TierCard but rendered on white/cream rather than navy. Featured (gold
// border + Recommended badge) is the visual anchor for the middle tier.
const InvestmentTier = ({
  tier,
  editable,
  onChange,
  onRemove,
}: {
  tier: ReplacementBriefingTier;
  editable: boolean;
  onChange: (next: ReplacementBriefingTier) => void;
  onRemove?: () => void;
}) => {
  const featured = !!tier.recommended;
  return (
    <div
      className="rounded-lg p-4 flex flex-col relative bg-card"
      style={{
        border: featured ? `2px solid ${GOLD}` : "1px solid hsl(var(--border))",
        background: featured ? CREAM_LIGHT : undefined,
      }}
    >
      {featured && !editable && (
        <div
          className="absolute -top-2.5 right-3 font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
          style={{ background: GOLD, color: CREAM }}
        >
          Recommended
        </div>
      )}
      {editable ? (
        <div className="flex items-center justify-between gap-2 mb-2">
          <input
            className="flex-1 bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none"
            style={{ color: GOLD }}
            value={tier.label}
            onChange={(e) => onChange({ ...tier, label: e.target.value })}
          />
          <label className="flex items-center gap-1 text-[10px] cursor-pointer text-muted-foreground">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => onChange({ ...tier, recommended: e.target.checked })}
            />
            recommended
          </label>
        </div>
      ) : (
        <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          {tier.label}
        </div>
      )}

      {editable ? (
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">$</span>
          <input
            type="number"
            className="w-24 bg-transparent border-b border-border outline-none text-sm"
            value={tier.priceLow ?? ""}
            onChange={(e) => onChange({ ...tier, priceLow: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="low"
          />
          <span className="text-xs text-muted-foreground">to $</span>
          <input
            type="number"
            className="w-24 bg-transparent border-b border-border outline-none text-sm"
            value={tier.priceHigh ?? ""}
            onChange={(e) => onChange({ ...tier, priceHigh: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="high"
          />
        </div>
      ) : (
        <div className="font-display text-base mt-1.5" style={{ color: NAVY }}>
          {fmtRange(tier.priceLow, tier.priceHigh)}
        </div>
      )}

      {editable ? (
        <textarea
          className="mt-2 bg-transparent text-xs leading-relaxed outline-none border-b border-border resize-none text-muted-foreground"
          rows={3}
          value={tier.scopeHtml ?? ""}
          onChange={(e) => onChange({ ...tier, scopeHtml: e.target.value })}
          placeholder="Tier description"
        />
      ) : (
        tier.scopeHtml && (
          <div
            className="text-xs leading-relaxed text-muted-foreground mt-2 flex-1"
            dangerouslySetInnerHTML={{ __html: tier.scopeHtml }}
          />
        )
      )}

      {editable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-[10px] text-muted-foreground hover:text-foreground self-start"
        >
          ✕ Remove tier
        </button>
      )}
    </div>
  );
};

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <h3
    className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
    style={{ color: GOLD }}
  >
    {children}
  </h3>
);

const VisionProjectBlock = ({ content, editable, onChange }: VisionProjectBlockProps) => {
  const update = (patch: Partial<VisionProjectContent>) => onChange?.({ ...content, ...patch });
  const tiers = content.tiers ?? [];

  // Hardcoded execution-path default text WITH AKR disclosure baked in.
  const defaultExecutionPath =
    "When you are ready to start, this can be executed through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you would prefer a different contractor, we will connect you with a vetted HBC trade partner. The choice is always yours.";

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Hero with navy gradient */}
      <div
        className="relative px-6 sm:px-8 py-7 flex flex-col justify-end min-h-[180px]"
        style={{
          background: content.imageUrl
            ? `url(${content.imageUrl}) center/cover`
            : `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_SOFT} 100%)`,
        }}
      >
        {content.imageUrl && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(10,22,40,0.2) 0%, rgba(10,22,40,0.85) 100%)" }}
          />
        )}
        <div className="relative">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            {editable ? (
              <span className="inline-flex gap-2 items-center">
                Vision Project ·
                <input
                  className="bg-transparent border-b border-white/30 outline-none text-white/80 px-1 text-xs"
                  value={content.priority ?? ""}
                  onChange={(e) => update({ priority: e.target.value })}
                  placeholder="priority (e.g. Year 1-2)"
                  size={20}
                />
              </span>
            ) : (
              <>Vision Project{content.priority ? ` · ${content.priority}` : ""}</>
            )}
          </div>
          {editable ? (
            <input
              className="w-full mt-2 bg-transparent font-display text-2xl sm:text-[26px] outline-none"
              style={{ color: CREAM }}
              value={content.projectTitle}
              onChange={(e) => update({ projectTitle: e.target.value })}
              placeholder="Project title"
            />
          ) : (
            <h1
              className="font-display text-2xl sm:text-[26px] mt-2 leading-tight"
              style={{ color: CREAM }}
            >
              {content.projectTitle}
            </h1>
          )}
          {(editable || content.category) && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {editable ? (
                <input
                  className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.15em] text-white outline-none"
                  value={content.category ?? ""}
                  onChange={(e) => update({ category: e.target.value })}
                  placeholder="category"
                  size={16}
                />
              ) : (
                content.category && (
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-1 rounded-full"
                    style={{ background: GOLD, color: NAVY }}
                  >
                    {content.category}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 py-6 space-y-6">
        {/* The Vision narrative */}
        <section>
          <SectionEyebrow>The Vision</SectionEyebrow>
          {editable ? (
            <textarea
              className="w-full bg-transparent text-sm leading-relaxed text-foreground border border-border rounded p-3 outline-none focus:border-foreground resize-none"
              rows={6}
              value={content.visionNarrativeHtml ?? ""}
              onChange={(e) => update({ visionNarrativeHtml: e.target.value })}
              placeholder="The warm, aspirational vision narrative. What does this become? Why does it matter to this family?"
            />
          ) : content.visionNarrativeHtml ? (
            <div
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: content.visionNarrativeHtml }}
            />
          ) : (
            <p className="text-sm italic text-muted-foreground">Vision narrative not yet drafted.</p>
          )}
        </section>

        {/* Why Design Matters First */}
        <section
          className="rounded-lg p-5"
          style={{ background: CREAM_LIGHT, borderLeft: `3px solid ${GOLD}` }}
        >
          <SectionEyebrow>Why Design Matters First</SectionEyebrow>
          {editable ? (
            <>
              <textarea
                className="w-full bg-transparent text-sm leading-relaxed text-foreground border-b border-border outline-none resize-none"
                rows={6}
                value={content.designFeeEducationHtml ?? ""}
                onChange={(e) => update({ designFeeEducationHtml: e.target.value })}
                placeholder="Why a design phase is non-negotiable. What it covers. Why design fees protect investment."
              />
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-[0.15em]">
                  Design fee
                </span>
                <span className="text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  className="w-24 bg-transparent border-b border-border outline-none text-sm"
                  value={content.designFeeLow ?? ""}
                  onChange={(e) =>
                    update({ designFeeLow: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="low"
                />
                <span className="text-xs text-muted-foreground">to $</span>
                <input
                  type="number"
                  className="w-24 bg-transparent border-b border-border outline-none text-sm"
                  value={content.designFeeHigh ?? ""}
                  onChange={(e) =>
                    update({ designFeeHigh: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="high"
                />
              </div>
            </>
          ) : (
            <>
              {content.designFeeEducationHtml && (
                <div
                  className="text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: content.designFeeEducationHtml }}
                />
              )}
              {(content.designFeeLow != null || content.designFeeHigh != null) && (
                <div className="mt-3 text-sm font-medium" style={{ color: NAVY }}>
                  Design phase: {fmtRange(content.designFeeLow, content.designFeeHigh)}
                </div>
              )}
            </>
          )}
        </section>

        {/* Scope of work */}
        {(editable || content.scopeOfWorkHtml) && (
          <section>
            <SectionEyebrow>Scope of Work</SectionEyebrow>
            {editable ? (
              <textarea
                className="w-full bg-transparent text-sm leading-relaxed text-foreground border border-border rounded p-3 outline-none focus:border-foreground resize-none"
                rows={6}
                value={content.scopeOfWorkHtml ?? ""}
                onChange={(e) => update({ scopeOfWorkHtml: e.target.value })}
                placeholder="Beautifully written scope. Hedged appropriately ('design phase will refine quantities, finishes, structural decisions, and final scope')."
              />
            ) : (
              <div
                className="text-sm leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: content.scopeOfWorkHtml ?? "" }}
              />
            )}
          </section>
        )}

        {/* Investment tiers */}
        <section>
          <SectionEyebrow>Investment Ranges</SectionEyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiers.map((tier, i) => (
              <InvestmentTier
                key={tier.id ?? i}
                tier={tier}
                editable={!!editable}
                onChange={(next) => {
                  const arr = [...tiers];
                  arr[i] = next;
                  update({ tiers: arr });
                }}
                onRemove={tiers.length > 1 ? () => update({ tiers: tiers.filter((_, j) => j !== i) }) : undefined}
              />
            ))}
            {editable && tiers.length < 5 && (
              <button
                type="button"
                onClick={() =>
                  update({
                    tiers: [
                      ...tiers,
                      { id: `tier-${tiers.length + 1}`, label: "New Tier" } as ReplacementBriefingTier,
                    ],
                  })
                }
                className="rounded-lg border-2 border-dashed border-border text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground p-4 flex items-center justify-center"
              >
                + Add tier
              </button>
            )}
          </div>
        </section>

        {/* How We Execute — AKR transparently disclosed (REQUIRED) */}
        <section
          className="rounded-lg p-5"
          style={{ background: CREAM_LIGHT, borderLeft: `3px solid ${NAVY}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <SectionEyebrow>How We Execute</SectionEyebrow>
            {!content.akrDisclosed && (
              <span
                className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                style={{ background: RUST, color: CREAM }}
                title="AKR disclosure is required per locked decision [v1.13]"
              >
                AKR disclosure missing
              </span>
            )}
          </div>
          {editable ? (
            <>
              <textarea
                className="w-full bg-transparent text-sm leading-relaxed text-foreground border-b border-border outline-none resize-none"
                rows={5}
                value={content.executionPathHtml ?? defaultExecutionPath}
                onChange={(e) => update({ executionPathHtml: e.target.value })}
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.akrDisclosed}
                  onChange={(e) => update({ akrDisclosed: e.target.checked })}
                />
                AKR disclosed (required: non-optional per locked decision [v1.13])
              </label>
            </>
          ) : (
            <div
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: content.executionPathHtml ?? defaultExecutionPath }}
            />
          )}
        </section>

        {/* Disruption forecast + Dependencies (compact 2-col when both set) */}
        {(editable || content.disruptionSummary || content.dependenciesHtml) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(editable || content.disruptionSummary) && (
              <div>
                <SectionEyebrow>Disruption Forecast</SectionEyebrow>
                {editable ? (
                  <input
                    className="w-full bg-transparent border-b border-border outline-none text-sm"
                    value={content.disruptionSummary ?? ""}
                    onChange={(e) => update({ disruptionSummary: e.target.value })}
                    placeholder="e.g. 8 weeks of takeout"
                  />
                ) : (
                  <p className="text-sm text-foreground">{content.disruptionSummary}</p>
                )}
              </div>
            )}
            {(editable || content.dependenciesHtml) && (
              <div>
                <SectionEyebrow>Dependencies</SectionEyebrow>
                {editable ? (
                  <textarea
                    className="w-full bg-transparent border border-border rounded p-2 text-sm outline-none focus:border-foreground resize-none"
                    rows={3}
                    value={content.dependenciesHtml ?? ""}
                    onChange={(e) => update({ dependenciesHtml: e.target.value })}
                    placeholder="e.g. electrical before chef's kitchen"
                  />
                ) : (
                  <div
                    className="text-sm text-foreground"
                    dangerouslySetInnerHTML={{ __html: content.dependenciesHtml ?? "" }}
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* Concierge action CTA */}
        {(editable || (content.conciergeActionLabel && content.conciergeActionPrompt)) && (
          <section
            className="rounded-md flex justify-between items-center gap-4 flex-wrap p-4"
            style={{ background: CREAM_LIGHT }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                Bobby Action
              </div>
              {editable ? (
                <input
                  className="mt-1 w-72 bg-transparent border-b border-border outline-none text-sm"
                  value={content.conciergeActionLabel ?? ""}
                  onChange={(e) => update({ conciergeActionLabel: e.target.value })}
                  placeholder="Action prompt (e.g. Ready to start the design conversation?)"
                />
              ) : (
                <div className="text-sm mt-0.5" style={{ color: NAVY }}>
                  {content.conciergeActionLabel}
                </div>
              )}
              {editable && (
                <input
                  className="mt-1 w-72 bg-transparent border-b border-border outline-none text-xs text-muted-foreground"
                  value={content.conciergeActionPrompt ?? ""}
                  onChange={(e) => update({ conciergeActionPrompt: e.target.value })}
                  placeholder="Prefilled Bobby prompt"
                />
              )}
            </div>
            {!editable && (
              <button
                type="button"
                className="rounded-md px-4 py-2 font-mono text-xs uppercase tracking-[0.15em]"
                style={{ background: GOLD, color: NAVY }}
                title={content.conciergeActionPrompt}
                onClick={() => {
                  // C1 wires this to ConciergePanel; for now no-op visual button.
                }}
              >
                Start design
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default VisionProjectBlock;
