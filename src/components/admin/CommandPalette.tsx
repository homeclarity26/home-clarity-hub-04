import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, FileText, Settings, BookOpen, LayoutDashboard, Megaphone, Plus, Search } from "lucide-react";
import { useAdminClients } from "@/hooks/useAdminData";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { data: clients } = useAdminClients();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setSearch("");
        setSelectedIndex(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const staticItems: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => go("/admin"), category: "Navigation" },
    { id: "clients", label: "All Clients", icon: Users, action: () => go("/admin/clients"), category: "Navigation" },
    { id: "new-report", label: "Create New Report", icon: Plus, action: () => go("/admin/clients/new"), category: "Actions" },
    { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen, action: () => go("/admin/knowledge-base"), category: "Navigation" },
    { id: "announcements", label: "Announcements", icon: Megaphone, action: () => go("/admin/announcements"), category: "Navigation" },
    { id: "settings", label: "Settings", icon: Settings, action: () => go("/admin/settings"), category: "Navigation" },
  ];

  const clientItems: CommandItem[] = (clients || []).map((c) => ({
    id: `client-${c.propertyId}`,
    label: c.propertyName,
    description: c.name,
    icon: FileText,
    action: () => go(`/admin/clients/${c.propertyId}`),
    category: "Clients",
  }));

  const allItems = [...staticItems, ...clientItems];
  const filtered = search
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      )
    : allItems.slice(0, 12);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, pages, actions…"
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm font-sans"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border border-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-sans">No results found.</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-4 py-1.5">{category}</p>
                {items.map((item) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const Icon = item.icon;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-none cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 text-foreground" : "bg-transparent text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-sans font-medium">{item.label}</span>
                        {item.description && (
                          <span className="text-xs font-sans text-muted-foreground ml-2">{item.description}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
