import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
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
        <h1 className="font-display text-3xl text-foreground">Privacy Policy</h1>
        <div className="prose prose-sm font-sans text-muted-foreground space-y-4">
          <p>Home Clarity Hub ("HBC") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
          <h2 className="font-display text-lg text-foreground">Information We Collect</h2>
          <p>We collect information you provide directly, such as your name, email address, property details, and communications with your home advisor. We also collect usage data to improve the platform experience.</p>
          <h2 className="font-display text-lg text-foreground">How We Use Information</h2>
          <p>Your information is used to deliver home stewardship services, generate reports, communicate with your advisor, and improve our platform. We do not sell your personal information to third parties.</p>
          <h2 className="font-display text-lg text-foreground">Data Security</h2>
          <p>We use industry-standard encryption and security measures to protect your data. Access to your property information is restricted to your assigned advisor and authorized HBC personnel.</p>
          <h2 className="font-display text-lg text-foreground">Contact</h2>
          <p>For questions about this privacy policy, please contact your HBC advisor or email us at privacy@homeclarityhub.com.</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Last updated: March 2026</p>
      </main>
    </div>
  );
};

export default Privacy;
