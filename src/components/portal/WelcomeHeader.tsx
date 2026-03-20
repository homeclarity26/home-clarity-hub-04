import { format } from "date-fns";
import { Home } from "lucide-react";

interface WelcomeHeaderProps {
  firstName?: string;
  propertyAddress?: string;
  estimatedValue?: number | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const WelcomeHeader = ({ firstName, propertyAddress, estimatedValue }: WelcomeHeaderProps) => {
  const greeting = getGreeting();
  const today = format(new Date(), "EEEE, MMMM d");
  const displayName = firstName || "there";

  return (
    <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-3">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground">
          {greeting}, {displayName}
        </h1>
        {estimatedValue && (
          <span className="font-mono text-[11px] tracking-[0.1em] text-accent">
            ${estimatedValue.toLocaleString()}
          </span>
        )}
      </div>
      <p className="font-sans text-base text-muted-foreground">
        {propertyAddress ? `${propertyAddress} · ${today}` : today}
      </p>
    </section>
  );
};

export default WelcomeHeader;
