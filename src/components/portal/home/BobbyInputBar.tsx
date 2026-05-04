interface BobbyInputBarProps {
  onOpen: () => void;
}

export function BobbyInputBar({ onOpen }: BobbyInputBarProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 min-h-[56px] text-left hover:border-accent/40 hover:bg-accent/5 transition-all"
    >
      <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
        <span className="font-display text-sm font-bold text-primary-foreground">B</span>
      </span>
      <span className="text-sm font-sans text-muted-foreground flex-1">
        Ask Bobby anything about your home...
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">
        Open
      </span>
    </button>
  );
}
