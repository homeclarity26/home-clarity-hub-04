import { useEffect, useState, type ReactNode } from "react";
import ReportHome from "@/components/portal/report/ReportHome";
import { PortalHome } from "@/components/portal/home/PortalHome";
import ConciergeBar from "@/components/portal/concierge/ConciergeBar";
import ConciergePanel from "@/components/portal/concierge/ConciergePanel";
import RoomTemplatePage from "@/components/report/templates/RoomTemplatePage";
import SystemTemplatePage from "@/components/report/templates/SystemTemplatePage";
import VisionTemplatePage from "@/components/report/templates/VisionTemplatePage";
import StrategyTemplatePage from "@/components/report/templates/StrategyTemplatePage";
import { reportGroups, reportPages } from "@/data/reportContent";
import {
  kitchenGroup,
  kitchenPage,
  kitchenBlocks,
  kitchenImages,
  furnaceGroup,
  furnacePage,
  furnaceBlocks,
  furnaceImages,
  visionBathGroup,
  visionBathPage,
  visionBathBlocks,
  strategyGroup,
  servicesPage,
  servicesBlocks,
  roadmapPage,
  roadmapBlocks,
  reportHomeProps,
  portalHomeQaProps,
  bobbyPanelQaThread,
  bobbyPanelQaHomeLabel,
  wizardQaClient,
  wizardQaUploads,
  wizardQaHoverUrl,
  wizardQaIguideUrl,
  wizardQaFindings,
  wizardQaTocSections,
  wizardQaPageSeeds,
  wizardQaStructuredAuthoring,
  wizardQaPageImages,
  wizardQaCapitalPlan,
  wizardQaMaintenanceCalendar,
  wizardQaRecurringServices,
} from "@/data/prototypeQaFixtures";
import {
  WizardProvider,
  useWizard,
  type WizardStepKey,
} from "@/contexts/WizardContext";
import { WizardShell } from "@/components/admin/wizard/WizardShell";

/**
 * Developer-only visual QA harness — renders the REAL client report
 * template components with static Caldwell demo data so we can diff
 * against the locked prototype without logging in. Mounted at
 * /dev/prototype-qa next to /dev/portal-qa.
 */

type ScenarioId =
  | "portal-home"
  | "bobby-panel"
  | "report-home"
  | "room-kitchen"
  | "system-furnace"
  | "vision-bath"
  | "recurring-services"
  | "strategy-roadmap"
  | "wizard-step1-empty"
  | "wizard-step1"
  | "wizard-step2"
  | "wizard-step3"
  | "wizard-step3-bath"
  | "wizard-step3-system"
  | "wizard-step3-vision"
  | "wizard-step3-exec"
  | "wizard-step4"
  | "wizard-step5";

const SCENARIOS: { id: ScenarioId; label: string; sublabel: string }[] = [
  { id: "portal-home", label: "Portal Home", sublabel: "Hero + media cards" },
  { id: "bobby-panel", label: "Bobby Panel", sublabel: "Prompt chips + reply" },
  { id: "report-home", label: "Report Home", sublabel: "Chapter navigation" },
  { id: "room-kitchen", label: "Room: Kitchen", sublabel: "Evolving record example" },
  { id: "system-furnace", label: "System: Furnace", sublabel: "With Replacement Briefing" },
  { id: "vision-bath", label: "Vision: Primary Bath", sublabel: "Spa conversion project" },
  { id: "recurring-services", label: "Recurring Services", sublabel: "20-service register" },
  { id: "strategy-roadmap", label: "Strategy: 10-Year Plan", sublabel: "Phases + capital plan" },
  { id: "wizard-step1-empty", label: "Wizard 1: Intake (empty)", sublabel: "Screen 1" },
  { id: "wizard-step1", label: "Wizard 1: Intake (findings)", sublabel: "Screens 2 + 4" },
  { id: "wizard-step2", label: "Wizard 2: TOC Proposal", sublabel: "Screens 5-7" },
  { id: "wizard-step3", label: "Wizard 3: Room (Kitchen)", sublabel: "Screen 8" },
  { id: "wizard-step3-bath", label: "Wizard 3: Room (Bath)", sublabel: "Screen 9, vision link" },
  { id: "wizard-step3-system", label: "Wizard 3: System (Furnace)", sublabel: "Screens 10-12" },
  { id: "wizard-step3-vision", label: "Wizard 3: Vision (Bath)", sublabel: "Screens 13-14" },
  { id: "wizard-step3-exec", label: "Wizard 3: Exec Summary", sublabel: "Screen 15" },
  { id: "wizard-step4", label: "Wizard 4: Strategy", sublabel: "Screens 16-19" },
  { id: "wizard-step5", label: "Wizard 5: Publish", sublabel: "Screen 20" },
];

// ─── Wizard harness ───────────────────────────────────────────────────────
// Seeds the REAL WizardContext through its public setters (no network:
// there is no signed-in user so autosave/persist no-op, and qaMode
// suppresses the steps' on-mount edge-function calls), then mounts the
// real WizardShell.

interface WizardSeed {
  step: WizardStepKey;
  /** Screen 1 variant: client only, nothing uploaded yet. */
  empty?: boolean;
  /** Step 3 variants: which page starts active (default kitchen). */
  activePage?: string;
}

function WizardSeeder({ seed, children }: { seed: WizardSeed; children: ReactNode }) {
  const {
    setClient,
    setIntakeUploads,
    setHoverUrl,
    setIguideUrl,
    setFindings,
    setPageSeeds,
    setTocSections,
    upsertAuthoring,
    setActivePageKey,
    setCapitalPlan,
    setMaintenanceCalendar,
    setRecurringServicesPreview,
    goToStep,
  } = useWizard();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setClient(wizardQaClient);
    if (!seed.empty) {
      for (const key of Object.keys(wizardQaUploads) as (keyof typeof wizardQaUploads)[]) {
        setIntakeUploads(key, wizardQaUploads[key]);
      }
      setHoverUrl(wizardQaHoverUrl);
      setIguideUrl(wizardQaIguideUrl);
      setFindings(wizardQaFindings);
      setPageSeeds(wizardQaPageSeeds);
      setTocSections(wizardQaTocSections);
      // Pre-author a few pages so the Step 3 rail shows mixed statuses.
      upsertAuthoring("welcome-letter", {
        content: [{ type: "narrative", value: "Mark, Jennifer, Olivia, and Jack: thank you for inviting me into your home." }],
        status: "reviewed",
      });
      upsertAuthoring("executive-summary", {
        content: [{ type: "narrative", value: "Mark, Jennifer, Olivia, and Jack: thank you for inviting me into your home. After two-plus hours together and a thorough scan of every space and system, I've put together what I believe is the most accurate and useful picture of your home that exists anywhere." }],
        status: "reviewed",
      });
      // Phase 5b — structured payloads for the per-type Step 3 editors
      // (Kitchen room, Furnace system + briefing, Vision tiers, Exec themes).
      for (const [pageKey, structured] of Object.entries(
        wizardQaStructuredAuthoring,
      )) {
        upsertAuthoring(pageKey, { structured });
      }
      // Phase 4 — page photo assignments (Step 3 PHOTOS group chips).
      for (const [pageKey, images] of Object.entries(wizardQaPageImages)) {
        upsertAuthoring(pageKey, { images });
      }
      setActivePageKey(seed.activePage ?? "kitchen");
      setCapitalPlan(wizardQaCapitalPlan);
      setMaintenanceCalendar(wizardQaMaintenanceCalendar);
      setRecurringServicesPreview(wizardQaRecurringServices);
    }
    if (seed.step !== "intake") {
      void goToStep(seed.step);
    }
    setReady(true);
    // Seed exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready ? <>{children}</> : null;
}

function WizardScenario({ seed }: { seed: WizardSeed }) {
  return (
    <WizardProvider>
      <WizardSeeder seed={seed}>
        <WizardShell qaMode />
      </WizardSeeder>
    </WizardProvider>
  );
}

const WIZARD_SCENARIO_SEEDS: Partial<Record<ScenarioId, WizardSeed>> = {
  "wizard-step1-empty": { step: "intake", empty: true },
  "wizard-step1": { step: "intake" },
  "wizard-step2": { step: "toc" },
  "wizard-step3": { step: "authoring" },
  "wizard-step3-bath": { step: "authoring", activePage: "primary-bathroom" },
  "wizard-step3-system": { step: "authoring", activePage: "furnace-main" },
  "wizard-step3-vision": { step: "authoring", activePage: "vision-primary-bath" },
  "wizard-step3-exec": { step: "authoring", activePage: "executive-summary" },
  "wizard-step4": { step: "strategy" },
  "wizard-step5": { step: "publish" },
};

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
        {active === "portal-home" && (
          <div className="relative min-h-screen flex flex-col">
            <div className="flex-1">
              <PortalHome
                onNavigate={noop}
                propertyName={portalHomeQaProps.propertyName}
                propertyAddress={portalHomeQaProps.propertyAddress}
                heroImageUrl={portalHomeQaProps.heroImageUrl}
                yearBuilt={portalHomeQaProps.yearBuilt}
                hoverUrl={portalHomeQaProps.hoverUrl}
                hoverMeta={portalHomeQaProps.hoverMeta}
                iguideUrl={portalHomeQaProps.iguideUrl}
                iguideMeta={portalHomeQaProps.iguideMeta}
                isAdminPreview
              />
            </div>
            <ConciergeBar />
          </div>
        )}
        {active === "bobby-panel" && (
          <div className="min-h-screen bg-background">
            <ConciergePanel
              open
              onOpenChange={noop}
              homeLabel={bobbyPanelQaHomeLabel}
              qaThread={bobbyPanelQaThread}
            />
          </div>
        )}
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
            images={kitchenImages}
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
            images={furnaceImages}
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
        {WIZARD_SCENARIO_SEEDS[active] && (
          // Key by scenario so switching remounts a fresh provider + seed.
          <WizardScenario key={active} seed={WIZARD_SCENARIO_SEEDS[active]!} />
        )}
      </main>
    </div>
  );
};

export default DevPrototypeQA;
