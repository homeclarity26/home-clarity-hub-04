import type { AdminClient } from "@/hooks/useAdminData";

// Internal-only client signal scoring. The 0-100 number is NEVER surfaced
// to a client or admin; it exists solely so ClientHealthCard and
// PortfolioHealthDashboard can bucket clients into the 5 word ratings
// (Excellent / Good / Fair / Poor / Critical) defined in the v2 spec.
//
// Anything that surfaces the raw `total` violates the v2 rebuild rule
// "no numerical scoring in any output".
export interface HealthScoreBreakdown {
  total: number;
  reportCompletion: number;
  reportStatus: number;
  messageEngagement: number;
  issueFlags: number;
  onboarding: number;
}

export function computeClientHealthScore(client: AdminClient): HealthScoreBreakdown {
  const reportCompletion = client.totalPages > 0
    ? Math.round((client.completePages / client.totalPages) * 30)
    : 0;

  const statusScores: Record<string, number> = { published: 20, review: 12, draft: 5 };
  const reportStatus = statusScores[client.reportStatus] ?? 0;

  const unread = client.unreadMessages + client.unreadComments;
  const messageEngagement = unread === 0 ? 15 : unread <= 2 ? 10 : unread <= 5 ? 5 : 0;

  const issues = client.flaggedPages + client.openQuestions;
  const issueFlags = issues === 0 ? 20 : issues <= 2 ? 14 : issues <= 5 ? 8 : 2;

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
