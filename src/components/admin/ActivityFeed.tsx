import { useNavigate } from "react-router-dom";
import { MessageSquare, Upload, Send, Edit, HelpCircle } from "lucide-react";
import type { MockActivity } from "@/data/adminMockData";

const typeIcons = {
  comment: MessageSquare,
  publish: Send,
  upload: Upload,
  edit: Edit,
  question: HelpCircle,
};

interface ActivityFeedProps {
  activities: MockActivity[];
  limit?: number;
}

const ActivityFeed = ({ activities, limit }: ActivityFeedProps) => {
  const navigate = useNavigate();
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="space-y-0">
      {items.map((activity) => {
        const Icon = typeIcons[activity.type];
        return (
          <button
            key={activity.id}
            onClick={() => navigate(`/admin/clients/${activity.clientId}`)}
            className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors text-left bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans text-foreground leading-snug">{activity.message}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">{activity.timestamp}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
