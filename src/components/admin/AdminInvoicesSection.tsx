import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncInvoiceToQBO, syncPaymentToQBO, isQBOConfigured } from "@/lib/qboSync";
import { format, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, ArrowLeft, DollarSign, CreditCard, FileText, Sparkles, Loader2, Send, X, MessageSquareText, MessageSquare, FileSignature, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import InvoiceApprovalQueue from "@/components/admin/InvoiceApprovalQueue";
import InvoiceNotesPanel from "@/components/admin/InvoiceNotesPanel";
import ChangeOrderDocument from "@/components/admin/ChangeOrderDocument";
import MasterFinancialLedger from "@/components/admin/MasterFinancialLedger";

interface AdminInvoicesSectionProps {
  propertyId: string;
  propertyContext?: {
    propertyAddress?: string;
    sqft?: number | null;
    propertyType?: string | null;
    clientName?: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  title: string | null;
  type: string;
  description: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  balance_due: number;
  notes: string | null;
  ai_summary: string | null;
  amount: number;
  created_at: string;
}

interface LineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: string;
  sort_order: number;
}

interface ChangeOrder {
  id: string;
  invoice_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentPosted {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
  created_at: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  viewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  partially_paid: "bg-accent/20 text-accent-foreground",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  overdue: "bg-destructive/10 text-destructive",
  pending: "bg-accent/20 text-accent-foreground",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminInvoicesSection = ({ propertyId, propertyContext }: AdminInvoicesSectionProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [payments, setPayments] = useState<PaymentPosted[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form states
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [changeOrderOpen, setChangeOrderOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    title: "", type: "invoice" as string, issue_date: new Date().toISOString().split("T")[0],
    due_date: "", notes: "", description: "",
  });
  const [editLineItems, setEditLineItems] = useState<{ description: string; quantity: string; unit_price: string; item_type: string }[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], method: "check", notes: "" });
  const [changeOrderForm, setChangeOrderForm] = useState({ title: "", description: "", amount: "" });
  const [aiJobDescription, setAiJobDescription] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [aiChangeDescription, setAiChangeDescription] = useState("");

  // CO Mode Selector (5B)
  const [coMode, setCoMode] = useState<"verbal" | "formal" | "interim">("formal");
  const [showCoDocument, setShowCoDocument] = useState(false);
  const [pendingCoForDocument, setPendingCoForDocument] = useState<ChangeOrder | null>(null);

  // Approval queue tab
  const [adminTab, setAdminTab] = useState<"queue" | "invoices">("invoices");

  // Edit mode
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [invRes, liRes, coRes, pRes] = await Promise.all([
      (supabase.from("invoices" as any) as any).select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
      (supabase.from("invoice_line_items" as any) as any).select("*"),
      (supabase.from("change_orders" as any) as any).select("*"),
      (supabase.from("payments_posted" as any) as any).select("*"),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (liRes.data) setLineItems(liRes.data);
    if (coRes.data) setChangeOrders(coRes.data);
    if (pRes.data) setPayments(pRes.data);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`invoices-admin-${propertyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoice_line_items" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "change_orders" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments_posted" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId, loadData]);

  const invoiceLineItems = useMemo(() => lineItems.filter(li => li.invoice_id === selectedInvoice?.id), [lineItems, selectedInvoice]);
  const invoiceChangeOrders = useMemo(() => changeOrders.filter(co => co.invoice_id === selectedInvoice?.id), [changeOrders, selectedInvoice]);
  const invoicePayments = useMemo(() => payments.filter(p => p.invoice_id === selectedInvoice?.id), [payments, selectedInvoice]);

  const recalcInvoice = async (invoiceId: string) => {
    const lis = lineItems.filter(l => l.invoice_id === invoiceId);
    const cos = changeOrders.filter(c => c.invoice_id === invoiceId && c.status === "approved");
    const ps = payments.filter(p => p.invoice_id === invoiceId);
    const subtotal = lis.reduce((s, l) => s + Number(l.total), 0);
    const coTotal = cos.reduce((s, c) => s + Number(c.amount), 0);
    const total = subtotal + coTotal;
    const totalPaid = ps.reduce((s, p) => s + Number(p.amount), 0);
    const balance_due = Math.max(0, total - totalPaid);

    let newStatus: string | undefined;
    if (totalPaid >= total && total > 0) newStatus = "paid";
    else if (totalPaid > 0 && totalPaid < total) newStatus = "partially_paid";

    const updateData: Record<string, unknown> = { subtotal, total, balance_due, amount: total };
    if (newStatus) updateData.status = newStatus;

    // Check overdue
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv?.due_date && isPast(new Date(inv.due_date)) && balance_due > 0 && inv.status !== "paid") {
      updateData.status = "overdue";
    }

    await (supabase.from("invoices" as any) as any).update(updateData).eq("id", invoiceId);
    loadData();
  };

  // CREATE INVOICE
  const handleCreateInvoice = async () => {
    const subtotal = editLineItems.reduce((s, li) => s + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0), 0);
    const { data: inv, error } = await (supabase.from("invoices" as any) as any).insert({
      property_id: propertyId,
      title: invoiceForm.title || null,
      type: invoiceForm.type,
      description: invoiceForm.title || invoiceForm.description || "Invoice",
      status: "draft",
      issue_date: invoiceForm.issue_date || null,
      due_date: invoiceForm.due_date || null,
      notes: invoiceForm.notes || null,
      subtotal, tax: 0, total: subtotal, balance_due: subtotal,
      amount: subtotal,
      original_total: subtotal,
      co_total: 0,
    }).select().single();

    if (error || !inv) { toast.error("Failed to create invoice"); return; }

    // Insert line items
    if (editLineItems.length > 0) {
      const items = editLineItems.map((li, i) => ({
        invoice_id: inv.id,
        description: li.description,
        quantity: parseFloat(li.quantity) || 1,
        unit_price: parseFloat(li.unit_price) || 0,
        total: (parseFloat(li.quantity) || 1) * (parseFloat(li.unit_price) || 0),
        item_type: li.item_type || "service",
        sort_order: i,
      }));
      await (supabase.from("invoice_line_items" as any) as any).insert(items);
    }

    toast.success(`${invoiceForm.type === "estimate" ? "Estimate" : "Invoice"} created`);
    setCreateOpen(false);
    resetForm();
    loadData();
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", propertyId] });
  };

  // POST PAYMENT
  const handlePostPayment = async () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }

    const { error } = await (supabase.from("payments_posted" as any) as any).insert({
      invoice_id: selectedInvoice.id,
      amount,
      payment_date: paymentForm.payment_date,
      method: paymentForm.method,
      notes: paymentForm.notes || null,
    });
    if (error) { toast.error("Failed to post payment"); return; }
    toast.success("Payment posted");
    setPaymentOpen(false);
    const paymentData = { ...paymentForm, amount: amount.toString() };
    setPaymentForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], method: "check", notes: "" });
    await loadData();
    // Wait for state to update, then recalc
    setTimeout(() => recalcInvoice(selectedInvoice.id), 500);

    // QBO sync: push payment to QuickBooks if configured
    if (isQBOConfigured()) {
      const qboInvoiceId = (selectedInvoice as any).qbo_invoice_id;
      if (qboInvoiceId) {
        const clientName = propertyContext?.clientName || propertyContext?.propertyAddress || "Client";
        syncPaymentToQBO(
          {
            id: `${selectedInvoice.id}-pay-${Date.now()}`,
            amount,
            payment_date: paymentData.payment_date,
            method: paymentData.method,
            notes: paymentData.notes || null,
          },
          qboInvoiceId,
          { name: clientName }
        ).then((result) => {
          if (result.success) {
            console.log(`[QBO] Payment synced. QBO Payment ID: ${result.qboId}`);
          } else {
            console.warn(`[QBO] Payment sync skipped: ${result.error}`);
          }
        });
      } else {
        console.log("[QBO] Skipping payment sync — no QBO invoice ID on file");
      }
    }
  };

  // 5C — Auto-adjust invoice totals when COs are approved
  const applyApprovedCOs = async (invoiceId: string) => {
    // 1. Fetch all approved COs for this invoice
    const approvedCOs = changeOrders.filter(c => c.invoice_id === invoiceId && c.status === "approved");
    // 2. Sum their amounts
    const coSum = approvedCOs.reduce((s, c) => s + Number(c.amount), 0);
    // 3. Get original total (from invoices state)
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const origTotal = Number((inv as any).original_total ?? inv.subtotal);
    const paidSum = payments.filter(p => p.invoice_id === invoiceId).reduce((s, p) => s + Number(p.amount), 0);
    const newTotal = origTotal + coSum;
    const newBalanceDue = Math.max(0, newTotal - paidSum);
    // 4. Update invoice
    await (supabase.from("invoices" as any) as any).update({
      total: newTotal,
      co_total: coSum,
      balance_due: newBalanceDue,
      amount: newTotal,
    }).eq("id", invoiceId);
    toast.success(`Invoice total updated: +${fmt(coSum)} from approved change order`);
    loadData();
  };

  // ADD CHANGE ORDER (5B — mode-aware)
  const handleAddChangeOrder = async () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(changeOrderForm.amount);

    // Determine CO status based on mode
    const coStatus = coMode === "verbal" ? "verbal" : "pending";

    const { data: newCO, error } = await (supabase.from("change_orders" as any) as any).insert({
      invoice_id: selectedInvoice.id,
      title: changeOrderForm.title,
      description: changeOrderForm.description || null,
      amount: amount || 0,
      status: coStatus,
      co_mode: coMode,
    }).select().single();

    if (error) { toast.error("Failed to add change order"); return; }

    if (coMode === "verbal") {
      // Verbal: document it, will be added to next invoice automatically
      toast.success("Change order documented as verbal — will appear on next invoice");
      setChangeOrderOpen(false);
      setChangeOrderForm({ title: "", description: "", amount: "" });
      setCoMode("formal");
      loadData();
    } else if (coMode === "formal") {
      // Formal: open CO document for client signature
      setPendingCoForDocument(newCO);
      setShowCoDocument(true);
      setChangeOrderOpen(false);
      setChangeOrderForm({ title: "", description: "", amount: "" });
      setCoMode("formal");
      loadData();
      toast.success("Change order created — review document and send to client");
    } else if (coMode === "interim") {
      // Interim: create a new standalone invoice for this CO
      const { error: invErr } = await (supabase.from("invoices" as any) as any).insert({
        property_id: propertyId,
        title: `Change Order: ${changeOrderForm.title}`,
        description: changeOrderForm.description || `Change Order: ${changeOrderForm.title}`,
        type: "invoice",
        status: "draft",
        issue_date: new Date().toISOString().split("T")[0],
        subtotal: amount || 0,
        tax: 0,
        total: amount || 0,
        balance_due: amount || 0,
        amount: amount || 0,
        original_total: amount || 0,
        notes: `Interim invoice for change order: ${changeOrderForm.title}`,
      });
      if (invErr) {
        toast.error("Change order created but failed to create interim invoice");
      } else {
        toast.success("Change order created — standalone interim invoice generated");
      }
      setChangeOrderOpen(false);
      setChangeOrderForm({ title: "", description: "", amount: "" });
      setCoMode("formal");
      loadData();
    }
  };

  // APPROVE/REJECT CHANGE ORDER
  const updateChangeOrderStatus = async (coId: string, status: string) => {
    await (supabase.from("change_orders" as any) as any).update({ status }).eq("id", coId);
    toast.success(`Change order ${status}`);
    await loadData();
    // 5C: When approved, auto-adjust invoice total
    if (status === "approved" && selectedInvoice) {
      setTimeout(() => applyApprovedCOs(selectedInvoice.id), 500);
    } else if (selectedInvoice) {
      setTimeout(() => recalcInvoice(selectedInvoice.id), 500);
    }
  };

  // DELETE INVOICE
  const deleteInvoice = async (id: string) => {
    await (supabase.from("invoices" as any) as any).delete().eq("id", id);
    toast.success("Invoice deleted");
    if (selectedInvoice?.id === id) setSelectedInvoice(null);
    loadData();
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", propertyId] });
  };

  // UPDATE INVOICE STATUS
  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("invoices" as any) as any).update({ status }).eq("id", id);
    loadData();

    // QBO sync: when an invoice is marked 'sent', push to QuickBooks
    if (status === "sent" && isQBOConfigured()) {
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        const invoiceLineItems = lineItems.filter((li) => li.invoice_id === id);
        const clientName = propertyContext?.clientName || propertyContext?.propertyAddress || "Client";
        syncInvoiceToQBO(
          invoice,
          invoiceLineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unit_price,
            total: li.total,
            item_type: li.item_type,
          })),
          clientName
        ).then((result) => {
          if (result.success) {
            console.log(`[QBO] Invoice ${id} synced. QBO ID: ${result.qboId}`);
          } else {
            console.warn(`[QBO] Invoice sync skipped: ${result.error}`);
          }
        });
      }
    }
  };

  // UPDATE INVOICE FIELD
  const updateInvoiceField = async (id: string, field: string, value: unknown) => {
    await (supabase.from("invoices" as any) as any).update({ [field]: value }).eq("id", id);
    loadData();
  };

  // AI: Generate estimate line items from description
  const handleAiGenerate = async () => {
    if (!aiJobDescription.trim()) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
        body: {
          task: "generate_estimate",
          context: {
            jobDescription: aiJobDescription,
            propertyAddress: propertyContext?.propertyAddress,
            sqft: propertyContext?.sqft,
            propertyType: propertyContext?.propertyType,
          },
        },
      });
      if (error) throw error;
      if (data?.lineItems && Array.isArray(data.lineItems)) {
        setEditLineItems(data.lineItems.map((li: any) => ({
          description: li.description || "",
          quantity: String(li.quantity || 1),
          unit_price: String(li.unit_price || 0),
          item_type: "service",
        })));
        toast.success("AI generated line items — review and edit before saving");
      }
    } catch (err) {
      toast.error("AI generation failed — try again or enter items manually");
    } finally {
      setAiGenerating(false);
    }
  };

  // AI: Generate from meeting transcript
  const handleAiFromTranscript = async () => {
    if (!aiTranscript.trim()) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
        body: {
          task: "from_transcript",
          context: {
            transcript: aiTranscript,
            propertyAddress: propertyContext?.propertyAddress,
            sqft: propertyContext?.sqft,
            propertyType: propertyContext?.propertyType,
            clientName: propertyContext?.clientName,
          },
        },
      });
      if (error) throw error;
      if (data?.title) setInvoiceForm(f => ({ ...f, title: data.title }));
      if (data?.notes) setInvoiceForm(f => ({ ...f, notes: data.notes }));
      if (data?.lineItems && Array.isArray(data.lineItems)) {
        setEditLineItems(data.lineItems.map((li: any) => ({
          description: li.description || "",
          quantity: String(li.quantity || 1),
          unit_price: String(li.unit_price || 0),
          item_type: "service",
        })));
        toast.success(`AI extracted ${data.lineItems.length} line items from transcript`);
      }
    } catch (err: any) {
      if (err?.status === 429) toast.error("Rate limited — try again in a moment");
      else if (err?.status === 402) toast.error("AI credits exhausted");
      else toast.error("AI generation failed — try again or enter items manually");
    } finally {
      setAiGenerating(false);
    }
  };

  // AI: Draft change order
  const handleAiDraftChangeOrder = async () => {
    if (!aiChangeDescription.trim() || !selectedInvoice) return;
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
        body: {
          task: "draft_change_order",
          context: {
            changeDescription: aiChangeDescription,
            invoiceTitle: selectedInvoice.title || selectedInvoice.description,
            invoiceTotal: selectedInvoice.total,
          },
        },
      });
      if (error) throw error;
      if (data) {
        setChangeOrderForm({
          title: data.title || "",
          description: data.description || "",
          amount: String(data.amount || 0),
        });
        toast.success("AI drafted change order — review before saving");
      }
    } catch {
      toast.error("AI draft failed");
    } finally {
      setAiGenerating(false);
    }
  };

  // AI: Draft payment reminder
  const handleDraftReminder = async (inv: Invoice) => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
        body: {
          task: "payment_reminder",
          context: {
            clientName: propertyContext?.clientName || "Client",
            invoiceNumber: inv.invoice_number,
            amountOwed: inv.balance_due,
            dueDate: inv.due_date,
          },
        },
      });
      if (error) throw error;
      if (data?.message) {
        // Copy to clipboard for now
        await navigator.clipboard.writeText(data.message);
        toast.success("Payment reminder copied to clipboard — paste into Messages to send");
      }
    } catch {
      toast.error("Failed to draft reminder");
    } finally {
      setAiGenerating(false);
    }
  };

  const resetForm = () => {
    setInvoiceForm({ title: "", type: "invoice", issue_date: new Date().toISOString().split("T")[0], due_date: "", notes: "", description: "" });
    setEditLineItems([]);
    setAiJobDescription("");
    setAiTranscript("");
  };

  const addLineItem = () => setEditLineItems([...editLineItems, { description: "", quantity: "1", unit_price: "0", item_type: "service" }]);
  const removeLineItem = (i: number) => setEditLineItems(editLineItems.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: string, value: string) => {
    const updated = [...editLineItems];
    (updated[i] as any)[field] = value;
    setEditLineItems(updated);
  };

  const lineItemSubtotal = editLineItems.reduce((s, li) => s + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0), 0);

  // ─── DETAIL VIEW ───
  if (selectedInvoice) {
    const inv = invoices.find(i => i.id === selectedInvoice.id) || selectedInvoice;
    const lis = lineItems.filter(l => l.invoice_id === inv.id).sort((a, b) => a.sort_order - b.sort_order);
    const cos = changeOrders.filter(c => c.invoice_id === inv.id);
    const ps = payments.filter(p => p.invoice_id === inv.id).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    const approvedCOs = cos.filter(c => c.status === "approved");
    const coTotal = approvedCOs.reduce((s, c) => s + Number(c.amount), 0);
    const totalPaid = ps.reduce((s, p) => s + Number(p.amount), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)} className="gap-1 font-sans">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex-1">
            <h3 className="text-lg font-sans font-bold text-foreground flex items-center gap-2">
              {inv.invoice_number || "Draft"} — {inv.title || inv.description}
              <Badge className={`text-[10px] ${statusColors[inv.status] || "bg-muted"}`}>
                {inv.status.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {inv.type === "estimate" ? "Estimate" : "Invoice"}
              </Badge>
            </h3>
          </div>
          <div className="flex gap-2">
            <Select value={inv.status} onValueChange={(v) => updateStatus(inv.id, v)}>
              <SelectTrigger className="h-8 w-[140px] text-xs font-sans"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "sent", "viewed", "partially_paid", "paid", "overdue"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {inv.status === "overdue" && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => handleDraftReminder(inv)} disabled={aiGenerating}>
                <Send className="w-3.5 h-3.5" /> Draft Reminder
              </Button>
            )}
          </div>
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Issue Date</p>
            <p className="text-sm font-sans font-medium mt-1">{inv.issue_date ? format(new Date(inv.issue_date), "MMM d, yyyy") : "—"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Due Date</p>
            <p className="text-sm font-sans font-medium mt-1">{inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="text-lg font-sans font-bold mt-1">{fmt(Number(inv.total))}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Balance Due</p>
            <p className={`text-lg font-sans font-bold mt-1 ${Number(inv.balance_due) > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(Number(inv.balance_due))}</p>
          </Card>
        </div>

        <Card className="p-4">
          <InvoiceNotesPanel
            invoiceId={inv.id}
            initialNotes={inv.notes}
            onUpdate={loadData}
          />
        </Card>

        {/* Line Items */}
        <div>
          <h4 className="text-sm font-sans font-semibold mb-3">Line Items</h4>
          {lis.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Description</TableHead>
                  <TableHead className="font-sans text-xs text-right">Qty</TableHead>
                  <TableHead className="font-sans text-xs text-right">Unit Price</TableHead>
                  <TableHead className="font-sans text-xs text-right">Total</TableHead>
                  <TableHead className="font-sans text-xs">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lis.map(li => (
                  <TableRow key={li.id}>
                    <TableCell className="font-sans text-sm">{li.description}</TableCell>
                    <TableCell className="font-sans text-sm text-right">{li.quantity}</TableCell>
                    <TableCell className="font-sans text-sm text-right">{fmt(Number(li.unit_price))}</TableCell>
                    <TableCell className="font-sans text-sm text-right font-medium">{fmt(Number(li.total))}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{li.item_type}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card className="p-6 text-center"><p className="text-sm font-sans text-muted-foreground">No line items</p></Card>
          )}
        </div>

        {/* Change Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-sans font-semibold">Change Orders</h4>
            <Dialog open={changeOrderOpen} onOpenChange={setChangeOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" /> Add Change Order</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-sans">Add Change Order</DialogTitle></DialogHeader>
                <div className="space-y-5">
                  {/* 5B — CO Mode Selector */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">How do you want to handle this change order?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { mode: "verbal" as const, icon: <MessageSquare className="w-4 h-4" />, label: "Verbal / Informal", sub: "Add to next invoice", detail: "No signature needed" },
                        { mode: "formal" as const, icon: <FileSignature className="w-4 h-4" />, label: "Formal — Client Signs", sub: "Send for approval", detail: "Client must sign" },
                        { mode: "interim" as const, icon: <Receipt className="w-4 h-4" />, label: "Interim Invoice", sub: "Create new invoice", detail: "Separate document" },
                      ] as const).map(({ mode, icon, label, sub, detail }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setCoMode(mode)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${
                            coMode === mode
                              ? "border-[#C4A265] bg-[#C4A265]/10 text-[#C4A265]"
                              : "border-border hover:border-[#C4A265]/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {icon}
                          <span className="font-sans text-[11px] font-semibold leading-tight">{label}</span>
                          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide">{sub}</span>
                          <span className="font-sans text-[10px] text-muted-foreground">{detail}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Draft */}
                  <div className="space-y-2">
                    <Label className="font-sans text-xs">Describe the change (AI will draft)</Label>
                    <Textarea value={aiChangeDescription} onChange={e => setAiChangeDescription(e.target.value)} placeholder="e.g. Client wants to add gutter guards to the scope..." className="text-sm" />
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={handleAiDraftChangeOrder} disabled={aiGenerating || !aiChangeDescription.trim()}>
                      {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Draft with AI
                    </Button>
                  </div>
                  <div><Label className="font-sans">Title</Label><Input value={changeOrderForm.title} onChange={e => setChangeOrderForm({ ...changeOrderForm, title: e.target.value })} /></div>
                  <div><Label className="font-sans">Description</Label><Textarea value={changeOrderForm.description} onChange={e => setChangeOrderForm({ ...changeOrderForm, description: e.target.value })} /></div>
                  <div><Label className="font-sans">Amount ($)</Label><Input type="number" value={changeOrderForm.amount} onChange={e => setChangeOrderForm({ ...changeOrderForm, amount: e.target.value })} /></div>
                  <Button onClick={handleAddChangeOrder} className="w-full font-sans bg-[#C4A265] hover:bg-[#C4A265]/90 text-white" disabled={!changeOrderForm.title}>
                    {coMode === "verbal" ? "Document Change Order" : coMode === "formal" ? "Create & Send for Signature" : "Create & Generate Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {cos.length > 0 ? (
            <div className="space-y-2">
              {cos.map(co => (
                <Card key={co.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-sans font-medium">{co.title}</p>
                    {co.description && <p className="text-xs font-sans text-muted-foreground mt-0.5">{co.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-sans font-medium">{fmt(Number(co.amount))}</span>
                    <Badge className={`text-[10px] ${statusColors[co.status] || "bg-muted"}`}>{co.status}</Badge>
                    {co.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={() => updateChangeOrderStatus(co.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-[10px] h-7 px-2 text-destructive" onClick={() => updateChangeOrderStatus(co.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center"><p className="text-sm font-sans text-muted-foreground">No change orders</p></Card>
          )}
        </div>

        {/* Payments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-sans font-semibold">Payments Posted</h4>
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs font-sans"><DollarSign className="w-3.5 h-3.5" /> Post Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-sans">Post Payment</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label className="font-sans">Amount ($)</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={`Balance: ${fmt(Number(inv.balance_due))}`} /></div>
                  <div><Label className="font-sans">Payment Date</Label><Input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} /></div>
                  <div><Label className="font-sans">Method</Label>
                    <Select value={paymentForm.method} onValueChange={v => setPaymentForm({ ...paymentForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="font-sans">Notes</Label><Textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
                  <Button onClick={handlePostPayment} className="w-full font-sans">Post Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {ps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Date</TableHead>
                  <TableHead className="font-sans text-xs">Method</TableHead>
                  <TableHead className="font-sans text-xs text-right">Amount</TableHead>
                  <TableHead className="font-sans text-xs">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ps.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-sans text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.method}</Badge></TableCell>
                    <TableCell className="font-sans text-sm text-right font-medium text-green-600">{fmt(Number(p.amount))}</TableCell>
                    <TableCell className="font-sans text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card className="p-6 text-center"><p className="text-sm font-sans text-muted-foreground">No payments posted</p></Card>
          )}
        </div>

        {/* Financial Summary */}
        <Card className="p-5 bg-muted/30">
          <h4 className="text-sm font-sans font-semibold mb-3">Financial Summary</h4>
          <div className="space-y-2 text-sm font-sans">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(Number(inv.subtotal))}</span></div>
            {coTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Change Orders</span><span>{fmt(coTotal)}</span></div>}
            <div className="flex justify-between border-t border-border pt-2"><span className="font-medium">Total</span><span className="font-medium">{fmt(Number(inv.total))}</span></div>
            {totalPaid > 0 && <div className="flex justify-between text-green-600"><span>Payments Received</span><span>-{fmt(totalPaid)}</span></div>}
            <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Balance Due</span><span className={`font-bold ${Number(inv.balance_due) > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(Number(inv.balance_due))}</span></div>
          </div>
        </Card>
      </div>
    );
  }

  // ─── LIST VIEW ───
  const draftInvoices = invoices.filter(i => i.status === "draft");

  // CO Document Modal
  if (showCoDocument && pendingCoForDocument && selectedInvoice) {
    const origTotal = Number((selectedInvoice as any).original_total ?? selectedInvoice.subtotal);
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1 font-sans" onClick={() => { setShowCoDocument(false); setPendingCoForDocument(null); }}>
          <ArrowLeft className="w-4 h-4" /> Back to Invoice
        </Button>
        <ChangeOrderDocument
          changeOrder={pendingCoForDocument}
          originalContractTotal={origTotal}
          propertyAddress={propertyContext?.propertyAddress}
          clientName={propertyContext?.clientName}
          brand="hbc"
          onApprove={async () => {
            await (supabase.from("change_orders" as any) as any).update({ status: "approved" }).eq("id", pendingCoForDocument.id);
            toast.success("Change order approved");
            setShowCoDocument(false);
            setPendingCoForDocument(null);
            loadData();
            setTimeout(() => applyApprovedCOs(pendingCoForDocument.invoice_id), 500);
          }}
          onReject={async () => {
            await (supabase.from("change_orders" as any) as any).update({ status: "rejected" }).eq("id", pendingCoForDocument.id);
            toast.success("Change order rejected");
            setShowCoDocument(false);
            setPendingCoForDocument(null);
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Invoice Approval Queue — shown when there are drafts */}
      {draftInvoices.length > 0 && (
        <div className="mb-2">
          <InvoiceApprovalQueue
            invoices={invoices}
            lineItems={lineItems}
            clientName={propertyContext?.clientName}
            propertyAddress={propertyContext?.propertyAddress}
            onApproved={loadData}
            onEdit={(id) => {
              const inv = invoices.find(i => i.id === id);
              if (inv) setSelectedInvoice(inv);
            }}
          />
          {draftInvoices.length < invoices.length && (
            <div className="border-t border-border my-4" />
          )}
        </div>
      )}
      {/* Master Financial Ledger Tab View */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="invoices" className="font-sans text-xs">Invoices & Estimates</TabsTrigger>
          <TabsTrigger value="ledger" className="font-sans text-xs">Financial Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger">
          <MasterFinancialLedger
            propertyId={propertyId}
            propertyName={propertyContext?.propertyAddress}
            clientName={propertyContext?.clientName}
          />
        </TabsContent>
        <TabsContent value="invoices">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-sans font-semibold text-foreground">Invoices & Estimates</h3>
        <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-sans">Create Invoice / Estimate</DialogTitle></DialogHeader>
            <div className="space-y-5">
              {/* Type toggle */}
              <div className="flex gap-2">
                {["invoice", "estimate"].map(t => (
                  <button key={t} onClick={() => setInvoiceForm({ ...invoiceForm, type: t })} className={`px-4 py-2 text-sm font-sans rounded-md border transition-colors ${invoiceForm.type === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"}`}>
                    {t === "invoice" ? "Invoice" : "Estimate"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label className="font-sans">Title</Label><Input value={invoiceForm.title} onChange={e => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="e.g. Q1 Consultation" /></div>
                <div><Label className="font-sans">Issue Date</Label><Input type="date" value={invoiceForm.issue_date} onChange={e => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })} /></div>
              </div>
              <div><Label className="font-sans">Due Date</Label><Input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} /></div>
              <div><Label className="font-sans">Notes</Label><Textarea value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Internal or client-facing notes" /></div>

              {/* AI Assistant */}
              <Card className="p-4 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-sm font-sans font-medium">AI Line Item Generator</p>
                </div>
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="description" className="flex-1 text-xs font-sans gap-1"><Sparkles className="w-3 h-3" />From Description</TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1 text-xs font-sans gap-1"><MessageSquareText className="w-3 h-3" />From Transcript</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="space-y-2 mt-3">
                    <Textarea value={aiJobDescription} onChange={e => setAiJobDescription(e.target.value)} placeholder="Describe the job (e.g. 'Full furnace replacement, 2500 sqft home, standard ductwork')..." className="text-sm" />
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={handleAiGenerate} disabled={aiGenerating || !aiJobDescription.trim()}>
                      {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate Line Items
                    </Button>
                  </TabsContent>
                  <TabsContent value="transcript" className="space-y-2 mt-3">
                    <Textarea value={aiTranscript} onChange={e => setAiTranscript(e.target.value)} placeholder="Paste meeting notes or call transcript... AI will extract scope items and generate line items with pricing." className="text-sm" rows={4} />
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={handleAiFromTranscript} disabled={aiGenerating || !aiTranscript.trim()}>
                      {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquareText className="w-3.5 h-3.5" />} Extract from Transcript
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-sans font-medium">Line Items</Label>
                  <Button size="sm" variant="ghost" className="gap-1 text-xs font-sans" onClick={addLineItem}><Plus className="w-3 h-3" /> Add Row</Button>
                </div>
                {editLineItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_60px_80px_80px_30px] gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1">
                      <span>Description</span><span>Qty</span><span>Price</span><span>Total</span><span></span>
                    </div>
                    {editLineItems.map((li, i) => (
                      <div key={i} className="grid grid-cols-[1fr_60px_80px_80px_30px] gap-2 items-center">
                        <Input className="text-sm h-8" value={li.description} onChange={e => updateLineItem(i, "description", e.target.value)} placeholder="Description" />
                        <Input className="text-sm h-8" type="number" value={li.quantity} onChange={e => updateLineItem(i, "quantity", e.target.value)} />
                        <Input className="text-sm h-8" type="number" value={li.unit_price} onChange={e => updateLineItem(i, "unit_price", e.target.value)} />
                        <span className="text-sm font-sans text-right pr-1">{fmt((parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0))}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeLineItem(i)}><X className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                    <div className="flex justify-end pr-12 pt-2 border-t border-border">
                      <span className="text-sm font-sans font-semibold">Subtotal: {fmt(lineItemSubtotal)}</span>
                    </div>
                  </div>
                ) : (
                  <Card className="p-4 text-center"><p className="text-xs font-sans text-muted-foreground">No line items yet. Add rows or use AI to generate.</p></Card>
                )}
              </div>

              <Button onClick={handleCreateInvoice} className="w-full font-sans" disabled={!invoiceForm.title && editLineItems.length === 0}>
                Create {invoiceForm.type === "estimate" ? "Estimate" : "Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No invoices yet. Create one to get started.</p></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-sans text-xs">Invoice #</TableHead>
              <TableHead className="font-sans text-xs">Title</TableHead>
              <TableHead className="font-sans text-xs">Type</TableHead>
              <TableHead className="font-sans text-xs">Status</TableHead>
              <TableHead className="font-sans text-xs text-right">Total</TableHead>
              <TableHead className="font-sans text-xs text-right">Balance</TableHead>
              <TableHead className="font-sans text-xs">Due Date</TableHead>
              <TableHead className="font-sans text-xs w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInvoice(inv)}>
                <TableCell className="font-mono text-xs">{inv.invoice_number || "—"}</TableCell>
                <TableCell className="font-sans text-sm font-medium">{inv.title || inv.description}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{inv.type}</Badge></TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColors[inv.status] || "bg-muted"}`}>{inv.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="font-sans text-sm text-right">{fmt(Number(inv.total))}</TableCell>
                <TableCell className={`font-sans text-sm text-right font-medium ${Number(inv.balance_due) > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(Number(inv.balance_due))}</TableCell>
                <TableCell className="font-sans text-xs text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-sans">Delete {inv.type}?</AlertDialogTitle>
                        <AlertDialogDescription className="font-sans">This will permanently delete this {inv.type} and all associated line items, change orders, and payments.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteInvoice(inv.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInvoicesSection;
