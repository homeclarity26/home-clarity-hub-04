import { useState, useRef, useEffect } from "react";
import { Menu, Settings, Pencil, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/portal/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { Switch } from "@/components/ui/switch";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PropertySelector from "@/components/PropertySelector";
import VoiceNavButton from "@/components/portal/VoiceNavButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReportPageSelect: (pageId: string) => void;
  propertyId?: string;
}

const primaryTabs = [
  { id: "home", label: "Home" },
  { id: "report", label: "Report" },
  { id: "projects", label: "Projects" },
  { id: "messages", label: "Messages" },
];

const moreTabs = [
  { id: "photos", label: "Photos" },
  { id: "equipment", label: "Equipment" },
  { id: "documents", label: "Documents" },
  { id: "schedule", label: "Schedule" },
  { id: "payments", label: "Payments" },
  { id: "estimates", label: "Estimates" },
  { id: "services", label: "Services" },
  { id: "contacts", label: "Contacts" },
  { id: "billing", label: "Billing" },
  { id: "refer", label: "Refer" },
];

const allTabs = [...primaryTabs, ...moreTabs];

const Header = ({ activeTab, onTabChange, propertyId }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const { profile, isCreator, signOut } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  const isMoreActive = moreTabs.some((t) => t.id === activeTab);

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-card shadow-hbc-sm z-50 flex items-center justify-between px-6 md:px-20">
      <button
        onClick={() => onTabChange("home")}
        className="font-display text-2xl text-foreground bg-transparent border-none cursor-pointer"
      >
        HBC
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 ml-8 items-center">
        {primaryTabs.map((tab) => (
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

        {/* More dropdown */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((p) => !p)}
            className={`font-mono text-[11px] uppercase tracking-[0.15em] py-2 border-none bg-transparent cursor-pointer transition-colors flex items-center gap-1 relative ${
              isMoreActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            More
            <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-300 ${
                isMoreActive ? "w-full" : "w-0"
              }`}
            />
          </button>
          {moreOpen && (
            <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[160px] z-50">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setMoreOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors border-none cursor-pointer ${
                    activeTab === tab.id ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu — Sheet slide-in */}
      <div className="md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="font-display text-xl text-foreground">Menu</h2>
              </div>

              {isCreator && (
                <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Edit Mode</span>
                  <Switch checked={editMode} onCheckedChange={toggleEditMode} className="data-[state=checked]:bg-accent" />
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-3 py-2">
                <p className="px-3 pt-3 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">Main</p>
                {primaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { onTabChange(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-3 rounded-md font-sans text-sm transition-colors border-none cursor-pointer min-h-[44px] ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                <p className="px-3 pt-5 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">More</p>
                {moreTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { onTabChange(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-3 rounded-md font-sans text-sm transition-colors border-none cursor-pointer min-h-[44px] ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-foreground flex items-center justify-center font-display text-xs text-foreground">
                    {profile?.avatar_initials || "??"}
                  </div>
                  <span className="font-sans text-sm text-foreground">{profile?.full_name || "User"}</span>
                </div>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="font-mono text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground"
                >
                  Logout
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* User Section */}
      <div className="hidden md:flex items-center ml-6 flex-shrink-0 gap-3">
        {!isCreator && <PropertySelector />}
        {!isCreator && propertyId && (
          <VoiceNavButton
            propertyId={propertyId}
            currentPage={activeTab}
            onNavigate={(tab) => onTabChange(tab)}
          />
        )}
        {!isCreator && propertyId && (
          <NotificationBell propertyId={propertyId} onNavigate={(tab) => onTabChange(tab)} />
        )}
        <ThemeToggle />
        {isCreator && (
          <button
            onClick={toggleEditMode}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${
              editMode ? "bg-accent/20 text-accent" : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
            title={editMode ? "Exit edit mode" : "Enter edit mode"}
          >
            <Pencil className="w-4 h-4" />
          </button>
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
    </header>
  );
};

export default Header;
