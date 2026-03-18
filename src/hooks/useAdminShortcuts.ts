import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts for admin area
 * ⌘+N = New Report, ⌘+D = Dashboard, ⌘+C = Clients, ⌘+? = Shortcuts help
 */
const useAdminShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "n") {
        e.preventDefault();
        navigate("/admin/clients/new");
      }
      if (meta && e.key === "d") {
        e.preventDefault();
        navigate("/admin");
      }
      if (meta && e.key === "c" && !e.shiftKey) {
        // Don't override copy
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
};

export default useAdminShortcuts;
