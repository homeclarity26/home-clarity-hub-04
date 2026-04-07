import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// Groups that should align to end to avoid right-edge clipping
const END_ALIGNED_GROUPS = new Set(["Financial", "Communication", "Intelligence"]);

const WorkspaceTabGroups = ({ activeTab, onTabChange, unreadMessages }: WorkspaceTabGroupsProps) => {
  const activeGroup = findGroupForTab(activeTab);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleTabClick = (tab: ClientTab) => {
    onTabChange(tab);
    setOpenGroup(null);
  };

  return (
    <div className="flex items-end gap-0.5 border-b border-border px-2">
      {TAB_GROUPS.map((group) => {
        const isActiveGroup = group.label === activeGroup;
        const isOpen = openGroup === group.label;

        return (
          <Popover
            key={group.label}
            open={isOpen}
            onOpenChange={(open) => setOpenGroup(open ? group.label : null)}
          >
            <PopoverTrigger asChild>
              <button
                className={`relative flex items-center gap-1 px-3 py-2 text-xs font-sans whitespace-nowrap transition-colors border-none cursor-pointer bg-transparent rounded-none focus:outline-none ${
                  isActiveGroup
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{group.icon}</span>
                <span>{group.label}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
                {/* Gold/accent underline for active group */}
                {isActiveGroup && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-sm" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align={END_ALIGNED_GROUPS.has(group.label) ? "end" : "start"}
              side="bottom"
              sideOffset={0}
              className="w-44 p-1"
            >
              <div className="flex flex-col">
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-sans rounded-md transition-colors cursor-pointer border-none text-left ${
                      activeTab === tab.id
                        ? "bg-muted text-foreground font-bold"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.id === "messages" && (unreadMessages ?? 0) > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
};

export { TAB_GROUPS, findGroupForTab };
export default WorkspaceTabGroups;
