import { useNavigate } from "react-router-dom";
import { MessageSquare, Upload, Send, Edit, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  publish: Send,
  upload: Upload,
  edit: Edit,
  question: HelpCircle,
};

interface ActivityItem {
  id: string;
  message: string;
  action_type: string;
  created_at: string;
  property_id: string | null;
  properties?: { id: string; property_name: string | null; address: string } | null;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  limit?: number;
}

const ActivityFeed = ({ activities, limit }: ActivityFeedProps) => {
  const navigate = useNavigate();
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="space-y-0">
      {items.length === 0 && (
        <p className="text-sm font-sans text-muted-foreground text-center py-6">No recent activity.</p>
      )}
      {items.map((activity) => {
        const Icon = typeIcons[activity.action_type] || Edit;
        return (
          <button
            key={activity.id}
            onClick={() => activity.property_id && navigate(`/admin/clients/${activity.property_id}`)}
            className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors text-left bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans text-foreground leading-snug">{activity.message}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                {activity.properties && ` · ${activity.properties.property_name || activity.properties.address}`}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
