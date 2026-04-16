import { HealthScoreRing } from "@/components/ui/HealthScoreRing";
import { cn } from "@/lib/utils";

/**
 * PropertyHero — the WOW moment.
 *
 * Full-bleed property photo (admin-uploaded, independent from Hover scan)
 * with a dark gradient overlay, property name in Playfair, address in Inter,
 * score ring pinned bottom-right.
 *
 * The client's actual home dominates the first screen. Not a generic dashboard.
 *
 * If no photo is provided yet (new client, photo not yet uploaded), falls back
 * to a navy gradient so the UI never looks broken. The admin is reminded to
 * upload a photo via the intake wizard.
 */
interface PropertyHeroProps {
  propertyName: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  healthScore?: number | null;
  yearBuilt?: number | null;
  greeting?: string; // "Good morning" etc — optional eyebrow
  firstName?: string; // "Adam" — optional personalization
  className?: string;
}

function getGreetingByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function PropertyHero({
  propertyName,
  propertyAddress,
  heroImageUrl,
  healthScore,
  yearBuilt,
  greeting,
  firstName,
  className,
}: PropertyHeroProps) {
  const displayGreeting = greeting ?? getGreetingByHour();

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-primary",
        "h-[60vh] min-h-[440px] md:min-h-[520px]",
        className,
      )}
    >
      {heroImageUrl ? (
        <img
          src={heroImageUrl}
          alt={propertyAddress ? `${propertyName} — ${propertyAddress}` : propertyName}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          // @ts-expect-error - fetchpriority is a valid HTML attr, React types lag
          fetchpriority="high"
          decoding="async"
        />
      ) : (
        // Fallback: subtle navy gradient with texture so the hero never looks empty
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"
          aria-hidden="true"
        />
      )}
      {/* Darkening gradient pulled up from the bottom for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/75 via-black/45 to-transparent"
      />

      <div className="relative z-10 h-full flex flex-col justify-end max-w-5xl mx-auto px-6 md:px-20 pb-10 md:pb-14">
        {/* Eyebrow */}
        <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-accent mb-3">
          {displayGreeting}
          {firstName ? `, ${firstName}` : ""}
          {healthScore != null && ` · Condition ${healthScore}`}
        </p>

        {/* Property name */}
        <h1 className="font-display text-4xl md:text-6xl text-white leading-[1.05] max-w-2xl">
          {propertyName}
        </h1>

        {/* Address + metadata */}
        {(propertyAddress || yearBuilt) && (
          <p className="font-sans text-sm md:text-base text-white/75 mt-2">
            {propertyAddress}
            {propertyAddress && yearBuilt ? " · " : ""}
            {yearBuilt ? `Built ${yearBuilt}` : ""}
          </p>
        )}
      </div>

      {/* Score ring — pinned bottom-right on desktop; inline on mobile below copy */}
      {healthScore != null && (
        <>
          <div className="absolute bottom-8 right-8 hidden md:block z-10">
            <HealthScoreRing
              score={healthScore}
              size={96}
              strokeWidth={6}
              animate
              trackClassName="text-white/20"
              numberClassName="text-white"
              label={`Overall home condition score ${healthScore}`}
            />
          </div>
          <div className="absolute bottom-6 right-6 md:hidden z-10">
            <HealthScoreRing
              score={healthScore}
              size={64}
              strokeWidth={5}
              animate
              trackClassName="text-white/20"
              numberClassName="text-white"
              label={`Overall home condition score ${healthScore}`}
            />
          </div>
        </>
      )}

      {/* Subtle placeholder nudge when admin hasn't uploaded a hero photo yet */}
      {!heroImageUrl && (
        <div className="absolute top-5 right-5 font-mono text-[9px] uppercase tracking-wider text-white/40 hidden md:block pointer-events-none">
          Upload a front-of-house photo in the admin intake wizard
        </div>
      )}
    </section>
  );
}
