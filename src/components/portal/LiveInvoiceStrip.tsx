import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

interface Invoice {
  id: string;
  title: string | null;
  invoice_number: string | null;
  status: string;
  balance_due: number;
  total: number;
  due_date: string | null;
  issue_date: string | null;
}

interface LiveInvoiceStripProps {
  propertyId: string;
  onNavigate: (tab: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function getDueDateStyle(dueDateStr: string | null): {
  icon: React.ReactNode;
  colorClass: string;
  label: string;
} {
  if (!dueDateStr) {
    return {
      icon: <Clock className="w-4 h-4" />,
      colorClass: "text-muted-foreground",
      label: "No due date",
    };
  }
  const dueDate = new Date(dueDateStr);
  const daysUntil = differenceInDays(dueDate, new Date());

  if (isPast(dueDate) && daysUntil < 0) {
    return {
      icon: <AlertCircle className="w-4 h-4" />,
      colorClass: "text-[#B5450B]",
      label: `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""}`,
    };
  }
  if (daysUntil <= 7) {
    return {
      icon: <Clock className="w-4 h-4" />,
      colorClass: "text-amber-600",
      label: `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} (${format(dueDate, "MMM d")})`,
    };
  }
  return {
    icon: <CheckCircle2 className="w-4 h-4" />,
    colorClass: "text-green-600",
    label: `Due ${format(dueDate, "MMM d, yyyy")}`,
  };
}

const LiveInvoiceStrip = ({ propertyId, onNavigate }: LiveInvoiceStripProps) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    const { data, error } = await supabase.from("invoices")
      .select("id, title, invoice_number, status, balance_due, total, due_date, issue_date")
      .eq("property_id", propertyId)
      .not("status", "eq", "paid")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setInvoice(data[0]);
    } else {
      setInvoice(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setLoading(false);
      return;
    }
    fetchInvoice();

    // Real-time subscription
    const channel = supabase
      .channel("invoice-updates")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "invoices",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status !== "paid") {
            setInvoice(payload.new as Invoice);
          } else if (payload.new && payload.new.status === "paid") {
            // Invoice was just paid, re-fetch to get next unpaid one
            fetchInvoice();
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "invoices",
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          fetchInvoice();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  if (loading || !invoice) return null;

  const { icon, colorClass, label } = getDueDateStyle(invoice.due_date);
  const invoiceTitle = invoice.title || (invoice.invoice_number ? `Invoice #${invoice.invoice_number}` : "Invoice");
  const amount = invoice.balance_due ?? invoice.total ?? 0;

  return (
    <div className="bg-card rounded-lg border border-border shadow-hbc-sm px-5 py-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
      {/* Icon */}
      <div className="shrink-0">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-medium text-foreground truncate">{invoiceTitle}</p>
        <div className={`flex items-center gap-1.5 mt-0.5 font-mono text-[11px] ${colorClass}`}>
          {icon}
          <span>{label}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="font-mono text-base font-semibold text-foreground">{fmt(amount)}</p>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Balance Due</p>
      </div>

      {/* Pay Now */}
      <button
        onClick={() => onNavigate("payments")}
        className="shrink-0 flex items-center gap-1.5 font-sans text-sm font-medium text-white bg-[#B5450B] hover:bg-[#B5450B]/90 rounded-md px-4 py-2 transition-colors"
      >
        Pay Now
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default LiveInvoiceStrip;
