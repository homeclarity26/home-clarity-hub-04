import { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "home", label: "Home" },
    { id: "report", label: "Report" },
    { id: "projects", label: "Projects" },
    { id: "payments", label: "Payments" },
    { id: "contacts", label: "Contacts" },
    { id: "schedule", label: "Schedule" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-card shadow-hbc-sm z-50 flex items-center justify-between px-6 md:px-20">
      <a href="/" className="font-display text-2xl text-foreground no-underline">
        HBC
      </a>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-mono text-[11px] uppercase tracking-[0.15em] py-2 border-none bg-transparent cursor-pointer transition-colors relative ${
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-300 ${
                activeTab === tab.id ? "w-full" : "w-0"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 bg-transparent border-none cursor-pointer"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* User Section */}
      <div className="hidden md:flex items-center gap-4">
        <div className="w-10 h-10 rounded-full border border-foreground flex items-center justify-center font-display text-sm text-foreground">
          JS
        </div>
        <a href="#" className="font-mono text-[11px] text-muted-foreground no-underline">
          Logout
        </a>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-50 md:hidden">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="font-display text-2xl text-foreground">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl text-foreground bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground py-4 bg-transparent border-none cursor-pointer"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
