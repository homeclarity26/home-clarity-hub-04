import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import KnowledgeBaseComponent from "@/components/admin/KnowledgeBase";
import ReportTemplateManager from "@/components/admin/ReportTemplateManager";

const AdminKnowledgeBase = () => {
  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Knowledge Base" }]} />
      <div className="p-6 max-w-7xl">
        <Tabs defaultValue="knowledge" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="knowledge" className="font-sans text-xs">Knowledge Base</TabsTrigger>
            <TabsTrigger value="report-templates" className="font-sans text-xs">Report Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="knowledge">
            <KnowledgeBaseComponent />
          </TabsContent>
          <TabsContent value="report-templates">
            <ReportTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
