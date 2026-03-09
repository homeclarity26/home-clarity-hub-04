import { Card } from "@/components/ui/card";

const ContactsTab = () => {
  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Your Home Team</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Direct contact information for Hometown Builders Club and approved vendor partners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">Hometown Builders Club</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex items-start gap-6">
              <div className="w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center font-display text-xl text-primary-foreground flex-shrink-0">
                AK
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-2">Adam Kinney</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                  Founder & Lead Advisor
                </p>
                <a href="mailto:adam@hbc.com" className="text-sm text-foreground no-underline block mb-2 hover:text-accent transition-colors">
                  adam@hbc.com
                </a>
                <a href="tel:5550123456" className="text-sm text-foreground no-underline block hover:text-accent transition-colors">
                  (555) 012-3456
                </a>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center font-display text-xl text-primary-foreground flex-shrink-0">
                HB
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-2">HBC Support</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                  Client Services
                </p>
                <a href="mailto:support@hbc.com" className="text-sm text-foreground no-underline block mb-2 hover:text-accent transition-colors">
                  support@hbc.com
                </a>
                <a href="tel:5550199999" className="text-sm text-foreground no-underline block hover:text-accent transition-colors">
                  (555) 019-9999
                </a>
              </div>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">Approved Vendor Partners</h2>
          <p className="text-base text-foreground mb-8">
            Your Home Clarity Report will recommend specific vendors for each project phase. Once
            approved, their contact information will appear here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex items-start gap-6 opacity-50">
              <div className="w-[60px] h-[60px] rounded-full bg-muted flex items-center justify-center font-display text-xl text-muted-foreground flex-shrink-0">
                GC
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-2">General Contractor</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  To be assigned
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 opacity-50">
              <div className="w-[60px] h-[60px] rounded-full bg-muted flex items-center justify-center font-display text-xl text-muted-foreground flex-shrink-0">
                HV
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-2">HVAC Specialist</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  To be assigned
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactsTab;
