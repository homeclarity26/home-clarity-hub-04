import { useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { Switch } from "@/components/ui/switch";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReportPageSelect: (pageId: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { profile, isCreator, signOut } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

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
      <button
        onClick={() => onTabChange("home")}
        className="font-display text-2xl text-foreground bg-transparent border-none cursor-pointer"
      >
        HBC
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`font-mono text-[11px] uppercase tracking-[0.15em] py-2 border-none bg-transparent cursor-pointer transition-colors relative ${
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
        {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
      </button>

      {/* User Section */}
      <div className="hidden md:flex items-center gap-4">
        {isCreator && (
          <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${editMode ? "text-accent" : "text-muted-foreground"}`}>
              Edit
            </span>
            <Switch checked={editMode} onCheckedChange={toggleEditMode} className="data-[state=checked]:bg-accent" />
          </div>
        )}
        {isCreator && (
          <button
            onClick={() => (window.location.href = "/admin")}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full border border-foreground flex items-center justify-center font-display text-sm text-foreground">
          {profile?.avatar_initials || "??"}
        </div>
        <button onClick={signOut} className="font-mono text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground">
          Logout
        </button>
      </div>

      {/* Mobile Full-Screen Menu */}
      <div
        className={`fixed inset-0 bg-background z-[300] md:hidden flex flex-col overflow-y-auto transition-transform duration-400 ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="font-display text-2xl text-foreground">Menu</h2>
          <button onClick={() => setMobileMenuOpen(false)} className="text-2xl text-foreground bg-transparent border-none cursor-pointer">
            ×
          </button>
        </div>

        {isCreator && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Edit Mode</span>
            <Switch checked={editMode} onCheckedChange={toggleEditMode} className="data-[state=checked]:bg-accent" />
          </div>
        )}

        <div className="flex-1 p-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileMenuOpen(false); }}
              className="block w-full text-left font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground py-4 bg-transparent border-none cursor-pointer hover:text-foreground"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center">
          <button
            onClick={() => { onTabChange("home"); setMobileMenuOpen(false); }}
            className="font-mono text-[11px] text-foreground bg-transparent border-none cursor-pointer"
          >
            ← Back to Portal
          </button>
          <button
            onClick={() => { signOut(); setMobileMenuOpen(false); }}
            className="font-mono text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
