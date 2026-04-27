import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * PropertyHero — the WOW moment.
 *
 * Full-bleed property photo (admin-uploaded, independent from Hover scan)
 * with a dark gradient overlay, property name in Playfair, address in Inter.
 * The client's actual home dominates the first screen.
 *
 * Falls back to a navy gradient when no hero photo is set yet.
 */
interface PropertyHeroProps {
  propertyName: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  yearBuilt?: number | null;
  greeting?: string;
  firstName?: string;
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
          alt={propertyAddress ? `${propertyName}, ${propertyAddress}` : propertyName}
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-accent mb-3"
        >
          {displayGreeting}
          {firstName ? `, ${firstName}` : ""}
        </motion.p>

        {/* Property name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl md:text-6xl text-white leading-[1.05] max-w-2xl"
        >
          {propertyName}
        </motion.h1>

        {/* Address + metadata */}
        {(propertyAddress || yearBuilt) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="font-sans text-sm md:text-base text-white/75 mt-2"
          >
            {propertyAddress}
            {propertyAddress && yearBuilt ? " · " : ""}
            {yearBuilt ? `Built ${yearBuilt}` : ""}
          </motion.p>
        )}
      </div>

      {/* Subtle placeholder nudge when admin hasn't uploaded a hero photo yet */}
      {!heroImageUrl && (
        <div className="absolute top-5 right-5 font-mono text-[9px] uppercase tracking-wider text-white/40 hidden md:block pointer-events-none">
          Upload a front-of-house photo in the admin intake wizard
        </div>
      )}
    </section>
  );
}
