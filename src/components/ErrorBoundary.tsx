import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

// A chunk-load / dynamic-import failure means the browser is running a
// cached index.html whose asset hashes no longer exist on the server
// (classic Vite/Vercel SPA drift after a new deploy). The fix is always
// a hard reload — we can detect the error and offer a tailored message.
const isChunkLoadError = (error: Error | null): boolean => {
  if (!error) return false;
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    (error.name === "ChunkLoadError")
  );
};

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    // On a chunk-load failure, reload once automatically — the cached
    // HTML is pointing at stale asset hashes and the user can't recover
    // without a hard reload. Guard against infinite loops with a
    // session-scoped flag.
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem("hbc:chunk-reload") === "1";
      if (!alreadyReloaded) {
        sessionStorage.setItem("hbc:chunk-reload", "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const chunkDrift = isChunkLoadError(this.state.error);
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="text-center space-y-4 max-w-md">
            {chunkDrift ? (
              <RefreshCw className="w-10 h-10 text-accent mx-auto" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-accent mx-auto" />
            )}
            <h1 className="font-display text-2xl text-foreground">
              {chunkDrift ? "A new version is available" : "Something went wrong"}
            </h1>
            <p className="font-sans text-sm text-muted-foreground">
              {chunkDrift
                ? "Reload to get the latest version — your browser has the old one cached."
                : (this.state.error?.message || "An unexpected error occurred.")}
            </p>
            <Button onClick={() => { this.setState({ hasError: false, error: null }); sessionStorage.removeItem("hbc:chunk-reload"); window.location.reload(); }}>
              {chunkDrift ? "Reload now" : "Reload Page"}
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
