import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload, Sparkles, CheckCircle, Loader2, ArrowLeft, ArrowRight, Mail, Copy, ExternalLink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const steps = ["Client Info", "Select Pages", "Upload Data", "AI Generation", "Review & Publish"];

interface ClientFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyName: string;
  yearBuilt: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  notes: string;
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

const NewReportWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    portalUrl: string;
    isExisting: boolean;
    magicLinkSent: boolean;
  } | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Template state
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [form, setForm] = useState<ClientFormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    propertyName: "",
    yearBuilt: "",
    sqft: "",
    bedrooms: "",
    bathrooms: "",
    notes: "",
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
        setTemplates(data || []);
        
        // Auto-select common templates by default
        const defaultSelections = new Set<string>();
        const defaultSlugs = [
          "executive-summary", "property-overview", 
          "roof-system", "windows", "siding",
          "kitchen", "primary-bedroom", "primary-bathroom",
          "furnace", "air-conditioning", "water-heater", "electrical-panel",
          "financial-roadmap", "maintenance-calendar"
        ];
        data?.forEach(t => {
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

  // Group templates by group_name and sub_group
  const groupedTemplates = templates.reduce((acc, template) => {
    const group = template.group_name;
    const subGroup = template.sub_group || "general";
    if (!acc[group]) acc[group] = {};
    if (!acc[group][subGroup]) acc[group][subGroup] = [];
    acc[group][subGroup].push(template);
    return acc;
  }, {} as Record<string, Record<string, PageTemplate[]>>);

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

    setSaving(true);
    try {
      const { data: property, error: propErr } = await supabase
        .from("properties")
        .insert({
          address: form.address,
          property_name: form.propertyName || form.address,
          client_user_id: user.id,
          metadata: {
            year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
            sqft: form.sqft ? parseInt(form.sqft) : null,
            bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
            bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
            client_name: form.fullName,
            client_email: form.email,
            client_phone: form.phone,
            notes: form.notes,
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

      // Create pages from selected templates
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
          health_bar: (defaultContent.health_bar as Record<string, unknown>) || null,
          specs: (defaultContent.specs as unknown[]) || null,
          tiers: (defaultContent.tiers as Record<string, unknown>) || null,
          timing: (defaultContent.timing as string) || null,
          recommendations: (defaultContent.recommendations as unknown[]) || null,
          key_observations: (defaultContent.key_observations as unknown[]) || null,
          risks: (defaultContent.risks as unknown[]) || null,
          dependencies: (defaultContent.dependencies as unknown[]) || null,
          maintenance: (defaultContent.maintenance as Record<string, unknown>) || null,
          sort_order: index,
          status: "draft",
        };
      });

      const { error: pagesErr } = await supabase.from("report_pages").insert(pageInserts);
      if (pagesErr) {
        console.error("Failed to seed pages:", pagesErr);
        throw pagesErr;
      }

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
    if (currentStep === 1) {
      // After page selection, create the client and report
      const success = await handleCreateClient();
      if (!success) return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 3000);
  };

  const copyPortalLink = () => {
    const url = `${window.location.origin}/portal/${createdPropertyId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Portal link copied to clipboard." });
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

      {/* Step 0: Client Info */}
      {currentStep === 0 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Client Information</h3>
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
              <Label className="text-xs font-sans">Property Address *</Label>
              <Input placeholder="445 Elm Street, Hudson, OH 44236" className="font-sans" value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Property Name</Label>
            <Input placeholder="Johnson Residence (optional)" className="font-sans" value={form.propertyName} onChange={(e) => updateForm("propertyName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Discovery Call Notes</Label>
            <textarea
              placeholder="Key notes from the initial consultation..."
              className="w-full h-24 px-3 py-2 rounded-md border border-border text-sm font-sans bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Step 1: Select Pages */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-sans font-semibold text-foreground">Select Report Pages</h3>
              <p className="text-xs text-muted-foreground mt-1">Choose which pages to include in this report</p>
            </div>
            <Badge variant="outline" className="text-sm font-mono">
              <FileText className="w-3 h-3 mr-1" />
              {selectedTemplates.size} of {templates.length} pages
            </Badge>
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
                              {subTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                                    selectedTemplates.has(template.id)
                                      ? "bg-primary/5 border-primary/30"
                                      : "bg-card border-border hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleTemplate(template.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{template.icon || "📄"}</span>
                                    <span className="text-sm font-sans">{template.name}</span>
                                  </div>
                                  <Switch
                                    checked={selectedTemplates.has(template.id)}
                                    onCheckedChange={() => toggleTemplate(template.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ))}
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

      {/* Step 2: Upload Data */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Upload Data</h3>
          {["Discovery Call Recording", "Walkthrough Transcript", "Exterior Photos", "Interior Photos", "Serial Plate Photos", "hover.to Files", "External Reports"].map((category) => (
            <div key={category} className="border border-dashed border-border rounded-lg p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-sans font-medium text-foreground">{category}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">Drag & drop or click to upload</p>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">iGuide.com Link</Label>
            <Input placeholder="https://youriguide.com/..." className="font-sans" />
          </div>
        </Card>
      )}

      {/* Step 3: AI Generation */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">AI Report Generation</h3>
          {!generating && !generated && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-sm font-sans text-foreground mb-2">AI will analyze your uploaded data and generate initial report content</p>
              <p className="text-xs font-sans text-muted-foreground mb-6">This typically takes 2-5 minutes depending on the amount of data</p>
              <Button onClick={handleGenerate} className="gap-2 font-sans">
                <Sparkles className="w-4 h-4" />
                Generate Report Content
              </Button>
            </div>
          )}
          {generating && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-sm font-sans text-foreground mb-2">Generating report content...</p>
              <div className="max-w-sm mx-auto space-y-2 mt-6">
                {["Analyzing discovery call transcript", "Processing property photos", "Generating room narratives", "Building pricing recommendations"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    {i < 2 ? <CheckCircle className="w-4 h-4 text-foreground shrink-0" /> : <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />}
                    <span className={`text-xs font-sans ${i < 2 ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {generated && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-foreground mx-auto mb-4" />
              <p className="text-sm font-sans text-foreground mb-2">Report content generated!</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge className="bg-primary/10 text-foreground text-xs font-sans border-none">{selectedTemplates.size} pages generated</Badge>
                <Badge className="bg-accent/20 text-accent-foreground text-xs font-sans border-none">4 flagged for review</Badge>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 4: Review & Publish */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Review & Publish</h3>

          {!published ? (
            <>
              <p className="text-sm font-sans text-muted-foreground">
                Review the generated content in the portal before publishing. Publishing will create a client account for <strong className="text-foreground">{form.email || "—"}</strong> and send them a magic link to access their portal.
              </p>
              <div className="flex gap-3">
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
                      ? `A magic link was sent to ${form.email}`
                      : `Client can sign in at ${form.email}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
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
                <Button className="gap-1.5 font-sans" onClick={() => navigate("/admin/clients")}>
                  Back to Clients
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
          <Button onClick={handleNext} disabled={saving || (currentStep === 1 && selectedTemplates.size === 0)} className="gap-1.5 font-sans">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === 1 ? "Create Report" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewReportWizard;
