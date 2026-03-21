import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown } from "lucide-react";
import { useAdminClients } from "@/hooks/useAdminData";

interface ClientQuickSwitchProps {
  currentClientId: string;
}

const ClientQuickSwitch = ({ currentClientId }: ClientQuickSwitchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: clients } = useAdminClients();

  const filtered = (clients || [])
    .filter(c => c.propertyId !== currentClientId)
    .filter(c =>
      !search || c.propertyName.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-sans text-muted-foreground">
          Switch client <ChevronsUpDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs mb-2"
          autoFocus
        />
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button
              key={c.propertyId}
              onClick={() => {
                navigate(`/admin/clients/${c.propertyId}`);
                setOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-2 py-1.5 rounded text-xs font-sans hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
            >
              <p className="text-foreground font-medium truncate">{c.propertyName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-3">No clients found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientQuickSwitch;
