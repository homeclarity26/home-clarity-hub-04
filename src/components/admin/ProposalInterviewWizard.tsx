import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProposalInterviewWizardProps {
  propertyId: string;
  propertyAddress?: string;
  clientName?: string;
  reportPages?: Record<string, any>;
  onComplete: (estimateId: string) => void;
  onCancel: () => void;
}

type BrandType = "hbc" | "akr";
type PricingType = "labor_only" | "lump_sum" | "three_tier" | "allowance" | "time_and_materials";
type BudgetRange = "$20K-$40K" | "$40K-$75K" | "$75K-$125K" | "$125K-$200K" | "custom";
type TimelineOption = "2-3 weeks" | "4-6 weeks" | "6-10 weeks" | "10-16 weeks" | "custom";

interface InterviewAnswers {
  projectType: string;
  projectTypeCustom: string;
  brand: BrandType;
  clientName: string;
  propertyAddress: string;
  pricingStructure: PricingType;
  scopeDescription: string;
  materials: string;
  budgetRange: BudgetRange | "";
  budgetCustom: string;
  timeline: TimelineOption | "";
  timelineCustom: string;
  hasClientSelections: boolean;
  clientSelections: string;
  specialTerms: string;
  adminNotes: string;
  // report bridge
  selectedReportPages: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_TYPES = [
  "Kitchen Remodel",
  "Bathroom Renovation",
  "First Floor Transformation",
  "Other",
];

const PRICING_OPTIONS: { value: PricingType; label: string; desc: string }[] = [
  { value: "labor_only", label: "Labor Only", desc: "Client supplies materials" },
  { value: "lump_sum", label: "Lump Sum", desc: "Single all-in price" },
  { value: "three_tier", label: "Good / Better / Best", desc: "3-tier options" },
  { value: "allowance", label: "Allowance-Based", desc: "Labor fixed, materials budgeted" },
  { value: "time_and_materials", label: "Time & Materials", desc: "Hourly + actual materials" },
];

const BUDGET_RANGES: BudgetRange[] = ["$20K-$40K", "$40K-$75K", "$75K-$125K", "$125K-$200K", "custom"];
const TIMELINE_OPTIONS: TimelineOption[] = ["2-3 weeks", "4-6 weeks", "6-10 weeks", "10-16 weeks", "custom"];

const DEFAULT_WARRANTY = "10-year workmanship warranty on all work performed by AK Renovations / Hometown Builders Club LLC.";

const TOTAL_STEPS = 12;

// ── Helper: Progress bar ──────────────────────────────────────────────────────

const ProgressBar = ({ step, total }: { step: number; total: number }) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-mono text-muted-foreground">
        Step {step} of {total}
      </span>
      <span className="text-xs font-mono text-muted-foreground">
        {Math.round((step / total) * 100)}%
      </span>
    </div>
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${(step / total) * 100}%`,
          background: "linear-gradient(to right, hsl(var(--hbc-gold)), hsl(var(--hbc-rust)))",
        }}
      />
    </div>
  </div>
);

// ── Report Bridge sub-component ───────────────────────────────────────────────

const ReportPagePicker = ({
  reportPages,
  selected,
  onToggle,
}: {
  reportPages: Record<string, any>;
  selected: string[];
  onToggle: (pageKey: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const pages = Object.entries(reportPages || {});
  if (pages.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-amber-800"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Pull from Home Clarity Report</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-amber-700 mb-2">
            Check pages to inject their findings into the AI prompt.
          </p>
          {pages.map(([key, page]: [string, any]) => {
            const isSelected = selected.includes(key);
            const title = page?.title || page?.page_title || key;
            const condition = page?.condition_rating || page?.condition || "";
            return (
              <label
                key={key}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${
                  isSelected
                    ? "border-amber-400 bg-amber-100"
                    : "border-transparent hover:bg-amber-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(key)}
                  className="accent-amber-600"
                />
                <span className="text-sm text-amber-900 flex-1">{title}</span>
                {condition && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                    {condition}
                  </span>
                )}
                {isSelected && (
                  <Badge className="text-[9px] bg-amber-500 text-white border-0 px-1.5">
                    included
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Wizard ───────────────────────────────────────────────────────────────

const ProposalInterviewWizard = ({
  propertyId,
  propertyAddress,
  clientName: clientNameProp,
  reportPages,
  onComplete,
  onCancel,
}: ProposalInterviewWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState<InterviewAnswers>({
    projectType: "",
    projectTypeCustom: "",
    brand: "hbc",
    clientName: clientNameProp || "",
    propertyAddress: propertyAddress || "",
    pricingStructure: "lump_sum",
    scopeDescription: "",
    materials: "",
    budgetRange: "",
    budgetCustom: "",
    timeline: "",
    timelineCustom: "",
    hasClientSelections: false,
    clientSelections: "",
    specialTerms: DEFAULT_WARRANTY,
    adminNotes: "",
    selectedReportPages: [],
  });

  const set = <K extends keyof InterviewAnswers>(key: K, value: InterviewAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const toggleReportPage = (key: string) => {
    set(
      "selectedReportPages",
      answers.selectedReportPages.includes(key)
        ? answers.selectedReportPages.filter((k) => k !== key)
        : [...answers.selectedReportPages, key]
    );
  };

  const canAdvance = () => {
    switch (step) {
      case 1: return answers.projectType !== "" && (answers.projectType !== "Other" || answers.projectTypeCustom.trim() !== "");
      case 2: return answers.brand !== "" as any;
      case 3: return answers.clientName.trim() !== "";
      case 4: return true; // address optional
      case 5: return answers.pricingStructure !== "" as any;
      case 6: return answers.scopeDescription.trim().length > 10;
      case 7: return true;
      case 8: return answers.budgetRange !== "" && (answers.budgetRange !== "custom" || answers.budgetCustom.trim() !== "");
      case 9: return answers.timeline !== "" && (answers.timeline !== "custom" || answers.timelineCustom.trim() !== "");
      case 10: return true;
      case 11: return true;
      case 12: return true;
      default: return true;
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const projectType =
        answers.projectType === "Other" ? answers.projectTypeCustom : answers.projectType;
      const budget =
        answers.budgetRange === "custom" ? answers.budgetCustom : answers.budgetRange;
      const timeline =
        answers.timeline === "custom" ? answers.timelineCustom : answers.timeline;

      // Build report context
      const reportContext: any[] = [];
      if (reportPages && answers.selectedReportPages.length > 0) {
        for (const key of answers.selectedReportPages) {
          const page = reportPages[key];
          if (page) {
            reportContext.push({
              page: page.title || page.page_title || key,
              condition: page.condition_rating || page.condition || "",
              narrative: page.narrative || page.summary || "",
              observations: page.key_observations || page.observations || [],
              estimatedCost: page.estimated_cost || page.tiers?.[0]?.cost || null,
              tiers: page.tiers || null,
            });
          }
        }
      }

      // Build the AI prompt message
      const userMessage = [
        `Project Type: ${projectType}`,
        `Brand: ${answers.brand === "hbc" ? "Hometown Builders Club LLC (HBC)" : "AK Renovations (AKR)"}`,
        `Client: ${answers.clientName}`,
        answers.propertyAddress ? `Property Address: ${answers.propertyAddress}` : "",
        `Pricing Structure: ${PRICING_OPTIONS.find((p) => p.value === answers.pricingStructure)?.label}`,
        `\nScope of Work:\n${answers.scopeDescription}`,
        answers.materials ? `\nMaterials & Finishes:\n${answers.materials}` : "",
        `\nBudget Range: ${budget}`,
        `Estimated Timeline: ${timeline}`,
        answers.hasClientSelections && answers.clientSelections
          ? `\nClient Selections Needed:\n${answers.clientSelections}`
          : "",
        answers.specialTerms ? `\nSpecial Terms / Warranty:\n${answers.specialTerms}` : "",
        answers.adminNotes ? `\n[ADMIN ONLY - Do not include on proposal] Notes:\n${answers.adminNotes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("ai-proposal-kickoff", {
        body: {
          userMessage,
          clientName: answers.clientName,
          propertyAddress: answers.propertyAddress,
          interviewData: {
            projectType,
            brand: answers.brand,
            pricingStructure: answers.pricingStructure,
            budget,
            timeline,
            hasClientSelections: answers.hasClientSelections,
            adminNotes: answers.adminNotes,
          },
          reportContext: reportContext.length > 0 ? reportContext : undefined,
        },
      });

      if (error) throw error;
      if (!data?.lineItems?.length) {
        toast.error("AI couldn't generate line items — try adding more scope detail");
        return;
      }

      // Calculate totals
      const aiSubtotal = data.lineItems.reduce(
        (s: number, li: any) => s + (li.quantity || 1) * (li.unit_price || 0),
        0
      );

      // Determine pricing_type from interview
      const pricingTypeMap: Record<PricingType, string> = {
        labor_only: "labor_only",
        lump_sum: "lump_sum",
        three_tier: "three_tier",
        allowance: "allowance",
        time_and_materials: "time_and_materials",
      };

      const proposalToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const colorTheme = answers.brand; // 'hbc' | 'akr'

      const { data: est, error: estErr } = await supabase.from("estimates")
        .insert({
          property_id: propertyId,
          admin_id: user.id,
          title: data.title || `${projectType} Proposal`,
          notes: data.notes || "",
          subtotal: aiSubtotal,
          discount_amount: 0,
          discount_type: "dollar",
          tax: 0,
          total: aiSubtotal,
          proposal_prepared_for: answers.clientName,
          proposal_tagline: data.tagline || "",
          proposal_intro_text: data.introText || "",
          proposal_scope_sections: data.scopeSections || [],
          proposal_client_selections: data.clientSelections || [],
          proposal_terms: data.terms || [],
          proposal_timeline_phases: data.timelinePhases || [],
          proposal_color_theme: colorTheme,
          proposal_token: proposalToken,
          pricing_type: pricingTypeMap[answers.pricingStructure] || "lump_sum",
        })
        .select("id")
        .single();

      if (estErr || !est) throw estErr;

      // Insert line items
      await supabase.from("estimate_line_items").insert(
        data.lineItems.map((li: any, i: number) => ({
          estimate_id: est.id,
          description: li.description || "",
          quantity: li.quantity || 1,
          unit_price: li.unit_price || 0,
          total: (li.quantity || 1) * (li.unit_price || 0),
          sort_order: i,
        }))
      );

      toast.success(`Proposal "${data.title}" created with ${data.lineItems.length} line items`);
      onComplete(est.id);
    } catch (err: any) {
      if (err?.status === 429) toast.error("Rate limited — try again in a moment");
      else if (err?.status === 402) toast.error("AI credits exhausted");
      else toast.error("Failed to generate proposal — try again");
      console.error("Interview wizard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Render individual step content ────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ─── Step 1: Project Type ───────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              What type of project is this?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("projectType", type)}
                  className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${
                    answers.projectType === type
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {answers.projectType === "Other" && (
              <Input
                placeholder="Describe the project type..."
                value={answers.projectTypeCustom}
                onChange={(e) => set("projectTypeCustom", e.target.value)}
                className="font-sans"
                autoFocus
              />
            )}
          </div>
        );

      // ─── Step 2: Brand ──────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Which brand are you using for this proposal?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => set("brand", "hbc")}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${
                  answers.brand === "hbc"
                    ? "border-accent bg-accent/10 shadow-lg scale-[1.02]"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: "hsl(var(--hbc-navy))" }}
                >
                  HBC
                </div>
                <p className="font-semibold text-foreground text-sm">Hometown Builders Club</p>
                <p className="text-xs text-muted-foreground mt-1">Gold — #C4A265</p>
                {answers.brand === "hbc" && (
                  <span className="mt-2 inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-white">
                    Selected
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => set("brand", "akr")}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${
                  answers.brand === "akr"
                    ? "border-destructive bg-destructive/10 shadow-lg scale-[1.02]"
                    : "border-border hover:border-destructive/50"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: "hsl(var(--hbc-rust))" }}
                >
                  AKR
                </div>
                <p className="font-semibold text-foreground text-sm">AK Renovations</p>
                <p className="text-xs text-muted-foreground mt-1">Rust — #B5450B</p>
                {answers.brand === "akr" && (
                  <span className="mt-2 inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive text-white">
                    Selected
                  </span>
                )}
              </button>
            </div>
          </div>
        );

      // ─── Step 3: Client Name ────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Who is this proposal for?
            </h2>
            <Input
              placeholder="Client name..."
              value={answers.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              className="font-sans text-base h-12"
              autoFocus
            />
          </div>
        );

      // ─── Step 4: Property Address ───────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              What is the property address?
            </h2>
            <Input
              placeholder="Property address..."
              value={answers.propertyAddress}
              onChange={(e) => set("propertyAddress", e.target.value)}
              className="font-sans text-base h-12"
              autoFocus
            />
            {propertyAddress && answers.propertyAddress !== propertyAddress && (
              <button
                type="button"
                className="text-xs text-accent underline"
                onClick={() => set("propertyAddress", propertyAddress)}
              >
                Use property address: {propertyAddress}
              </button>
            )}
          </div>
        );

      // ─── Step 5: Pricing Structure ──────────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              What is the pricing structure?
            </h2>
            <div className="space-y-2">
              {PRICING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("pricingStructure", opt.value)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all flex items-center justify-between ${
                    answers.pricingStructure === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {answers.pricingStructure === opt.value && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      // ─── Step 6: Scope Description ──────────────────────────────────────
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Describe the full scope of work in your own words
            </h2>
            <p className="text-sm text-muted-foreground">
              This is the core AI input. Be as detailed as possible.
            </p>
            <Textarea
              placeholder="e.g. Full master bathroom gut-to-studs remodel: demo existing tile and fixtures, install new 3/4-inch plywood subfloor, 12x24 porcelain tile floor with radiant heat mat, custom niche shower with glass door..."
              value={answers.scopeDescription}
              onChange={(e) => set("scopeDescription", e.target.value)}
              className="font-sans text-sm min-h-[160px] resize-none"
              autoFocus
            />
            {/* Report Bridge */}
            {reportPages && Object.keys(reportPages).length > 0 && (
              <ReportPagePicker
                reportPages={reportPages}
                selected={answers.selectedReportPages}
                onToggle={toggleReportPage}
              />
            )}
          </div>
        );

      // ─── Step 7: Materials & Finishes ───────────────────────────────────
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Are there any specific materials, finishes, or selections included?
            </h2>
            <Textarea
              placeholder="e.g. Kohler Tresham toilet, Delta Trinsic fixtures in Matte Black, Daltile Restore collection 12×24 in Arctic, MSI Q-Premium quartz countertop..."
              value={answers.materials}
              onChange={(e) => set("materials", e.target.value)}
              className="font-sans text-sm min-h-[120px] resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Leave blank if no specific selections yet.</p>
          </div>
        );

      // ─── Step 8: Budget Range ───────────────────────────────────────────
      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              What is the approximate budget range?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {BUDGET_RANGES.filter((r) => r !== "custom").map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => set("budgetRange", range)}
                  className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                    answers.budgetRange === range
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {range}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("budgetRange", "custom")}
                className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                  answers.budgetRange === "custom"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-accent/50"
                }`}
              >
                Custom
              </button>
            </div>
            {answers.budgetRange === "custom" && (
              <Input
                placeholder="e.g. $200,000 – $250,000"
                value={answers.budgetCustom}
                onChange={(e) => set("budgetCustom", e.target.value)}
                className="font-sans"
                autoFocus
              />
            )}
          </div>
        );

      // ─── Step 9: Timeline ───────────────────────────────────────────────
      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              What is the estimated project timeline?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TIMELINE_OPTIONS.filter((t) => t !== "custom").map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("timeline", opt)}
                  className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                    answers.timeline === opt
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("timeline", "custom")}
                className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                  answers.timeline === "custom"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-accent/50"
                }`}
              >
                Custom
              </button>
            </div>
            {answers.timeline === "custom" && (
              <Input
                placeholder="e.g. 20 weeks"
                value={answers.timelineCustom}
                onChange={(e) => set("timelineCustom", e.target.value)}
                className="font-sans"
                autoFocus
              />
            )}
          </div>
        );

      // ─── Step 10: Client Selections ─────────────────────────────────────
      case 10:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Are there any items the client needs to select or purchase?
            </h2>
            <div className="flex gap-3">
              {(["Yes", "No"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("hasClientSelections", opt === "Yes")}
                  className={`flex-1 rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                    (opt === "Yes") === answers.hasClientSelections
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {answers.hasClientSelections && (
              <Textarea
                placeholder="e.g. Client to select tile from our allowance, faucet finish, cabinet hardware, paint color..."
                value={answers.clientSelections}
                onChange={(e) => set("clientSelections", e.target.value)}
                className="font-sans text-sm min-h-[100px] resize-none"
                autoFocus
              />
            )}
          </div>
        );

      // ─── Step 11: Terms & Warranty ──────────────────────────────────────
      case 11:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Any special terms, warranty notes, or exclusions?
            </h2>
            <Textarea
              value={answers.specialTerms}
              onChange={(e) => set("specialTerms", e.target.value)}
              className="font-sans text-sm min-h-[120px] resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Pre-filled with standard warranty. Edit or add exclusions as needed.
            </p>
          </div>
        );

      // ─── Step 12: Admin Notes ───────────────────────────────────────────
      case 12:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Any additional notes for Adam's eyes only?
            </h2>
            <p className="text-sm text-muted-foreground">
              These notes are creator-only and will NOT appear on the client proposal.
            </p>
            <Textarea
              placeholder="Internal notes, reminders, scope concerns, margin targets..."
              value={answers.adminNotes}
              onChange={(e) => set("adminNotes", e.target.value)}
              className="font-sans text-sm min-h-[120px] resize-none"
              autoFocus
            />
            {/* Summary Card */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs font-sans text-muted-foreground">
              <p className="font-semibold text-foreground text-sm mb-3">Ready to generate:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Project:</span>
                <span className="text-foreground">{answers.projectType === "Other" ? answers.projectTypeCustom : answers.projectType}</span>
                <span className="text-muted-foreground">Brand:</span>
                <span className="text-foreground">{answers.brand === "hbc" ? "HBC" : "AKR"}</span>
                <span className="text-muted-foreground">Client:</span>
                <span className="text-foreground">{answers.clientName}</span>
                <span className="text-muted-foreground">Pricing:</span>
                <span className="text-foreground">{PRICING_OPTIONS.find((p) => p.value === answers.pricingStructure)?.label}</span>
                <span className="text-muted-foreground">Budget:</span>
                <span className="text-foreground">{answers.budgetRange === "custom" ? answers.budgetCustom : answers.budgetRange}</span>
                <span className="text-muted-foreground">Timeline:</span>
                <span className="text-foreground">{answers.timeline === "custom" ? answers.timelineCustom : answers.timeline}</span>
                {answers.selectedReportPages.length > 0 && (
                  <>
                    <span className="text-muted-foreground">Report data:</span>
                    <span className="text-foreground">{answers.selectedReportPages.length} page(s) included</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold font-sans text-foreground">
                AI Proposal Interview
              </span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Step Content */}
        <div className="px-6 py-6 min-h-[300px]">{renderStep()}</div>

        {/* Footer Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
            className="gap-1.5 font-sans"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="gap-1.5 font-sans"
              style={{ background: canAdvance() ? "hsl(var(--hbc-gold))" : undefined, color: canAdvance() ? "white" : undefined }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              className="gap-1.5 font-sans px-6"
              style={{ background: "hsl(var(--hbc-gold))", color: "white" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building Proposal...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Proposal
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalInterviewWizard;
