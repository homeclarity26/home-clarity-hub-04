import { Leaf, Snowflake, Sun, Flower2, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

const SEASONS = [
  {
    key: "spring",
    label: "Spring",
    icon: Flower2,
    months: [3, 4, 5],
    tips: [
      { task: "Inspect roof for winter damage", system: "Roof" },
      { task: "Clean gutters and downspouts", system: "Exterior" },
      { task: "Service HVAC: switch to cooling mode", system: "HVAC" },
      { task: "Check exterior paint and caulking", system: "Exterior" },
      { task: "Test sump pump operation", system: "Plumbing" },
    ],
  },
  {
    key: "summer",
    label: "Summer",
    icon: Sun,
    months: [6, 7, 8],
    tips: [
      { task: "Replace HVAC filters", system: "HVAC" },
      { task: "Inspect deck/patio for damage", system: "Exterior" },
      { task: "Check irrigation system", system: "Plumbing" },
      { task: "Test smoke and CO detectors", system: "Safety" },
      { task: "Seal driveway cracks", system: "Exterior" },
    ],
  },
  {
    key: "fall",
    label: "Fall",
    icon: Leaf,
    months: [9, 10, 11],
    tips: [
      { task: "Schedule furnace maintenance", system: "HVAC" },
      { task: "Clean gutters before freeze", system: "Exterior" },
      { task: "Winterize outdoor faucets", system: "Plumbing" },
      { task: "Inspect weatherstripping on doors/windows", system: "Interior" },
      { task: "Check attic insulation", system: "Roof" },
    ],
  },
  {
    key: "winter",
    label: "Winter",
    icon: Snowflake,
    months: [12, 1, 2],
    tips: [
      { task: "Monitor pipes for freezing", system: "Plumbing" },
      { task: "Replace furnace filter monthly", system: "HVAC" },
      { task: "Check for ice dams on roof", system: "Roof" },
      { task: "Test emergency generators/sump pumps", system: "Electrical" },
      { task: "Inspect water heater for leaks", system: "Plumbing" },
    ],
  },
];

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  return SEASONS.find((s) => s.months.includes(month))!;
}

const SeasonalMaintenanceTips = () => {
  const currentSeason = getCurrentSeason();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (task: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.has(task) ? next.delete(task) : next.add(task);
      return next;
    });
  };

  const Icon = currentSeason.icon;
  const completedCount = currentSeason.tips.filter((t) => completedTasks.has(t.task)).length;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Seasonal Maintenance</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">{currentSeason.label} Checklist</h3>
            <p className="font-mono text-[10px] text-muted-foreground">{completedCount}/{currentSeason.tips.length} completed</p>
          </div>
        </div>

        <div className="w-full h-1 bg-border rounded-full mb-4">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${(completedCount / currentSeason.tips.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {currentSeason.tips.map((tip) => {
            const done = completedTasks.has(tip.task);
            return (
              <button
                key={tip.task}
                onClick={() => toggleTask(tip.task)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/40 bg-transparent cursor-pointer transition-all text-left"
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`font-sans text-sm flex-1 ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {tip.task}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tip.system}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeasonalMaintenanceTips;
