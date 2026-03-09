import { Card } from "@/components/ui/card";

interface CreatorInfo {
  name: string;
  email?: string;
  phone?: string;
  initials: string;
}

interface ContactsTabProps {
  creator?: CreatorInfo;
}

const ContactsTab = ({ creator }: ContactsTabProps) => {
  const creatorName = creator?.name || "Your HBC Team";
  const creatorInitials = creator?.initials || "HB";
  const creatorEmail = creator?.email || "support@hbc.com";
  const creatorPhone = creator?.phone || "";

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
                {creatorInitials}
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-2">{creatorName}</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                  Lead Advisor
                </p>
                {creatorEmail && (
                  <a href={`mailto:${creatorEmail}`} className="text-sm text-foreground no-underline block mb-2 hover:text-accent transition-colors">
                    {creatorEmail}
                  </a>
                )}
                {creatorPhone && (
                  <a href={`tel:${creatorPhone.replace(/\D/g, "")}`} className="text-sm text-foreground no-underline block hover:text-accent transition-colors">
                    {creatorPhone}
                  </a>
                )}
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
