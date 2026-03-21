import { Tutorial } from "../types";

export const adminTools: Tutorial[] = [
  {
    id: "admin-knowledge-base",
    category: "Tools",
    title: "Using the Knowledge Base",
    description: "Build and maintain a reference library of articles that power AI drafts and client-facing content.",
    audience: "admin",
    steps: [
      { title: "Open Knowledge Base", body: "Navigate to the Knowledge Base section in the admin sidebar." },
      { title: "Browse categories", body: "Articles are organized by category: Home Systems, Maintenance, Building Codes, Materials, and more." },
      { title: "Create an article", body: "Click +New Article. Enter a title, select a category, and write the content. Use the rich text editor for formatting." },
      { title: "Tag with keywords", body: "Add relevant keywords so the AI can find and reference this article when drafting report narratives or answering client questions." },
      { title: "Use in reports", body: "When the AI drafts a narrative, it automatically pulls relevant Knowledge Base articles for context — making drafts more accurate and consistent." },
    ],
    tip: "Add articles about regional building codes and common issues in your service area. This local knowledge dramatically improves AI draft quality.",
    keywords: ["knowledge base", "articles", "reference", "library", "content", "ai context"],
  },
  {
    id: "admin-goals",
    category: "Tools",
    title: "Managing Client Goals",
    description: "Track homeowner goals and wishlist items alongside report-driven projects.",
    audience: "admin",
    steps: [
      { title: "Open Goals tab", body: "From a client workspace, click the Goals tab." },
      { title: "View client goals", body: "Goals can be created by either you (the advisor) or the client through their portal. Each has a title, description, category, target date, and progress percentage." },
      { title: "Add an advisor goal", body: "Click +New Goal to create a goal on behalf of the client based on your assessment (e.g., 'Replace roof within 2 years')." },
      { title: "Link to projects", body: "When a goal aligns with an active project, note the connection. Completing the project advances the goal's progress." },
      { title: "Track progress", body: "Update the progress percentage as milestones are hit. Completed goals are visible in the client's portal and annual review." },
    ],
    tip: "Review client-created goals regularly — they reveal what the homeowner cares about most, which helps you prioritize your recommendations.",
    keywords: ["goals", "wishlist", "tracking", "progress", "client goals", "advisor goals"],
  },
  {
    id: "admin-referrals",
    category: "Tools",
    title: "Tracking Referrals",
    description: "Monitor your referral program and track which clients are bringing in new business.",
    audience: "admin",
    steps: [
      { title: "Open Referrals", body: "Navigate to the Referrals section in the admin sidebar." },
      { title: "View referral stats", body: "See total referrals, conversion rate, and credit issued at a glance." },
      { title: "Track individual referrals", body: "Each referral shows who referred whom, the status (pending, converted, expired), and any credit earned." },
      { title: "Manage credits", body: "When a referred client signs up, the referrer receives their credit automatically according to your referral program rules." },
      { title: "Promote the program", body: "Use announcements or messages to remind clients about the referral program and share their unique referral links." },
    ],
    tip: "Clients who refer others have the highest retention rates. Consider mentioning the referral program during annual review calls.",
    keywords: ["referrals", "program", "tracking", "credit", "refer", "new business"],
  },
];
