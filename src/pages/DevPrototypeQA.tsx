import { useState } from "react";
import ReportHome from "@/components/portal/report/ReportHome";
import RoomTemplatePage from "@/components/report/templates/RoomTemplatePage";
import SystemTemplatePage from "@/components/report/templates/SystemTemplatePage";
import VisionTemplatePage from "@/components/report/templates/VisionTemplatePage";
import StrategyTemplatePage from "@/components/report/templates/StrategyTemplatePage";
import { reportGroups, reportPages } from "@/data/reportContent";
import {
  kitchenGroup,
  kitchenPage,
  kitchenBlocks,
  furnaceGroup,
  furnacePage,
  furnaceBlocks,
  visionBathGroup,
  visionBathPage,
  visionBathBlocks,
  strategyGroup,
  servicesPage,
  servicesBlocks,
  roadmapPage,
  roadmapBlocks,
  reportHomeProps,
} from "@/data/prototypeQaFixtures";

/**
 * Developer-only visual QA harness — renders the REAL client report
 * template components with static Caldwell demo data so we can diff
 * against the locked prototype without logging in. Mounted at
 * /dev/prototype-qa next to /dev/portal-qa.
 */

type ScenarioId =
  | "report-home"
  | "room-kitchen"
  | "system-furnace"
  | "vision-bath"
  | "recurring-services"
  | "strategy-roadmap";

const SCENARIOS: { id: ScenarioId; label: string; sublabel: string }[] = [
  { id: "report-home", label: "Report Home", sublabel: "Chapter navigation" },
  { id: "room-kitchen", label: "Room: Kitchen", sublabel: "Evolving record example" },
  { id: "system-furnace", label: "System: Furnace", sublabel: "With Replacement Briefing" },
  { id: "vision-bath", label: "Vision: Primary Bath", sublabel: "Spa conversion project" },
  { id: "recurring-services", label: "Recurring Services", sublabel: "20-service register" },
  { id: "strategy-roadmap", label: "Strategy: 10-Year Plan", sublabel: "Phases + capital plan" },
];

const noop = () => undefined;

// Allow deep-linking a scenario for automated screenshot diffs:
// /dev/prototype-qa?scenario=room-kitchen
function initialScenario(): ScenarioId {
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return SCENARIOS.some((s) => s.id === requested)
    ? (requested as ScenarioId)
    : "report-home";
}

const DevPrototypeQA = () => {
  const [active, setActive] = useState<ScenarioId>(initialScenario);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left nav */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-card min-h-screen">
        <div className="px-4 py-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent mb-1">
            Prototype QA
          </p>
          <p className="font-display text-lg text-primary leading-tight">
            The Caldwells
          </p>
        </div>
        <nav>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full text-left px-4 py-3 border-l-2 transition-colors min-h-[44px] ${
                active === s.id
                  ? "border-accent bg-background"
                  : "border-transparent hover:bg-background/60"
              }`}
              data-scenario={s.id}
            >
              <span className="block font-sans text-sm font-medium text-foreground">
                {s.label}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {s.sublabel}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Scenario canvas */}
      <main className="flex-1 min-w-0">
        {active === "report-home" && (
          <ReportHome
            groups={reportGroups}
            pages={reportPages}
            propertyName={reportHomeProps.propertyName}
            propertyAddress={reportHomeProps.propertyAddress}
            completionPercent={reportHomeProps.completionPercent}
            onChapterSelect={noop}
            onPageSelect={noop}
          />
        )}
        {active === "room-kitchen" && (
          <RoomTemplatePage
            page={kitchenPage}
            group={kitchenGroup}
            blocks={kitchenBlocks}
            images={[]}
            prevPage={null}
            nextPage={null}
            prevPageId={null}
            nextPageId={null}
          />
        )}
        {active === "system-furnace" && (
          <SystemTemplatePage
            page={furnacePage}
            group={furnaceGroup}
            blocks={furnaceBlocks}
            images={[]}
            prevPage={null}
            nextPage={null}
            prevPageId={null}
            nextPageId={null}
          />
        )}
        {active === "vision-bath" && (
          <VisionTemplatePage
            page={visionBathPage}
            group={visionBathGroup}
            blocks={visionBathBlocks}
            images={[]}
            prevPage={null}
            nextPage={null}
            prevPageId={null}
            nextPageId={null}
          />
        )}
        {active === "recurring-services" && (
          <StrategyTemplatePage
            page={servicesPage}
            group={strategyGroup}
            blocks={servicesBlocks}
            images={[]}
            prevPage={null}
            nextPage={null}
            prevPageId={null}
            nextPageId={null}
          />
        )}
        {active === "strategy-roadmap" && (
          <StrategyTemplatePage
            page={roadmapPage}
            group={strategyGroup}
            blocks={roadmapBlocks}
            images={[]}
            prevPage={null}
            nextPage={null}
            prevPageId={null}
            nextPageId={null}
          />
        )}
      </main>
    </div>
  );
};

export default DevPrototypeQA;
