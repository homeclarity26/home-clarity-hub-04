import type { AdminClient } from "@/hooks/useAdminData";

export interface HealthScoreBreakdown {
  total: number;
  reportCompletion: number;
  reportStatus: number;
  messageEngagement: number;
  issueFlags: number;
  onboarding: number;
}

export type HealthLevel = "excellent" | "good" | "fair" | "poor" | "critical";

/**
 * Computes a 0–100 composite health score for a client based on
 * report completion, status, engagement signals, and issue flags.
 *
 * Weights:
 *   Report completion %      — 30 pts
 *   Report status             — 20 pts
 *   Message engagement        — 15 pts
 *   Issue flags (inverted)    — 20 pts
 *   Onboarding completeness   — 15 pts
 */
export function computeClientHealthScore(client: AdminClient): HealthScoreBreakdown {
  // 1. Report completion (0-30)
  const reportCompletion = client.totalPages > 0
    ? Math.round((client.completePages / client.totalPages) * 30)
    : 0;

  // 2. Report status (0-20)
  const statusScores: Record<string, number> = { published: 20, review: 12, draft: 5 };
  const reportStatus = statusScores[client.reportStatus] ?? 0;

  // 3. Message engagement — low unread = good (0-15)
  const unread = client.unreadMessages + client.unreadComments;
  const messageEngagement = unread === 0 ? 15 : unread <= 2 ? 10 : unread <= 5 ? 5 : 0;

  // 4. Issue flags — fewer flagged pages & open questions = better (0-20)
  const issues = client.flaggedPages + client.openQuestions;
  const issueFlags = issues === 0 ? 20 : issues <= 2 ? 14 : issues <= 5 ? 8 : 2;

  // 5. Onboarding completeness (0-15)
  const onboardingSteps = [
    !!client.address,
    !!client.discoveryNotes,
    client.digitalAssetsStatus === "complete",
    client.totalPages > 0,
    client.reportStatus === "published",
  ];
  const onboarding = Math.round((onboardingSteps.filter(Boolean).length / onboardingSteps.length) * 15);

  const total = reportCompletion + reportStatus + messageEngagement + issueFlags + onboarding;

  return { total, reportCompletion, reportStatus, messageEngagement, issueFlags, onboarding };
}

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

export function getHealthColor(level: HealthLevel): string {
  switch (level) {
    case "excellent": return "text-emerald-600";
    case "good": return "text-primary";
    case "fair": return "text-amber-600";
    case "poor": return "text-orange-600";
    case "critical": return "text-destructive";
  }
}

export function getHealthBgColor(level: HealthLevel): string {
  switch (level) {
    case "excellent": return "bg-emerald-100 text-emerald-800";
    case "good": return "bg-primary/10 text-primary";
    case "fair": return "bg-amber-100 text-amber-800";
    case "poor": return "bg-orange-100 text-orange-800";
    case "critical": return "bg-destructive/10 text-destructive";
  }
}

export function getHealthLabel(level: HealthLevel): string {
  switch (level) {
    case "excellent": return "Excellent";
    case "good": return "Good";
    case "fair": return "Fair";
    case "poor": return "Needs Attention";
    case "critical": return "Critical";
  }
}
