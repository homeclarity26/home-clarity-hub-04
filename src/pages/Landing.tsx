import { Link } from "react-router-dom";
import { Shield, ClipboardCheck, TrendingUp, Home, Calendar, FileText, ChevronRight, Star, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/landing-hero.jpg";
import advisorImg from "@/assets/landing-advisor.jpg";

const stats = [
  { value: "77%", label: "of homeowners miss critical maintenance" },
  { value: "$12K", label: "average cost of deferred repairs" },
  { value: "3×", label: "ROI on proactive home care" },
];

const features = [
  { icon: ClipboardCheck, title: "Whole-Home Assessment", desc: "Every system inspected and rated — roof to foundation, HVAC to electrical — with clear condition scores." },
  { icon: TrendingUp, title: "Financial Roadmap", desc: "Know exactly what to spend and when. Tiered pricing options so you control the investment." },
  { icon: Home, title: "Digital Home Registry", desc: "Every appliance, warranty, and service date in one place. Never lose track of equipment again." },
  { icon: Calendar, title: "Maintenance Schedule", desc: "Seasonal reminders and service tracking so nothing falls through the cracks." },
  { icon: FileText, title: "Action Plan", desc: "Prioritized recommendations ranked by urgency so you always know what matters most." },
  { icon: Shield, title: "Ongoing Stewardship", desc: "A dedicated advisor who knows your home inside and out — year after year." },
];

const steps = [
  { num: "01", title: "Book Your Assessment", desc: "We visit your home and inspect every major system — inside and out." },
  { num: "02", title: "Receive Your Report", desc: "Get a detailed digital report with condition ratings, photos, and recommendations." },
  { num: "03", title: "Access Your Portal", desc: "Log into your private portal to view your report, track projects, and message your advisor." },
  { num: "04", title: "Stay Ahead", desc: "We help you prioritize, budget, and coordinate — so your home stays healthy." },
];

const testimonials = [
  { quote: "I had no idea my HVAC was 2 years past its service date. This saved me from a $6,000 emergency repair.", author: "Sarah M.", role: "Homeowner, Akron" },
  { quote: "Finally, someone who looks at the whole picture — not just one system. The financial roadmap changed how we budget for our home.", author: "James & Linda R.", role: "Homeowners, Hudson" },
  { quote: "The portal is incredible. I can see everything about my home in one place and know exactly what's coming next.", author: "Michael T.", role: "Homeowner, Cuyahoga Falls" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/welcome" className="font-display text-xl text-foreground tracking-tight">
            Hometown Builders Club
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-widest">
                Sign In
              </Button>
            </Link>
            <a href="#book">
              <Button size="sm" className="font-mono text-xs uppercase tracking-widest">
                Book Assessment
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Beautiful maintained home at golden hour" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
              Home Stewardship for Summit County
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary-foreground leading-[1.1] mb-6">
              Your home deserves a plan — not just repairs.
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-md">
              Most homeowners react to problems. We help you get ahead of them — with a comprehensive assessment, a clear financial roadmap, and an advisor who knows your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#book">
                <Button size="lg" className="font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
                  Book Your Assessment <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="font-mono text-xs uppercase tracking-widest w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Stats ── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl lg:text-5xl text-accent mb-2">{s.value}</div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-primary-foreground/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get ── */}
      <section className="py-24 bg-secondary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">What You Get</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">
              Everything your home needs — in one place
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-lg p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">How It Works</p>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-12">
                Four steps to a healthier home
              </h2>
              <div className="space-y-8">
                {steps.map((s) => (
                  <div key={s.num} className="flex gap-5">
                    <div className="font-mono text-2xl text-accent/40 font-semibold shrink-0 w-10">{s.num}</div>
                    <div>
                      <h3 className="font-display text-lg text-foreground mb-1">{s.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
              <img src={advisorImg} alt="Home advisor reviewing property dashboard" loading="lazy" width={800} height={600} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">What Homeowners Say</p>
            <h2 className="font-display text-3xl sm:text-4xl">Peace of mind is priceless</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-8">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
                </div>
                <p className="text-primary-foreground/90 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground">{t.author}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal Preview ── */}
      <section className="py-24 bg-secondary">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">Your Private Portal</p>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">
            Everything about your home — at your fingertips
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-12">
            Access your detailed report, track maintenance, manage projects, view invoices, and message your advisor — anytime, from any device.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {["Condition Ratings", "Equipment Registry", "Financial Roadmap", "Action Plan", "Project Tracking", "Document Vault", "Advisor Chat", "Maintenance Schedule"].map(f => (
              <div key={f} className="bg-card rounded-lg p-4 shadow-[var(--shadow-sm)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-mono text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="book" className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">Get Started</p>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">
            Ready to take control of your home?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Book a no-pressure assessment. We'll walk your property, deliver a comprehensive report, and give you a clear plan forward.
          </p>
          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-lg)] border border-border">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <a href="tel:+13305551234" className="flex items-center gap-2 text-foreground font-mono text-sm">
                <Phone className="w-4 h-4 text-accent" />
                (330) 555-1234
              </a>
              <span className="hidden sm:block text-muted-foreground">·</span>
              <a href="mailto:adam@hometownbuildersclub.com" className="font-mono text-sm text-foreground hover:text-accent transition-colors">
                adam@hometownbuildersclub.com
              </a>
            </div>
            <a href="mailto:adam@hometownbuildersclub.com?subject=Home Assessment Request&body=Hi Adam, I'd like to schedule a home assessment. My address is:">
              <Button size="lg" className="font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
                Request Your Assessment <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <p className="mt-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Serving Summit County, OH
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg">Hometown Builders Club</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50 mt-1">
              Home Stewardship for Summit County
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50 hover:text-primary-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50 hover:text-primary-foreground transition-colors">Terms</Link>
            <Link to="/login" className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50 hover:text-primary-foreground transition-colors">Client Login</Link>
          </div>
          <p className="font-mono text-[10px] text-primary-foreground/30">© 2026 Hometown Builders Club</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
