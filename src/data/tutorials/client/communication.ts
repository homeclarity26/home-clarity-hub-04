import { Tutorial } from "../types";

export const clientCommunication: Tutorial[] = [
  {
    id: "client-message-advisor",
    category: "Communication",
    title: "Messaging Your Advisor",
    description: "Send and receive messages directly with your Home Clarity Hub advisor.",
    audience: "client",
    steps: [
      { title: "Go to Messages", body: "Click the 'Messages' tab in your portal navigation." },
      { title: "Type your message", body: "Type in the reply box at the bottom. Press Enter to send, or Shift+Enter for a new line." },
      { title: "Response time", body: "Your advisor typically responds within one business day." },
      { title: "For urgent matters", body: "Include the word 'URGENT' at the start of your message for emergency repairs or critical equipment failures." },
      { title: "Message history", body: "All messages are saved and searchable. This is a direct channel to your advisor — not a general support queue." },
    ],
    tip: "Be specific in your messages — 'The upstairs bathroom faucet is dripping' helps your advisor respond faster than 'I have a plumbing issue.'",
    keywords: ["message", "advisor", "send", "reply", "communication", "chat", "urgent"],
  },
  {
    id: "client-ai-assistant",
    category: "Communication",
    title: "Using the AI Assistant for Home Questions",
    description: "Get instant answers about your home's systems, report findings, and recommendations.",
    audience: "client",
    steps: [
      { title: "Open the AI assistant", body: "Click the chat bubble icon in the bottom-right corner of your portal." },
      { title: "Ask about your home", body: "Try questions like: 'What condition is my HVAC in?' or 'What are the top 3 things I should prioritize?' or 'When does my water heater warranty expire?'" },
      { title: "Get report insights", body: "Ask the AI to explain any part of your report in simpler terms: 'What does a Fair rating on my roof mean?'" },
      { title: "Explore recommendations", body: "Ask about costs: 'How much might the electrical panel upgrade cost?' — the AI references your report's pricing tiers." },
      { title: "Know its limits", body: "The AI can answer questions and explain findings, but it can't take actions like scheduling or payments. For those, message your advisor." },
    ],
    tip: "The AI knows everything in your report, equipment registry, and project history. Think of it as a 24/7 reference guide for your home.",
    keywords: ["ai", "assistant", "questions", "home", "instant", "answers", "chatbot"],
  },
  {
    id: "client-home-team",
    category: "Communication",
    title: "Contacting Your Home Team & Vendors",
    description: "Find contact information for your advisor and recommended vendors.",
    audience: "client",
    steps: [
      { title: "Go to Contacts", body: "Click the 'Contacts' tab in your portal navigation." },
      { title: "Find your advisor", body: "Your primary HBC advisor's contact info is listed at the top with their name, phone, and email." },
      { title: "Browse vendors", body: "Below your advisor, you'll find recommended vendors organized by specialty — HVAC, plumbing, electrical, roofing, etc." },
      { title: "View vendor details", body: "Each vendor card shows their company name, specialty, phone number, and email." },
      { title: "Coordinate through your advisor", body: "While you can contact vendors directly, we recommend coordinating through your advisor for the best experience and pricing." },
    ],
    tip: "Your advisor has vetted every vendor in your contacts list. These are trusted professionals who meet HBC's quality standards.",
    keywords: ["contacts", "team", "vendors", "advisor", "phone", "email", "directory"],
  },
];
