import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface InvoicePrintProps {
  invoice: {
    invoice_number?: string | null;
    title?: string | null;
    description: string;
    amount: number;
    status: string;
    due_date?: string | null;
    issue_date?: string | null;
    subtotal: number;
    tax: number;
    total: number;
    balance_due: number;
    notes?: string | null;
  };
  lineItems?: { description: string; quantity: number; unit_price: number; total: number }[];
  propertyName?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const InvoicePrintView = ({ invoice, lineItems = [], propertyName }: InvoicePrintProps) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number || ""}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:40px;color:#1a1a2e}
h1{font-size:24px;margin-bottom:4px}
.meta{color:#666;font-size:13px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
th{font-weight:600;text-transform:uppercase;font-size:11px;color:#666;letter-spacing:0.05em}
.right{text-align:right}
.summary{margin-top:24px;border-top:2px solid #1a1a2e;padding-top:12px}
.summary div{display:flex;justify-content:space-between;padding:4px 0;font-size:14px}
.total{font-weight:700;font-size:18px;border-top:1px solid #ccc;padding-top:8px;margin-top:8px}
.notes{margin-top:24px;padding:12px;background:#f9f9f9;border-radius:4px;font-size:13px;color:#666}
@media print{body{margin:20px}}
</style></head><body>
<h1>Invoice ${invoice.invoice_number || ""}</h1>
<p class="meta">${invoice.title || invoice.description}</p>
${propertyName ? `<p class="meta">Property: ${propertyName}</p>` : ""}
<p class="meta">Issue: ${invoice.issue_date || "—"} &nbsp;|&nbsp; Due: ${invoice.due_date || "—"} &nbsp;|&nbsp; Status: ${invoice.status.toUpperCase()}</p>
${lineItems.length > 0 ? `<table><thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${lineItems.map(l => `<tr><td>${l.description}</td><td class="right">${l.quantity}</td><td class="right">${fmt(l.unit_price)}</td><td class="right">${fmt(l.total)}</td></tr>`).join("")}</tbody></table>` : ""}
<div class="summary">
<div><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
${invoice.tax > 0 ? `<div><span>Tax</span><span>${fmt(invoice.tax)}</span></div>` : ""}
<div class="total"><span>Balance Due</span><span>${fmt(invoice.balance_due)}</span></div>
</div>
${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}
<script>window.print();window.onafterprint=()=>window.close();</script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-sans">
      <Printer className="w-3.5 h-3.5" />
      Print
    </Button>
  );
};

export default InvoicePrintView;
