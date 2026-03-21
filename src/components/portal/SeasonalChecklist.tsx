import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Leaf, Snowflake, Sun, CloudRain, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SeasonalChecklistProps {
  propertyId?: string;
}

type Season = "spring" | "summer" | "fall" | "winter";

const SEASON_META: Record<Season, { icon: React.ElementType; label: string; color: string }> = {
  spring: { icon: CloudRain, label: "Spring", color: "text-primary" },
  summer: { icon: Sun, label: "Summer", color: "text-accent" },
  fall: { icon: Leaf, label: "Fall", color: "text-orange-600" },
  winter: { icon: Snowflake, label: "Winter", color: "text-blue-500" },
};

const SEASONAL_TASKS: Record<Season, { title: string; description: string; category: string }[]> = {
  spring: [
    { title: "Inspect roof for winter damage", description: "Look for missing shingles, flashing damage", category: "exterior" },
    { title: "Clean gutters and downspouts", description: "Clear debris and check for proper drainage", category: "exterior" },
    { title: "Service HVAC — switch to cooling", description: "Change filters, schedule professional tune-up", category: "hvac" },
    { title: "Test irrigation system", description: "Check sprinkler heads, adjust timers", category: "exterior" },
    { title: "Check window and door seals", description: "Replace weatherstripping if worn", category: "structure" },
  ],
  summer: [
    { title: "Deep clean dryer vents", description: "Prevent fire hazard, improve efficiency", category: "appliances" },
    { title: "Inspect deck and patio", description: "Check for rot, reseal if needed", category: "exterior" },
    { title: "Test smoke and CO detectors", description: "Replace batteries, verify all units work", category: "safety" },
    { title: "Check attic ventilation", description: "Ensure proper airflow to prevent heat buildup", category: "structure" },
    { title: "Inspect exterior paint and caulking", description: "Touch up before fall weather", category: "exterior" },
  ],
  fall: [
    { title: "Service furnace / heating system", description: "Professional inspection before winter", category: "hvac" },
    { title: "Clean gutters (pre-winter)", description: "Remove fallen leaves, check downspouts", category: "exterior" },
    { title: "Winterize outdoor faucets", description: "Disconnect hoses, insulate spigots", category: "plumbing" },
    { title: "Seal gaps around foundation", description: "Prevent drafts and pest entry", category: "structure" },
    { title: "Test backup generator / sump pump", description: "Ensure readiness for winter storms", category: "electrical" },
  ],
  winter: [
    { title: "Monitor for ice dams", description: "Check roof edges after snowfall", category: "exterior" },
    { title: "Change HVAC filters", description: "Monthly during heavy use", category: "hvac" },
    { title: "Check pipe insulation", description: "Prevent freezing in unheated areas", category: "plumbing" },
    { title: "Test GFCI outlets", description: "Press test/reset buttons to verify", category: "electrical" },
    { title: "Inspect fireplace and chimney", description: "Clean before use, check damper", category: "hvac" },
  ],
};

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

const SeasonalChecklist = ({ propertyId }: SeasonalChecklistProps) => {
  const currentSeason = getCurrentSeason();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const key = `hbc_seasonal_${propertyId || "default"}_${currentSeason}_${new Date().getFullYear()}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      setCompleted(saved);
    } catch {}
  }, [propertyId, currentSeason]);

  const toggleTask = (title: string) => {
    const next = { ...completed, [title]: !completed[title] };
    setCompleted(next);
    const key = `hbc_seasonal_${propertyId || "default"}_${currentSeason}_${new Date().getFullYear()}`;
    localStorage.setItem(key, JSON.stringify(next));
  };

  const tasks = SEASONAL_TASKS[currentSeason];
  const doneCount = tasks.filter((t) => completed[t.title]).length;
  const SeasonIcon = SEASON_META[currentSeason].icon;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="w-full text-left bg-transparent border-none cursor-pointer">
        <div className="bg-card rounded-lg shadow-hbc-sm border border-border p-5 hover:shadow-hbc-md transition-shadow">
          <div className="flex items-center gap-3">
            <SeasonIcon className={`w-5 h-5 ${SEASON_META[currentSeason].color}`} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-foreground">{SEASON_META[currentSeason].label} Maintenance</h3>
              <p className="font-sans text-xs text-muted-foreground">{doneCount} of {tasks.length} completed</p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">{Math.round((doneCount / tasks.length) * 100)}%</Badge>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 bg-card rounded-lg shadow-hbc-sm border border-border divide-y divide-border">
          {tasks.map((task) => (
            <label
              key={task.title}
              className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <Checkbox
                checked={!!completed[task.title]}
                onCheckedChange={() => toggleTask(task.title)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-sans ${completed[task.title] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.title}
                </p>
                <p className="text-xs font-sans text-muted-foreground mt-0.5">{task.description}</p>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono shrink-0">{task.category}</Badge>
            </label>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SeasonalChecklist;
