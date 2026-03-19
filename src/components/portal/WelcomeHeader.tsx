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
    <div className="w-full px-6 md:px-20 py-4 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div>
          <h1 className="font-display text-2xl md:text-[28px] text-foreground leading-tight">
            {greeting}, {displayName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {today}
            </p>
            {propertyAddress && (
              <>
                <span className="text-border">·</span>
                <p className="font-sans text-sm text-muted-foreground">{propertyAddress}</p>
              </>
            )}
          </div>
        </div>
        {estimatedValue && (
          <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
            <Home className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono text-[11px] tracking-[0.1em] text-accent">
              ${estimatedValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeHeader;
