import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Pencil, Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string | null;
  title: string | null;
  description: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  total: number;
  balance_due: number;
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

interface InvoiceApprovalQueueProps {
  invoices: Invoice[];
  lineItems: LineItem[];
  clientName?: string;
  propertyAddress?: string;
  onApproved: () => void;
  onEdit: (invoiceId: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function InvoiceApprovalQueue({
  invoices,
  lineItems,
  clientName,
  propertyAddress,
  onApproved,
  onEdit,
}: InvoiceApprovalQueueProps) {
  const [approving, setApproving] = useState<string | null>(null);

  const pendingInvoices = invoices.filter(inv => inv.status === "draft");

  const handleApproveSend = async (inv: Invoice) => {
    setApproving(inv.id);
    try {
      // 1. Update status to 'sent'
      const { error } = await supabase.from("invoices")
        .update({ status: "sent" })
        .eq("id", inv.id);
      if (error) throw error;

      // 2. Try to send notification email (best-effort)
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "invoice_sent",
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number,
            invoiceTitle: inv.title || inv.description,
            total: inv.total,
            dueDate: inv.due_date,
            clientName,
            propertyAddress,
          },
        });
      } catch {
        // Email failure is non-blocking
      }

      toast.success(`Invoice ${inv.invoice_number || ""} approved and sent to client`);
      onApproved();
    } catch {
      toast.error("Failed to approve invoice");
    } finally {
      setApproving(null);
    }
  };

  if (pendingInvoices.length === 0) {
    return (
      <Card className="p-10 text-center shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-display text-lg text-foreground">All invoices approved</p>
          <p className="font-sans text-sm text-muted-foreground">Nothing pending review.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg text-foreground">Awaiting Approval</h3>
        <Badge className="bg-amber-100 text-amber-800 font-mono text-[10px]">{pendingInvoices.length}</Badge>
      </div>

      {/* Invoice Cards */}
      <div className="space-y-4">
        {pendingInvoices.map(inv => {
          const lis = lineItems
            .filter(l => l.invoice_id === inv.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const previewItems = lis.slice(0, 3);
          const extraCount = lis.length - previewItems.length;
          const isApproving = approving === inv.id;

          return (
            <Card key={inv.id} className="p-6 shadow-[0_4px_12px_rgba(27,43,77,0.08)] border-l-[3px] border-l-amber-400">
              {/* Client + Property */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {clientName && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{clientName}</p>
                  )}
                  {propertyAddress && (
                    <p className="font-sans text-sm text-muted-foreground">{propertyAddress}</p>
                  )}
                </div>
                <Badge className="bg-muted text-muted-foreground font-mono text-[10px]">Draft</Badge>
              </div>

              {/* Invoice Title + Number */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  {inv.invoice_number && (
                    <span className="font-mono text-[11px] text-muted-foreground">{inv.invoice_number}</span>
                  )}
                  <h4 className="font-display text-lg text-foreground">{inv.title || inv.description}</h4>
                </div>
              </div>

              {/* Total Amount */}
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Invoice Total</p>
                <p className="font-display text-3xl text-foreground mt-1">{fmt(Number(inv.total))}</p>
              </div>

              {/* Line Items Preview */}
              {previewItems.length > 0 && (
                <div className="mb-5 bg-muted/50 rounded p-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Line Items</p>
                  <div className="space-y-1">
                    {previewItems.map(li => (
                      <div key={li.id} className="flex justify-between text-sm font-sans">
                        <span className="text-foreground truncate pr-4">{li.description}</span>
                        <span className="font-medium flex-shrink-0">{fmt(Number(li.total))}</span>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <p className="font-sans text-xs text-muted-foreground pt-1">and {extraCount} more item{extraCount > 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApproveSend(inv)}
                  disabled={isApproving}
                  className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white font-sans"
                >
                  {isApproving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Approve &amp; Send</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 font-sans"
                  onClick={() => onEdit(inv.id)}
                >
                  <Pencil className="w-4 h-4" /> Edit First
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
