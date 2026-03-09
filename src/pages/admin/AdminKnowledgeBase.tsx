import AdminHeader from "@/components/admin/AdminHeader";
import KnowledgeBaseComponent from "@/components/admin/KnowledgeBase";

const AdminKnowledgeBase = () => {
  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Knowledge Base" }]} />
      <div className="p-6 max-w-7xl">
        <KnowledgeBaseComponent />
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
