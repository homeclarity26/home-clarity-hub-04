import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Check, MessageSquare, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ───── COLOR THEMES ─────
const THEMES: Record<string, Record<string, string>> = {
  navy: { "--bg-hero": "#1a2744", "--bg-section-alt": "#f0ebe3", "--bg-section": "#ffffff", "--accent": "#c9a96e", "--text-hero": "#ffffff", "--text-body": "#2d3748", "--accent-glow": "rgba(201,169,110,0.15)" },
  slate: { "--bg-hero": "#334155", "--bg-section-alt": "#f1f5f9", "--bg-section": "#ffffff", "--accent": "#0ea5e9", "--text-hero": "#ffffff", "--text-body": "#1e293b", "--accent-glow": "rgba(14,165,233,0.15)" },
  forest: { "--bg-hero": "#1a3a2a", "--bg-section-alt": "#f0f4f0", "--bg-section": "#ffffff", "--accent": "#84cc16", "--text-hero": "#ffffff", "--text-body": "#1c2b1e", "--accent-glow": "rgba(132,204,22,0.15)" },
  midnight: { "--bg-hero": "#0f0f1a", "--bg-section-alt": "#1a1a2e", "--bg-section": "#111827", "--accent": "#6366f1", "--text-hero": "#ffffff", "--text-body": "#e2e8f0", "--accent-glow": "rgba(99,102,241,0.15)" },
  warm: { "--bg-hero": "#7c3d1e", "--bg-section-alt": "#fef9f0", "--bg-section": "#ffffff", "--accent": "#e07b39", "--text-hero": "#ffffff", "--text-body": "#3d1a08", "--accent-glow": "rgba(224,123,57,0.15)" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const SECTION_IDS = ["introduction", "scope", "investment", "timeline", "why-us", "next-steps"] as const;
const SECTION_LABELS: Record<string, string> = { introduction: "Introduction", scope: "Scope", investment: "Investment", timeline: "Timeline", "why-us": "Why Us", "next-steps": "Next Steps" };

const PIE_COLORS = ["#c9a96e", "#4a90d9", "#e07b39", "#6366f1", "#84cc16", "#f43f5e", "#8b5cf6", "#14b8a6"];

const ProposalView = () => {
  const { token } = useParams<{ token: string }>();
  const [activeSection, setActiveSection] = useState("");
  const [showNav, setShowNav] = useState(false);
  const [optionalSelections, setOptionalSelections] = useState<Record<string, boolean>>({});
  const [stickyTotal, setStickyTotal] = useState(false);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const timeRef = useRef(0);
  const viewedSections = useRef<Set<string>>(new Set());

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", token],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await (supabase.from("estimates") as any).select("*").eq("proposal_token", token).single();
      return data;
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["proposal-lines", proposal?.id],
    enabled: !!proposal?.id,
    queryFn: async () => {
      const { data } = await (supabase.from("estimate_line_items") as any).select("*").eq("estimate_id", proposal.id).order("sort_order");
      return data || [];
    },
  });

  const { data: property } = useQuery({
    queryKey: ["proposal-property", proposal?.property_id],
    enabled: !!proposal?.property_id,
    queryFn: async () => {
      const { data } = await (supabase.from("properties") as any).select("property_name, address, city, state, zip").eq("id", proposal.property_id).single();
      return data;
    },
  });

  const theme = THEMES[proposal?.proposal_color_theme || "navy"] || THEMES.navy;

  // ───── Tracking: view count, time, sections ─────
  useEffect(() => {
    if (!proposal?.id) return;
    // Increment view count
    (supabase.from("estimates") as any).update({
      proposal_view_count: (proposal.proposal_view_count || 0) + 1,
      proposal_last_viewed_at: new Date().toISOString(),
      ...(proposal.proposal_first_viewed_at ? {} : { proposal_first_viewed_at: new Date().toISOString() }),
      ...(proposal.proposal_status === "sent" ? { proposal_status: "viewed" } : {}),
    }).eq("id", proposal.id).then(() => {});

    // Time tracking
    const interval = setInterval(() => {
      timeRef.current += 10;
      if (timeRef.current % 30 === 0) {
        (supabase.from("estimates") as any).update({
          proposal_time_spent_seconds: (proposal.proposal_time_spent_seconds || 0) + 30,
          proposal_sections_viewed: Array.from(viewedSections.current),
        }).eq("id", proposal.id).then(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [proposal?.id]);

  // ───── IntersectionObserver for scroll animations + section tracking ─────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    // Animate elements
    const animObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("proposal-visible");
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".proposal-animate").forEach((el) => animObs.observe(el));
    observers.push(animObs);

    // Section tracking
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id);
          viewedSections.current.add(id);
        }
      });
    }, { threshold: 0.6 });
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) secObs.observe(el);
    });
    observers.push(secObs);

    // Show nav after hero
    const heroObs = new IntersectionObserver(([entry]) => {
      setShowNav(!entry.isIntersecting);
    }, { threshold: 0.1 });
    const hero = document.getElementById("proposal-hero");
    if (hero) heroObs.observe(hero);
    observers.push(heroObs);

    // Sticky total bar
    const invObs = new IntersectionObserver(([entry]) => {
      setStickyTotal(entry.isIntersecting);
    }, { threshold: 0.1 });
    const inv = document.getElementById("investment");
    if (inv) invObs.observe(inv);
    observers.push(invObs);

    return () => observers.forEach((o) => o.disconnect());
  }, [proposal]);

  // ───── Initialize optional selections ─────
  useEffect(() => {
    if (proposal?.proposal_optional_line_items) {
      const optionals = proposal.proposal_optional_line_items as any[];
      const defaults: Record<string, boolean> = {};
      optionals.forEach((item: any) => { defaults[item.id] = item.selected_by_default ?? true; });
      setOptionalSelections(defaults);
    }
  }, [proposal]);

  const toggleOptional = (id: string) => {
    setOptionalSelections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // Save client selections
      if (proposal?.id) {
        (supabase.from("estimates") as any).update({ proposal_client_selections: next }).eq("id", proposal.id);
      }
      return next;
    });
  };

  // ───── Calculate totals ─────
  const baseTotal = lineItems.reduce((s: number, li: any) => s + Number(li.total), 0);
  const optionalItems = (proposal?.proposal_optional_line_items || []) as any[];
  const optionalTotal = optionalItems.reduce((s: number, item: any) => s + (optionalSelections[item.id] ? Number(item.amount || 0) : 0), 0);
  const grandTotal = baseTotal + optionalTotal - (proposal?.discount_amount || 0) + (proposal?.tax || 0);

  // Pie chart data by service grouping
  const pieData = lineItems.reduce((acc: any[], li: any) => {
    const desc = li.description?.split(" - ")[0] || li.description || "Other";
    const existing = acc.find((a) => a.name === desc);
    if (existing) existing.value += Number(li.total);
    else acc.push({ name: desc, value: Number(li.total) });
    return acc;
  }, []).slice(0, 8);

  const timelinePhases = (proposal?.proposal_timeline_phases || []) as any[];
  const statCallouts = (proposal?.proposal_stat_callouts || []) as any[];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2744]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2744] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Proposal Not Found</h1>
          <p className="text-white/60">This link may be invalid or the proposal has been removed.</p>
        </div>
      </div>
    );
  }

  const propertyAddress = property ? `${property.address || ""}${property.city ? `, ${property.city}` : ""}${property.state ? `, ${property.state}` : ""}` : "";
  const isSigned = proposal.proposal_status === "signed" || proposal.proposal_status === "accepted";

  return (
    <div className="min-h-screen" style={{ ...Object.fromEntries(Object.entries(theme).map(([k, v]) => [k, v])) } as any}>
      <style>{`
        :root { ${Object.entries(theme).map(([k, v]) => `${k}: ${v}`).join("; ")} }
        html { scroll-behavior: smooth; }
        .proposal-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .proposal-animate.proposal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .proposal-animate-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .proposal-animate-left.proposal-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .proposal-animate-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .proposal-animate-right.proposal-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .stagger-1 { transition-delay: 0.08s; }
        .stagger-2 { transition-delay: 0.16s; }
        .stagger-3 { transition-delay: 0.24s; }
        .stagger-4 { transition-delay: 0.32s; }
        .stagger-5 { transition-delay: 0.40s; }
        .stagger-6 { transition-delay: 0.48s; }
        .stagger-7 { transition-delay: 0.56s; }
        .stagger-8 { transition-delay: 0.64s; }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-animate { animation: hero-fade-up 0.8s ease-out forwards; }
        .hero-animate-delay { animation: hero-fade-up 0.8s ease-out 0.3s forwards; opacity: 0; }
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .bounce-arrow { animation: bounce-arrow 2s ease-in-out infinite; }
        @keyframes total-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .total-pulse { animation: total-pulse 0.3s ease-out; }
        .glass-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>

      {/* ═══ STICKY NAV ═══ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          opacity: showNav ? 1 : 0,
          pointerEvents: showNav ? "auto" : "none",
          transform: showNav ? "translateY(0)" : "translateY(-100%)",
          background: `${theme["--bg-hero"]}f2`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: theme["--accent"] }}>
            {proposal.title}
          </span>
          <div className="hidden md:flex items-center gap-1">
            {SECTION_IDS.map((id) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className="px-3 py-1 text-[11px] font-medium rounded-full transition-all"
                style={{
                  color: activeSection === id ? theme["--bg-hero"] : "rgba(255,255,255,0.7)",
                  background: activeSection === id ? theme["--accent"] : "transparent",
                }}
              >
                {SECTION_LABELS[id]}
              </button>
            ))}
          </div>
          {!isSigned ? (
            <button
              className="px-4 py-1.5 text-xs font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
              style={{ background: theme["--accent"], color: "#fff" }}
              onClick={() => document.getElementById("next-steps")?.scrollIntoView({ behavior: "smooth" })}
            >
              Accept & Sign →
            </button>
          ) : (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs gap-1">
              <Check className="w-3 h-3" /> Signed
            </Badge>
          )}
        </div>
      </nav>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section
        id="proposal-hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: theme["--bg-hero"] }}
      >
        {proposal.proposal_cover_video_url ? (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src={proposal.proposal_cover_video_url} />
          </video>
        ) : proposal.proposal_cover_image_url ? (
          <div className="absolute inset-0">
            <img src={proposal.proposal_cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
          </div>
        ) : null}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 20%, ${theme["--bg-hero"]}cc 70%, ${theme["--bg-hero"]} 100%)` }} />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <h1
            className="hero-animate font-serif leading-tight"
            style={{ color: theme["--text-hero"], fontSize: "clamp(2.2rem, 5vw, 4.5rem)", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {proposal.title}
          </h1>
          {proposal.proposal_tagline && (
            <p className="hero-animate-delay mt-4 text-lg md:text-xl font-light" style={{ color: `${theme["--text-hero"]}cc` }}>
              {proposal.proposal_tagline}
            </p>
          )}
          <div className="hero-animate-delay mt-8 space-y-1">
            <p className="text-sm font-medium" style={{ color: theme["--accent"] }}>
              Prepared for {proposal.proposal_prepared_for || "You"}
            </p>
            {propertyAddress && (
              <p className="text-sm" style={{ color: `${theme["--text-hero"]}88` }}>{propertyAddress}</p>
            )}
            <p className="text-sm" style={{ color: `${theme["--text-hero"]}66` }}>
              {format(new Date(proposal.sent_at || proposal.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center bounce-arrow">
          <ChevronDown className="w-6 h-6 mx-auto" style={{ color: `${theme["--text-hero"]}44` }} />
          <p className="text-[10px] tracking-widest uppercase mt-1" style={{ color: `${theme["--text-hero"]}44` }}>Scroll to explore</p>
        </div>
      </section>

      {/* ═══ SECTION 2: INTRODUCTION ═══ */}
      <section id="introduction" className="py-20 md:py-28 px-6" style={{ background: theme["--bg-section"] }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="proposal-animate proposal-animate-left">
            {proposal.proposal_intro_text ? (
              <div style={{ color: theme["--text-body"] }}>
                {proposal.proposal_intro_text.split("\n").map((p: string, i: number) => (
                  <p key={i} className={i === 0 ? "text-xl md:text-2xl leading-relaxed font-light mb-6" : "text-base leading-relaxed mb-4 opacity-80"}>
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xl leading-relaxed italic opacity-50" style={{ color: theme["--text-body"] }}>
                A personalized introduction will appear here once your advisor prepares this proposal.
              </p>
            )}
          </div>
          <div className="proposal-animate proposal-animate-right">
            {proposal.proposal_cover_image_url && (
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={proposal.proposal_cover_image_url} alt="Property" className="w-full h-80 object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: SCOPE OF WORK ═══ */}
      <section id="scope" className="py-20 md:py-28 px-6" style={{ background: theme["--bg-section-alt"] }}>
        <div className="max-w-5xl mx-auto">
          <p className="proposal-animate text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme["--accent"] }}>
            Scope of Work
          </p>
          {proposal.proposal_scope_description && (
            <p className="proposal-animate text-lg md:text-xl leading-relaxed mb-10 max-w-3xl" style={{ color: theme["--text-body"] }}>
              {proposal.proposal_scope_description}
            </p>
          )}
          <div className="space-y-3">
            {lineItems.map((li: any, i: number) => (
              <div
                key={li.id}
                className={`proposal-animate stagger-${Math.min(i + 1, 8)} rounded-xl p-5 flex items-center justify-between border transition-shadow hover:shadow-md`}
                style={{
                  background: theme["--bg-section"],
                  borderColor: `${theme["--accent"]}22`,
                  borderLeftWidth: "3px",
                  borderLeftColor: theme["--accent"],
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: theme["--text-body"] }}>{li.description}</p>
                  {li.quantity > 1 && (
                    <p className="text-xs mt-0.5 opacity-60" style={{ color: theme["--text-body"] }}>Qty: {li.quantity}</p>
                  )}
                </div>
                <p className="text-sm font-mono font-bold" style={{ color: theme["--accent"] }}>{fmt(Number(li.total))}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: INVESTMENT ═══ */}
      <section id="investment" className="py-20 md:py-28 px-6" style={{ background: theme["--bg-section"] }}>
        <div className="max-w-5xl mx-auto">
          <p className="proposal-animate text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme["--accent"] }}>
            Your Investment
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Pie Chart */}
            <div className="proposal-animate">
              {pieData.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={1200}
                      >
                        {pieData.map((_: any, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{ background: theme["--bg-section"], border: `1px solid ${theme["--accent"]}33`, borderRadius: "8px", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: theme["--text-body"] }}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="truncate opacity-70">{item.name}</span>
                    <span className="ml-auto font-mono font-medium">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing panel */}
            <div className="proposal-animate space-y-4">
              {/* Optional add-ons */}
              {proposal.proposal_show_pricing_toggle && optionalItems.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold tracking-wider uppercase opacity-60" style={{ color: theme["--text-body"] }}>
                    Optional Add-Ons
                  </p>
                  {optionalItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="rounded-xl p-4 flex items-center justify-between border transition-all"
                      style={{
                        background: optionalSelections[item.id] ? theme["--accent-glow"] : theme["--bg-section-alt"],
                        borderColor: optionalSelections[item.id] ? `${theme["--accent"]}55` : "transparent",
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: theme["--text-body"] }}>{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-medium" style={{ color: theme["--accent"] }}>{fmt(Number(item.amount || 0))}</span>
                        <Switch
                          checked={optionalSelections[item.id] || false}
                          onCheckedChange={() => toggleOptional(item.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="rounded-2xl p-6 space-y-3" style={{ background: theme["--bg-section-alt"] }}>
                <div className="flex justify-between text-sm" style={{ color: theme["--text-body"] }}>
                  <span className="opacity-70">Base scope</span>
                  <span className="font-mono">{fmt(baseTotal)}</span>
                </div>
                {optionalTotal > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: theme["--text-body"] }}>
                    <span className="opacity-70">Selected add-ons</span>
                    <span className="font-mono">{fmt(optionalTotal)}</span>
                  </div>
                )}
                {(proposal.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">-{fmt(proposal.discount_amount)}</span>
                  </div>
                )}
                {(proposal.tax || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: theme["--text-body"] }}>
                    <span className="opacity-70">Tax</span>
                    <span className="font-mono">{fmt(proposal.tax)}</span>
                  </div>
                )}
                <div className="pt-3 border-t flex justify-between" style={{ borderColor: `${theme["--accent"]}33` }}>
                  <span className="text-lg font-bold" style={{ color: theme["--text-body"] }}>Total Investment</span>
                  <span className="text-2xl font-bold font-mono total-pulse" style={{ color: theme["--accent"] }}>
                    {fmt(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STICKY TOTAL BAR ═══ */}
      {stickyTotal && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 py-3 px-6 flex items-center justify-center gap-4 shadow-2xl transition-all"
          style={{ background: theme["--accent"], color: "#fff" }}
        >
          <span className="text-sm font-medium">Your Investment:</span>
          <span className="text-xl font-bold font-mono total-pulse">{fmt(grandTotal)}</span>
        </div>
      )}

      {/* ═══ SECTION 5: TIMELINE ═══ */}
      {timelinePhases.length > 0 && (
        <section id="timeline" className="py-20 md:py-28 px-6" style={{ background: theme["--bg-section-alt"] }}>
          <div className="max-w-5xl mx-auto">
            <p className="proposal-animate text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme["--accent"] }}>
              Your Project Timeline
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5" style={{ background: `${theme["--accent"]}33` }} />
              {timelinePhases.map((phase: any, i: number) => (
                <div key={i} className={`proposal-animate stagger-${Math.min(i + 1, 8)} text-center relative`}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg"
                    style={{ background: theme["--accent-glow"], border: `2px solid ${theme["--accent"]}44` }}
                  >
                    {phase.icon || "📋"}
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: theme["--text-body"] }}>{phase.phase_title}</h4>
                  <p className="text-xs font-mono mb-2" style={{ color: theme["--accent"] }}>{phase.duration}</p>
                  <p className="text-xs leading-relaxed opacity-70" style={{ color: theme["--text-body"] }}>{phase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SECTION 6: WHY CHOOSE US ═══ */}
      <section id="why-us" className="py-20 md:py-28 px-6" style={{ background: theme["--bg-hero"] }}>
        <div className="max-w-5xl mx-auto">
          <p className="proposal-animate text-xs font-bold tracking-[0.2em] uppercase mb-6" style={{ color: theme["--accent"] }}>
            Why Choose Us
          </p>
          {proposal.proposal_why_us_text && (
            <p className="proposal-animate text-xl md:text-2xl leading-relaxed mb-12" style={{ color: theme["--text-hero"] }}>
              {proposal.proposal_why_us_text}
            </p>
          )}

          {/* Stat callouts */}
          {statCallouts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {statCallouts.map((stat: any, i: number) => (
                <div key={i} className={`proposal-animate stagger-${i + 1} glass-card rounded-2xl p-6 text-center`}>
                  <p className="text-3xl mb-2">{stat.icon || "⭐"}</p>
                  <p className="text-2xl font-bold mb-1" style={{ color: theme["--accent"] }}>{stat.number}</p>
                  <p className="text-sm" style={{ color: `${theme["--text-hero"]}99` }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Testimonial */}
          {proposal.proposal_testimonial_quote && (
            <div className="proposal-animate max-w-3xl mx-auto text-center mt-8">
              <span className="text-6xl font-serif" style={{ color: `${theme["--accent"]}66` }}>"</span>
              <p className="text-lg md:text-xl italic leading-relaxed -mt-6" style={{ color: `${theme["--text-hero"]}dd` }}>
                {proposal.proposal_testimonial_quote}
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold" style={{ color: theme["--text-hero"] }}>{proposal.proposal_testimonial_author}</p>
                {proposal.proposal_testimonial_role && (
                  <p className="text-xs mt-0.5" style={{ color: `${theme["--text-hero"]}77` }}>{proposal.proposal_testimonial_role}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ SECTION 7: NEXT STEPS / CTA ═══ */}
      <section id="next-steps" className="py-24 md:py-32 px-6" style={{ background: theme["--bg-section"] }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="proposal-animate text-3xl md:text-4xl font-bold mb-4"
            style={{ color: theme["--text-body"], letterSpacing: "-0.02em" }}
          >
            {proposal.proposal_cta_headline || "Ready to move forward?"}
          </h2>
          {proposal.proposal_cta_subtext && (
            <p className="proposal-animate text-base leading-relaxed mb-10 opacity-70" style={{ color: theme["--text-body"] }}>
              {proposal.proposal_cta_subtext}
            </p>
          )}
          <div className="proposal-animate flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isSigned ? (
              <button
                className="px-8 py-4 text-base font-bold rounded-full shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: theme["--accent"], color: "#fff" }}
              >
                Accept & Sign This Proposal →
              </button>
            ) : (
              <div className="px-8 py-4 text-base font-bold rounded-full bg-green-500/10 text-green-600 border-2 border-green-500/30 flex items-center gap-2">
                <Check className="w-5 h-5" /> Proposal Signed
              </div>
            )}
            <button
              className="px-8 py-4 text-base font-medium rounded-full border-2 transition-all hover:scale-105"
              style={{ borderColor: `${theme["--text-body"]}22`, color: theme["--text-body"] }}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" /> Message Your Advisor
            </button>
          </div>
          {proposal.valid_until && (
            <p className="mt-8 text-xs opacity-50" style={{ color: theme["--text-body"] }}>
              This proposal is valid until {format(new Date(proposal.valid_until), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-6 text-center" style={{ background: theme["--bg-hero"] }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: `${theme["--text-hero"]}44` }}>
          Prepared with HBC
        </p>
      </footer>
    </div>
  );
};

export default ProposalView;
