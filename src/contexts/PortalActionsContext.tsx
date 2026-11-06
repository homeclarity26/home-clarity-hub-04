import { createContext, useContext } from "react";

/**
 * Optional action wiring for portal surfaces rendered outside the live
 * portal shell (today: the public /demo sample report).
 *
 * Several client-viewer buttons inside report blocks (Replacement Briefing
 * CTAs, the room Concierge Action callout, "View Vision Project", the
 * Concierge plans button) are visual-only in the live portal. When a
 * provider is mounted, those buttons call these handlers instead. With NO
 * provider mounted `usePortalActions()` returns null and every consumer
 * keeps its existing production behavior, so this context is purely
 * additive.
 */
export interface PortalActions {
  /** True only inside the public sample report. */
  demoMode: boolean;
  /** Open Bobby. With a prompt, the prompt is asked immediately. */
  openBobby: (prompt?: string) => void;
  /** Navigate to a report page by page key. */
  navigateToPage: (pageKey: string) => void;
  /** True when a page key exists in the current report. */
  hasPage: (pageKey: string) => boolean;
  /** Caption for a photo on the page currently shown, keyed by image src. */
  captionFor: (src: string) => string | undefined;
}

const PortalActionsContext = createContext<PortalActions | null>(null);

export const PortalActionsProvider = PortalActionsContext.Provider;

/** Returns the mounted actions, or null in the live portal. */
export function usePortalActions(): PortalActions | null {
  return useContext(PortalActionsContext);
}
