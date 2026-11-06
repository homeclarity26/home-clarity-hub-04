import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { PortalActionsProvider, type PortalActions } from "@/contexts/PortalActionsContext";
import { PortalHome } from "@/components/portal/home/PortalHome";
import ConciergeBar from "@/components/portal/concierge/ConciergeBar";
import ReportTab from "@/components/tabs/ReportTab";
import ReportChapterNav, { CHAPTERS } from "@/components/report/ReportChapterNav";
import DemoInfoPageView from "@/components/demo/DemoInfoPageView";
import DemoTour, { type DemoTourStop } from "@/components/demo/DemoTour";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ReportPageData } from "@/data/reportContent";
import { caldwellDemo } from "@/data/demo/caldwellDemo";
import { STRATEGY_PAGE_KEYS } from "@/data/demo/caldwellBuilder";
import {
  DEMO_BOBBY_PROMPTS,
  demoBobbyReply,
  type DemoBobbyContext,
} from "@/data/demo/caldwellBobbyScript";

/**
 * Public, no-login sample of the client portal at /demo.
 *
 * Renders the REAL portal components (PortalHome, ReportTab and its page
 * templates, the Bobby bar and panel) against the static Caldwell report in
 * src/data/demo. Nothing here reads or writes Supabase: there is no
 * property id, Bobby answers from a script, and every button either works
 * locally or opens Bobby.
 *
 * URL state: /demo (home), /demo?view=report, /demo?page=<pageKey>.
 * Extras: ?tour=off skips the first-visit tour, ?tour=<1-7> opens the tour
 * at a stop, ?bobby=<1-5> opens Bobby with that sample question asked.
 */

const DOC_TITLE = "The Caldwell Residence · Sample Home Clarity Report";
const CTA_HREF = "mailto:adam@hometownbuildersclub.com?subject=Home%20Clarity%20Report%20inquiry";
const CTA_LABEL = "Get your Home Clarity Report";
const SAMPLE_NOTE =
  "the Caldwell Residence is a fictional home, shown exactly as a client sees their own.";
const TOUR_SEEN_KEY = "hcr-demo-tour-seen";

const demo = caldwellDemo;
// ReportTab types `narrative` as the legacy string[]; at runtime it accepts
// the published ReportBlock[] shape, which is what the builder produces.
const reportPages = demo.pages as unknown as Record<string, ReportPageData>;
const allPageIds = demo.groups.flatMap((g) => g.pages);

const chapters = CHAPTERS.map((ch) => ({
  id: ch.id,
  label: ch.label,
  pages: demo.groups
    .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
    .flatMap((g) => g.pages),
})).filter((ch) => ch.pages.length > 0);

const chapterOf = (pageKey: string | null) =>
  pageKey ? chapters.find((ch) => ch.pages.includes(pageKey))?.id ?? null : null;

const hasServices = !!demo.pages[STRATEGY_PAGE_KEYS.services];
const hasRoadmap = !!demo.pages[STRATEGY_PAGE_KEYS.roadmap];

function headingByText(selector: string, text: string): Element | null {
  return (
    Array.from(document.querySelectorAll(selector)).find((el) =>
      (el.textContent ?? "").trim().toLowerCase().startsWith(text.toLowerCase()),
    ) ?? null
  );
}

function buildTourStops(): DemoTourStop[] {
  const serviceCount =
    (
      demo.pages[STRATEGY_PAGE_KEYS.services]?.narrative[0]?.content as
        | { services?: unknown[] }
        | undefined
    )?.services?.length ?? 20;

  const stops: DemoTourStop[] = [
    {
      step: 1,
      title: "This is a client's portal home",
      body: "Every Home Clarity Report client gets a private portal like this one. Their own home is on the cover, with the 3D exterior model and the 360 degree interior tour one tap away.",
      target: { view: "home" },
    },
    {
      step: 2,
      title: "The report, chapter by chapter",
      body: "The full report lives here: five chapters covering every room, every system and the plan ahead. Open any chapter card to start reading.",
      target: { view: "report" },
    },
    {
      step: 3,
      title: "Every room gets its own record",
      body: "The kitchen shows how a room is documented: dimensions, paint colors, flooring, fixtures, a condition rating in plain words and what we noticed on the walkthrough.",
      target: { page: "kitchen" },
    },
    {
      step: 4,
      title: "Systems come with a replacement plan",
      body: "Each system shows its age against its expected life. This furnace is near the end, so its Replacement Briefing is already scoped and priced at three levels.",
      target: { page: "furnace-main-zone" },
      anchor: () => headingByText("h3", "Lifecycle Timeline")?.parentElement ?? null,
    },
    {
      step: 5,
      title: "Projects, scoped three ways",
      body: "Vision pages turn a wish into a plan. The primary bath is priced at Essential, Enhanced and Signature levels, so the family chooses the pace and the budget.",
      target: { page: "vision-primary-bath" },
      anchor: () => headingByText("h3", "Investment Ranges")?.parentElement ?? null,
    },
    {
      step: 6,
      title: "Every recurring service, in one place",
      body: `All ${serviceCount} services the home runs on: who provides each one, what it costs per month and what is overdue. Tap Next for the long view.`,
      target: { page: STRATEGY_PAGE_KEYS.services },
    },
    {
      step: 6,
      title: "The 10-Year Plan",
      body: "Projects are sequenced into defense, offense and expansion, so the big items arrive on the family's schedule instead of as surprises.",
      target: { page: STRATEGY_PAGE_KEYS.roadmap },
    },
    {
      step: 7,
      title: "Meet Bobby",
      body: "Bobby is the assistant trained on this home's record. Clients ask Bobby to schedule a visit, pay an invoice, pull up a photo or message Adam. Try the sample questions.",
      target: { page: STRATEGY_PAGE_KEYS.roadmap },
      anchor: () => document.querySelector("[data-bobby-bar]"),
      anchorPinned: true,
    },
  ];
  // A stop whose page is not in the report falls back to the report cover.
  return stops.map((s) =>
    "page" in s.target && !demo.pages[s.target.page]
      ? { ...s, target: { view: "report" as const }, anchor: s.anchorPinned ? s.anchor : undefined }
      : s,
  );
}

const TOUR_STOPS = buildTourStops();
const TOUR_TOTAL = 7;

interface NavItem {
  id: string;
  label: string;
  sub: string;
  active: boolean;
  indent?: boolean;
  onSelect: () => void;
}

function NavList({ items, onAfterSelect }: { items: NavItem[]; onAfterSelect?: () => void }) {
  return (
    <nav aria-label="Sample portal">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            item.onSelect();
            onAfterSelect?.();
          }}
          aria-current={item.active ? "page" : undefined}
          className={`w-full text-left py-2.5 pr-4 border-l-[3px] transition-colors min-h-[48px] ${
            item.indent ? "pl-8" : "pl-5"
          } ${
            item.active
              ? "border-accent bg-white"
              : "border-transparent hover:bg-background/70"
          }`}
        >
          <span
            className={`block font-sans text-sm ${
              item.active ? "font-semibold text-primary" : "font-medium text-foreground"
            }`}
          >
            {item.label}
          </span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">{item.sub}</span>
        </button>
      ))}
    </nav>
  );
}

const DemoPortal = () => {
  const [params, setParams] = useSearchParams();
  const pageParam = params.get("page");
  const pageKey = pageParam && demo.pages[pageParam] ? pageParam : null;
  const view: "home" | "report" =
    pageKey || params.get("view") === "report" ? "report" : "home";

  const [menuOpen, setMenuOpen] = useState(false);
  const [media, setMedia] = useState<"hover" | "iguide" | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [thread, setThread] = useState<
    { sender: "user" | "bobby" | "adam"; content: string; imageUrl?: string }[]
  >([]);
  const [pending, setPending] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(56);

  const desktopBarRef = useRef<HTMLElement>(null);
  const mobileBarRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;
  const viewRef = useRef(view);
  viewRef.current = view;

  // ── Navigation (URL is the single source of truth; back button works) ──
  const goHome = useCallback(() => setParams({}), [setParams]);
  const goReport = useCallback(() => setParams({ view: "report" }), [setParams]);
  const goPage = useCallback(
    (key: string) => {
      if (key && demo.pages[key]) setParams({ page: key });
      else setParams({ view: "report" });
    },
    [setParams],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, pageKey]);

  useEffect(() => {
    const previous = document.title;
    document.title = DOC_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  // ── Pinned bar height drives the sticky offsets below it ──
  useEffect(() => {
    const measure = () => {
      const h = desktopBarRef.current?.offsetHeight || mobileBarRef.current?.offsetHeight || 56;
      setHeaderHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (desktopBarRef.current) ro.observe(desktopBarRef.current);
    if (mobileBarRef.current) ro.observe(mobileBarRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ── Bobby, scripted ──
  const ask = useCallback((text: string, source: DemoBobbyContext["source"]) => {
    const clean = text.trim();
    if (!clean) return;
    const reply = demoBobbyReply(clean, { demo, pageKey: pageKeyRef.current, source });
    setThread((t) => [...t, { sender: "user", content: clean }]);
    setPending((p) => p + 1);
    const timer = window.setTimeout(() => {
      setThread((t) => [...t, { sender: "bobby", ...reply }]);
      setPending((p) => Math.max(p - 1, 0));
    }, 700);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach((t) => window.clearTimeout(t));
  }, []);

  const openBobby = useCallback(
    (prompt?: string) => {
      if (prompt && prompt.trim()) ask(prompt, "action");
      window.dispatchEvent(new CustomEvent("concierge:open", { detail: {} }));
    },
    [ask],
  );

  const actions = useMemo<PortalActions>(
    () => ({
      demoMode: true,
      openBobby,
      navigateToPage: goPage,
      hasPage: (key) => !!demo.pages[key],
      captionFor: (src) => (pageKey ? demo.photoCaptions[pageKey]?.[src] : undefined),
    }),
    [openBobby, goPage, pageKey],
  );

  // ── Tour ──
  const startTour = useCallback((index = 0) => {
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      // Private browsing: the tour simply is not remembered.
    }
    setMenuOpen(false);
    setTourIndex(index);
  }, []);
  const closeTour = useCallback(() => setTourIndex(null), []);

  // First visit, and the ?tour= / ?bobby= deep links. Runs once on mount
  // (deferred a tick so a development double-mount cannot run it twice).
  useEffect(() => {
    const boot = window.setTimeout(() => {
      const tourParam = params.get("tour");
      const bobbyParam = params.get("bobby");
      if (bobbyParam && /^[1-5]$/.test(bobbyParam)) {
        ask(DEMO_BOBBY_PROMPTS[Number(bobbyParam) - 1], "typed");
        window.dispatchEvent(new CustomEvent("concierge:open", { detail: {} }));
        return;
      }
      if (tourParam && /^[1-7]$/.test(tourParam)) {
        startTour(Math.max(TOUR_STOPS.findIndex((s) => s.step === Number(tourParam)), 0));
        return;
      }
      if (tourParam === "off" || params.get("page") || params.get("view")) return;
      let seen = false;
      try {
        seen = window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
      } catch {
        seen = false;
      }
      if (!seen) startTour(0);
    }, 0);
    return () => window.clearTimeout(boot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Each stop moves the portal once; the visitor can still wander freely.
  useEffect(() => {
    if (tourIndex == null) return;
    const target = TOUR_STOPS[tourIndex].target;
    if ("page" in target) {
      if (pageKeyRef.current !== target.page) goPage(target.page);
    } else if (target.view === "home") {
      if (viewRef.current !== "home") goHome();
    } else if (viewRef.current !== "report" || pageKeyRef.current) {
      goReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIndex]);

  // ── Left rail ──
  const activeChapter = chapterOf(pageKey);
  const isServices = pageKey === STRATEGY_PAGE_KEYS.services;
  const isRoadmap = pageKey === STRATEGY_PAGE_KEYS.roadmap;
  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      sub: "3D model, 360 tour, Bobby",
      active: view === "home",
      onSelect: goHome,
    },
    {
      id: "report",
      label: "Your Report",
      sub: "Read by chapter",
      active: view === "report" && !pageKey,
      onSelect: goReport,
    },
    ...chapters.map((ch) => ({
      id: `chapter-${ch.id}`,
      label: ch.label,
      sub: `${ch.pages.length} ${ch.pages.length === 1 ? "page" : "pages"}`,
      active: activeChapter === ch.id && !isServices && !isRoadmap,
      indent: true,
      onSelect: () => goPage(ch.pages[0]),
    })),
    ...(hasServices
      ? [
          {
            id: "services",
            label: "Recurring Services",
            sub: "Every vendor, cost and due date",
            active: isServices,
            onSelect: () => goPage(STRATEGY_PAGE_KEYS.services),
          },
        ]
      : []),
    ...(hasRoadmap
      ? [
          {
            id: "plan",
            label: "10-Year Plan",
            sub: "Phases and capital plan",
            active: isRoadmap,
            onSelect: () => goPage(STRATEGY_PAGE_KEYS.roadmap),
          },
        ]
      : []),
  ];

  // ── Page body ──
  const activePage = pageKey ? demo.pages[pageKey] : null;
  const pageIndex = pageKey ? allPageIds.indexOf(pageKey) : -1;
  const neighbor = (offset: number) => {
    const id = pageIndex >= 0 ? allPageIds[pageIndex + offset] : undefined;
    return id && demo.pages[id] ? { id, title: demo.pages[id].title } : null;
  };

  const shellStyle = { "--demo-top": `${headerHeight}px` } as CSSProperties;

  const ctaButton = (extra: string) => (
    <a
      href={CTA_HREF}
      className={`inline-flex items-center justify-center min-h-[44px] px-4 rounded-md bg-accent text-white font-sans text-[13px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90 ${extra}`}
    >
      {CTA_LABEL}
    </a>
  );

  return (
    <EditModeProvider>
      <PortalActionsProvider value={actions}>
        <div className="demo-portal min-h-screen bg-background" style={shellStyle}>
          <style>{`
            .demo-portal .sticky.top-\\[80px\\] { top: var(--demo-top, 56px); }
            [data-demo-tour-focus] { outline: 2px solid hsl(var(--hbc-gold)); outline-offset: 6px; border-radius: 6px; }
            [data-bobby-bar][data-demo-tour-focus] { outline-width: 3px; outline-offset: -3px; border-radius: 0; }
          `}</style>

          {/* Desktop: one pinned strip */}
          <header
            ref={desktopBarRef}
            className="hidden md:flex sticky top-0 z-40 items-center gap-5 bg-primary text-primary-foreground px-5 py-2"
          >
            <p className="flex-1 min-w-0 font-sans text-[13px] leading-snug text-primary-foreground/80">
              <span className="font-semibold text-primary-foreground">Sample report:</span>{" "}
              {SAMPLE_NOTE}
            </p>
            <button
              type="button"
              onClick={() => startTour(0)}
              className="min-h-[44px] px-2 font-sans text-[13px] font-medium text-hbc-gold underline underline-offset-4 whitespace-nowrap hover:opacity-80"
            >
              Take the tour
            </button>
            {ctaButton("")}
          </header>

          {/* Mobile: the note scrolls away, the menu + CTA bar stays pinned */}
          <div className="md:hidden bg-primary text-primary-foreground px-4 pt-3">
            <p className="font-sans text-[12px] leading-snug text-primary-foreground/80">
              <span className="font-semibold text-primary-foreground">Sample report:</span>{" "}
              {SAMPLE_NOTE}
            </p>
            <button
              type="button"
              onClick={() => startTour(0)}
              className="min-h-[44px] font-sans text-[13px] font-medium text-hbc-gold underline underline-offset-4"
            >
              Take the tour
            </button>
          </div>
          <div
            ref={mobileBarRef}
            className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 bg-primary text-primary-foreground pl-1 pr-2 py-1.5"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center gap-2 font-sans text-[13px] font-medium"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
            {ctaButton("px-3")}
          </div>

          <div className="flex">
            {/* Desktop rail */}
            <aside className="hidden md:flex flex-col w-60 shrink-0 bg-card border-r border-border sticky top-[var(--demo-top)] self-start h-[calc(100vh-var(--demo-top))] overflow-y-auto">
              <div className="px-5 pt-6 pb-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent mb-1">
                  Client view
                </p>
                <p className="font-display text-xl text-primary leading-tight">
                  {demo.home.familyName}
                </p>
              </div>
              <NavList items={navItems} />
              <div className="mt-auto px-5 py-5">
                <button
                  type="button"
                  onClick={() => startTour(0)}
                  className="w-full min-h-[44px] rounded-md border border-border bg-white font-sans text-[13px] font-medium text-primary hover:border-accent/50 transition-colors"
                >
                  Take the tour
                </button>
              </div>
            </aside>

            {/* Main column */}
            <main className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-var(--demo-top))]">
              <div className="flex-1">
                {view === "home" && (
                  <PortalHome
                    onNavigate={(tab) => {
                      if (tab === "report") goReport();
                    }}
                    propertyName={demo.home.propertyName}
                    propertyAddress={`${demo.home.addressLine} · ${demo.home.cityLine}`}
                    heroImageUrl={demo.home.heroImage}
                    yearBuilt={demo.home.yearBuilt}
                    hoverMeta={demo.home.hoverMeta}
                    iguideMeta={demo.home.iguideMeta}
                    isAdminPreview
                    demo={{
                      hoverImageUrl: demo.home.hoverImage,
                      iguideImageUrl: demo.home.iguideImage,
                      onOpenHover: () => setMedia("hover"),
                      onOpenIguide: () => setMedia("iguide"),
                    }}
                  />
                )}

                {view === "report" && activePage?.info && pageKey && (
                  <div>
                    <ReportChapterNav
                      groups={demo.groups}
                      pages={reportPages}
                      activeChapter="information"
                      activePageId={pageKey}
                      onChapterChange={(chapterId) => {
                        const first = chapters.find((ch) => ch.id === chapterId)?.pages[0];
                        if (first) goPage(first);
                      }}
                      onPageSelect={goPage}
                      onBackToHome={goReport}
                    />
                    <DemoInfoPageView
                      info={activePage.info}
                      prev={neighbor(-1)}
                      next={neighbor(1)}
                      onNavigate={goPage}
                    />
                  </div>
                )}

                {view === "report" && !(activePage?.info && pageKey) && (
                  <ReportTab
                    activePageId={pageKey}
                    onNavigate={goPage}
                    groups={demo.groups}
                    pages={reportPages}
                    pageImages={demo.pageImages}
                    propertyName={demo.home.propertyName}
                    propertyAddress={`${demo.home.addressLine}, ${demo.home.cityLine}`}
                    heroImageUrl={demo.home.heroImage}
                    completionPercent={100}
                  />
                )}
              </div>

              <ConciergeBar
                stickyClassName="bottom-0"
                panelProps={{
                  homeLabel: "Trained on the Caldwell home",
                  qaThread: thread,
                  onQaSend: (text) => ask(text, "typed"),
                  qaPending: pending > 0,
                  suggestedPrompts: DEMO_BOBBY_PROMPTS,
                }}
              />
            </main>
          </div>

          {/* Mobile drawer */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="left" className="w-[86%] max-w-[340px] p-0 bg-card flex flex-col overflow-y-auto [&>button]:right-2 [&>button]:top-2 [&>button]:p-3">
              <div className="px-5 pt-6 pb-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent mb-1">
                  Client view
                </p>
                <SheetTitle className="font-display text-xl font-normal text-primary leading-tight">
                  {demo.home.familyName}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Sample portal navigation
                </SheetDescription>
              </div>
              <NavList items={navItems} onAfterSelect={() => setMenuOpen(false)} />
              <div className="mt-auto px-5 py-5 space-y-3">
                <button
                  type="button"
                  onClick={() => startTour(0)}
                  className="w-full min-h-[44px] rounded-md border border-border bg-white font-sans text-[13px] font-medium text-primary"
                >
                  Take the tour
                </button>
                {ctaButton("w-full")}
              </div>
            </SheetContent>
          </Sheet>

          {/* Hover / iGUIDE preview: a local dialog, never a navigation */}
          <Dialog open={media !== null} onOpenChange={(open) => !open && setMedia(null)}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-xl rounded-lg p-0 overflow-hidden gap-0 [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-2 [&>button]:opacity-100 [&>button]:shadow">
              {media && (
                <>
                  <img
                    src={media === "hover" ? demo.home.hoverImage : demo.home.iguideImage}
                    alt={media === "hover" ? "Exterior 3D model preview" : "Interior 360 degree tour preview"}
                    className="w-full aspect-[16/10] object-cover"
                  />
                  <div className="p-5">
                    <DialogTitle className="font-display text-2xl font-normal text-primary">
                      {media === "hover" ? "Exterior 3D Model" : "Interior 360° Tour"}
                    </DialogTitle>
                    <DialogDescription className="font-sans text-sm text-foreground/80 mt-2 leading-relaxed">
                      {media === "hover"
                        ? "In your own portal this opens your interactive 3D exterior model."
                        : "In your own portal this opens your 360 degree interior tour."}
                    </DialogDescription>
                    <p className="font-sans text-xs text-muted-foreground mt-2">
                      {media === "hover" ? demo.home.hoverMeta : demo.home.iguideMeta}
                    </p>
                    <button
                      type="button"
                      onClick={() => setMedia(null)}
                      className="mt-4 min-h-[44px] px-5 rounded-md bg-accent text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Got it
                    </button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <DemoTour
            stops={TOUR_STOPS}
            index={tourIndex}
            totalSteps={TOUR_TOTAL}
            onIndexChange={setTourIndex}
            onClose={closeTour}
            finalAction={{
              label: "Ask Bobby a sample question",
              onClick: () => {
                closeTour();
                openBobby();
              },
            }}
          />
        </div>
      </PortalActionsProvider>
    </EditModeProvider>
  );
};

export default DemoPortal;
