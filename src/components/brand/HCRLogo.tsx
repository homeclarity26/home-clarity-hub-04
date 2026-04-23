interface HCRLogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { wordmark: "text-lg", eyebrow: "text-[7px]", rule: "w-8 h-[1px]" },
  md: { wordmark: "text-2xl", eyebrow: "text-[8px]", rule: "w-10 h-[1.5px]" },
  lg: { wordmark: "text-[40px]", eyebrow: "text-[10px]", rule: "w-14 h-[2px]" },
};

const HCRLogo = ({ variant = "default", size = "md", className = "" }: HCRLogoProps) => {
  const s = SIZE_MAP[size];
  const text = variant === "light" ? "text-primary-foreground" : "text-primary";
  const rule = variant === "light" ? "bg-accent" : "bg-accent";
  const eyebrow = variant === "light" ? "text-primary-foreground/70" : "text-primary";
  const eyebrowSub = variant === "light" ? "text-accent/90" : "text-accent";

  return (
    <div className={`flex flex-col items-start leading-none ${className}`}>
      <span
        className={`font-display font-bold tracking-tight ${text} ${s.wordmark}`}
        aria-label="HCR — Home Clarity Report"
      >
        HCR
      </span>
      <div className={`${s.rule} ${rule} my-1.5`} />
      <span
        className={`font-sans uppercase tracking-[0.22em] font-semibold ${eyebrow} ${s.eyebrow}`}
      >
        Home Clarity
      </span>
      <span
        className={`font-sans tracking-[0.12em] mt-0.5 ${eyebrowSub} ${s.eyebrow}`}
      >
        Report
      </span>
    </div>
  );
};

export default HCRLogo;
