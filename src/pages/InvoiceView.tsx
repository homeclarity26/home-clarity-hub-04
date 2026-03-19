import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Download, Printer } from "lucide-react";
import { format } from "date-fns";

const THEMES: Record<string, Record<string, string>> = {
  navy: { "--bg-hero": "#1a2744", "--bg-section": "#ffffff", "--accent": "#c9a96e", "--text-hero": "#ffffff", "--text-body": "#2d3748" },
  slate: { "--bg-hero": "#334155", "--bg-section": "#ffffff", "--accent": "#0ea5e9", "--text-hero": "#ffffff", "--text-body": "#1e293b" },
  forest: { "--bg-hero": "#1a3a2a", "--bg-section": "#ffffff", "--accent": "#84cc16", "--text-hero": "#ffffff", "--text-body": "#1c2b1e" },
  midnight: { "--bg-hero": "#0f0f1a", "--bg-section": "#111827", "--accent": "#6366f1", "--text-hero": "#ffffff", "--text-body": "#e2e8f0" },
  warm: { "--bg-hero": "#7c3d1e", "--bg-section": "#ffffff", "--accent": "#e07b39", "--text-hero": "#ffffff", "--text-body": "#3d1a08" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#94a3b8", text: "#fff" },
  sent: { bg: "#3b82f6", text: "#fff" },
  paid: { bg: "#22c55e", text: "#fff" },
  overdue: { bg: "#ef4444", text: "#fff" },
  partially_paid: { bg: "#f59e0b", text: "#fff" },
  viewed: { bg: "#8b5cf6", text: "#fff" },
};

const InvoiceView = () => {
  const { token } = useParams<{ token: string }>();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-view", token],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await (supabase.from("invoices") as any).select("*").eq("invoice_token", token).single();
      return data;
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["invoice-view-lines", invoice?.id],
    enabled: !!invoice?.id,
    queryFn: async () => {
      const { data } = await (supabase.from("invoice_line_items") as any).select("*").eq("invoice_id", invoice.id).order("sort_order");
      return data || [];
    },
  });

  const { data: property } = useQuery({
    queryKey: ["invoice-property", invoice?.property_id],
    enabled: !!invoice?.property_id,
    queryFn: async () => {
      const { data } = await (supabase.from("properties") as any).select("property_name, address, city, state, zip, client_user_id").eq("id", invoice.property_id).single();
      return data;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ["invoice-client", property?.client_user_id],
    enabled: !!property?.client_user_id,
    queryFn: async () => {
      const { data } = await (supabase.from("profiles") as any).select("full_name, email, phone").eq("user_id", property.client_user_id).single();
      return data;
    },
  });

  const theme = THEMES[invoice?.invoice_theme || "navy"] || THEMES.navy;
  const statusStyle = STATUS_STYLES[invoice?.status || "draft"] || STATUS_STYLES.draft;

  // Track view
  useEffect(() => {
    if (!invoice?.id) return;
    (supabase.from("invoices") as any).update({
      invoice_view_count: (invoice.invoice_view_count || 0) + 1,
    }).eq("id", invoice.id).then(() => {});
  }, [invoice?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEMES.navy["--bg-hero"] }}>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEMES.navy["--bg-hero"] }}>
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-white/60">This link may be invalid.</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const propertyAddress = property ? `${property.address || ""}${property.city ? `, ${property.city}` : ""}${property.state ? ` ${property.state}` : ""}` : "";

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f0" }}>
      <style>{`
        @keyframes inv-fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .inv-animate { animation: inv-fade-up 0.6s ease-out forwards; }
        .inv-animate-d1 { animation: inv-fade-up 0.6s ease-out 0.1s forwards; opacity: 0; }
        .inv-animate-d2 { animation: inv-fade-up 0.6s ease-out 0.2s forwards; opacity: 0; }
        .inv-animate-d3 { animation: inv-fade-up 0.6s ease-out 0.3s forwards; opacity: 0; }
      `}</style>

      {/* ═══ STICKY HEADER ═══ */}
      <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 shadow-sm" style={{ background: `${theme["--bg-hero"]}f5`, backdropFilter: "blur(12px)" }}>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: theme["--accent"] }}>
          Invoice
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-medium" style={{ color: theme["--text-hero"] }}>
            {invoice.invoice_number || "Draft"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: statusStyle.bg, color: statusStyle.text }}>
            {invoice.status?.replace("_", " ")}
          </span>
        </div>
        {!isPaid && Number(invoice.balance_due) > 0 && (
          <button
            className="px-4 py-1.5 text-xs font-bold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
            style={{ background: theme["--accent"], color: "#fff" }}
            onClick={() => {
              if (invoice.stripe_payment_link_url) window.open(invoice.stripe_payment_link_url, "_blank");
            }}
          >
            <CreditCard className="w-3.5 h-3.5" /> Pay Now {fmt(Number(invoice.balance_due))}
          </button>
        )}
        {isPaid && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
            <Check className="w-3 h-3" /> Paid
          </Badge>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative h-[40vh] min-h-[280px] flex items-center justify-center overflow-hidden" style={{ background: theme["--bg-hero"] }}>
        {(invoice.invoice_cover_image_url) && (
          <div className="absolute inset-0">
            <img src={invoice.invoice_cover_image_url} alt="" className="w-full h-full object-cover opacity-20" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, ${theme["--bg-hero"]} 100%)` }} />
        <div className="relative z-10 text-center px-6">
          <h1 className="inv-animate text-2xl md:text-4xl font-bold" style={{ color: theme["--text-hero"] }}>
            {invoice.title || invoice.description}
          </h1>
          <div className="inv-animate-d1 mt-4 space-y-1">
            {propertyAddress && <p className="text-sm" style={{ color: `${theme["--text-hero"]}88` }}>{propertyAddress}</p>}
            <p className="text-sm" style={{ color: `${theme["--text-hero"]}66` }}>
              {invoice.invoice_number && `${invoice.invoice_number} · `}
              Issue: {invoice.issue_date ? format(new Date(invoice.issue_date), "MMM d, yyyy") : "—"}
              {invoice.due_date && ` · Due: ${format(new Date(invoice.due_date), "MMM d, yyyy")}`}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ BODY ═══ */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10 space-y-6 pb-16">
        {/* Bill To / Bill From */}
        <div className="inv-animate-d2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme["--bg-section"] }}>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme["--accent"] }}>Bill To</p>
            <p className="text-sm font-semibold" style={{ color: theme["--text-body"] }}>{clientProfile?.full_name || "Client"}</p>
            {propertyAddress && <p className="text-xs mt-1 opacity-70" style={{ color: theme["--text-body"] }}>{propertyAddress}</p>}
            {clientProfile?.email && <p className="text-xs mt-0.5 opacity-60" style={{ color: theme["--text-body"] }}>{clientProfile.email}</p>}
          </div>
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme["--bg-section"] }}>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme["--accent"] }}>Bill From</p>
            <p className="text-sm font-semibold" style={{ color: theme["--text-body"] }}>Home Clarity Hub</p>
            <p className="text-xs mt-1 opacity-60" style={{ color: theme["--text-body"] }}>Your trusted home advisor</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="inv-animate-d3 rounded-2xl overflow-hidden shadow-sm" style={{ background: theme["--bg-section"] }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme["--accent"]}22` }}>
                <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase py-4 px-6" style={{ color: theme["--accent"] }}>Description</th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase py-4 px-4" style={{ color: theme["--accent"] }}>Qty</th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase py-4 px-4" style={{ color: theme["--accent"] }}>Price</th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase py-4 px-6" style={{ color: theme["--accent"] }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li: any, i: number) => (
                <tr key={li.id} style={{ borderBottom: `1px solid ${theme["--accent"]}11` }}>
                  <td className="py-3.5 px-6 text-sm" style={{ color: theme["--text-body"] }}>{li.description}</td>
                  <td className="py-3.5 px-4 text-sm font-mono text-right opacity-70" style={{ color: theme["--text-body"] }}>{li.quantity}</td>
                  <td className="py-3.5 px-4 text-sm font-mono text-right opacity-70" style={{ color: theme["--text-body"] }}>{fmt(Number(li.unit_price))}</td>
                  <td className="py-3.5 px-6 text-sm font-mono text-right font-medium" style={{ color: theme["--text-body"] }}>{fmt(Number(li.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-6 py-5" style={{ borderTop: `2px solid ${theme["--accent"]}22` }}>
            <div className="max-w-xs ml-auto space-y-1.5">
              <div className="flex justify-between text-sm" style={{ color: theme["--text-body"] }}>
                <span className="opacity-60">Subtotal</span>
                <span className="font-mono">{fmt(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-sm" style={{ color: theme["--text-body"] }}>
                  <span className="opacity-60">Tax</span>
                  <span className="font-mono">{fmt(Number(invoice.tax))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-lg font-bold" style={{ borderTop: `1px solid ${theme["--accent"]}33`, color: theme["--text-body"] }}>
                <span>Balance Due</span>
                <span className="font-mono" style={{ color: isPaid ? "#22c55e" : theme["--accent"] }}>
                  {isPaid ? "$0.00" : fmt(Number(invoice.balance_due))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {!isPaid && Number(invoice.balance_due) > 0 ? (
          <div className="rounded-2xl p-8 text-center shadow-lg" style={{ background: theme["--accent"], color: "#fff" }}>
            <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-80" />
            <p className="text-xl font-bold mb-1">{fmt(Number(invoice.balance_due))}</p>
            <p className="text-sm opacity-80 mb-5">Pay securely online with card or ACH</p>
            <button
              className="px-8 py-3 bg-white text-sm font-bold rounded-full shadow-lg transition-transform hover:scale-105"
              style={{ color: theme["--accent"] }}
              onClick={() => {
                if (invoice.stripe_payment_link_url) window.open(invoice.stripe_payment_link_url, "_blank");
                else alert("Payment link not yet configured. Contact your advisor.");
              }}
            >
              Pay Now →
            </button>
          </div>
        ) : isPaid ? (
          <div className="rounded-2xl p-8 text-center bg-green-50 border-2 border-green-200">
            <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-700">Paid in Full</p>
            {invoice.paid_date && <p className="text-sm text-green-600 mt-1">Payment received {format(new Date(invoice.paid_date), "MMMM d, yyyy")}</p>}
          </div>
        ) : null}

        {/* Memo */}
        {invoice.invoice_memo && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme["--bg-section"], borderLeft: `3px solid ${theme["--accent"]}` }}>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: theme["--accent"] }}>Memo</p>
            <p className="text-sm leading-relaxed" style={{ color: theme["--text-body"] }}>{invoice.invoice_memo}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8">
          {invoice.invoice_footer_text && (
            <p className="text-sm mb-4" style={{ color: `${theme["--text-body"]}88` }}>{invoice.invoice_footer_text}</p>
          )}
          <p className="text-[10px] tracking-widest uppercase" style={{ color: `${theme["--text-body"]}44` }}>
            Powered by HBC
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
