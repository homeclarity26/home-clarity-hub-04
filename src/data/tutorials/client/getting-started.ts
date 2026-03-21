import { Tutorial } from "../types";

export const clientGettingStarted: Tutorial[] = [
  {
    id: "client-welcome",
    category: "Getting Started",
    title: "Welcome to Your Home Clarity Portal",
    description: "An overview of what your portal is, what it does, and how it helps you take care of your home.",
    audience: "client",
    steps: [
      { title: "What is the Home Clarity Portal?", body: "Your portal is a private online hub where you can view your home's assessment, track projects, manage documents, communicate with your advisor, and stay on top of maintenance — all in one place." },
      { title: "Who can see it?", body: "Only you and your Home Clarity Hub advisor team have access. Your data is private and secure." },
      { title: "What's inside?", body: "Your portal includes your Home Clarity Report, Home Health Score, active projects, equipment registry, payment history, maintenance calendar, document storage, and a direct messaging channel with your advisor." },
      { title: "It gets smarter over time", body: "As your advisor updates your report and completes projects, your portal reflects the improvements — including an updated Health Score showing your home's progress." },
    ],
    tip: "Bookmark your portal URL so you can quickly check in anytime. Your advisor will also send you links when something new is available.",
    keywords: ["welcome", "portal", "overview", "what is", "getting started", "introduction"],
  },
  {
    id: "client-navigate-portal",
    category: "Getting Started",
    title: "How to Navigate Your Portal",
    description: "Find your way around the portal tabs and sections.",
    audience: "client",
    steps: [
      { title: "The tab bar", body: "At the top of your portal, you'll see tabs: Home, Report, Projects, Payments, Equipment, Documents, Messages, Contacts, Schedule, and more." },
      { title: "Home tab", body: "Your landing page with a summary of your home's status, Health Score, quick links, and recent activity." },
      { title: "Report tab", body: "Your full Home Clarity Report with every finding, condition rating, and recommendation." },
      { title: "More tabs", body: "Scroll the tab bar or look for the 'More' menu to access Photos, Goals, Services, Referrals, and Settings." },
      { title: "Switch properties", body: "If you have multiple properties, use the property selector at the top to switch between them." },
    ],
    tip: "Start with the Home tab — it gives you a quick snapshot of everything important and links to the details in other tabs.",
    keywords: ["navigate", "tabs", "menu", "sections", "home", "find", "layout"],
  },
  {
    id: "client-ai-concierge",
    category: "Getting Started",
    title: "How to Use the AI Home Concierge",
    description: "Ask questions about your home and get instant answers from your AI assistant.",
    audience: "client",
    steps: [
      { title: "Find the AI button", body: "Look for the chat icon in the bottom-right corner of your portal, or the AI assistant panel on supported pages." },
      { title: "Ask a question", body: "Type any question about your home: 'When was my roof last inspected?' or 'What's the most urgent thing I should fix?'" },
      { title: "Get a personalized answer", body: "The AI has access to your full report, equipment registry, and project history. Answers are specific to your home — not generic advice." },
      { title: "Follow up", body: "Ask follow-up questions in the same conversation. The AI remembers the context of your chat." },
      { title: "When to message your advisor", body: "The AI is great for quick lookups and explanations. For scheduling, project decisions, or anything requiring action, send a message to your advisor directly." },
    ],
    tip: "Try asking: 'Summarize the most important things in my report' — it's a great way to get up to speed quickly.",
    keywords: ["ai", "concierge", "assistant", "chat", "question", "ask", "help"],
  },
];
