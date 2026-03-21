import { Tutorial } from "../types";

export const adminAiIntelligence: Tutorial[] = [
  {
    id: "admin-ai-agent",
    category: "AI & Intelligence",
    title: "Using the AI Agent",
    description: "Your intelligent assistant that can answer questions, draft content, and take actions across the platform.",
    audience: "admin",
    steps: [
      { title: "Access the agent", body: "The AI Agent is available in the right rail of every client workspace, and as a global floating button accessible from any admin page." },
      { title: "Ask questions", body: "Ask about a client's home, their report findings, project history, or payment status. The agent has full context about the active client." },
      { title: "Request actions", body: "Tell the agent to 'create a project for the roof repair' or 'draft a follow-up about the kitchen estimate.' It can trigger real actions in the system." },
      { title: "Use built-in tools", body: "The agent has access to 25+ tools: creating projects, generating estimates, looking up equipment, analyzing trends, and more." },
      { title: "Review confirmations", body: "For any action that modifies data (creating a project, sending a message), the agent asks for your confirmation before executing." },
    ],
    tip: "The AI Agent learns from your patterns over time. The more you use it, the better it understands your preferences for report writing, pricing, and communication style.",
    keywords: ["ai agent", "assistant", "tools", "actions", "questions", "intelligent", "copilot"],
  },
  {
    id: "admin-ai-tools",
    category: "AI & Intelligence",
    title: "AI Tools: Score Explainer, Cost Estimator & Meeting Prep",
    description: "Specialized AI tools built into the platform for specific advisor workflows.",
    audience: "admin",
    steps: [
      { title: "Score Explainer", body: "On any report page with a condition rating, click 'Explain This Score.' The AI generates a plain-English summary of what's driving the score, suitable for sharing with clients." },
      { title: "Cost Estimator", body: "On a project, click 'AI Cost Estimate.' Enter the project type, system age, and condition. The AI returns three cost tiers (Conservative, Recommended, Premium) with rationale." },
      { title: "Meeting Prep / Annual Review", body: "Before a client meeting, open the Annual Reviews section and generate a briefing. It summarizes the client's year: score changes, completed projects, outstanding items, and recommended discussion topics." },
      { title: "Vendor Matching", body: "When assigning a vendor to a project, the AI can recommend the best match from your vendor directory based on specialties, ratings, availability, and cost tier." },
      { title: "Transcript Summarizer", body: "After a discovery call, upload the transcript. The AI extracts goals, constraints, priorities, and key findings into structured data." },
    ],
    tip: "The Cost Estimator uses both your historical pricing data and market averages. The more estimates you create, the more accurate its suggestions become.",
    keywords: ["score explainer", "cost estimator", "meeting prep", "annual review", "vendor matching", "transcript", "ai tools"],
  },
  {
    id: "admin-learning-layer",
    category: "AI & Intelligence",
    title: "How the Self-Learning Intelligence Layer Works",
    description: "Understand how the platform learns from your work to improve over time.",
    audience: "admin",
    steps: [
      { title: "What it learns", body: "Every report you write, estimate you create, and edit you make teaches the system your preferences — writing style, pricing patterns, workflow sequences, and communication tone." },
      { title: "How it learns", body: "The system logs 'learning events' for key actions: report edits, AI draft acceptances/rejections, estimate outcomes, and more. A background process aggregates these into patterns." },
      { title: "Where you see it", body: "Learned patterns appear as better AI drafts that match your voice, more accurate cost estimates, and smarter default suggestions throughout the platform." },
      { title: "Cross-client insights", body: "The system identifies patterns across all your clients — like 'homes built before 1970 commonly need electrical panel upgrades' — and surfaces relevant insights proactively." },
      { title: "Your control", body: "All AI suggestions require your confirmation before taking action. The system augments your expertise — it never acts autonomously on client-facing content." },
    ],
    tip: "You don't need to do anything special to benefit from the learning layer — just use the platform normally. It improves automatically with every interaction.",
    keywords: ["learning", "intelligence", "patterns", "improvement", "self-learning", "smart", "personalized"],
  },
];
