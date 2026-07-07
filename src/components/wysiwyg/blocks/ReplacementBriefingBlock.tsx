import type {
  ReplacementBriefingContent,
  ReplacementBriefingTier,
  ReplacementBriefingPhoto,
  ReplacementBriefingCta,
} from "../types";

// Locked HCR palette per Master Spec 5.1.2 — the navy block IS the brand
// signature for the Replacement Briefing Package per [v1.13]. Inline
// because tailwind tokens are HSL-based and these need to be exact.
const NAVY = "#0A1628";
const NAVY_SOFT = "rgba(10, 22, 40, 0.85)";
const GOLD = "#B87333";
const GOLD_SOFT = "rgba(184, 115, 51, 0.15)";
const GOLD_BORDER = "rgba(184, 115, 51, 0.4)";
const RUST = "#B7410E";
const CREAM = "#EDE9E1";
const CREAM_LIGHT = "#F5F2EE";
const CREAM_SOFT = "rgba(237, 233, 225, 0.85)";
const CREAM_QUIET = "rgba(237, 233, 225, 0.65)";

interface ReplacementBriefingBlockProps {
  content: ReplacementBriefingContent;
  editable?: boolean;
  onChange?: (content: ReplacementBriefingContent) => void;
}

// Format a price range for display. Hyphen-formatted ("$14,000 - $18,000")
// per locked copy discipline — never the word "to", never an em-dash.
function formatPriceRange(low?: number, high?: number): string {
  if (low == null && high == null) return "Pricing pending";
  const fmt = (n: number) => "$" + n.toLocaleString();
  if (low != null && high != null) return `${fmt(low)} - ${fmt(high)}`;
  if (low != null) return `from ${fmt(low)}`;
  return `up to ${fmt(high!)}`;
}

// Substitute {systemType} placeholder in CTA prompts with the actual system
// type, falling back to a generic word so the prompt never reads with a
// literal {systemType} in it.
function fillPrompt(prompt: string | undefined, systemType?: string): string | undefined {
  if (!prompt) return prompt;
  return prompt.replace(/\{systemType\}/g, systemType || "system");
}

// ─── Tier card (inside the navy block) ───────────────────────────────────

interface TierCardProps {
  tier: ReplacementBriefingTier;
  editable: boolean;
  onChange: (next: ReplacementBriefingTier) => void;
  onRemove?: () => void;
}

const TierCard = ({ tier, editable, onChange, onRemove }: TierCardProps) => {
  const featured = !!tier.recommended;
  return (
    <div
      className="rounded-md flex flex-col p-4"
      style={{
        background: featured ? GOLD_SOFT : "rgba(237, 233, 225, 0.08)",
        border: `1px solid ${featured ? GOLD : "rgba(237, 233, 225, 0.2)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {editable ? (
          <input
            className="flex-1 bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none"
            style={{ color: featured ? GOLD : CREAM_QUIET }}
            value={tier.label}
            onChange={(e) => onChange({ ...tier, label: e.target.value })}
          />
        ) : (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: featured ? GOLD : CREAM_QUIET }}
          >
            {tier.label}
          </span>
        )}
        {editable && (
          <label
            className="flex items-center gap-1 text-[10px] cursor-pointer"
            style={{ color: featured ? GOLD : CREAM_QUIET }}
            title="Mark as recommended (gold border + badge)"
          >
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => onChange({ ...tier, recommended: e.target.checked })}
            />
            recommended
          </label>
        )}
        {!editable && featured && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
            style={{ background: GOLD, color: NAVY }}
          >
            Recommended
          </span>
        )}
      </div>

      {/* Price range */}
      {editable ? (
        <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: CREAM }}>
          <span className="font-mono text-[10px]" style={{ color: CREAM_QUIET }}>$</span>
          <input
            type="number"
            className="w-20 bg-transparent border-b outline-none text-sm"
            style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.3)" }}
            value={tier.priceLow ?? ""}
            onChange={(e) => onChange({ ...tier, priceLow: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="low"
          />
          <span className="text-xs" style={{ color: CREAM_QUIET }}>to $</span>
          <input
            type="number"
            className="w-20 bg-transparent border-b outline-none text-sm"
            style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.3)" }}
            value={tier.priceHigh ?? ""}
            onChange={(e) => onChange({ ...tier, priceHigh: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="high"
          />
        </div>
      ) : (
        <div className="mt-2 font-display text-lg" style={{ color: CREAM }}>
          {formatPriceRange(tier.priceLow, tier.priceHigh)}
        </div>
      )}

      {/* Scope description */}
      {editable ? (
        <textarea
          className="mt-2 bg-transparent text-[11px] leading-relaxed outline-none border-b resize-none"
          style={{ color: CREAM_SOFT, borderColor: "rgba(237, 233, 225, 0.2)" }}
          rows={3}
          value={tier.scopeHtml ?? ""}
          onChange={(e) => onChange({ ...tier, scopeHtml: e.target.value })}
          placeholder="Scope description"
        />
      ) : (
        tier.scopeHtml && (
          <div
            className="mt-2 text-[11px] leading-relaxed flex-1"
            style={{ color: CREAM_SOFT }}
            dangerouslySetInnerHTML={{ __html: tier.scopeHtml }}
          />
        )
      )}

      {/* Inclusions / exclusions / warranty (compact in viewer) */}
      {!editable && (tier.inclusions?.length || tier.exclusions?.length || tier.warranty) && (
        <div className="mt-3 space-y-1.5 text-[10px]" style={{ color: CREAM_QUIET }}>
          {tier.warranty && (
            <div>
              <span className="font-mono uppercase tracking-[0.15em]" style={{ color: GOLD }}>Warranty: </span>
              {tier.warranty}
            </div>
          )}
          {tier.inclusions && tier.inclusions.length > 0 && (
            <div>
              <span className="font-mono uppercase tracking-[0.15em]" style={{ color: GOLD }}>Includes: </span>
              {tier.inclusions.join(", ")}
            </div>
          )}
          {tier.exclusions && tier.exclusions.length > 0 && (
            <div>
              <span className="font-mono uppercase tracking-[0.15em]" style={{ color: GOLD }}>Excludes: </span>
              {tier.exclusions.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Editable inclusions/exclusions/warranty (compact list editor) */}
      {editable && (
        <div className="mt-3 space-y-2 text-[11px]">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] block" style={{ color: GOLD }}>
              Warranty
            </label>
            <input
              className="w-full bg-transparent border-b outline-none"
              style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.2)" }}
              value={tier.warranty ?? ""}
              onChange={(e) => onChange({ ...tier, warranty: e.target.value })}
              placeholder="e.g. 5 years parts, 2 years labor"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] block" style={{ color: GOLD }}>
              Inclusions (comma-separated)
            </label>
            <input
              className="w-full bg-transparent border-b outline-none"
              style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.2)" }}
              value={(tier.inclusions ?? []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...tier,
                  inclusions: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] block" style={{ color: GOLD }}>
              Exclusions (comma-separated)
            </label>
            <input
              className="w-full bg-transparent border-b outline-none"
              style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.2)" }}
              value={(tier.exclusions ?? []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...tier,
                  exclusions: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] hover:text-foreground"
              style={{ color: CREAM_QUIET }}
            >
              ✕ Remove tier
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Photo strip (inside navy block) ─────────────────────────────────────

const PhotoThumb = ({ photo, editable, onChange, onRemove }: {
  photo: ReplacementBriefingPhoto;
  editable: boolean;
  onChange: (next: ReplacementBriefingPhoto) => void;
  onRemove?: () => void;
}) => (
  <div className="aspect-square rounded overflow-hidden relative" style={{ background: NAVY_SOFT }}>
    {photo.url ? (
      <img src={photo.url} alt={photo.caption ?? photo.role} className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: CREAM_QUIET }}>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-center px-2">
          {photo.role.replace("_", " ")}
        </span>
      </div>
    )}
    {editable && (
      <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 flex flex-col gap-0.5">
        <input
          type="url"
          className="bg-transparent text-[9px] outline-none"
          style={{ color: CREAM }}
          value={photo.url}
          onChange={(e) => onChange({ ...photo, url: e.target.value })}
          placeholder="Photo URL"
          aria-label="Photo URL"
        />
        <div className="flex gap-1 items-center">
          <select
            className="bg-transparent text-[9px] outline-none"
            style={{ color: CREAM_SOFT }}
            value={photo.role}
            onChange={(e) => onChange({ ...photo, role: e.target.value as ReplacementBriefingPhoto["role"] })}
          >
            <option value="unit">unit</option>
            <option value="serial_plate">serial_plate</option>
            <option value="install_location">install_location</option>
            <option value="failure_signal">failure_signal</option>
          </select>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto text-[10px]"
              style={{ color: CREAM_QUIET }}
              aria-label="Remove photo"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

// ─── Main block ──────────────────────────────────────────────────────────

const ReplacementBriefingBlock = ({ content, editable, onChange }: ReplacementBriefingBlockProps) => {
  const update = (patch: Partial<ReplacementBriefingContent>) => onChange?.({ ...content, ...patch });

  const tiers = content.tiers ?? [];
  const photos = content.photos ?? [];
  const ctas = content.ctas ?? [];
  const headline = content.headline ?? "Pre-scoped, pre-priced, ready when you are";

  const ctaButtonClass = (style: ReplacementBriefingCta["style"]) => {
    switch (style) {
      case "rust":
        return { background: RUST, color: CREAM };
      case "gold":
        return { background: GOLD, color: NAVY };
      case "navy":
      default:
        return { background: NAVY, color: CREAM, border: `1px solid ${GOLD_BORDER}` };
    }
  };

  return (
    <div className="space-y-4">
      {/* The navy briefing card — branded "Replacement Briefing Package" */}
      <div
        className="rounded-lg p-5 sm:p-6"
        style={{ background: NAVY, color: CREAM }}
      >
        {/* Eyebrow + headline */}
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: GOLD }}>
          Replacement Briefing Package
        </div>
        {editable ? (
          <input
            className="w-full bg-transparent font-display text-lg sm:text-xl outline-none"
            style={{ color: CREAM }}
            value={headline}
            onChange={(e) => update({ headline: e.target.value })}
          />
        ) : (
          <h4 className="font-display text-xl sm:text-2xl mb-2" style={{ color: CREAM }}>
            {headline}
          </h4>
        )}

        {editable ? (
          <textarea
            className="w-full mt-2 bg-transparent text-[13px] leading-relaxed outline-none border-b resize-none"
            style={{ color: CREAM_SOFT, borderColor: "rgba(237, 233, 225, 0.2)" }}
            rows={3}
            value={content.intro ?? ""}
            onChange={(e) => update({ intro: e.target.value })}
            placeholder="Intro paragraph"
          />
        ) : (
          content.intro && (
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: CREAM_SOFT }}>
              {content.intro}
            </p>
          )
        )}

        {editable && (
          <div className="mt-2 mb-3">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] block" style={{ color: GOLD }}>
              System Type
            </label>
            <input
              className="w-full bg-transparent border-b outline-none text-sm"
              style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.2)" }}
              value={content.systemType ?? ""}
              onChange={(e) => update({ systemType: e.target.value })}
              placeholder="e.g. Furnace, AC Condenser, Water Heater"
            />
          </div>
        )}

        {/* Photos strip */}
        {(editable || photos.length > 0) && (
          <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <PhotoThumb
                  key={i}
                  photo={p}
                  editable={!!editable}
                  onChange={(next) => {
                    const arr = [...photos];
                    arr[i] = next;
                    update({ photos: arr });
                  }}
                  onRemove={() => update({ photos: photos.filter((_, j) => j !== i) })}
                />
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      photos: [...photos, { role: "unit", url: "" } as ReplacementBriefingPhoto],
                    })
                  }
                  className="aspect-square rounded border-2 border-dashed text-[10px] font-mono uppercase tracking-[0.15em] flex items-center justify-center"
                  style={{ borderColor: "rgba(237, 233, 225, 0.3)", color: CREAM_QUIET }}
                >
                  + Add photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tier grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiers.map((tier, i) => (
            <TierCard
              key={tier.id ?? i}
              tier={tier}
              editable={!!editable}
              onChange={(next) => {
                const arr = [...tiers];
                arr[i] = next;
                update({ tiers: arr });
              }}
              onRemove={
                tiers.length > 1
                  ? () => update({ tiers: tiers.filter((_, j) => j !== i) })
                  : undefined
              }
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
              className="rounded-md border-2 border-dashed text-[10px] font-mono uppercase tracking-[0.15em] flex items-center justify-center p-4"
              style={{ borderColor: "rgba(237, 233, 225, 0.3)", color: CREAM_QUIET }}
            >
              + Add tier
            </button>
          )}
        </div>

        {/* CTA buttons */}
        {(editable || ctas.length > 0) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {ctas.map((cta, i) => (
              <div key={cta.id ?? i} className="flex-1 min-w-[200px]">
                {editable ? (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-transparent border-b outline-none text-sm"
                        style={{ color: CREAM, borderColor: "rgba(237, 233, 225, 0.3)" }}
                        value={cta.label}
                        onChange={(e) => {
                          const arr = [...ctas];
                          arr[i] = { ...cta, label: e.target.value };
                          update({ ctas: arr });
                        }}
                      />
                      <select
                        className="bg-transparent border-b outline-none text-xs"
                        style={{ color: CREAM_SOFT, borderColor: "rgba(237, 233, 225, 0.3)" }}
                        value={cta.style}
                        onChange={(e) => {
                          const arr = [...ctas];
                          arr[i] = { ...cta, style: e.target.value as ReplacementBriefingCta["style"] };
                          update({ ctas: arr });
                        }}
                      >
                        <option value="rust">rust</option>
                        <option value="gold">gold</option>
                        <option value="navy">navy</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => update({ ctas: ctas.filter((_, j) => j !== i) })}
                        className="text-[10px]"
                        style={{ color: CREAM_QUIET }}
                        aria-label="Remove CTA"
                      >✕</button>
                    </div>
                    <input
                      className="w-full bg-transparent border-b outline-none text-[10px]"
                      style={{ color: CREAM_SOFT, borderColor: "rgba(237, 233, 225, 0.2)" }}
                      value={cta.prompt ?? ""}
                      onChange={(e) => {
                        const arr = [...ctas];
                        arr[i] = { ...cta, prompt: e.target.value };
                        update({ ctas: arr });
                      }}
                      placeholder="Prefilled Bobby prompt"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-md py-3 px-4 font-mono text-xs uppercase tracking-[0.15em]"
                    style={ctaButtonClass(cta.style)}
                    title={fillPrompt(cta.prompt, content.systemType)}
                    onClick={() => {
                      // Wire-up to ConciergePanel happens in C1. For now this
                      // is a no-op visual button so the briefing renders
                      // correctly in the report.
                    }}
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            ))}
            {editable && ctas.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  update({
                    ctas: [
                      ...ctas,
                      { id: `cta-${ctas.length + 1}`, label: "New CTA", style: "navy", action: "open_concierge" } as ReplacementBriefingCta,
                    ],
                  })
                }
                className="text-[10px] font-mono uppercase tracking-[0.15em] px-3 py-3 rounded border-2 border-dashed"
                style={{ borderColor: "rgba(237, 233, 225, 0.3)", color: CREAM_QUIET }}
              >
                + Add CTA
              </button>
            )}
          </div>
        )}
      </div>

      {/* The cream "How replacement happens" explainer below the navy block */}
      {(editable || content.howReplacementHappensHtml) && (
        <div
          className="rounded-lg p-5"
          style={{
            background: CREAM_LIGHT,
            borderLeft: `3px solid ${NAVY}`,
          }}
        >
          <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: GOLD }}>
            How replacement happens
          </h4>
          {editable ? (
            <textarea
              className="w-full bg-transparent text-[13px] leading-relaxed text-foreground outline-none border-b resize-none border-border"
              rows={6}
              value={content.howReplacementHappensHtml ?? ""}
              onChange={(e) => update({ howReplacementHappensHtml: e.target.value })}
              placeholder="5-step explainer: what the trade partner does, day by day, what to expect, when the system is offline"
            />
          ) : (
            <div
              className="text-[13px] leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: content.howReplacementHappensHtml ?? "" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReplacementBriefingBlock;
