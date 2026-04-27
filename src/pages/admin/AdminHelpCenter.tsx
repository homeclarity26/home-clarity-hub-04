import { useState, useMemo } from "react";
import { BookOpen, LayoutGrid, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/AdminHeader";
import TutorialCategory from "@/components/help/TutorialCategory";
import { allAdminTutorials, adminCategories, adminReferenceCards } from "@/data/tutorials/admin";
import type { Tutorial } from "@/data/tutorials/types";

const AdminHelpCenter = () => {
  const [search, setSearch] = useState("");

  const filteredTutorials = useMemo(() => {
    if (!search.trim()) return allAdminTutorials;
    const q = search.toLowerCase();
    return allAdminTutorials.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.steps.some((s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
    );
  }, [search]);

  const groupedTutorials = useMemo(() => {
    const map = new Map<string, Tutorial[]>();
    for (const cat of adminCategories) map.set(cat, []);
    for (const t of filteredTutorials) {
      const arr = map.get(t.category);
      if (arr) arr.push(t);
    }
    return map;
  }, [filteredTutorials]);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return adminReferenceCards;
    const q = search.toLowerCase();
    return adminReferenceCards.filter(
      (c) => c.title.toLowerCase().includes(q) || c.items.some((i) => i.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Help & Tutorials" }]} />
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-foreground mb-1">Help & Tutorials</h1>
          <p className="text-sm font-sans text-muted-foreground">
            {allAdminTutorials.length} guides across {adminCategories.length} categories. Everything you need to master your HBC workspace.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search all tutorials and reference cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm font-sans"
          />
        </div>

        <Tabs defaultValue="guides" className="space-y-4">
          <TabsList>
            <TabsTrigger value="guides" className="gap-1.5 text-xs font-sans">
              <BookOpen className="w-3.5 h-3.5" /> Step-by-Step Guides
            </TabsTrigger>
            <TabsTrigger value="reference" className="gap-1.5 text-xs font-sans">
              <LayoutGrid className="w-3.5 h-3.5" /> Quick Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="space-y-6">
            {search && filteredTutorials.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tutorials match "{search}"</p>
            )}
            {Array.from(groupedTutorials.entries()).map(([cat, tutorials]) => (
              <TutorialCategory key={cat} category={cat} tutorials={tutorials} />
            ))}
          </TabsContent>

          <TabsContent value="reference">
            {filteredCards.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No reference cards match "{search}"</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCards.map((card) => (
                <Card key={card.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{card.icon}</span>
                    <h3 className="text-sm font-sans font-semibold text-foreground">{card.title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {card.items.map((item, i) => (
                      <li key={i} className="text-xs font-sans text-muted-foreground flex gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminHelpCenter;
