import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ProposalInterviewWizard from "./ProposalInterviewWizard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Send, ArrowRight, ArrowLeft, Trash2, FileText, Loader2, Sparkles, MessageSquareText, Wand2, ChevronDown, Clock, ShoppingCart, Scale, CalendarDays, Download, BrainCircuit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-destructive/10 text-destructive",
  converted: "bg-accent/20 text-accent-foreground",
};

interface EstimatesSectionProps {
  propertyId: string;
  clientName?: string;
  propertyAddress?: string;
  sqft?: number | null;
  propertyType?: string | null;
}

interface LineItemForm {
  service_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
}

const EstimatesSection = ({ propertyId, clientName, propertyAddress, sqft, propertyType }: EstimatesSectionProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [title, setTitle] = useState("Estimate");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState("dollar");
  const [tax, setTax] = useState(0);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [aiTranscript, setAiTranscript] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<Set<string>>(new Set());
  const [aiKickoffInput, setAiKickoffInput] = useState("");
  const [aiKickoffLoading, setAiKickoffLoading] = useState(false);
  const kickoffRef = useRef<HTMLTextAreaElement>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [showHCRImport, setShowHCRImport] = useState(false);
  const [hcrSelectedPages, setHcrSelectedPages] = useState<Set<string>>(new Set());

  const handleDownloadDocx = async (estimateId: string, title: string) => {
    setDownloadingDocx(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-docx", {
        body: { estimateId },
      });
      if (error) throw error;
      if (!data?.base64) throw new Error("No document returned");

      const byteChars = atob(data.base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);

      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}_Proposal.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Proposal downloaded!");
    } catch (err: any) {
      console.error("DOCX download error:", err);
      toast.error("Failed to download proposal");
    } finally {
      setDownloadingDocx(false);
    }
  };

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates", propertyId],
    queryFn: async () => {
      const { data } = await (supabase.from("estimates") as any).select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: estimateLineItems = [] } = useQuery({
    queryKey: ["estimate-line-items", propertyId],
    queryFn: async () => {
      const estIds = estimates.map((e: any) => e.id);
      if (estIds.length === 0) return [];
      const { data } = await (supabase.from("estimate_line_items") as any).select("*").in("estimate_id", estIds).order("sort_order");
      return data || [];
    },
    enabled: estimates.length > 0,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-library"],
    queryFn: async () => {
      const { data } = await (supabase.from("services") as any).select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: reportData } = useQuery({
    queryKey: ['active-report', propertyId],
    queryFn: async () => {
      const { data } = await supabase.from('reports').select('id').eq('property_id', propertyId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!propertyId,
  });

  const reportId = reportData?.id;

  const { data: hcrReportPages = [] } = useQuery({
    queryKey: ['report-pages-for-import', reportId],
    queryFn: async () => {
      const { data } = await (supabase.from('report_pages') as any).select('*').eq('report_id', reportId).order('page_order');
      return data || [];
    },
    enabled: !!reportId && showHCRImport,
  });

  const addLine = () => setLineItems([...lineItems, { service_id: null, description: "", quantity: "1", unit_price: "0" }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItemForm, value: string) => {
    const updated = [...lineItems];
    (updated[i] as any)[field] = value;
    // If selecting a service, auto-fill description and price
    if (field === "service_id" && value) {
      const svc = services.find((s: any) => s.id === value);
      if (svc) {
        updated[i].description = svc.name;
        updated[i].unit_price = String(svc.price);
      }
    }
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((s, li) => s + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0), 0);
  const discount = discountType === "percent" ? subtotal * (discountAmount / 100) : discountAmount;
  const total = subtotal - discount + tax;

  // AI: Generate from transcript
  const handleAiFromTranscript = async () => {
    if (!aiTranscript.trim()) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
        body: {
          task: "from_transcript",
          context: {
            transcript: aiTranscript,
            propertyAddress,
            sqft,
            propertyType,
            clientName,
          },
        },
      });
      if (error) throw error;
      if (data?.title) setTitle(data.title);
      if (data?.notes) setNotes(data.notes);
      if (data?.lineItems && Array.isArray(data.lineItems)) {
        setLineItems(data.lineItems.map((li: any) => ({
          service_id: null,
          description: li.description || "",
          quantity: String(li.quantity || 1),
          unit_price: String(li.unit_price || 0),
        })));
        toast.success(`AI extracted ${data.lineItems.length} line items — review before saving`);
      }
    } catch (err: any) {
      if (err?.status === 429) toast.error("Rate limited — try again in a moment");
      else if (err?.status === 402) toast.error("AI credits exhausted");
      else toast.error("AI generation failed — try again or enter items manually");
    } finally {
      setAiGenerating(false);
    }
  };

  // Partial conversion: selected line items → invoice
  const convertPartialToInvoice = async (est: any) => {
    if (!user || selectedLineItemIds.size === 0) return;
    setConverting(true);
    try {
      const lis = estimateLineItems.filter((li: any) => li.estimate_id === est.id && selectedLineItemIds.has(li.id));
      const partialSubtotal = lis.reduce((s: number, li: any) => s + Number(li.total), 0);

      const { data: inv, error } = await (supabase.from("invoices") as any).insert({
        property_id: propertyId, title: `${est.title} (partial)`, description: est.title,
        amount: partialSubtotal, subtotal: partialSubtotal, tax: 0, total: partialSubtotal,
        balance_due: partialSubtotal, status: "draft", type: "invoice", notes: est.notes,
      }).select("id").single();
      if (error || !inv) throw error;

      await (supabase.from("invoice_line_items") as any).insert(
        lis.map((li: any, i: number) => ({
          invoice_id: inv.id, service_id: li.service_id, description: li.description,
          quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: i,
        }))
      );

      toast.success(`Invoice created from ${lis.length} selected items`);
      setConvertDialogOpen(false);
      setSelectedLineItemIds(new Set());
      qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
      qc.invalidateQueries({ queryKey: ["admin-invoices", propertyId] });
    } catch {
      toast.error("Failed to create invoice from selected items");
    } finally {
      setConverting(false);
    }
  };

  const createEstimate = async () => {
    if (!user || lineItems.length === 0) return;
    const { data: est, error } = await (supabase.from("estimates") as any).insert({
      property_id: propertyId, admin_id: user.id, title, notes, subtotal,
      discount_amount: discountAmount, discount_type: discountType, tax, total,
    }).select("id").single();
    if (error || !est) { toast.error("Failed to create estimate"); return; }

    await (supabase.from("estimate_line_items") as any).insert(
      lineItems.map((li, i) => ({
        estimate_id: est.id, service_id: li.service_id || null,
        description: li.description, quantity: parseFloat(li.quantity) || 1,
        unit_price: parseFloat(li.unit_price) || 0,
        total: (parseFloat(li.quantity) || 1) * (parseFloat(li.unit_price) || 0),
        sort_order: i,
      }))
    );

    toast.success("Estimate created");
    setCreateOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("estimates") as any).update({ status, ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}) }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
    toast.success(`Estimate ${status}`);
  };

  const convertToInvoice = async (est: any) => {
    if (!user) return;
    setConverting(true);
    try {
      const lis = estimateLineItems.filter((li: any) => li.estimate_id === est.id);

      // Create invoice
      const { data: inv, error } = await (supabase.from("invoices") as any).insert({
        property_id: propertyId, title: est.title, description: est.title,
        amount: est.total, subtotal: est.subtotal, tax: est.tax, total: est.total,
        balance_due: est.total, status: "draft", type: "invoice", notes: est.notes,
      }).select("id").single();
      if (error || !inv) throw error;

      // Copy line items
      if (lis.length > 0) {
        await (supabase.from("invoice_line_items") as any).insert(
          lis.map((li: any) => ({
            invoice_id: inv.id, service_id: li.service_id, description: li.description,
            quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: li.sort_order,
          }))
        );
      }

      // Mark estimate as converted
      await (supabase.from("estimates") as any).update({ status: "converted", converted_invoice_id: inv.id }).eq("id", est.id);

      toast.success("Estimate converted to invoice");
      qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
      qc.invalidateQueries({ queryKey: ["admin-invoices", propertyId] });
    } catch {
      toast.error("Failed to convert estimate");
    } finally {
      setConverting(false);
    }
  };

  const deleteEstimate = async (id: string) => {
    await (supabase.from("estimate_line_items") as any).delete().eq("estimate_id", id);
    await (supabase.from("estimates") as any).delete().eq("id", id);
    if (selectedId === id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
    toast.success("Estimate deleted");
  };

  const resetForm = () => {
    setTitle("Estimate"); setNotes(""); setDiscountAmount(0); setDiscountType("dollar"); setTax(0); setLineItems([]); setAiTranscript("");
  };

  // AI Kickoff: plain language → full proposal
  const handleAiKickoff = async () => {
    if (!aiKickoffInput.trim() || !user) return;
    setAiKickoffLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proposal-kickoff", {
        body: {
          userMessage: aiKickoffInput,
          clientName,
          propertyAddress,
          sqft,
          propertyType,
        },
      });
      if (error) throw error;
      if (!data?.lineItems?.length) { toast.error("AI couldn't generate line items — try being more specific"); return; }

      // Calculate totals from AI line items
      const aiLineItems = data.lineItems.map((li: any) => ({
        service_id: null,
        description: li.description || "",
        quantity: String(li.quantity || 1),
        unit_price: String(li.unit_price || 0),
      }));
      const aiSubtotal = data.lineItems.reduce((s: number, li: any) => s + (li.quantity || 1) * (li.unit_price || 0), 0);
      const aiTotal = aiSubtotal;

      // Create estimate
      const proposalToken = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
      const { data: est, error: estErr } = await (supabase.from("estimates") as any).insert({
        property_id: propertyId,
        admin_id: user.id,
        title: data.title || "Estimate",
        notes: data.notes || "",
        subtotal: aiSubtotal,
        discount_amount: 0,
        discount_type: "dollar",
        tax: 0,
        total: aiTotal,
        proposal_prepared_for: clientName || "",
        proposal_tagline: data.tagline || "",
        proposal_intro_text: data.introText || "",
        proposal_scope_sections: data.scopeSections || [],
        proposal_client_selections: data.clientSelections || [],
        proposal_terms: data.terms || [],
        proposal_timeline_phases: data.timelinePhases || [],
        proposal_color_theme: "navy",
        proposal_token: proposalToken,
      }).select("id").single();
      if (estErr || !est) throw estErr;

      // Insert line items
      await (supabase.from("estimate_line_items") as any).insert(
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
      setAiKickoffInput("");
      await qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
      await qc.invalidateQueries({ queryKey: ["estimate-line-items", propertyId] });
      // Auto-open the new estimate
      setSelectedId(est.id);
    } catch (err: any) {
      if (err?.status === 429) toast.error("Rate limited — try again in a moment");
      else if (err?.status === 402) toast.error("AI credits exhausted");
      else toast.error("Failed to generate proposal — try again");
      console.error("AI kickoff error:", err);
    } finally {
      setAiKickoffLoading(false);
    }
  };

  // Detail view
  if (selectedId) {
    const est = estimates.find((e: any) => e.id === selectedId);
    if (!est) { setSelectedId(null); return null; }
    const lis = estimateLineItems.filter((li: any) => li.estimate_id === est.id);

    return (
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1 font-sans"><ArrowLeft className="w-4 h-4" />Back</Button>
          <div className="flex-1">
            <h3 className="text-lg font-sans font-bold text-foreground flex items-center gap-2">
              {est.title}
              <Badge className={`text-[10px] ${statusColors[est.status] || "bg-muted"}`}>{est.status.toUpperCase()}</Badge>
            </h3>
            <p className="text-xs font-sans text-muted-foreground">{format(new Date(est.created_at), "MMM d, yyyy")}</p>
          </div>
           <div className="flex gap-2">
             <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => handleDownloadDocx(est.id, est.title)} disabled={downloadingDocx}>
               {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
               Download .docx
             </Button>
             {est.status === "draft" && (
               <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => updateStatus(est.id, "sent")}>
                 <Send className="w-3.5 h-3.5" />Send to Client
               </Button>
             )}
             {(est.status === "accepted" || est.status === "sent" || est.status === "draft") && lis.length > 1 && (
               <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => { setSelectedLineItemIds(new Set(lis.map((l: any) => l.id))); setConvertDialogOpen(true); }}>
                 <FileText className="w-3.5 h-3.5" />Pull to Invoice
               </Button>
             )}
             {est.status === "accepted" && (
               <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => convertToInvoice(est)} disabled={converting}>
                 {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                 Convert All to Invoice
               </Button>
             )}
           </div>
         </div>

         {/* Intro / Tagline */}
         {(est.proposal_tagline || est.proposal_intro_text) && (
           <div className="bg-accent/5 rounded-lg p-4 border border-accent/20 space-y-2">
             {est.proposal_tagline && <p className="text-sm font-sans font-semibold text-accent">{est.proposal_tagline}</p>}
             {est.proposal_intro_text && <p className="text-sm font-sans text-muted-foreground leading-relaxed">{est.proposal_intro_text}</p>}
           </div>
         )}

         {/* Scope of Work */}
         {est.proposal_scope_sections && Array.isArray(est.proposal_scope_sections) && est.proposal_scope_sections.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
               <FileText className="w-4 h-4 text-accent" />Scope of Work
             </h4>
             <div className="space-y-3">
               {(est.proposal_scope_sections as any[]).map((section: any, i: number) => (
                 <div key={i} className="rounded-md border border-border p-3 space-y-2">
                   <p className="text-sm font-sans font-medium text-foreground">
                     <span className="text-accent font-mono mr-2">{section.number || String(i + 1).padStart(2, '0')}</span>
                     {section.title}
                   </p>
                   <ul className="space-y-1.5 ml-6">
                     {section.bullets?.map((b: any, j: number) => (
                       <li key={j} className="text-xs font-sans text-muted-foreground">
                         <span className="font-medium text-foreground">{b.label}:</span> {b.desc}
                       </li>
                     ))}
                   </ul>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Line Items / Investment */}
         <div className="space-y-3">
           <h4 className="text-sm font-sans font-semibold text-foreground">Investment</h4>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="font-sans text-xs">Description</TableHead>
                 <TableHead className="font-sans text-xs text-right">Qty</TableHead>
                 <TableHead className="font-sans text-xs text-right">Unit Price</TableHead>
                 <TableHead className="font-sans text-xs text-right">Total</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {lis.length > 0 ? lis.map((li: any) => (
                 <TableRow key={li.id}>
                   <TableCell className="font-sans text-sm">{li.description}</TableCell>
                   <TableCell className="font-mono text-sm text-right">{li.quantity}</TableCell>
                   <TableCell className="font-mono text-sm text-right">{fmt(li.unit_price)}</TableCell>
                   <TableCell className="font-mono text-sm text-right">{fmt(li.total)}</TableCell>
                 </TableRow>
               )) : (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">Loading line items...</TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
           <div className="flex justify-end">
             <div className="w-64 space-y-1 text-sm font-sans">
               <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{fmt(est.subtotal)}</span></div>
               {est.discount_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-mono text-destructive">-{fmt(est.discount_type === "percent" ? est.subtotal * est.discount_amount / 100 : est.discount_amount)}</span></div>}
               {est.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">{fmt(est.tax)}</span></div>}
               <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span className="font-mono">{fmt(est.total)}</span></div>
             </div>
           </div>
         </div>

         {/* Client Selections */}
         {est.proposal_client_selections && Array.isArray(est.proposal_client_selections) && est.proposal_client_selections.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
               <ShoppingCart className="w-4 h-4 text-accent" />Client Selections
             </h4>
             <div className="space-y-3">
               {(est.proposal_client_selections as any[]).map((cat: any, i: number) => (
                 <div key={i} className="rounded-md border border-border p-3">
                   <p className="text-sm font-sans font-medium text-foreground mb-2">{cat.label}</p>
                   <div className="space-y-1.5">
                     {cat.items?.map((item: any, j: number) => (
                       <div key={j} className="flex items-start gap-2 text-xs font-sans">
                         <span className="font-medium text-foreground min-w-[120px]">{item.name}</span>
                         <span className="text-muted-foreground flex-1">{item.desc}</span>
                         {item.shop && <span className="text-accent text-[10px]">{item.shop}</span>}
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Timeline */}
         {est.proposal_timeline_phases && Array.isArray(est.proposal_timeline_phases) && est.proposal_timeline_phases.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
               <CalendarDays className="w-4 h-4 text-accent" />Timeline
             </h4>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
               {(est.proposal_timeline_phases as any[]).map((phase: any, i: number) => (
                 <div key={i} className="rounded-md border border-border p-3 text-center">
                   <p className="text-xs font-sans font-medium text-foreground">{phase.phase}</p>
                   <p className="text-[11px] font-sans text-muted-foreground mt-1">{phase.duration}</p>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Terms */}
         {est.proposal_terms && Array.isArray(est.proposal_terms) && est.proposal_terms.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
               <Scale className="w-4 h-4 text-accent" />Terms & Conditions
             </h4>
             <div className="grid grid-cols-2 gap-2">
               {(est.proposal_terms as any[]).map((term: any, i: number) => (
                 <div key={i} className="flex items-start gap-2 p-2 rounded border border-border">
                   <span className="text-xs font-sans font-medium text-foreground min-w-[100px]">{term.label}</span>
                   <span className="text-xs font-sans text-muted-foreground">{term.value}</span>
                 </div>
               ))}
             </div>
           </div>
         )}

         {est.notes && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-sans text-muted-foreground">{est.notes}</p></div>}

         {/* Partial Conversion Dialog */}
         <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader><DialogTitle className="font-sans">Select Items for Invoice</DialogTitle></DialogHeader>
             <p className="text-xs text-muted-foreground font-sans">Choose which line items to pull into a new invoice.</p>
             <div className="space-y-2 max-h-[40vh] overflow-y-auto">
               {lis.map((li: any) => (
                 <div key={li.id} className="flex items-center gap-3 p-2 rounded-md border border-border">
                   <Checkbox
                     checked={selectedLineItemIds.has(li.id)}
                     onCheckedChange={(checked) => {
                       const next = new Set(selectedLineItemIds);
                       if (checked) next.add(li.id); else next.delete(li.id);
                       setSelectedLineItemIds(next);
                     }}
                   />
                   <div className="flex-1">
                     <p className="text-sm font-sans">{li.description}</p>
                     <p className="text-xs text-muted-foreground font-mono">{li.quantity} × {fmt(li.unit_price)}</p>
                   </div>
                   <span className="text-sm font-mono font-medium">{fmt(li.total)}</span>
                 </div>
               ))}
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-border">
               <span className="text-sm font-sans text-muted-foreground">{selectedLineItemIds.size} items selected</span>
               <span className="text-sm font-sans font-bold">
                 {fmt(lis.filter((li: any) => selectedLineItemIds.has(li.id)).reduce((s: number, li: any) => s + Number(li.total), 0))}
               </span>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="font-sans">Cancel</Button>
               <Button onClick={() => convertPartialToInvoice(est)} disabled={converting || selectedLineItemIds.size === 0} className="gap-1.5 font-sans">
                 {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                 Create Invoice
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </Card>
     );
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Estimates & Proposals</h3>
          <Badge variant="outline" className="text-[10px] font-mono">{estimates.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => { setHcrSelectedPages(new Set()); setShowHCRImport(true); }}>
            <FileText className="w-3 h-3" />Import from HCR
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => { resetForm(); addLine(); setCreateOpen(true); }}>
            <Plus className="w-3.5 h-3.5" />Manual Estimate
          </Button>
        </div>
      </div>

      {/* AI Interview — always visible */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-accent" />
          <p className="text-sm font-sans font-medium text-foreground">AI Proposal Builder</p>
        </div>
        <p className="text-xs font-sans text-muted-foreground">
          Answer 12 targeted questions — the AI will generate a complete proposal with scope, pricing, timeline, and terms.
        </p>
        <Button
          size="sm"
          className="gap-1.5 text-xs font-sans w-full"
          onClick={() => setInterviewOpen(true)}
          style={{ background: "#C4A265", color: "#fff" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Start AI Interview
        </Button>
      </div>

      {/* Interview Wizard Modal */}
      {interviewOpen && (
        <ProposalInterviewWizard
          propertyId={propertyId}
          propertyAddress={propertyAddress}
          clientName={clientName}
          onComplete={async (estimateId) => {
            setInterviewOpen(false);
            await qc.invalidateQueries({ queryKey: ["estimates", propertyId] });
            await qc.invalidateQueries({ queryKey: ["estimate-line-items", propertyId] });
            setSelectedId(estimateId);
          }}
          onCancel={() => setInterviewOpen(false)}
        />
      )}

      {estimates.length > 0 && (
        <div className="space-y-2">
          {estimates.map((est: any) => (
            <div key={est.id} className="flex items-center justify-between py-3 px-4 rounded-md border border-border hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedId(est.id)}>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-sans font-medium text-foreground">{est.title}</span>
                  <p className="text-[11px] font-sans text-muted-foreground">{format(new Date(est.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold">{fmt(est.total)}</span>
                <Badge className={`text-[10px] ${statusColors[est.status]}`}>{est.status.toUpperCase()}</Badge>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); deleteEstimate(est.id); }}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create estimate dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-sans">New Estimate{clientName ? ` for ${clientName}` : ""}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* AI Transcript Assistant */}
            <Card className="p-4 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-accent" />
                <p className="text-sm font-sans font-medium">AI Estimate from Meeting Notes</p>
              </div>
              <Textarea
                value={aiTranscript}
                onChange={e => setAiTranscript(e.target.value)}
                placeholder="Paste meeting notes or call transcript here... AI will extract scope items and generate line items with pricing."
                className="text-sm font-sans"
                rows={4}
              />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={handleAiFromTranscript} disabled={aiGenerating || !aiTranscript.trim()}>
                {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Estimate from Transcript
              </Button>
            </Card>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="font-sans" />
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <Label className="text-xs font-sans">Line Items</Label>
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select value={li.service_id || "custom"} onValueChange={v => updateLine(i, "service_id", v === "custom" ? "" : v)}>
                      <SelectTrigger className="font-sans text-xs h-9"><SelectValue placeholder="Service..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom" className="font-sans text-xs">Custom Item</SelectItem>
                        {services.map((s: any) => (
                          <SelectItem key={s.id} value={s.id} className="font-sans text-xs">{s.name} — {fmt(s.price)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input value={li.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Description" className="font-sans text-xs h-9" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={li.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} className="font-mono text-xs h-9" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={li.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)} className="font-mono text-xs h-9" />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => removeLine(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs font-sans" onClick={addLine}><Plus className="w-3 h-3 mr-1" />Add Line</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Discount</Label>
                <div className="flex gap-2">
                  <Input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="font-mono text-sm" />
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="w-20 font-sans text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dollar">$</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Tax ($)</Label>
                <Input type="number" value={tax} onChange={e => setTax(Number(e.target.value))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Total</Label>
                <p className="text-lg font-mono font-bold text-foreground">{fmt(total)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Notes / Terms</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="font-sans text-sm" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="font-sans">Cancel</Button>
            <Button onClick={createEstimate} disabled={lineItems.length === 0} className="font-sans">Create Estimate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HCR Import Dialog */}
      <Dialog open={showHCRImport} onOpenChange={setShowHCRImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Import from HCR Report</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {!reportId ? (
              <p className="text-sm font-sans text-muted-foreground">No HCR report found for this property.</p>
            ) : hcrReportPages.length === 0 ? (
              <p className="text-sm font-sans text-muted-foreground">No report pages found.</p>
            ) : (
              hcrReportPages.map((page: any) => (
                <div key={page.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <Checkbox
                    id={`hcr-page-${page.id}`}
                    checked={hcrSelectedPages.has(page.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(hcrSelectedPages);
                      if (checked) next.add(page.id); else next.delete(page.id);
                      setHcrSelectedPages(next);
                    }}
                  />
                  <label htmlFor={`hcr-page-${page.id}`} className="text-sm font-sans cursor-pointer">
                    {page.page_name || `Page ${page.page_order + 1}`}
                  </label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHCRImport(false)} className="font-sans">Cancel</Button>
            <Button
              className="font-sans"
              disabled={hcrSelectedPages.size === 0}
              onClick={async () => {
                const selected = hcrReportPages.filter((p: any) => hcrSelectedPages.has(p.id));
                const scopeSections = selected.map((page: any) => ({
                  title: page.page_name || `Page ${page.page_order + 1}`,
                  description: page.narrative || '',
                  line_items: [],
                }));
                // Create a new estimate with these scope sections
                const subtotal = 0;
                const { data: newEst, error } = await (supabase.from('estimates') as any).insert({
                  property_id: propertyId,
                  admin_id: user?.id,
                  title: 'Imported from HCR',
                  notes: '',
                  subtotal,
                  discount_amount: 0,
                  discount_type: 'dollar',
                  tax: 0,
                  total: 0,
                  status: 'draft',
                  proposal_scope_sections: scopeSections,
                }).select().single();
                if (error) { toast.error('Failed to create estimate'); return; }
                await qc.invalidateQueries({ queryKey: ['estimates', propertyId] });
                setShowHCRImport(false);
                setSelectedId(newEst?.id || null);
                toast.success(`Imported ${selected.length} page${selected.length !== 1 ? 's' : ''} as proposal scope`);
              }}
            >
              Import {hcrSelectedPages.size > 0 ? `(${hcrSelectedPages.size})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EstimatesSection;
