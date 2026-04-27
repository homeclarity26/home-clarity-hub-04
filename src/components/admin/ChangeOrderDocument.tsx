import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, X, Printer } from "lucide-react";

export interface ChangeOrderDocumentProps {
  changeOrder: {
    id: string;
    invoice_id: string;
    title: string;
    description: string | null;
    amount: number;
    status: string;
  };
  originalContractTotal: number;
  propertyAddress?: string;
  clientName?: string;
  brand: "hbc" | "akr";
  onApprove: () => void;
  onReject: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const BRAND_CONFIG = {
  hbc: {
    name: "Hometown Builders Club LLC",
    email: "adam@hometownbuildersclub.com",
    phone: "(330) 203-1331",
    color: "#B87333",
    tagline: "Craftsmanship you can trust. Communication you deserve.",
  },
  akr: {
    name: "AK Renovations",
    email: "akrenovations01@gmail.com",
    phone: "(330) 203-1331",
    color: "#B7410E",
    tagline: "Craftsmanship you can trust. Communication you deserve.",
  },
};

export default function ChangeOrderDocument({
  changeOrder,
  originalContractTotal,
  propertyAddress,
  clientName,
  brand,
  onApprove,
  onReject,
}: ChangeOrderDocumentProps) {
  const [clientSignatureName, setClientSignatureName] = useState("");
  const [clientApprovalChecked, setClientApprovalChecked] = useState(false);
  const [approvalDate] = useState(format(new Date(), "MMMM d, yyyy"));
  const brandConfig = BRAND_CONFIG[brand];
  const newContractTotal = originalContractTotal + changeOrder.amount;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Change Order — ${changeOrder.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; margin: 48px; color: #0A1628; background: white; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${brandConfig.color}; padding-bottom: 24px; margin-bottom: 32px; }
    .company-name { font-size: 22px; font-weight: bold; color: ${brandConfig.color}; }
    .doc-title { font-size: 28px; font-weight: bold; text-align: right; }
    .doc-subtitle { font-size: 13px; color: #888; text-align: right; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #8A8E99; font-family: 'Courier New', monospace; margin-bottom: 8px; }
    .cost-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .cost-table td, .cost-table th { padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 14px; }
    .cost-table th { background: #F2EFEB; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
    .cost-table .total-row td { font-weight: bold; font-size: 16px; background: #F8F6F2; }
    .terms { background: #F8F6F2; border-left: 3px solid ${brandConfig.color}; padding: 16px; font-size: 13px; color: #555; font-style: italic; }
    .signature-block { margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 24px; }
    .sig-line { border-bottom: 1px solid #0A1628; margin-top: 40px; margin-bottom: 4px; }
    .sig-label { font-size: 11px; color: #888; }
    .approval-notice { background: ${brandConfig.color}22; border: 1px solid ${brandConfig.color}55; padding: 12px; border-radius: 4px; font-size: 13px; margin-bottom: 16px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${brandConfig.name}</div>
      <div style="font-size:13px; color:#888; margin-top:4px;">${brandConfig.phone} · ${brandConfig.email}</div>
      <div style="font-size:12px; color:#aaa; margin-top:2px;">${brandConfig.tagline}</div>
    </div>
    <div>
      <div class="doc-title">Change Order</div>
      <div class="doc-subtitle">Date: ${approvalDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Property</div>
    <div style="font-size:15px;">${propertyAddress || "—"}</div>
    ${clientName ? `<div style="font-size:13px; color:#888; margin-top:2px;">Client: ${clientName}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-label">Change Order Title</div>
    <div style="font-size:18px; font-weight:bold;">${changeOrder.title}</div>
  </div>

  <div class="section">
    <div class="section-label">Description of Change</div>
    <div style="font-size:14px; line-height:1.6;">${changeOrder.description || "See attached scope."}</div>
  </div>

  <div class="section">
    <div class="section-label">Cost Impact</div>
    <table class="cost-table">
      <tr><th>Item</th><th style="text-align:right;">Amount</th></tr>
      <tr><td>Original Contract Total</td><td style="text-align:right;">${fmt(originalContractTotal)}</td></tr>
      <tr><td>This Change Order</td><td style="text-align:right; color:${changeOrder.amount >= 0 ? "green" : "red"};">${fmt(changeOrder.amount)}</td></tr>
      <tr class="total-row"><td>New Contract Total</td><td style="text-align:right;">${fmt(newContractTotal)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="terms">"Work will not begin until this change order is approved in writing by the client."</div>
  </div>

  <div class="signature-block">
    <div class="section-label">Client Approval</div>
    <p style="font-size:13px; margin-bottom:16px;">By signing below, I authorize ${brandConfig.name} to proceed with the above change order and acknowledge the updated contract total of ${fmt(newContractTotal)}.</p>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px;">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Client Signature</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
    </div>
    <div style="margin-top:24px;">
      <div class="sig-line"></div>
      <div class="sig-label">Printed Name</div>
    </div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Document Preview Card */}
      <Card className="overflow-hidden shadow-[0_4px_12px_rgba(27,43,77,0.08)]">
        {/* Document Header */}
        <div
          className="p-8 border-b-2"
          style={{ borderColor: brandConfig.color }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-xl" style={{ color: brandConfig.color }}>
                {brandConfig.name}
              </h1>
              <p className="font-sans text-xs text-muted-foreground mt-1">{brandConfig.phone} · {brandConfig.email}</p>
              <p className="font-sans text-xs text-muted-foreground/70 mt-0.5 italic">{brandConfig.tagline}</p>
            </div>
            <div className="text-right">
              <h2 className="font-display text-2xl text-foreground">Change Order</h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">{approvalDate}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Property */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Property</p>
            <p className="font-sans text-base font-medium text-foreground">{propertyAddress || "—"}</p>
            {clientName && <p className="font-sans text-sm text-muted-foreground mt-0.5">Client: {clientName}</p>}
          </div>

          {/* Title */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Change Order Title</p>
            <p className="font-display text-xl text-foreground">{changeOrder.title}</p>
          </div>

          {/* Description */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Description of Change</p>
            <p className="font-sans text-sm text-foreground leading-relaxed">{changeOrder.description || "See attached scope."}</p>
          </div>

          {/* Cost Impact Table */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Cost Impact</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Item</th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 bg-white">
                  <td className="py-3 font-sans text-foreground">Original Contract Total</td>
                  <td className="py-3 font-sans text-right font-medium">{fmt(originalContractTotal)}</td>
                </tr>
                <tr className="border-b border-border/50 bg-muted">
                  <td className="py-3 font-sans text-foreground">This Change Order</td>
                  <td className={`py-3 font-sans text-right font-medium ${changeOrder.amount >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {changeOrder.amount >= 0 ? "+" : ""}{fmt(changeOrder.amount)}
                  </td>
                </tr>
                <tr className="bg-primary text-white">
                  <td className="py-3 px-2 font-display text-base rounded-bl">New Contract Total</td>
                  <td className="py-3 px-2 font-display text-base text-right rounded-br">{fmt(newContractTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms */}
          <div
            className="p-4 rounded border-l-4 bg-background"
            style={{ borderColor: brandConfig.color }}
          >
            <p className="font-sans text-sm text-muted-foreground italic">
              "Work will not begin until this change order is approved in writing by the client."
            </p>
          </div>

          {/* Client Signature Block */}
          <div className="border-t border-border pt-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Client Approval</p>
            <p className="font-sans text-sm text-muted-foreground mb-4">
              By checking the box and entering your name below, you authorize {brandConfig.name} to proceed with the above change order and acknowledge the updated contract total of <strong>{fmt(newContractTotal)}</strong>.
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientApprovalChecked}
                  onChange={e => setClientApprovalChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-accent"
                />
                <span className="font-sans text-sm text-foreground">
                  I approve this change order and authorize work to proceed.
                </span>
              </label>

              <div>
                <Label className="font-sans text-sm">Typed Name (legal signature)</Label>
                <Input
                  value={clientSignatureName}
                  onChange={e => setClientSignatureName(e.target.value)}
                  placeholder={clientName || "Enter full name"}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Date</p>
                  <p className="font-sans text-sm text-foreground mt-1">{approvalDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white font-sans"
          disabled={!clientApprovalChecked || !clientSignatureName.trim()}
          onClick={onApprove}
        >
          <CheckCircle className="w-4 h-4" /> Approve Change Order
        </Button>
        <Button variant="outline" className="gap-2 font-sans" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print
        </Button>
        <Button
          variant="outline"
          className="gap-2 font-sans text-destructive hover:text-destructive"
          onClick={onReject}
        >
          <X className="w-4 h-4" /> Reject
        </Button>
      </div>
    </div>
  );
}
