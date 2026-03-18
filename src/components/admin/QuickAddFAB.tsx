import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, UserPlus, Calendar, DollarSign, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickAddFAB = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: FileText, label: "New Report", action: () => navigate("/admin/clients/new") },
    { icon: UserPlus, label: "Add Client", action: () => navigate("/admin/clients/new") },
    { icon: Calendar, label: "View Schedule", action: () => navigate("/admin/clients") },
    { icon: DollarSign, label: "View Revenue", action: () => navigate("/admin") },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2 mb-2">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => { a.action(); setOpen(false); }}
              className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5 shadow-lg cursor-pointer hover:bg-muted transition-colors whitespace-nowrap"
            >
              <a.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-sans font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <Button
        onClick={() => setOpen(!open)}
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </Button>
    </div>
  );
};

export default QuickAddFAB;
