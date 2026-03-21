import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 bg-card shadow-hbc-sm flex items-center px-6 md:px-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>
      <main className="max-w-3xl mx-auto px-6 md:px-20 py-16 space-y-8">
        <h1 className="font-display text-3xl text-foreground">Terms of Service</h1>
        <div className="prose prose-sm font-sans text-muted-foreground space-y-4">
          <p>By using Home Clarity Hub ("HBC"), you agree to these terms. Please read them carefully.</p>
          <h2 className="font-display text-lg text-foreground">Service Description</h2>
          <p>HBC provides a home stewardship platform connecting homeowners with professional home consultants. Services include home condition reporting, maintenance tracking, project management, and advisory communications.</p>
          <h2 className="font-display text-lg text-foreground">User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for providing accurate property information. You agree not to misuse the platform or attempt unauthorized access.</p>
          <h2 className="font-display text-lg text-foreground">Advisor Services</h2>
          <p>Reports and recommendations provided through HBC are advisory in nature. HBC advisors are not licensed contractors, engineers, or inspectors unless explicitly stated. Always consult qualified professionals for structural or safety concerns.</p>
          <h2 className="font-display text-lg text-foreground">Limitation of Liability</h2>
          <p>HBC provides the platform "as is" and is not liable for decisions made based on report content. Cost estimates are approximate and may vary from actual contractor quotes.</p>
          <h2 className="font-display text-lg text-foreground">Contact</h2>
          <p>For questions about these terms, please contact your HBC advisor or email us at legal@homeclarityhub.com.</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Last updated: March 2026</p>
      </main>
    </div>
  );
};

export default Terms;
