import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eye, Copy, Send, Sparkles, Loader2, Plus, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ScopeSectionBuilder, { type ScopeSection } from "./proposal/ScopeSectionBuilder";
import ClientSelectionsBuilder, { type SelectionCategory } from "./proposal/ClientSelectionsBuilder";
import TermsEditor, { type TermItem } from "./proposal/TermsEditor";
import MultiOptionPricing, { type OptionPrice } from "./proposal/MultiOptionPricing";

// ── Types ─────────────────────────────────────────────────────────────────────

type PricingType = "labor_only" | "lump_sum" | "three_tier" | "allowance" | "time_and_materials";
type BrandType = "hbc" | "akr";

// ── Brand Config ──────────────────────────────────────────────────────────────

const BRAND_CONFIG: Record<
  BrandType,
  { label: string; hero: string; accent: string; company: string; email: string; phone: string; tagline: string }
> = {
  hbc: {
    label: "HBC — Hometown Builders Club",
    hero: "#1B2B4D",
    accent: "#C4A265",
    company: "Hometown Builders Club LLC",
    email: "adam@hometownbuildersclub.com",
    phone: "(330) 203-1331",
    tagline: "Craftsmanship you can trust. Communication you deserve.",
  },
  akr: {
    label: "AKR — AK Renovations",
    hero: "#B5450B",
    accent: "#C4A265",
    company: "AK Renovations",
    email: "akrenovations01@gmail.com",
    phone: "(330) 203-1331",
    tagline: "Craftsmanship you can trust. Communication you deserve.",
  },
};

// ── Pricing Type labels ───────────────────────────────────────────────────────

const PRICING_LABELS: Record<PricingType, string> = {
  labor_only: "Labor Only",
  lump_sum: "Lump Sum",
  three_tier: "Good / Better / Best",
  allowance: "Allowance-Based",
  time_and_materials: "Time & Materials",
};

interface ProposalBuilderProps {
  estimate: any;
  lineItems: any[];
  clientName?: string;
  propertyAddress?: string;
  onUpdate: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const ProposalBuilder = ({ estimate, lineItems, clientName, propertyAddress, onUpdate }: ProposalBuilderProps) => {
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [docxLoading, setDocxLoading] = useState(false);

  const [form, setForm] = useState({
    proposal_color_theme: (estimate.proposal_color_theme || "hbc") as BrandType | string,
    proposal_cover_image_url: estimate.proposal_cover_image_url || "",
    proposal_cover_video_url: estimate.proposal_cover_video_url || "",
    proposal_prepared_for: estimate.proposal_prepared_for || clientName || "",
    proposal_tagline: estimate.proposal_tagline || "",
    proposal_intro_text: estimate.proposal_intro_text || "",
    proposal_scope_description: estimate.proposal_scope_description || "",
    proposal_show_pricing_toggle: estimate.proposal_show_pricing_toggle || false,
    proposal_timeline_phases: estimate.proposal_timeline_phases || [],
    proposal_why_us_text: estimate.proposal_why_us_text || "",
    proposal_stat_callouts: estimate.proposal_stat_callouts || [],
    proposal_testimonial_quote: estimate.proposal_testimonial_quote || "",
    proposal_testimonial_author: estimate.proposal_testimonial_author || "",
    proposal_testimonial_role: estimate.proposal_testimonial_role || "",
    proposal_cta_headline: estimate.proposal_cta_headline || "Ready to move forward?",
    proposal_cta_subtext: estimate.proposal_cta_subtext || "",
    proposal_optional_line_items: estimate.proposal_optional_line_items || [],
    proposal_scope_sections: estimate.proposal_scope_sections || [],
    proposal_client_selections: estimate.proposal_client_selections || [],
    proposal_terms: estimate.proposal_terms || [],
    proposal_multi_option: estimate.proposal_multi_option || false,
    proposal_option_prices: estimate.proposal_option_prices || [],
    // Pricing type fields
    pricing_type: (estimate.pricing_type || "lump_sum") as PricingType,
    hourly_rate: estimate.hourly_rate || "",
    estimated_hours: estimate.estimated_hours || "",
    materials_estimate: estimate.materials_estimate || "",
  });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  // Resolve brand — treat 'hbc'/'akr' as brand keys; legacy themes fall back
  const brandKey: BrandType = (form.proposal_color_theme === "hbc" || form.proposal_color_theme === "akr")
    ? (form.proposal_color_theme as BrandType)
    : "hbc";
  const brand = BRAND_CONFIG[brandKey];

  const save = async () => {
    setSaving(true);
    const payload: any = { ...form };
    // Ensure pricing_type is persisted
    await supabase.from("estimates").update(payload).eq("id", estimate.id);
    setSaving(false);
    toast.success("Proposal saved");
    onUpdate();
  };

  const aiGenerate = async (field: string, task: string) => {
    setAiLoading(field);
    try {
      const { data, error } = await supabase.functions.invoke("ai-draft-assistant", {
        body: {
          task,
          context: {
            clientName: form.proposal_prepared_for || clientName,
            propertyAddress,
            estimateTitle: estimate.title,
            lineItems: lineItems.map((li: any) => li.description).join(", "),
            total: estimate.total,
            brand: brand.company,
          },
        },
      });
      if (error) throw error;
      if (data?.text) update(field, data.text);
      else if (data?.phases) update(field, data.phases);
      toast.success("AI draft generated");
    } catch (err: any) {
      if (err?.status === 429) toast.error("Rate limited — try again shortly");
      else toast.error("AI generation failed");
    } finally {
      setAiLoading("");
    }
  };

  const downloadDocx = async () => {
    setDocxLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-docx", {
        body: { estimateId: estimate.id },
      });
      if (error) throw error;
      if (data?.base64) {
        const byteCharacters = atob(data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(form.proposal_prepared_for || "Proposal").replace(/[^a-zA-Z0-9]/g, "_")}_Proposal.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Proposal .docx downloaded");
      }
    } catch {
      toast.error("DOCX generation failed");
    } finally {
      setDocxLoading(false);
    }
  };

  const proposalUrl = `${window.location.origin}/proposal/${estimate.proposal_token}`;

  // ── T&M running total ──────────────────────────────────────────────────────
  const tmTotal =
    (parseFloat(form.hourly_rate) || 0) * (parseFloat(form.estimated_hours) || 0) +
    (parseFloat(form.materials_estimate) || 0);

  // ── Line-item total ────────────────────────────────────────────────────────
  const baseTotal = lineItems.reduce((s: number, li: any) => s + Number(li.total), 0);

  return (
    <div className="space-y-4">
      {/* ══ BRAND TOGGLE (top of builder) ══ */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <Label className="text-xs font-sans font-semibold text-foreground">Brand</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["hbc", "akr"] as BrandType[]).map((b) => {
            const bc = BRAND_CONFIG[b];
            const isActive = brandKey === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => update("proposal_color_theme", b)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isActive ? "shadow-md scale-[1.01]" : "opacity-70 hover:opacity-90"
                }`}
                style={{
                  borderColor: isActive ? bc.accent : "transparent",
                  background: isActive ? `${bc.hero}15` : undefined,
                  outlineColor: bc.accent,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: bc.hero }}
                  />
                  <span className="text-xs font-bold font-mono" style={{ color: bc.hero }}>
                    {b.toUpperCase()}
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: bc.accent }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground">{bc.company}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{bc.email}</p>
              </button>
            );
          })}
        </div>
        {/* Show active brand info */}
        <div className="rounded-lg p-3 text-xs font-sans text-muted-foreground" style={{ background: `${brand.hero}08`, borderLeft: `3px solid ${brand.accent}` }}>
          <span className="font-medium text-foreground">{brand.company}</span>
          {" · "}
          {brand.email}
          {" · "}
          {brand.phone}
          <br />
          <span className="italic">{brand.tagline}</span>
        </div>
      </div>

      {/* ══ PRICING TYPE SELECTOR ══ */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <Label className="text-xs font-sans font-semibold text-foreground">Pricing Structure</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRICING_LABELS) as PricingType[]).map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => update("pricing_type", pt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                form.pricing_type === pt
                  ? "border-accent bg-accent/15 text-foreground font-semibold"
                  : "border-border text-muted-foreground hover:border-accent/50"
              }`}
            >
              {PRICING_LABELS[pt]}
            </button>
          ))}
        </div>

        {/* Pricing-type specific UI */}
        {form.pricing_type === "labor_only" && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <span className="font-semibold">Labor Only</span> — Column header will read "Labor Description". No materials column shown. Note: "Materials supplied by client or included in allowances."
          </div>
        )}

        {form.pricing_type === "lump_sum" && (
          <div className="rounded-lg border border-border p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground font-sans">Total Investment</p>
            <p className="text-3xl font-mono font-bold" style={{ color: brand.accent }}>
              {fmt(baseTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground">Line items are hidden from client view. Only total is shown.</p>
          </div>
        )}

        {form.pricing_type === "three_tier" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Configure the 3-tier Good / Better / Best options below in the Investment section.</p>
            <MultiOptionPricing
              enabled={true}
              onToggle={() => {}}
              options={
                form.proposal_option_prices.length >= 3
                  ? form.proposal_option_prices
                  : [
                      { label: "Good", sub: "Essential scope", base: "", upgrade: null },
                      { label: "Better", sub: "Enhanced finishes", base: "", upgrade: null },
                      { label: "Best", sub: "Premium everything", base: "", upgrade: null },
                    ]
              }
              onChange={(opts) => update("proposal_option_prices", opts)}
            />
          </div>
        )}

        {form.pricing_type === "allowance" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Allowance-Based Pricing</p>
            <p>Line items are split into fixed Labor + Installation and Material Allowances. Client view shows: <span className="font-mono">"Starting at {fmt(baseTotal)} — final price depends on selections."</span></p>
          </div>
        )}

        {form.pricing_type === "time_and_materials" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Hourly Rate ($)</Label>
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={(e) => update("hourly_rate", e.target.value)}
                  className="font-mono text-sm h-9"
                  placeholder="95"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Est. Hours</Label>
                <Input
                  type="number"
                  value={form.estimated_hours}
                  onChange={(e) => update("estimated_hours", e.target.value)}
                  className="font-mono text-sm h-9"
                  placeholder="200"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Materials Est. ($)</Label>
                <Input
                  type="number"
                  value={form.materials_estimate}
                  onChange={(e) => update("materials_estimate", e.target.value)}
                  className="font-mono text-sm h-9"
                  placeholder="15000"
                />
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Running Estimate</span>
              <span className="text-lg font-mono font-bold" style={{ color: brand.accent }}>
                {fmt(tmTotal)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Note: Final invoice based on actual hours and materials.
            </p>
          </div>
        )}
      </div>

      {/* ══ ACTIONS BAR ══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="text-[10px]" variant="outline">
          {estimate.proposal_status?.toUpperCase() || "DRAFT"}
        </Badge>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => window.open(proposalUrl, "_blank")}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-sans"
          onClick={() => {
            navigator.clipboard.writeText(proposalUrl);
            toast.success("Link copied");
          }}
        >
          <Copy className="w-3.5 h-3.5" /> Copy Link
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={downloadDocx} disabled={docxLoading}>
          {docxLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Download .docx
        </Button>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={save} disabled={saving} style={{ background: brand.accent, color: "#fff" }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Save Proposal
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["cover", "intro", "scope"]} className="space-y-2">
        {/* ── COVER ── */}
        <AccordionItem value="cover" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Cover</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div>
              <Label className="text-xs font-sans">Cover Image URL</Label>
              <Input
                value={form.proposal_cover_image_url}
                onChange={(e) => update("proposal_cover_image_url", e.target.value)}
                placeholder="https://..."
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Cover Video URL (optional)</Label>
              <Input
                value={form.proposal_cover_video_url}
                onChange={(e) => update("proposal_cover_video_url", e.target.value)}
                placeholder="YouTube/Vimeo URL"
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Prepared For</Label>
              <Input
                value={form.proposal_prepared_for}
                onChange={(e) => update("proposal_prepared_for", e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Tagline</Label>
              <Input
                value={form.proposal_tagline}
                onChange={(e) => update("proposal_tagline", e.target.value)}
                placeholder={brand.tagline}
                className="text-xs"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── INTRODUCTION ── */}
        <AccordionItem value="intro" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Introduction</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <Textarea
              value={form.proposal_intro_text}
              onChange={(e) => update("proposal_intro_text", e.target.value)}
              rows={5}
              className="text-xs"
              placeholder="Write a warm, personalized introduction..."
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => aiGenerate("proposal_intro_text", "proposal_intro")}
              disabled={!!aiLoading}
            >
              {aiLoading === "proposal_intro_text" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Write with AI
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── SCOPE OF WORK ── */}
        <AccordionItem value="scope" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Scope of Work</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-[11px] text-muted-foreground">
              {lineItems.length} line items from estimate.
              {form.pricing_type === "labor_only" && " (Labor Only — materials column hidden on proposal)"}
            </p>
            <ScopeSectionBuilder
              sections={form.proposal_scope_sections as ScopeSection[]}
              onChange={(sections) => update("proposal_scope_sections", sections)}
              lineItems={lineItems}
              projectType={estimate.title?.toLowerCase()}
            />
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                Plain text description (legacy)
              </summary>
              <div className="mt-2 space-y-2">
                <Textarea
                  value={form.proposal_scope_description}
                  onChange={(e) => update("proposal_scope_description", e.target.value)}
                  rows={3}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => aiGenerate("proposal_scope_description", "scope_description")}
                  disabled={!!aiLoading}
                >
                  {aiLoading === "proposal_scope_description" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </Button>
              </div>
            </details>
          </AccordionContent>
        </AccordionItem>

        {/* ── CLIENT SELECTIONS ── */}
        <AccordionItem value="selections" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">
            Client Selections / Shopping List
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ClientSelectionsBuilder
              selections={form.proposal_client_selections as SelectionCategory[]}
              onChange={(selections) => update("proposal_client_selections", selections)}
              projectType={estimate.title?.toLowerCase()}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── INVESTMENT ── */}
        <AccordionItem value="investment" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Investment</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {/* Three-tier shows MultiOptionPricing */}
            {form.pricing_type === "three_tier" && (
              <MultiOptionPricing
                enabled={true}
                onToggle={() => {}}
                options={
                  (form.proposal_option_prices as OptionPrice[]).length > 0
                    ? (form.proposal_option_prices as OptionPrice[])
                    : [
                        { label: "Good", sub: "Essential scope", base: "", upgrade: null },
                        { label: "Better", sub: "Enhanced finishes", base: "", upgrade: null },
                        { label: "Best", sub: "Premium everything", base: "", upgrade: null },
                      ]
                }
                onChange={(opts) => update("proposal_option_prices", opts)}
              />
            )}

            {/* Non-three-tier: legacy multi-option toggle for backward compat */}
            {form.pricing_type !== "three_tier" && (
              <>
                <MultiOptionPricing
                  enabled={form.proposal_multi_option as boolean}
                  onToggle={(v) => update("proposal_multi_option", v)}
                  options={form.proposal_option_prices as OptionPrice[]}
                  onChange={(opts) => update("proposal_option_prices", opts)}
                />

                {!form.proposal_multi_option && form.pricing_type !== "time_and_materials" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-sans">Optional Add-On Items</Label>
                    {(form.proposal_optional_line_items as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const next = [...(form.proposal_optional_line_items as any[])];
                            next[i] = { ...next[i], description: e.target.value };
                            update("proposal_optional_line_items", next);
                          }}
                          className="text-xs flex-1"
                          placeholder="Description"
                        />
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            const next = [...(form.proposal_optional_line_items as any[])];
                            next[i] = { ...next[i], amount: Number(e.target.value) };
                            update("proposal_optional_line_items", next);
                          }}
                          className="text-xs w-24 font-mono"
                          placeholder="$"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            update(
                              "proposal_optional_line_items",
                              (form.proposal_optional_line_items as any[]).filter(
                                (_: any, idx: number) => idx !== i
                              )
                            );
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        update("proposal_optional_line_items", [
                          ...(form.proposal_optional_line_items as any[]),
                          { id: crypto.randomUUID(), description: "", amount: 0, selected_by_default: false },
                        ]);
                      }}
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </Button>
                  </div>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ── TIMELINE ── */}
        <AccordionItem value="timeline" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Project Timeline</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {(form.proposal_timeline_phases as any[]).map((phase: any, i: number) => (
              <Card key={i} className="p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={phase.icon || ""}
                    onChange={(e) => {
                      const next = [...(form.proposal_timeline_phases as any[])];
                      next[i] = { ...next[i], icon: e.target.value };
                      update("proposal_timeline_phases", next);
                    }}
                    className="w-14 text-center text-xs"
                    placeholder="📋"
                  />
                  <Input
                    value={phase.phase_title || ""}
                    onChange={(e) => {
                      const next = [...(form.proposal_timeline_phases as any[])];
                      next[i] = { ...next[i], phase_title: e.target.value };
                      update("proposal_timeline_phases", next);
                    }}
                    className="text-xs flex-1"
                    placeholder="Phase title"
                  />
                  <Input
                    value={phase.duration || ""}
                    onChange={(e) => {
                      const next = [...(form.proposal_timeline_phases as any[])];
                      next[i] = { ...next[i], duration: e.target.value };
                      update("proposal_timeline_phases", next);
                    }}
                    className="text-xs w-24"
                    placeholder="Week 1-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      update(
                        "proposal_timeline_phases",
                        (form.proposal_timeline_phases as any[]).filter(
                          (_: any, idx: number) => idx !== i
                        )
                      );
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Textarea
                  value={phase.description || ""}
                  onChange={(e) => {
                    const next = [...(form.proposal_timeline_phases as any[])];
                    next[i] = { ...next[i], description: e.target.value };
                    update("proposal_timeline_phases", next);
                  }}
                  className="text-xs"
                  rows={2}
                  placeholder="Description..."
                />
              </Card>
            ))}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => {
                  update("proposal_timeline_phases", [
                    ...(form.proposal_timeline_phases as any[]),
                    { icon: "📋", phase_title: "", duration: "", description: "" },
                  ]);
                }}
              >
                <Plus className="w-3 h-3" /> Add Phase
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => aiGenerate("proposal_timeline_phases", "proposal_timeline")}
                disabled={!!aiLoading}
              >
                {aiLoading === "proposal_timeline_phases" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Generate Timeline
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── WHY US ── */}
        <AccordionItem value="why-us" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Why Choose Us</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <Textarea
              value={form.proposal_why_us_text}
              onChange={(e) => update("proposal_why_us_text", e.target.value)}
              rows={4}
              className="text-xs"
              placeholder={`Why clients should choose ${brand.company}...`}
            />
            <Label className="text-xs font-sans">Stat Callouts</Label>
            {(form.proposal_stat_callouts as any[]).map((stat: any, i: number) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={stat.icon}
                  onChange={(e) => {
                    const n = [...(form.proposal_stat_callouts as any[])];
                    n[i] = { ...n[i], icon: e.target.value };
                    update("proposal_stat_callouts", n);
                  }}
                  className="w-12 text-center text-xs"
                  placeholder="🏠"
                />
                <Input
                  value={stat.number}
                  onChange={(e) => {
                    const n = [...(form.proposal_stat_callouts as any[])];
                    n[i] = { ...n[i], number: e.target.value };
                    update("proposal_stat_callouts", n);
                  }}
                  className="w-20 text-xs"
                  placeholder="200+"
                />
                <Input
                  value={stat.label}
                  onChange={(e) => {
                    const n = [...(form.proposal_stat_callouts as any[])];
                    n[i] = { ...n[i], label: e.target.value };
                    update("proposal_stat_callouts", n);
                  }}
                  className="flex-1 text-xs"
                  placeholder="homes managed"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    update(
                      "proposal_stat_callouts",
                      (form.proposal_stat_callouts as any[]).filter((_: any, idx: number) => idx !== i)
                    )
                  }
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() =>
                update("proposal_stat_callouts", [
                  ...(form.proposal_stat_callouts as any[]),
                  { icon: "⭐", number: "", label: "" },
                ])
              }
            >
              <Plus className="w-3 h-3" /> Add Stat
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── TESTIMONIAL ── */}
        <AccordionItem value="testimonial" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Testimonial</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <Textarea
              value={form.proposal_testimonial_quote}
              onChange={(e) => update("proposal_testimonial_quote", e.target.value)}
              rows={3}
              className="text-xs"
              placeholder="Client testimonial quote..."
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-sans">Author</Label>
                <Input
                  value={form.proposal_testimonial_author}
                  onChange={(e) => update("proposal_testimonial_author", e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-sans">Role/Location</Label>
                <Input
                  value={form.proposal_testimonial_role}
                  onChange={(e) => update("proposal_testimonial_role", e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── TERMS ── */}
        <AccordionItem value="terms" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Terms & Conditions</AccordionTrigger>
          <AccordionContent className="pb-4">
            <TermsEditor
              terms={form.proposal_terms as TermItem[]}
              onChange={(terms) => update("proposal_terms", terms)}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── CTA ── */}
        <AccordionItem value="cta" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-sans font-semibold">Next Steps & CTA</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div>
              <Label className="text-xs font-sans">CTA Headline</Label>
              <Input
                value={form.proposal_cta_headline}
                onChange={(e) => update("proposal_cta_headline", e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-sans">CTA Subtext</Label>
              <Textarea
                value={form.proposal_cta_subtext}
                onChange={(e) => update("proposal_cta_subtext", e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Analytics ── */}
      {(estimate.proposal_view_count || 0) > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-xs font-sans font-semibold text-foreground">Proposal Analytics</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Views</p>
              <p className="text-lg font-bold">{estimate.proposal_view_count || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Time Spent</p>
              <p className="text-lg font-bold">{Math.round((estimate.proposal_time_spent_seconds || 0) / 60)}m</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Sections Viewed</p>
              <p className="text-lg font-bold">{(estimate.proposal_sections_viewed || []).length}</p>
            </div>
          </div>
          {estimate.proposal_first_viewed_at && (
            <p className="text-[10px] text-muted-foreground">
              First viewed: {new Date(estimate.proposal_first_viewed_at).toLocaleDateString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProposalBuilder;
