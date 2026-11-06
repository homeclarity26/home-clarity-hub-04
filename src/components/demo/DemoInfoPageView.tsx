import { ArrowLeft, ChevronRight } from "lucide-react";
import type { DemoInfoPage } from "@/data/demo/caldwellTypes";

// Designed layout for the Information chapter of the public sample report
// (/demo only). These are the first pages a reader opens, so they are laid
// out as pages, not prose: lede, stat tiles, short headed sections,
// numbered cards with a gold numeral, a gold-bordered callout and a
// signature. Every container expands with its content.

interface DemoInfoPageViewProps {
  info: DemoInfoPage;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  onNavigate: (pageKey: string) => void;
}

const DemoInfoPageView = ({ info, prev, next, onNavigate }: DemoInfoPageViewProps) => {
  const stats = info.stats ?? [];
  const sections = info.sections ?? [];
  const numbered = info.numbered ?? [];
  const statCols =
    stats.length >= 4 ? "grid-cols-2 md:grid-cols-4" : stats.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2";
  const statColsSix = stats.length > 4 ? "grid-cols-2 sm:grid-cols-3" : statCols;

  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Eyebrow + title + lede */}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
        Information
      </div>
      <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
        {info.title}
      </h1>
      {info.lede && (
        <p className="font-display text-xl sm:text-[22px] leading-snug text-foreground/85 max-w-[760px]">
          {info.lede}
        </p>
      )}

      <hr className="border-border my-7" />

      <div className="space-y-9">
        {/* Stat tiles */}
        {stats.length > 0 && (
          <div className={`grid gap-3 sm:gap-4 ${statColsSix}`}>
            {stats.map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-lg p-4 sm:p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-2">
                  {s.label}
                </div>
                <div className="font-display text-[28px] sm:text-[32px] leading-none text-primary break-words">
                  {s.value}
                </div>
                {s.subtitle && (
                  <div className="text-xs text-muted-foreground mt-2">{s.subtitle}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Headed sections */}
        {sections.map((section, i) => (
          <section key={section.heading ?? `section-${i}`} className="max-w-[760px]">
            {section.heading && (
              <h2 className="font-display text-[22px] sm:text-2xl text-primary mb-3">
                {section.heading}
              </h2>
            )}
            {(section.paragraphs ?? []).length > 0 && (
              <div className="space-y-4">
                {(section.paragraphs ?? []).map((p, j) => (
                  <p key={j} className="text-[15px] leading-relaxed text-foreground">
                    {p}
                  </p>
                ))}
              </div>
            )}
            {(section.bullets ?? []).length > 0 && (
              <ul className={`space-y-2.5 ${(section.paragraphs ?? []).length > 0 ? "mt-4" : ""}`}>
                {(section.bullets ?? []).map((b, j) => (
                  <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-foreground">
                    <span aria-hidden className="mt-[9px] w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Numbered cards */}
        {numbered.length > 0 && (
          <ol className="space-y-3">
            {numbered.map((n, i) => (
              <li
                key={n.title}
                className="bg-white border border-border rounded-lg p-5 flex gap-4 sm:gap-5"
              >
                <div
                  aria-hidden
                  className="font-display text-[34px] leading-none text-accent w-10 shrink-0"
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1.5">
                    <h3 className="font-sans text-base font-semibold text-primary">{n.title}</h3>
                    {n.tag && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-[3px] rounded-[3px] bg-accent/10 text-hbc-gold-readable whitespace-nowrap">
                        {n.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Callout */}
        {info.callout && (
          <div className="bg-white rounded-lg border border-border border-l-[3px] border-l-accent p-5">
            <div className="font-mono uppercase text-[10px] tracking-[0.14em] text-accent mb-2">
              {info.callout.label}
            </div>
            <p className="text-sm text-foreground leading-relaxed">{info.callout.body}</p>
          </div>
        )}

        {/* Signature */}
        {info.signature && (
          <div className="pt-1">
            <div className="w-12 h-px bg-accent mb-3" />
            <p className="font-display italic text-xl text-primary">{info.signature}</p>
          </div>
        )}
      </div>

      {/* Prev / Next (same pattern as the report templates) */}
      {(prev || next) && (
        <div className="border-t border-border pt-8 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prev ? (
            <button
              onClick={() => onNavigate(prev.id)}
              className="group flex items-center gap-3 text-left bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                  ← Previous
                </p>
                <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">
                  {prev.title}
                </p>
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
          {next ? (
            <button
              onClick={() => onNavigate(next.id)}
              className="group flex items-center gap-3 text-right justify-end bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
            >
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                  Next →
                </p>
                <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">
                  {next.title}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      )}
    </div>
  );
};

export default DemoInfoPageView;
