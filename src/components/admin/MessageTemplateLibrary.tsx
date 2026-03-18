import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Search, FileText, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CATEGORIES = ["Welcome", "Report Ready", "Invoice & Billing", "Project Updates", "Maintenance Reminders", "Follow-Up", "General"];
const MERGE_TAGS = ["{{client_first_name}}", "{{client_last_name}}", "{{property_address}}", "{{advisor_name}}", "{{report_link}}", "{{invoice_amount}}", "{{invoice_due_date}}", "{{project_name}}", "{{service_date}}"];

const SEED_TEMPLATES = [
  { title: "Welcome to Your Portal", category: "Welcome", body_text: "Hi {{client_first_name}}, welcome to your Home Clarity Hub portal! Your personalized home stewardship system is ready. Log in anytime to view your Home Clarity Report, track projects, and reach out with any questions. We're glad to have you. — {{advisor_name}}" },
  { title: "Your Report Is Ready", category: "Report Ready", body_text: "Hi {{client_first_name}}, your Home Clarity Report for {{property_address}} has been published and is ready to view in your portal. Take a look at your Home Health Score and Priority Action Items — and don't hesitate to message me with any questions. — {{advisor_name}}" },
  { title: "Invoice Sent", category: "Invoice & Billing", body_text: "Hi {{client_first_name}}, an invoice for {{invoice_amount}} has been sent to your portal and is due on {{invoice_due_date}}. You can view and pay it in the Payments section. Let me know if you have any questions. — {{advisor_name}}" },
  { title: "Project Status Update", category: "Project Updates", body_text: "Hi {{client_first_name}}, I wanted to give you a quick update on your {{project_name}} project. Progress is on track — I'll keep you updated as things move forward. Feel free to check the Projects section of your portal for the latest milestone status. — {{advisor_name}}" },
  { title: "Service Date Reminder", category: "Maintenance Reminders", body_text: "Hi {{client_first_name}}, just a friendly reminder that your {{service_date}} service appointment is coming up. If you need to reschedule or have questions, reply here and I'll take care of it. — {{advisor_name}}" },
  { title: "Check-In", category: "Follow-Up", body_text: "Hi {{client_first_name}}, just checking in on you and {{property_address}}. Is there anything on your home's radar we should be talking about? I'm here whenever you need me. — {{advisor_name}}" },
];

const MessageTemplateLibrary = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [body, setBody] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data } = await (supabase.from("message_templates") as any).select("*").order("use_count", { ascending: false });
      if (data && data.length === 0 && user) {
        // Seed templates
        const seeds = SEED_TEMPLATES.map(t => ({ ...t, admin_id: user.id }));
        await (supabase.from("message_templates") as any).insert(seeds);
        const { data: seeded } = await (supabase.from("message_templates") as any).select("*").order("use_count", { ascending: false });
        return seeded || [];
      }
      return data || [];
    },
  });

  const filtered = templates.filter((t: any) => {
    const matchSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()) || t.body_text.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const create = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    await (supabase.from("message_templates") as any).insert({
      admin_id: user.id, title: title.trim(), category, body_text: body.trim(),
    });
    setCreateOpen(false); setTitle(""); setBody("");
    qc.invalidateQueries({ queryKey: ["message-templates"] });
    toast.success("Template created");
  };

  const deleteTemplate = async (id: string) => {
    await (supabase.from("message_templates") as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["message-templates"] });
    toast.success("Template deleted");
  };

  const copyBody = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Template copied to clipboard");
  };

  const insertTag = (tag: string) => {
    setBody(prev => prev + tag);
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Message Templates</h3>
          <Badge variant="secondary" className="text-[10px]">{templates.length}</Badge>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 font-sans text-sm" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px] font-sans text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        {filtered.map((tpl: any) => (
          <div key={tpl.id} className="border border-border rounded-lg p-4 group hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-sans font-medium text-foreground">{tpl.title}</span>
                <Badge variant="outline" className="text-[9px]">{tpl.category}</Badge>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyBody(tpl.body_text)}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteTemplate(tpl.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-xs font-sans text-muted-foreground line-clamp-2">{tpl.body_text}</p>
            <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Used {tpl.use_count}x</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm font-sans text-muted-foreground text-center py-8">No templates match your search.</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">New Message Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Template name..." className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-sans">Message Body</Label>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {MERGE_TAGS.map(tag => (
                  <Button key={tag} variant="outline" size="sm" className="h-6 text-[10px] font-mono px-1.5" onClick={() => insertTag(tag)}>
                    {tag}
                  </Button>
                ))}
              </div>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your template..." className="font-sans min-h-[120px]" />
            </div>
            {body && (
              <div className="space-y-1.5">
                <Label className="text-xs font-sans text-muted-foreground">Preview</Label>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-sans text-foreground whitespace-pre-wrap">
                  {body.replace(/\{\{client_first_name\}\}/g, "Sarah").replace(/\{\{property_address\}\}/g, "123 Oak Lane").replace(/\{\{advisor_name\}\}/g, "Your Advisor").replace(/\{\{[^}]+\}\}/g, "[value]")}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!title.trim() || !body.trim()} className="font-sans">Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageTemplateLibrary;
