import { Tutorial } from "../types";

export const adminPaymentsBilling: Tutorial[] = [
  {
    id: "admin-create-invoice",
    category: "Payments & Billing",
    title: "Creating & Sending an Invoice",
    description: "Generate invoices manually or from projects and proposals.",
    audience: "admin",
    steps: [
      { title: "Open the Payments tab", body: "From a client workspace, click the Payments tab." },
      { title: "Click +New Invoice", body: "Or create one from a project card ('Create Invoice') or by converting an accepted proposal." },
      { title: "Fill in details", body: "Enter the title, line item descriptions, amounts, and due date." },
      { title: "Pre-fill from report tiers", body: "Use 'From Report Tier' to select a report page and pricing tier. The invoice pre-fills with the tier title and cost estimate." },
      { title: "Send the invoice", body: "Click Create & Send. The client receives a notification and the invoice appears in their portal Payments tab." },
      { title: "Track payment", body: "Monitor the status: Sent → Paid or Sent → Overdue. Overdue invoices trigger escalation rules if configured." },
    ],
    tip: "Set due dates to 14 days from today as a default. Clients with Stripe-connected payments often pay within 48 hours of receiving the invoice.",
    keywords: ["invoice", "create", "send", "payment", "billing", "line items", "due date"],
  },
  {
    id: "admin-track-payments",
    category: "Payments & Billing",
    title: "Tracking Payment Status & Escalation Rules",
    description: "Monitor outstanding balances and configure automatic payment follow-ups.",
    audience: "admin",
    steps: [
      { title: "View payment overview", body: "Your admin dashboard shows total outstanding balance, collection rate, and overdue invoices at a glance." },
      { title: "Review individual invoices", body: "Open any client's Payments tab to see their invoice history with status badges: Draft, Sent, Paid, or Overdue." },
      { title: "Mark as paid", body: "When payment is received (cash, check, or external), manually mark the invoice as Paid and enter the payment date." },
      { title: "Configure escalation rules", body: "In Settings, configure payment escalation rules: Day 1 gentle reminder, Day 7 firm follow-up, Day 14 final notice, Day 30 collections risk." },
      { title: "Review automation logs", body: "Check the Automation section for a history of all automated payment reminders that have been sent." },
    ],
    tip: "Enable all four escalation rules. The Day 14 admin flag creates a Task in your Task Board so overdue invoices stay visible alongside your other work.",
    keywords: ["payment", "tracking", "overdue", "escalation", "reminder", "collection", "status"],
  },
  {
    id: "admin-subscriptions-analytics",
    category: "Payments & Billing",
    title: "Managing Subscriptions & Reading Revenue Analytics",
    description: "Track membership billing and analyze your business revenue performance.",
    audience: "admin",
    steps: [
      { title: "View subscription status", body: "Each client's membership tab shows their tier, billing cycle, current period, and payment history." },
      { title: "Handle renewals", body: "The system sends renewal reminders automatically. Review the Annual Reviews section for clients approaching their renewal date." },
      { title: "Open Analytics", body: "Navigate to the Analytics section in the admin sidebar for your revenue dashboard." },
      { title: "Review key metrics", body: "Track: total revenue, collection rate, average revenue per client, monthly recurring revenue, and revenue by service type." },
      { title: "Spot trends", body: "Use the chart views to identify seasonal patterns, growth trends, and any clients who may be at risk of not renewing." },
    ],
    tip: "The Profitability Score on each client card tells you revenue divided by estimated time cost. Use this to identify your most and least profitable client relationships.",
    keywords: ["subscription", "membership", "analytics", "revenue", "recurring", "renewal", "metrics"],
  },
];
