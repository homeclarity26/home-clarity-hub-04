import { User, Headset, Hammer, Thermometer, Zap, TreePine, Phone, MessageCircle, ChevronRight } from "lucide-react";

interface CreatorInfo {
  name: string;
  email?: string;
  phone?: string;
  initials: string;
}

interface ContactsTabProps {
  creator?: CreatorInfo;
  onTabChange?: (tab: string) => void;
}

const cardBase = "group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const vendorPlaceholders = [
  { title: "General Contractor", icon: Hammer },
  { title: "HVAC Specialist", icon: Thermometer },
  { title: "Electrician", icon: Zap },
  { title: "Landscaper", icon: TreePine },
];

const ContactsTab = ({ creator, onTabChange }: ContactsTabProps) => {
  const creatorName = creator?.name || "Adam Kinney";
  const creatorEmail = creator?.email || "support@hbc.com";
  const creatorPhone = creator?.phone || "";

  const handleAskQuestion = () => {
    const input = document.querySelector<HTMLInputElement>('footer input[type="text"]');
    if (input) { input.focus(); input.scrollIntoView({ behavior: "smooth" }); }
  };

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Your Home Team</h1>
        <p className="font-sans text-base text-muted-foreground">
          Direct contact information for Hometown Builders Club and approved vendor partners.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Row 1: HBC Team */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Your HBC Team</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardBase} border-l-[3px] border-l-accent cursor-default`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-display text-sm flex-shrink-0">
                  {creator?.initials || "AK"}
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground mb-0.5">{creatorName}</h2>
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Founder & Lead Advisor</p>
                </div>
              </div>
              {creatorEmail && (
                <a href={`mailto:${creatorEmail}`} className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors no-underline">
                  {creatorEmail}
                </a>
              )}
              {creatorPhone && (
                <a href={`tel:${creatorPhone.replace(/\D/g, "")}`} className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors no-underline">
                  {creatorPhone}
                </a>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 self-end transition-colors" />
            </div>

            <div className={`${cardBase} cursor-default`}>
              <Headset className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">HBC Support Team</h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Client Services</p>
              <a href="mailto:support@hbc.com" className="font-sans text-sm text-muted-foreground hover:text-accent transition-colors no-underline">
                support@hbc.com
              </a>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 self-end transition-colors" />
            </div>
          </div>
        </div>

        {/* Row 2: Approved Vendor Partners */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Approved Vendor Partners</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {vendorPlaceholders.map((vendor) => (
              <div key={vendor.title} className={`${cardBase} opacity-60 cursor-default`}>
                <div className="flex items-start justify-between w-full">
                  <vendor.icon className="w-5 h-5 text-accent" />
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    To be assigned
                  </span>
                </div>
                <h3 className="font-display text-xl text-foreground">{vendor.title}</h3>
                <p className="font-sans text-sm text-muted-foreground">Contact details will appear once assigned</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => onTabChange?.("schedule")} className={cardBase}>
              <Phone className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Schedule a Call</h2>
              <p className="font-sans text-sm text-muted-foreground">Book time with your HBC advisor</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            <button onClick={handleAskQuestion} className={cardBase}>
              <MessageCircle className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Ask a Question</h2>
              <p className="font-sans text-sm text-muted-foreground">AI-powered answers about your home</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsTab;
