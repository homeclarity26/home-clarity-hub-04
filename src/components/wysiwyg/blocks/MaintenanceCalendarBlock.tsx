import type { MaintenanceCalendarContent, MaintenanceCalendarItem } from "../types";

// Locked season colors per v2 prototype line 1915 — Spring green, Summer
// gold, Fall rust, Winter navy. Inline because these are season-specific
// and not in tailwind tokens.
const SEASON_COLORS = {
  spring: "#5A8A4F",
  summer: "#B58A1F",
  fall: "#B7410E",
  winter: "#0A1628",
} as const;

const SEASONS: Array<{ key: keyof typeof SEASON_COLORS; label: string }> = [
  { key: "spring", label: "Spring" },
  { key: "summer", label: "Summer" },
  { key: "fall", label: "Fall" },
  { key: "winter", label: "Winter" },
];

const GOLD = "#B87333";

interface MaintenanceCalendarBlockProps {
  content: MaintenanceCalendarContent;
  editable?: boolean;
  onChange?: (content: MaintenanceCalendarContent) => void;
}

const MaintenanceCalendarBlock = ({
  content,
  editable,
  onChange,
}: MaintenanceCalendarBlockProps) => {
  const update = (patch: Partial<MaintenanceCalendarContent>) =>
    onChange?.({ ...content, ...patch });

  const updateSeason = (
    key: keyof typeof SEASON_COLORS,
    items: MaintenanceCalendarItem[]
  ) => update({ [key]: items } as Partial<MaintenanceCalendarContent>);

  return (
    <div className="bg-card border border-border rounded-lg p-5 sm:p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: GOLD }}>
        {editable ? (
          <input
            className="w-full bg-transparent outline-none"
            style={{ color: GOLD }}
            value={content.eyebrow ?? "The annual cadence"}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        ) : (
          content.eyebrow ?? "The annual cadence"
        )}
      </div>
      {editable ? (
        <input
          className="w-full bg-transparent font-display text-xl sm:text-2xl text-foreground outline-none mb-5"
          value={content.title ?? "Maintenance Calendar"}
          onChange={(e) => update({ title: e.target.value })}
        />
      ) : (
        <h3 className="font-display text-xl sm:text-2xl text-foreground mb-5">
          {content.title ?? "Maintenance Calendar"}
        </h3>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SEASONS.map((s) => {
          const items = content[s.key] ?? [];
          const color = SEASON_COLORS[s.key];
          return (
            <div key={s.key}>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2"
                style={{ color }}
              >
                {s.label}
              </div>
              <ul className="list-none p-0 space-y-0">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground py-1 border-b border-dotted border-border flex items-start gap-2"
                  >
                    <span style={{ color }} aria-hidden>·</span>
                    {editable ? (
                      <>
                        <input
                          className="flex-1 bg-transparent outline-none"
                          value={item.description}
                          onChange={(e) => {
                            const next = [...items];
                            next[i] = { ...item, description: e.target.value };
                            updateSeason(s.key, next);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => updateSeason(s.key, items.filter((_, j) => j !== i))}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span className="flex-1">{item.description}</span>
                    )}
                  </li>
                ))}
                {editable && (
                  <li className="py-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateSeason(s.key, [...items, { description: "" } as MaintenanceCalendarItem])
                      }
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      + Add item
                    </button>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaintenanceCalendarBlock;
