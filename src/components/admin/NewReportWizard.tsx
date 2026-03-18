import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, ArrowLeft, ArrowRight, Mail, Copy, ExternalLink, FileText, Sparkles, ShieldCheck, AlertTriangle, Info, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import AddressAutocomplete, { type PropertyData } from "./AddressAutocomplete";
import ClientIntelligenceCard from "./ClientIntelligenceCard";
import DigitalAssetsStep from "./DigitalAssetsStep";

const steps = ["Client & Property", "Digital Assets", "Select Pages", "Review & Publish"];

interface ClientFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyName: string;
  propertyType: string;
  relationshipType: string;
  yearBuilt: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  discoveryNotes: string;
}

interface DigitalAssetsData {
  hoverUrl: string;
  hoverPdfUrl: string;
  iguideUrl: string;
  iguidePdfUrl: string;
}

interface PageTemplate {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  sub_group: string | null;
  default_order: number;
  icon: string | null;
  block_config: unknown;
  default_content: unknown;
}

const groupLabels: Record<string, string> = {
  information: "📋 Information",
  exterior: "🏠 Exterior",
  interior: "🏡 Interior",
  systems: "⚙️ Systems",
  strategy: "📈 Strategy",
};

const subGroupLabels: Record<string, string> = {
  "overview": "Overview",
  "roof-envelope": "Roof & Envelope",
  "cladding": "Cladding & Siding",
  "openings": "Doors & Windows",
  "structure": "Foundation & Structure",
  "site": "Site & Drainage",
  "hardscape": "Hardscape",
  "structures": "Decks & Porches",
  "landscape": "Landscape",
  "amenities": "Amenities",
  "kitchen-dining": "Kitchen & Dining",
  "primary-suite": "Primary Suite",
  "bedrooms": "Bedrooms",
  "bathrooms": "Bathrooms",
  "living-spaces": "Living Spaces",
  "flex-spaces": "Flex Spaces",
  "entertainment": "Entertainment",
  "basement": "Basement",
  "utility": "Utility",
  "circulation": "Circulation",
  "storage": "Storage",
  "hvac": "HVAC",
  "plumbing": "Plumbing",
  "electrical": "Electrical",
  "safety": "Safety",
  "planning": "Planning",
};

const propertyTypes = [
  { value: "single_family", label: "Single-Family" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
];

const relationshipTypes = [
  { value: "owner_occupied", label: "Owner-Occupied" },
  { value: "recently_purchased", label: "Recently Purchased" },
  { value: "pre_purchase", label: "Pre-Purchase Inspection" },
  { value: "investment", label: "Investment Property" },
];

const NewReportWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    portalUrl: string;
    isExisting: boolean;
    magicLinkSent: boolean;
    tempPassword?: string;
  } | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [clientIntelligenceSummary, setClientIntelligenceSummary] = useState<string | null>(null);
  const [aiRecommendedSlugs, setAiRecommendedSlugs] = useState<Set<string>>(new Set());
  const [aiRecommendReasoning, setAiRecommendReasoning] = useState<string | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [qaIssues, setQaIssues] = useState<{ severity: "error" | "warning" | "info"; page: string; message: string }[] | null>(null);
  const [qaScore, setQaScore] = useState<number | null>(null);
  const [qaSummary, setQaSummary] = useState<string | null>(null);
  const [isRunningQa, setIsRunningQa] = useState(false);
  const [isDraftingAll, setIsDraftingAll] = useState(false);
  const [draftProgress, setDraftProgress] = useState<{ current: number; total: number; currentPage: string } | null>(null);
  const [draftAllDone, setDraftAllDone] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Template state
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [form, setForm] = useState<ClientFormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    county: "",
    propertyName: "",
    propertyType: "",
    relationshipType: "",
    yearBuilt: "",
    sqft: "",
    bedrooms: "",
    bathrooms: "",
    discoveryNotes: "",
  });

  const [digitalAssets, setDigitalAssets] = useState<DigitalAssetsData>({
    hoverUrl: "",
    hoverPdfUrl: "",
    iguideUrl: "",
    iguidePdfUrl: "",
  });

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const { data, error } = await supabase
          .from("page_templates")
          .select("*")
          .order("group_name")
          .order("default_order");

        if (error) throw error;

        // ── DEV FALLBACK: seed local templates if DB is empty ──────
        let loadedTemplates = data || [];
        if (loadedTemplates.length === 0) {
          console.warn("[Dev] page_templates table is empty — using hardcoded fallbacks");
          loadedTemplates = [
            { id: "t-exec-summary", slug: "executive-summary", name: "Executive Summary", group_name: "information", sub_group: "overview", default_order: 1, icon: "FileText", block_config: {}, default_content: { narrative: "A comprehensive overview of your home's current condition, key findings, and recommended priorities.", condition_rating: "good", health_bar: 75 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-prop-overview", slug: "property-overview", name: "Property Overview", group_name: "information", sub_group: "overview", default_order: 2, icon: "Home", block_config: {}, default_content: { narrative: "Detailed property specifications, construction details, and general characteristics.", condition_rating: "good", health_bar: 80 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-roof", slug: "roof-system", name: "Roof System", group_name: "exterior", sub_group: "roof-envelope", default_order: 1, icon: "Shield", block_config: {}, default_content: { narrative: "Assessment of roofing materials, condition, and estimated remaining lifespan.", condition_rating: "fair", health_bar: 60, specs: { material: "Asphalt Shingle", age: "12 years", estimated_life: "20-25 years" }, tiers: [{ label: "Repair", cost: "$500-$1,500" }, { label: "Partial Replace", cost: "$3,000-$6,000" }, { label: "Full Replace", cost: "$8,000-$15,000" }] }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-windows", slug: "windows", name: "Windows", group_name: "exterior", sub_group: "openings", default_order: 2, icon: "Square", block_config: {}, default_content: { narrative: "Window condition, energy efficiency, and operation assessment.", condition_rating: "fair", health_bar: 55 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-siding", slug: "siding", name: "Siding & Cladding", group_name: "exterior", sub_group: "cladding", default_order: 3, icon: "Layers", block_config: {}, default_content: { narrative: "Exterior cladding materials, condition, and maintenance needs.", condition_rating: "good", health_bar: 70 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-foundation", slug: "foundation", name: "Foundation", group_name: "exterior", sub_group: "structure", default_order: 4, icon: "Building", block_config: {}, default_content: { narrative: "Foundation type, condition, and any signs of settlement or water intrusion.", condition_rating: "good", health_bar: 75 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-garage", slug: "garage", name: "Garage", group_name: "exterior", sub_group: "structures", default_order: 5, icon: "Car", block_config: {}, default_content: { narrative: "Garage structure, door operation, and storage capacity.", condition_rating: "good", health_bar: 70 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-kitchen", slug: "kitchen", name: "Kitchen", group_name: "interior", sub_group: "kitchen-dining", default_order: 1, icon: "Utensils", block_config: {}, default_content: { narrative: "Kitchen layout, appliances, countertops, cabinetry, and overall functionality.", condition_rating: "fair", health_bar: 55, tiers: [{ label: "Refresh", cost: "$5,000-$10,000" }, { label: "Remodel", cost: "$25,000-$45,000" }, { label: "Full Gut", cost: "$50,000-$80,000" }] }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-primary-bed", slug: "primary-bedroom", name: "Primary Bedroom", group_name: "interior", sub_group: "primary-suite", default_order: 2, icon: "Bed", block_config: {}, default_content: { narrative: "Primary bedroom size, condition, closet space, and comfort features.", condition_rating: "good", health_bar: 75 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-primary-bath", slug: "primary-bathroom", name: "Primary Bathroom", group_name: "interior", sub_group: "primary-suite", default_order: 3, icon: "Bath", block_config: {}, default_content: { narrative: "Primary bathroom fixtures, plumbing, ventilation, and finish condition.", condition_rating: "fair", health_bar: 60, tiers: [{ label: "Refresh", cost: "$3,000-$6,000" }, { label: "Remodel", cost: "$12,000-$20,000" }, { label: "Full Gut", cost: "$25,000-$40,000" }] }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-basement", slug: "basement", name: "Basement", group_name: "interior", sub_group: "basement", default_order: 4, icon: "ArrowDown", block_config: {}, default_content: { narrative: "Basement condition, moisture levels, and finishing potential.", condition_rating: "fair", health_bar: 50, tiers: [{ label: "Waterproof", cost: "$3,000-$8,000" }, { label: "Partial Finish", cost: "$15,000-$25,000" }, { label: "Full Finish", cost: "$30,000-$50,000" }] }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-living", slug: "living-room", name: "Living Room", group_name: "interior", sub_group: "living-spaces", default_order: 5, icon: "Sofa", block_config: {}, default_content: { narrative: "Living room layout, flooring, lighting, and overall condition.", condition_rating: "good", health_bar: 75 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-furnace", slug: "furnace", name: "Furnace / Heating", group_name: "systems", sub_group: "hvac", default_order: 1, icon: "Flame", block_config: {}, default_content: { narrative: "Heating system type, age, efficiency rating, and maintenance history.", condition_rating: "fair", health_bar: 50, specs: { type: "Gas Forced Air", brand: "Carrier", age: "14 years", efficiency: "80% AFUE" }, tiers: [{ label: "Service", cost: "$150-$300" }, { label: "Repair", cost: "$500-$2,000" }, { label: "Replace", cost: "$4,000-$8,000" }] }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-ac", slug: "air-conditioning", name: "Air Conditioning", group_name: "systems", sub_group: "hvac", default_order: 2, icon: "Wind", block_config: {}, default_content: { narrative: "AC system type, capacity, age, and cooling performance.", condition_rating: "fair", health_bar: 55 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-water-heater", slug: "water-heater", name: "Water Heater", group_name: "systems", sub_group: "plumbing", default_order: 3, icon: "Droplets", block_config: {}, default_content: { narrative: "Water heater type, capacity, age, and condition assessment.", condition_rating: "good", health_bar: 65 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-electrical", slug: "electrical-panel", name: "Electrical Panel", group_name: "systems", sub_group: "electrical", default_order: 4, icon: "Zap", block_config: {}, default_content: { narrative: "Main panel capacity, breaker condition, grounding, and code compliance.", condition_rating: "good", health_bar: 70 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-roadmap", slug: "financial-roadmap", name: "Financial Roadmap", group_name: "strategy", sub_group: "planning", default_order: 1, icon: "DollarSign", block_config: {}, default_content: { narrative: "Prioritized investment timeline with estimated costs for all recommended improvements." }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-calendar", slug: "maintenance-calendar", name: "Maintenance Calendar", group_name: "strategy", sub_group: "planning", default_order: 2, icon: "Calendar", block_config: {}, default_content: { narrative: "Seasonal maintenance schedule to protect your investment and prevent costly repairs." }, is_custom: false, version: 1, created_at: "", updated_at: "" },
            { id: "t-laundry", slug: "laundry", name: "Laundry Room", group_name: "interior", sub_group: "utility", default_order: 6, icon: "Shirt", block_config: {}, default_content: { narrative: "Laundry room layout, hookups, ventilation, and condition.", condition_rating: "good", health_bar: 70 }, is_custom: false, version: 1, created_at: "", updated_at: "" },
          ] as any;
        }
        // ────────────────────────────────────────────────────────────

        setTemplates(loadedTemplates);

        const defaultSelections = new Set<string>();
        const defaultSlugs = [
          "executive-summary", "property-overview",
          "roof-system", "windows", "siding",
          "kitchen", "primary-bedroom", "primary-bathroom",
          "furnace", "air-conditioning", "water-heater", "electrical-panel",
          "financial-roadmap", "maintenance-calendar"
        ];
        loadedTemplates.forEach((t: any) => {
          if (defaultSlugs.includes(t.slug)) {
            defaultSelections.add(t.id);
          }
        });
        setSelectedTemplates(defaultSelections);
      } catch (err) {
        console.error("Error loading templates:", err);
        toast({ title: "Error", description: "Failed to load page templates", variant: "destructive" });
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  const updateForm = (field: keyof ClientFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const selectAllInGroup = (groupName: string) => {
    const groupTemplates = templates.filter(t => t.group_name === groupName);
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      groupTemplates.forEach(t => next.add(t.id));
      return next;
    });
  };

  const deselectAllInGroup = (groupName: string) => {
    const groupTemplates = templates.filter(t => t.group_name === groupName);
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      groupTemplates.forEach(t => next.delete(t.id));
      return next;
    });
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    const group = template.group_name;
    const subGroup = template.sub_group || "general";
    if (!acc[group]) acc[group] = {};
    if (!acc[group][subGroup]) acc[group][subGroup] = [];
    acc[group][subGroup].push(template);
    return acc;
  }, {} as Record<string, Record<string, PageTemplate[]>>);

  // Compute digital assets status
  function getDigitalAssetsStatus(): "not_started" | "partial" | "complete" {
    const hasHover = !!(digitalAssets.hoverUrl || digitalAssets.hoverPdfUrl);
    const hasIguide = !!(digitalAssets.iguideUrl || digitalAssets.iguidePdfUrl);
    if (hasHover && hasIguide) return "complete";
    if (hasHover || hasIguide) return "partial";
    return "not_started";
  }

  const handleAiRecommendPages = async () => {
    if (!clientIntelligenceSummary) {
      toast({ title: "Run analysis first", description: "Accept the Client Intelligence Summary before recommending pages.", variant: "destructive" });
      return;
    }

    setIsRecommending(true);
    try {
      const parsed = (() => { try { return JSON.parse(clientIntelligenceSummary); } catch { return null; } })();
      const availablePages = templates.map((t) => ({
        slug: t.slug,
        name: t.name,
        group: t.group_name,
      }));

      const { data, error } = await supabase.functions.invoke("recommend-report-pages", {
        body: {
          intelligenceSummary: parsed?.summary || clientIntelligenceSummary,
          goals: parsed?.goals || [],
          priorities: parsed?.priorities || [],
          constraints: parsed?.constraints || [],
          propertyType: form.propertyType,
          relationshipType: form.relationshipType,
          yearBuilt: form.yearBuilt,
          sqft: form.sqft,
          availablePages,
        },
      });

      if (error) throw error;

      const recommended: string[] = data.recommended || [];
      const newSelected = new Set<string>();
      templates.forEach((t) => {
        if (recommended.includes(t.slug)) newSelected.add(t.id);
      });
      setSelectedTemplates(newSelected);
      setAiRecommendedSlugs(new Set(recommended));
      setAiRecommendReasoning(data.reasoning || null);

      toast({ title: "Pages recommended", description: `AI selected ${newSelected.size} pages based on client context.` });
    } catch (err) {
      console.error("AI page recommendation failed:", err);
      toast({ title: "Recommendation failed", description: "Could not get AI recommendations. You can select pages manually.", variant: "destructive" });
    } finally {
      setIsRecommending(false);
    }
  };

  const handleDraftAllPages = async () => {
    if (!createdPropertyId) {
      toast({ title: "No report yet", description: "The report hasn't been created yet.", variant: "destructive" });
      return;
    }
    // DEV bypass
    if (user?.id === "00000000-0000-0000-0000-000000000000") {
      toast({ title: "Dev mode", description: "Bulk draft skipped — using mock auth." });
      setDraftAllDone(true);
      return;
    }

    setIsDraftingAll(true);
    setDraftAllDone(false);
    setDraftProgress(null);

    try {
      // Fetch the created report_pages
      const { data: reportData } = await supabase
        .from("reports")
        .select("id")
        .eq("property_id", createdPropertyId)
        .single();

      if (!reportData) throw new Error("Report not found");

      const { data: pages } = await supabase
        .from("report_pages")
        .select("id, page_key, title")
        .eq("report_id", reportData.id)
        .order("sort_order", { ascending: true });

      if (!pages || pages.length === 0) {
        toast({ title: "No pages found", description: "No report pages to draft.", variant: "destructive" });
        return;
      }

      const intelligenceParsed = (() => {
        try { return JSON.parse(clientIntelligenceSummary || ""); } catch { return null; }
      })();

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        setDraftProgress({ current: i + 1, total: pages.length, currentPage: page.title });

        try {
          const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
            body: {
              pageSlug: page.page_key,
              pageName: page.title,
              propertyAddress: form.address,
              yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
              sqft: form.sqft ? parseInt(form.sqft) : undefined,
              bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
              bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
              propertyType: form.propertyType || undefined,
              relationshipType: form.relationshipType || undefined,
              clientIntelligenceSummary: intelligenceParsed?.summary || clientIntelligenceSummary || "",
              clientGoals: intelligenceParsed?.goals || [],
              clientPriorities: intelligenceParsed?.priorities || [],
            },
          });

          if (error) throw error;

          const updates: Record<string, unknown> = {};
          if (data.narrative?.length) updates.narrative = data.narrative;
          if (data.key_observations?.length) updates.key_observations = data.key_observations;

          if (Object.keys(updates).length > 0) {
            await supabase.from("report_pages").update(updates).eq("id", page.id);
          }

          successCount++;
        } catch (pageErr) {
          console.error(`Failed to draft page ${page.title}:`, pageErr);
          failCount++;
        }
      }

      setDraftAllDone(true);
      toast({
        title: `Drafted ${successCount} of ${pages.length} pages`,
        description: failCount > 0
          ? `${failCount} page(s) failed — check edge function deployment.`
          : "All pages drafted successfully. Review in the portal editor.",
      });
    } catch (err) {
      console.error("Bulk draft failed:", err);
      toast({ title: "Bulk draft failed", description: "Could not draft pages. Ensure edge functions are deployed.", variant: "destructive" });
    } finally {
      setIsDraftingAll(false);
      setDraftProgress(null);
    }
  };

  const handleRunQa = async () => {
    if (!createdPropertyId) {
      toast({ title: "No report yet", description: "The report hasn't been created yet.", variant: "destructive" });
      return;
    }
    setIsRunningQa(true);
    setQaIssues(null);
    setQaScore(null);
    setQaSummary(null);
    try {
      // Build pages array from selected templates with their default content
      const selectedTemplatesList = templates.filter((t) => selectedTemplates.has(t.id));
      const pages = selectedTemplatesList.map((t) => {
        const dc = (t.default_content || {}) as Record<string, unknown>;
        return {
          title: t.name,
          group: t.group_name,
          conditionRating: (dc.condition_rating as string) || undefined,
          narrative: Array.isArray(dc.narrative) ? dc.narrative as string[] : (dc.narrative ? [dc.narrative as string] : []),
          specs: (dc.specs as Record<string, unknown>) || undefined,
          tiers: (dc.tiers as { label: string; cost: string }[]) || undefined,
          recommendations: (dc.recommendations as string[]) || undefined,
          key_observations: (dc.key_observations as string[]) || undefined,
          status: "draft",
        };
      });

      const { data, error } = await supabase.functions.invoke("qa-report", {
        body: {
          pages,
          propertyName: form.propertyName || form.fullName,
          propertyAddress: form.address,
          reportCompletionPercent: 0,
        },
      });

      if (error) throw error;

      setQaIssues(data.issues || []);
      setQaScore(typeof data.overallScore === "number" ? data.overallScore : null);
      setQaSummary(data.summary || null);

      const errors = (data.issues as { severity: string }[]).filter((i) => i.severity === "error").length;
      const warnings = (data.issues as { severity: string }[]).filter((i) => i.severity === "warning").length;
      toast({
        title: errors > 0 ? `QA: ${errors} issue${errors !== 1 ? "s" : ""} to fix` : "QA passed!",
        description: errors > 0 ? `${errors} error${errors !== 1 ? "s" : ""}, ${warnings} warning${warnings !== 1 ? "s" : ""} found.` : `${warnings} warning${warnings !== 1 ? "s" : ""}. Report looks good.`,
        variant: errors > 0 ? "destructive" : "default",
      });
    } catch (err) {
      console.error("QA check failed:", err);
      toast({ title: "QA check failed", description: "Could not run quality check. You can still publish manually.", variant: "destructive" });
    } finally {
      setIsRunningQa(false);
    }
  };

  const handleCreateClient = async () => {
    if (!form.fullName || !form.address) {
      toast({ title: "Required fields", description: "Name and address are required.", variant: "destructive" });
      return false;
    }
    if (!user) return false;
    if (selectedTemplates.size === 0) {
      toast({ title: "No pages selected", description: "Please select at least one page template.", variant: "destructive" });
      return false;
    }

    // ── DEV BYPASS: skip Supabase writes when using mock auth ──────
    if (user.id === "00000000-0000-0000-0000-000000000000") {
      console.warn("[Dev] Bypassing Supabase writes — using mock property ID");
      const mockPropertyId = "mock-property-" + Date.now();
      setCreatedPropertyId(mockPropertyId);
      const pageCount = selectedTemplates.size;
      toast({ title: "Client created (dev mode)", description: `Mock property and report with ${pageCount} pages created for ${form.fullName}.` });
      return true;
    }
    // ────────────────────────────────────────────────────────────────

    setSaving(true);
    try {
      const { data: property, error: propErr } = await supabase
        .from("properties")
        .insert({
          address: form.address,
          property_name: form.propertyName || form.address,
          client_user_id: user.id,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          county: form.county || null,
          property_type: form.propertyType || null,
          relationship_type: form.relationshipType || null,
          discovery_notes: form.discoveryNotes || null,
          client_intelligence_summary: clientIntelligenceSummary || null,
          hover_url: digitalAssets.hoverUrl || null,
          hover_pdf_url: digitalAssets.hoverPdfUrl || null,
          iguide_url: digitalAssets.iguideUrl || null,
          iguide_pdf_url: digitalAssets.iguidePdfUrl || null,
          intake_status: "complete",
          digital_assets_status: getDigitalAssetsStatus(),
          metadata: {
            year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
            sqft: form.sqft ? parseInt(form.sqft) : null,
            bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
            bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
            client_name: form.fullName,
            client_email: form.email,
            client_phone: form.phone,
          },
        })
        .select()
        .single();

      if (propErr) throw propErr;

      const { data: report, error: repErr } = await supabase
        .from("reports")
        .insert({
          property_id: property.id,
          created_by: user.id,
          title: "Home Clarity Report",
          status: "draft",
        })
        .select()
        .single();

      if (repErr) throw repErr;

      const selectedTemplatesList = templates.filter(t => selectedTemplates.has(t.id));
      const pageInserts = selectedTemplatesList.map((template, index) => {
        const defaultContent = (template.default_content || {}) as Record<string, unknown>;
        return {
          report_id: report.id,
          template_id: template.id,
          block_config: template.block_config as Json,
          group_name: template.group_name,
          page_key: template.slug,
          title: template.name,
          narrative: (defaultContent.narrative ? [defaultContent.narrative as string] : []),
          condition_rating: (defaultContent.condition_rating as string) || null,
          health_bar: (defaultContent.health_bar || null) as Json,
          specs: (defaultContent.specs || null) as Json,
          tiers: (defaultContent.tiers || null) as Json,
          timing: (defaultContent.timing as string) || null,
          recommendations: (defaultContent.recommendations || null) as Json,
          key_observations: (defaultContent.key_observations || null) as Json,
          risks: (defaultContent.risks || null) as Json,
          dependencies: (defaultContent.dependencies || null) as Json,
          maintenance: (defaultContent.maintenance || null) as Json,
          sort_order: index,
          status: "draft",
        };
      });

      const { error: pagesErr } = await supabase.from("report_pages").insert(pageInserts);
      if (pagesErr) throw pagesErr;

      setCreatedPropertyId(property.id);
      toast({ title: "Client created", description: `Property and report with ${pageInserts.length} pages created for ${form.fullName}.` });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create client";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!createdPropertyId || !form.email) {
      toast({
        title: "Email required",
        description: "A client email is needed to create their account and send login credentials.",
        variant: "destructive",
      });
      return;
    }

    // ── DEV BYPASS: skip Supabase publish when using mock auth ─────
    if (user?.id === "00000000-0000-0000-0000-000000000000") {
      console.warn("[Dev] Bypassing publish — mock mode");
      setPublishResult({
        portalUrl: `/portal/${createdPropertyId}`,
        isExisting: false,
        magicLinkSent: false,
        tempPassword: "dev-temp-pass-123",
      });
      setPublished(true);
      toast({ title: "Published! (dev mode)", description: `Mock client account created for ${form.email}.` });
      return;
    }
    // ────────────────────────────────────────────────────────────────

    setPublishing(true);
    try {
      const { data: reports } = await supabase
        .from("reports")
        .select("id")
        .eq("property_id", createdPropertyId)
        .single();

      if (reports) {
        await supabase
          .from("reports")
          .update({ status: "published" })
          .eq("id", reports.id);
      }

      const { data, error } = await supabase.functions.invoke("create-client-account", {
        body: {
          email: form.email,
          fullName: form.fullName,
          propertyId: createdPropertyId,
        },
      });

      if (error) throw error;

      setPublishResult({
        portalUrl: data.portalUrl,
        isExisting: data.isExisting,
        magicLinkSent: data.magicLinkSent,
        tempPassword: data.tempPassword,
      });
      setPublished(true);

      toast({
        title: "Published!",
        description: data.isExisting
          ? `Property assigned to existing account (${form.email}).`
          : `Client account created and invite sent to ${form.email}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      toast({ title: "Publish failed", description: message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handleNext = async () => {
    // Validate Step 0 before advancing
    if (currentStep === 0) {
      if (!form.fullName || !form.address) {
        toast({ title: "Required fields", description: "Name and address are required.", variant: "destructive" });
        return;
      }
    }
    // Create report when leaving Select Pages (step 2)
    if (currentStep === 2) {
      const success = await handleCreateClient();
      if (!success) return;
    }
    setCurrentStep(currentStep + 1);
  };

  const copyPortalLink = () => {
    const url = `${window.location.origin}/portal/${createdPropertyId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Portal link copied to clipboard." });
  };

  const copyTempPassword = () => {
    if (publishResult?.tempPassword) {
      navigator.clipboard.writeText(publishResult.tempPassword);
      toast({ title: "Copied!", description: "Temporary password copied to clipboard." });
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const copyInviteMessage = () => {
    const firstName = form.fullName.split(" ")[0] || form.fullName;
    const portalUrl = publishResult?.portalUrl
      ? `${window.location.origin}${publishResult.portalUrl.startsWith("/") ? "" : "/"}${publishResult.portalUrl}`
      : `${window.location.origin}/portal/${createdPropertyId}`;

    const lines: string[] = [
      `Hi ${firstName},`,
      ``,
      `Your Home Clarity Hub portal is ready! Here's how to access it:`,
      ``,
      `Portal: ${portalUrl}`,
      `Email: ${form.email}`,
    ];

    if (publishResult?.tempPassword && !publishResult?.isExisting) {
      lines.push(`Temporary password: ${publishResult.tempPassword}`);
      lines.push(`(You'll be prompted to set your own password on first login.)`);
    }

    lines.push(``);
    lines.push(`Your personalized home report is ready to review. Reach out anytime if you have questions!`);

    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied!", description: "Invite message copied to clipboard — paste into email or text." });
  };

  const sendEmailInvite = async () => {
    setSendingEmail(true);
    try {
      const portalUrl = publishResult?.portalUrl
        ? `${window.location.origin}${publishResult.portalUrl.startsWith("/") ? "" : "/"}${publishResult.portalUrl}`
        : `${window.location.origin}/portal/${createdPropertyId}`;

      const { data, error } = await supabase.functions.invoke("send-client-invite", {
        body: {
          email: form.email,
          fullName: form.fullName,
          portalUrl,
          tempPassword: publishResult?.tempPassword && !publishResult?.isExisting ? publishResult.tempPassword : undefined,
          propertyName: form.propertyName || form.address,
          creatorName: profile?.full_name || "Your Home Clarity Advisor",
        },
      });

      if (error) throw error;
      toast({ title: "Email sent!", description: `Invitation email sent to ${form.email}.` });
    } catch (err: any) {
      console.error("Send email error:", err);
      toast({ title: "Email failed", description: err.message || "Could not send the invitation email.", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${
              i === currentStep ? "bg-primary text-primary-foreground font-medium" :
              i < currentStep ? "bg-primary/10 text-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current/20">
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Client & Property */}
      {currentStep === 0 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Client & Property Setup</h3>

          {/* Client info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Full Name *</Label>
              <Input placeholder="Sarah & Michael Johnson" className="font-sans" value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Email *</Label>
              <Input type="email" placeholder="client@email.com" className="font-sans" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
              <p className="text-[10px] font-sans text-muted-foreground">Required — used to create client login</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Phone</Label>
              <Input placeholder="(330) 555-0142" className="font-sans" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Relationship Type</Label>
              <Select value={form.relationshipType} onValueChange={(v) => updateForm("relationshipType", v)}>
                <SelectTrigger className="font-sans text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address with autocomplete */}
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => updateForm("address", v)}
            onAddressParsed={(parsed) => {
              setForm((prev) => ({
                ...prev,
                address: parsed.address,
                city: parsed.city,
                state: parsed.state,
                zip: parsed.zip,
                county: parsed.county,
              }));
            }}
            onPropertyDataFetched={(data: PropertyData) => {
              setForm((prev) => ({
                ...prev,
                yearBuilt: data.yearBuilt ? String(data.yearBuilt) : prev.yearBuilt,
                sqft: data.sqft ? String(data.sqft) : prev.sqft,
                bedrooms: data.bedrooms ? String(data.bedrooms) : prev.bedrooms,
                bathrooms: data.bathrooms ? String(data.bathrooms) : prev.bathrooms,
                propertyType: data.propertyType
                  ? (data.propertyType.toLowerCase().includes("single") ? "single_family"
                    : data.propertyType.toLowerCase().includes("multi") ? "multi_family"
                    : data.propertyType.toLowerCase().includes("condo") ? "condo"
                    : data.propertyType.toLowerCase().includes("town") ? "townhome"
                    : prev.propertyType)
                  : prev.propertyType,
              }));
              toast({ title: "Fields populated", description: "Year built, sq ft, beds/baths and property type filled in from public records." });
            }}
          />

          {/* City / State / Zip / County */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">City</Label>
              <Input placeholder="Hudson" className="font-sans" value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">State</Label>
              <Input placeholder="OH" className="font-sans" value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">ZIP</Label>
              <Input placeholder="44236" className="font-sans" value={form.zip} onChange={(e) => updateForm("zip", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">County</Label>
              <Input placeholder="Summit" className="font-sans" value={form.county} onChange={(e) => updateForm("county", e.target.value)} />
            </div>
          </div>

          {/* Property details */}
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Property Name</Label>
            <Input placeholder="Johnson Residence (optional)" className="font-sans" value={form.propertyName} onChange={(e) => updateForm("propertyName", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Property Type</Label>
              <Select value={form.propertyType} onValueChange={(v) => updateForm("propertyType", v)}>
                <SelectTrigger className="font-sans text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Year Built</Label>
              <Input type="number" placeholder="1998" className="font-sans" value={form.yearBuilt} onChange={(e) => updateForm("yearBuilt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Sq Ft</Label>
              <Input type="number" placeholder="3200" className="font-sans" value={form.sqft} onChange={(e) => updateForm("sqft", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Bedrooms</Label>
              <Input type="number" placeholder="4" className="font-sans" value={form.bedrooms} onChange={(e) => updateForm("bedrooms", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Bathrooms</Label>
              <Input type="number" placeholder="3" className="font-sans" value={form.bathrooms} onChange={(e) => updateForm("bathrooms", e.target.value)} />
            </div>
          </div>

          {/* Discovery notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Discovery Call Notes</Label>
            <p className="text-[10px] font-sans text-muted-foreground">
              Paste everything from the discovery call — goals, concerns, wish list, budget, family context, timeline
            </p>
            <textarea
              placeholder="Client wants to address water damage in the basement, plan for a kitchen renovation in the next 2 years, and understand the remaining life of their roof. Budget is flexible but wants to prioritize safety issues first..."
              className="w-full h-36 px-3 py-2 rounded-md border border-border text-sm font-sans bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.discoveryNotes}
              onChange={(e) => updateForm("discoveryNotes", e.target.value)}
            />
          </div>

          {/* AI Intelligence Card */}
          <ClientIntelligenceCard
            discoveryNotes={form.discoveryNotes}
            clientName={form.fullName}
            address={form.address}
            onAccept={(summary) => setClientIntelligenceSummary(summary)}
          />
        </Card>
      )}

      {/* Step 1: Digital Assets */}
      {currentStep === 1 && (
        <Card className="p-6">
          <DigitalAssetsStep
            data={digitalAssets}
            onChange={setDigitalAssets}
          />
        </Card>
      )}

      {/* Step 2: Select Pages */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-sans font-semibold text-foreground">Select Report Pages</h3>
              <p className="text-xs text-muted-foreground mt-1">Choose which pages to include in this report</p>
              {aiRecommendReasoning && (
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5 bg-primary/5 border border-primary/10 rounded-md px-3 py-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  {aiRecommendReasoning}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-sm font-mono">
                <FileText className="w-3 h-3 mr-1" />
                {selectedTemplates.size} of {templates.length} pages
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-[11px] gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                onClick={handleAiRecommendPages}
                disabled={isRecommending || !clientIntelligenceSummary}
                title={!clientIntelligenceSummary ? "Accept the Client Intelligence Summary first" : ""}
              >
                {isRecommending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isRecommending ? "Recommending..." : "AI Recommend"}
              </Button>
            </div>
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={["information", "exterior", "interior", "systems", "strategy"]} className="space-y-2">
              {Object.entries(groupedTemplates).map(([groupName, subGroups]) => {
                const groupTemplateIds = templates.filter(t => t.group_name === groupName).map(t => t.id);
                const selectedInGroup = groupTemplateIds.filter(id => selectedTemplates.has(id)).length;

                return (
                  <AccordionItem key={groupName} value={groupName} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium text-sm">
                          {groupLabels[groupName] || groupName}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {selectedInGroup}/{groupTemplateIds.length}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={(e) => { e.stopPropagation(); selectAllInGroup(groupName); }}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={(e) => { e.stopPropagation(); deselectAllInGroup(groupName); }}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        {Object.entries(subGroups).map(([subGroup, subTemplates]) => (
                          <div key={subGroup}>
                            {subGroup !== "general" && (
                              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                                {subGroupLabels[subGroup] || subGroup}
                              </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {subTemplates.map((template) => {
                                const isSelected = selectedTemplates.has(template.id);
                                const isAiPicked = aiRecommendedSlugs.has(template.slug);
                                return (
                                  <div
                                    key={template.id}
                                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-card border-border hover:bg-muted/50"
                                    }`}
                                    onClick={() => toggleTemplate(template.id)}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-base shrink-0">{template.icon || "📄"}</span>
                                      <span className="text-sm font-sans truncate">{template.name}</span>
                                      {isAiPicked && (
                                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                          <Sparkles className="w-2.5 h-2.5" />
                                          AI
                                        </span>
                                      )}
                                    </div>
                                    <Switch
                                      checked={isSelected}
                                      onCheckedChange={() => toggleTemplate(template.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Card>
      )}

      {/* Step 3: Review & Publish */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Review & Publish</h3>

          {!published ? (
            <>
              <p className="text-sm font-sans text-muted-foreground">
                Review the generated content in the portal before publishing. Publishing will create a client account for <strong className="text-foreground">{form.email || "—"}</strong> and send them login credentials.
              </p>

              {/* Bulk AI Draft Panel */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-sans font-medium">Auto-Draft All Pages</span>
                    {draftAllDone && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        Done
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-[11px] gap-1.5 h-8"
                    onClick={handleDraftAllPages}
                    disabled={isDraftingAll || !createdPropertyId}
                  >
                    {isDraftingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isDraftingAll ? "Drafting..." : draftAllDone ? "Re-Draft All" : "Draft All with AI"}
                  </Button>
                </div>

                {!isDraftingAll && !draftAllDone && (
                  <div className="px-4 py-5 text-center">
                    <p className="text-xs font-sans text-muted-foreground">
                      Let AI write a starter narrative for every page based on the property details and client intelligence. Review and edit each page in the portal editor afterward.
                    </p>
                    {!clientIntelligenceSummary && (
                      <p className="text-[10px] font-sans text-muted-foreground/70 mt-1.5 italic">
                        Tip: Accept the Client Intelligence Summary in Step 1 for higher-quality drafts.
                      </p>
                    )}
                  </div>
                )}

                {isDraftingAll && draftProgress && (
                  <div className="px-4 py-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-sans text-muted-foreground">
                      <span>Drafting: <strong className="text-foreground">{draftProgress.currentPage}</strong></span>
                      <span>{draftProgress.current} / {draftProgress.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${(draftProgress.current / draftProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-sans text-muted-foreground text-center">
                      This may take a minute — each page is drafted individually.
                    </p>
                  </div>
                )}

                {draftAllDone && !isDraftingAll && (
                  <div className="px-4 py-5 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                    <p className="text-sm font-sans text-foreground">
                      AI drafts complete! Open the portal to review and refine each page before publishing.
                    </p>
                  </div>
                )}
              </div>

              {/* QA Panel */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-sans font-medium">Report QA Check</span>
                    {qaScore !== null && (
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        qaScore >= 80 ? "bg-accent/20 text-accent" :
                        qaScore >= 60 ? "bg-orange-500/20 text-orange-500" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {qaScore}/100
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-[11px] gap-1.5 h-8"
                    onClick={handleRunQa}
                    disabled={isRunningQa}
                  >
                    {isRunningQa ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isRunningQa ? "Checking..." : qaIssues ? "Re-run QA" : "Run QA Check"}
                  </Button>
                </div>

                {qaIssues === null && !isRunningQa && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-sans text-muted-foreground">
                      Run a quality check to review the report for any issues before sending to the client.
                    </p>
                  </div>
                )}

                {isRunningQa && (
                  <div className="px-4 py-6 flex items-center justify-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <p className="text-xs font-sans text-muted-foreground">Reviewing report quality...</p>
                  </div>
                )}

                {qaIssues !== null && !isRunningQa && (
                  <div className="divide-y divide-border">
                    {qaSummary && (
                      <div className="px-4 py-3 bg-muted/20">
                        <p className="text-xs font-sans text-muted-foreground italic">{qaSummary}</p>
                      </div>
                    )}
                    {qaIssues.length === 0 ? (
                      <div className="px-4 py-5 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                        <p className="text-sm font-sans text-foreground font-medium">All checks passed — report is ready to publish!</p>
                      </div>
                    ) : (
                      qaIssues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                          {issue.severity === "error" ? (
                            <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          ) : issue.severity === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-sans font-medium text-foreground">{issue.page}</p>
                            <p className="text-xs font-sans text-muted-foreground mt-0.5">{issue.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="gap-1.5 font-sans"
                  onClick={() => window.open(`/portal/${createdPropertyId || ""}?edit=true`, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Portal to Review
                </Button>
                <Button
                  className="gap-1.5 font-sans"
                  onClick={handlePublish}
                  disabled={publishing || !form.email}
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {publishing ? "Creating account..." : "Publish & Send Invite"}
                </Button>
              </div>
              {!form.email && (
                <p className="text-xs font-sans text-destructive">
                  Go back to Step 1 and add a client email to enable publishing.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                <CheckCircle className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">
                    {publishResult?.isExisting
                      ? "Property assigned to existing client account"
                      : "Client account created & invite sent"}
                  </p>
                  <p className="text-xs font-sans text-muted-foreground mt-0.5">
                    {publishResult?.magicLinkSent
                      ? `An invite was sent to ${form.email}`
                      : `Client can sign in at ${form.email}`}
                  </p>
                </div>
              </div>

              {publishResult?.tempPassword && !publishResult?.isExisting && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <p className="text-xs font-sans font-medium text-foreground">Temporary Password (share with client if email doesn't arrive)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-background px-3 py-1.5 rounded border border-border">
                      {publishResult.tempPassword}
                    </code>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={copyTempPassword}>
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                <p className="text-xs font-sans font-medium text-foreground mb-1.5">Share with client:</p>
                <Button size="sm" className="gap-1.5 font-sans text-xs w-full" onClick={sendEmailInvite} disabled={sendingEmail}>
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {sendingEmail ? "Sending…" : "Send Email Invite"}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs w-full" onClick={copyInviteMessage}>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Invite Message
                </Button>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" className="gap-1.5 font-sans" onClick={copyPortalLink}>
                  <Copy className="w-4 h-4" />
                  Copy Portal Link
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 font-sans"
                  onClick={() => window.open(`/portal/${createdPropertyId}`, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Portal
                </Button>
                <Button className="gap-1.5 font-sans" onClick={() => navigate(`/admin/clients/${createdPropertyId}`)}>
                  Go to Client Detail
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => currentStep === 0 ? navigate("/admin/clients") : setCurrentStep(currentStep - 1)} className="gap-1.5 font-sans">
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>
        {currentStep < steps.length - 1 && (
          <Button onClick={handleNext} disabled={saving || (currentStep === 2 && selectedTemplates.size === 0)} className="gap-1.5 font-sans">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === 2 ? "Create Report" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewReportWizard;
