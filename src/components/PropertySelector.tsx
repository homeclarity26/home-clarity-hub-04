import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Home } from "lucide-react";

interface Property { id: string; property_name: string | null; address: string; }

const PropertySelector = ({ currentPropertyId }: { currentPropertyId?: string }) => {
  const { user, isCreator } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!user || isCreator) return;
    const load = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, property_name, address")
        .eq("client_user_id", user.id);
      if (data) setProperties(data);
    };
    load();
  }, [user, isCreator]);

  if (properties.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Home className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentPropertyId}
        onValueChange={(id) => {
          localStorage.setItem("hcr_last_property_id", id);
          navigate(`/portal/${id}`);
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-xs font-sans">
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs font-sans">
              {p.property_name || p.address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PropertySelector;
