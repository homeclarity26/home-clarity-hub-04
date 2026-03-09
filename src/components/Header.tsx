import { useState, useRef } from "react";
import { Menu, X, Settings } from "lucide-react";
import { reportGroups, reportPages } from "@/data/reportContent";
import { useAuth } from "@/contexts/AuthContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { Switch } from "@/components/ui/switch";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReportPageSelect: (pageId: string) => void;
}

const Header = ({ activeTab, onTabChange, onReportPageSelect }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);
  const cascadeTimeout = useRef<ReturnType<typeof setTimeout>>();
  
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

  const handleReportHoverEnter = () => {
    clearTimeout(cascadeTimeout.current);
  };

  const handleReportHoverLeave = () => {
    cascadeTimeout.current = setTimeout(() => setHoveredGroup(null), 200);
  };

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
          <div
            key={tab.id}
            className="relative"
            onMouseEnter={tab.id === "report" ? handleReportHoverEnter : undefined}
            onMouseLeave={tab.id === "report" ? handleReportHoverLeave : undefined}
          >
            <button
              onClick={() => {
                onTabChange(tab.id);
                if (tab.id !== "report") setHoveredGroup(null);
              }}
              onMouseEnter={tab.id === "report" ? () => setHoveredGroup(reportGroups[0].id) : undefined}
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

            {/* Cascade Dropdown for Report */}
            {tab.id === "report" && hoveredGroup !== null && (
              <div
                className="absolute top-[72px] left-1/2 -translate-x-1/2 flex z-[200] opacity-100 transition-opacity duration-200"
                onMouseEnter={handleReportHoverEnter}
                onMouseLeave={handleReportHoverLeave}
              >
                {/* Level 1 */}
                <div className="w-[320px] bg-card shadow-hbc-lg rounded-lg py-4">
                  {reportGroups.map((group) => (
                    <div
                      key={group.id}
                      onMouseEnter={() => setHoveredGroup(group.id)}
                      className={`px-6 py-4 cursor-pointer border-b border-border last:border-b-0 transition-all ${
                        hoveredGroup === group.id ? "border-l-[3px] border-l-accent pl-[21px]" : ""
                      }`}
                    >
                      <h3 className="font-display text-lg text-foreground">{group.title}</h3>
                    </div>
                  ))}
                </div>

                {/* Level 2 */}
                {hoveredGroup && (
                  <div className="w-[280px] ml-2 bg-card shadow-hbc-lg rounded-lg p-6">
                    <ul className="list-none p-0 m-0">
                      {reportGroups
                        .find((g) => g.id === hoveredGroup)
                        ?.pages.map((pageId) => {
                          const page = reportPages[pageId];
                          return (
                            <li key={pageId}>
                              <button
                                onClick={() => {
                                  onReportPageSelect(pageId);
                                  setHoveredGroup(null);
                                }}
                                className="block w-full text-left font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground bg-transparent border-none cursor-pointer py-3 transition-all hover:text-foreground hover:pl-3"
                              >
                                {page?.title || pageId}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
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
        {/* Edit Mode Toggle - Only for creators */}
        {isCreator && (
          <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${editMode ? "text-accent" : "text-muted-foreground"}`}>
              Edit
            </span>
            <Switch
              checked={editMode}
              onCheckedChange={toggleEditMode}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        )}
        
        {/* Admin icon for creators */}
        {isCreator && (
          <button 
            onClick={() => window.location.href = "/admin"}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <div className="w-10 h-10 rounded-full border border-foreground flex items-center justify-center font-display text-sm text-foreground">
          {profile?.avatar_initials || "??"}
        </div>
        <button
          onClick={signOut}
          className="font-mono text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground"
        >
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
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-2xl text-foreground bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Edit Mode Toggle for mobile */}
        {isCreator && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Edit Mode
            </span>
            <Switch
              checked={editMode}
              onCheckedChange={toggleEditMode}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        )}

        <div className="flex-1 p-6">
          {/* Main tabs */}
          {tabs.filter(t => t.id !== "report").map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground py-4 bg-transparent border-none cursor-pointer hover:text-foreground"
            >
              {tab.label}
            </button>
          ))}

          <div className="h-px bg-border my-6" />

          {/* Report sections */}
          <h3 className="font-display text-xl text-foreground mb-4">Report</h3>
          {reportGroups.map((group) => (
            <div key={group.id} className="mb-8">
              <button
                onClick={() =>
                  setExpandedMobileGroup(expandedMobileGroup === group.id ? null : group.id)
                }
                className="font-display text-lg text-foreground mb-2 bg-transparent border-none cursor-pointer block w-full text-left"
              >
                {group.title}
              </button>
              {(expandedMobileGroup === group.id || expandedMobileGroup === null) &&
                group.pages.map((pageId) => {
                  const page = reportPages[pageId];
                  return (
                    <button
                      key={pageId}
                      onClick={() => {
                        onReportPageSelect(pageId);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground leading-[40px] bg-transparent border-none cursor-pointer hover:text-foreground pl-4"
                    >
                      {page?.title || pageId}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center">
          <button
            onClick={() => {
              onTabChange("home");
              setMobileMenuOpen(false);
            }}
            className="font-mono text-[11px] text-foreground bg-transparent border-none cursor-pointer"
          >
            ← Back to Portal
          </button>
          <button
            onClick={() => {
              signOut();
              setMobileMenuOpen(false);
            }}
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
