import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";

const CRMFinancialTab = ({ propertyId, invoices }: { propertyId: string | null | undefined; invoices: any[] | undefined }) => {
  const totalBilled = (invoices || []).reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = (invoices || []).filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const lastPayment = (invoices || []).filter(i => i.paid_date).sort((a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime())[0];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider mb-1">Total Billed</p>
          <p className="text-xl font-sans font-bold text-foreground">${totalBilled.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-xl font-sans font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider mb-1">Outstanding</p>
          <p className={`text-xl font-sans font-bold ${outstanding > 0 ? "text-destructive" : "text-foreground"}`}>${outstanding.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider mb-1">Last Payment</p>
          <p className="text-xl font-sans font-bold text-foreground">{lastPayment?.paid_date ? format(new Date(lastPayment.paid_date), "MMM d") : "—"}</p>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-sans text-xs">Invoice</TableHead>
              <TableHead className="font-sans text-xs">Amount</TableHead>
              <TableHead className="font-sans text-xs">Status</TableHead>
              <TableHead className="font-sans text-xs">Due Date</TableHead>
              <TableHead className="font-sans text-xs">Paid Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoices || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground font-sans py-8">No invoices yet</TableCell></TableRow>
            ) : (invoices || []).map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-sans text-sm">{inv.title || inv.invoice_number || "Invoice"}</TableCell>
                <TableCell className="font-sans text-sm font-medium">${(inv.amount || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] font-sans ${inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : inv.status === "overdue" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-sans text-xs text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell className="font-sans text-xs text-muted-foreground">{inv.paid_date ? format(new Date(inv.paid_date), "MMM d, yyyy") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CRMFinancialTab;
