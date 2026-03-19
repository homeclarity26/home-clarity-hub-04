import { Outlet } from "react-router-dom";
import { Component, ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CommandPalette from "@/components/admin/CommandPalette";
import QuickAddFAB from "@/components/admin/QuickAddFAB";
import AgentPanel from "@/components/agent/AgentPanel";
import PushNotificationBanner from "@/components/PushNotificationBanner";
import useAdminShortcuts from "@/hooks/useAdminShortcuts";

class SafeWrapper extends Component<{ name: string; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error(`[AdminLayout] "${this.props.name}" crashed:`, err); }
  render() { return this.state.hasError ? null : this.props.children; }
}

const AdminLayout = () => {
  useAdminShortcuts();

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <SafeWrapper name="PushBanner"><PushNotificationBanner /></SafeWrapper>
      <AdminSidebar />
      <SafeWrapper name="CommandPalette"><CommandPalette /></SafeWrapper>
      <SafeWrapper name="QuickAddFAB"><QuickAddFAB /></SafeWrapper>
      <SafeWrapper name="AgentPanel"><AgentPanel /></SafeWrapper>
      <div className="md:ml-60 mt-14 md:mt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

