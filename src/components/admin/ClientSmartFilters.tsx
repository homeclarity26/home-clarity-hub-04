import { useState } from "react";
import { Filter, Save, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface FilterState {
  status: string;
  health: string;
  onboarding: string;
  hasUnread: string;
  search: string;
}

const DEFAULT_FILTERS: FilterState = {
  status: "all",
  health: "all",
  onboarding: "all",
  hasUnread: "all",
  search: "",
};

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

const PRESET_FILTERS: SavedFilter[] = [
  { id: "needs-attention", name: "Needs Attention", filters: { ...DEFAULT_FILTERS, hasUnread: "yes" } },
  { id: "in-progress", name: "In Progress", filters: { ...DEFAULT_FILTERS, status: "draft", onboarding: "incomplete" } },
  { id: "published", name: "Published", filters: { ...DEFAULT_FILTERS, status: "published" } },
  { id: "at-risk", name: "At Risk", filters: { ...DEFAULT_FILTERS, health: "poor" } },
];

interface ClientSmartFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const ClientSmartFilters = ({ filters, onChange }: ClientSmartFiltersProps) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const stored = localStorage.getItem("hbc-client-filters");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCount = Object.entries(filters).filter(
    ([key, val]) => key !== "search" && val !== "all" && val !== ""
  ).length;

  const saveCurrentFilter = () => {
    const name = prompt("Name this filter:");
    if (!name) return;
    const newFilter: SavedFilter = {
      id: `custom-${Date.now()}`,
      name,
      filters: { ...filters },
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem("hbc-client-filters", JSON.stringify(updated));
    toast.success(`Filter "${name}" saved`);
  };

  const applyPreset = (preset: SavedFilter) => {
    onChange(preset.filters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    onChange(DEFAULT_FILTERS);
  };

  const allPresets = [...PRESET_FILTERS, ...savedFilters];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="Search clients..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 font-sans text-sm"
        />
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{activeCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-3" align="start">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Report Status</label>
            <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Health Score</label>
            <Select value={filters.health} onValueChange={(v) => onChange({ ...filters, health: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="good">Good & Above</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor & Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Onboarding</label>
            <Select value={filters.onboarding} onValueChange={(v) => onChange({ ...filters, onboarding: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Unread Messages</label>
            <Select value={filters.hasUnread} onValueChange={(v) => onChange({ ...filters, hasUnread: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Has Unread</SelectItem>
                <SelectItem value="no">No Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" className="text-xs flex-1" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" />Clear
            </Button>
            <Button variant="outline" size="sm" className="text-xs flex-1" onClick={saveCurrentFilter}>
              <Save className="w-3 h-3 mr-1" />Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Preset chips */}
      <div className="flex gap-1.5 flex-wrap">
        {allPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="px-2.5 py-1 rounded-full text-[10px] font-sans font-medium border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {activeCount > 0 && (
        <button onClick={clearFilters} className="text-[10px] font-sans text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer underline">
          Clear all
        </button>
      )}
    </div>
  );
};

export { DEFAULT_FILTERS };
export default ClientSmartFilters;
