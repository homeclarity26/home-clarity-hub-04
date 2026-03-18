import type { AdminClient } from "@/hooks/useAdminData";
import { computeClientHealthScore, getHealthLevel, getHealthBgColor } from "@/lib/clientHealthScore";
import { Badge } from "@/components/ui/badge";

interface ClientHealthBadgeProps {
  client: AdminClient;
}

const ClientHealthBadge = ({ client }: ClientHealthBadgeProps) => {
  const { total } = computeClientHealthScore(client);
  const level = getHealthLevel(total);
  const bgColor = getHealthBgColor(level);

  return (
    <Badge className={`${bgColor} text-[10px] font-mono border-none tabular-nums`}>
      {total}
    </Badge>
  );
};

export default ClientHealthBadge;
