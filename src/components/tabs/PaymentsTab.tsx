import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PaymentsTab = () => {
  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Payments & Financial History</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Manage your account and review transaction history with Hometown Builders Club.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Current Balance</h2>
          <p className="font-display text-4xl text-foreground mb-4">$4,500</p>
          <p className="text-sm text-muted-foreground mb-6">
            Home Clarity Report — Initial Deposit
          </p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Make Payment
          </Button>
        </Card>

        <Card className="md:col-span-1 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Transaction History</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Date</th>
                <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Description</th>
                <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Amount</th>
                <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-sm text-foreground py-5 border-b border-border">Jan 15, 2026</td>
                <td className="text-sm text-foreground py-5 border-b border-border">Home Clarity Report — Initial Deposit</td>
                <td className="text-sm text-foreground py-5 border-b border-border text-right">$4,500</td>
                <td className="text-sm py-5 border-b border-border text-right">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Pending
                  </span>
                </td>
              </tr>
              <tr>
                <td className="text-sm text-foreground py-5 border-b border-border">Jan 10, 2026</td>
                <td className="text-sm text-foreground py-5 border-b border-border">Consultation Fee</td>
                <td className="text-sm text-foreground py-5 border-b border-border text-right">$500</td>
                <td className="text-sm py-5 border-b border-border text-right">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-foreground" />
                    Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsTab;
