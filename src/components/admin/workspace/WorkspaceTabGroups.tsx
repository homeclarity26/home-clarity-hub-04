import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type ClientTab = "overview" | "digital-twin" | "timeline" | "engagement" | "report" | "files" | "comments" | "projects" | "payments" | "equipment" | "schedule" | "vendors" | "messages" | "tasks" | "time" | "services" | "estimates" | "predictions" | "photos" | "referrals";

interface TabGroup {
  label: string;
  icon: string;
  tabs: { id: ClientTab; label: string }[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: "Property",
    icon: "🏠",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "digital-twin", label: "Digital Twin" },
      { id: "report", label: "Report" },
      { id: "photos", label: "Photos" },
      { id: "equipment", label: "Equipment" },
    ],
  },
  {
    label: "Work",
    icon: "🔨",
    tabs: [
      { id: "projects", label: "Projects" },
      { id: "tasks", label: "Tasks" },
      { id: "time", label: "Time" },
      { id: "schedule", label: "Schedule" },
      { id: "vendors", label: "Vendors" },
    ],
  },
  {
    label: "Financial",
    icon: "💰",
    tabs: [
      { id: "payments", label: "Payments" },
      { id: "estimates", label: "Estimates" },
      { id: "services", label: "Services" },
    ],
  },
  {
    label: "Communication",
    icon: "💬",
    tabs: [
      { id: "messages", label: "Messages" },
      { id: "comments", label: "Comments" },
      { id: "files", label: "Files" },
      { id: "timeline", label: "Timeline" },
      { id: "engagement", label: "Engagement" },
    ],
  },
  {
    label: "Intelligence",
    icon: "🧠",
    tabs: [
      { id: "predictions", label: "Predictions" },
      { id: "referrals", label: "Referrals" },
    ],
  },
];

interface WorkspaceTabGroupsProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  unreadMessages?: number;
}

function findGroupForTab(tab: ClientTab): string {
  for (const g of TAB_GROUPS) {
    if (g.tabs.some(t => t.id === tab)) return g.label;
  }
  return TAB_GROUPS[0].label;
}

const WorkspaceTabGroups = ({ activeTab, onTabChange, unreadMessages }: WorkspaceTabGroupsProps) => {
  const activeGroup = findGroupForTab(activeTab);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([activeGroup]));

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleTabClick = (tab: ClientTab) => {
    const group = findGroupForTab(tab);
    setOpenGroups(prev => new Set(prev).add(group));
    onTabChange(tab);
  };

  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto px-2 py-1">
      {TAB_GROUPS.map((group) => {
        const isActiveGroup = group.tabs.some(t => t.id === activeTab);
        return (
          <Collapsible
            key={group.label}
            open={openGroups.has(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <button className={`flex items-center gap-1 px-2.5 py-2 text-xs font-sans whitespace-nowrap transition-colors border-none cursor-pointer bg-transparent rounded-t ${isActiveGroup ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openGroups.has(group.label) ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex items-center">
                <div className="flex items-center gap-0.5 ml-0.5">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={(e) => { e.stopPropagation(); handleTabClick(tab.id); }}
                      className={`px-2.5 py-2 text-xs font-sans whitespace-nowrap transition-colors border-b-2 bg-transparent cursor-pointer relative ${
                        activeTab === tab.id
                          ? "border-primary text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                      {tab.id === "messages" && (unreadMessages ?? 0) > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                          {unreadMessages}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};

export { TAB_GROUPS, findGroupForTab };
export default WorkspaceTabGroups;
