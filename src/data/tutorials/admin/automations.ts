import { Tutorial } from "../types";

export const adminAutomations: Tutorial[] = [
  {
    id: "admin-configure-automations",
    category: "Automations",
    title: "Configuring & Monitoring Automation Rules",
    description: "Set up background rules for follow-ups, alerts, and recurring tasks.",
    audience: "admin",
    steps: [
      { title: "Go to Automations", body: "Navigate to the Automations section in the admin sidebar." },
      { title: "Review pre-built rules", body: "Seven rules are available: Client Inactivity Check-In (30 days), Equipment Service Due (no project), Invoice Overdue (escalation), Project Stalled (45 days), Message Unanswered (24 hours), Poor Score (no project), and Client Anniversary (renewal)." },
      { title: "Enable rules", body: "Toggle each rule on or off. Start with Client Inactivity, Invoice Overdue, and Project Stalled — these deliver the most immediate value." },
      { title: "Configure thresholds", body: "Some rules have configurable thresholds (e.g., inactivity days, overdue days). Set these to match your service standards." },
      { title: "Monitor trigger counts", body: "Each rule shows how many times it has fired and when it last triggered." },
      { title: "Review automation logs", body: "Click 'View Logs' to see a full history of every automated action — which client, what action, and when." },
    ],
    tip: "Don't enable all seven rules at once on day one. Start with three, get comfortable with how they work, then layer in the rest over the first few weeks.",
    keywords: ["automation", "rules", "configure", "alerts", "follow-up", "triggers", "background"],
  },
];
