import { Tutorial } from "../types";

export const adminCommunication: Tutorial[] = [
  {
    id: "admin-messaging",
    category: "Communication",
    title: "Messaging Clients Through the Portal",
    description: "Send and manage direct messages with clients in their portal inbox.",
    audience: "admin",
    steps: [
      { title: "Open Messages", body: "From a client workspace, click the Messages tab. Or use the Inbox in the admin sidebar to see all client conversations." },
      { title: "Read unread messages", body: "Unread messages show a blue dot. The Inbox badge in the sidebar shows your total unread count." },
      { title: "Compose a reply", body: "Type your message in the input field at the bottom and press Enter to send. Shift+Enter creates a new line." },
      { title: "Use AI suggested replies", body: "Below the reply input, AI-generated reply suggestions appear based on the conversation context and the client's report." },
      { title: "Filter conversations", body: "In the Inbox, use the 'Awaiting Reply' filter to see only threads where the client is waiting on your response." },
    ],
    tip: "If a client asks a technical question about their home, open their report in a second tab while replying so you have their exact findings in front of you.",
    keywords: ["message", "inbox", "reply", "communication", "chat", "unread", "conversation"],
  },
  {
    id: "admin-announcements",
    category: "Communication",
    title: "Creating & Managing Announcements",
    description: "Broadcast messages to all clients or targeted groups at once.",
    audience: "admin",
    steps: [
      { title: "Go to Announcements", body: "Navigate to the Announcements section in the admin sidebar." },
      { title: "Click +New Announcement", body: "Enter a title and body for your announcement." },
      { title: "Choose the audience", body: "Select 'All Clients,' a specific membership tier, or hand-pick individual clients." },
      { title: "Set display type", body: "Choose between a banner (shown at the top of the portal) or a modal (shown once on next login)." },
      { title: "Set dates", body: "Set a start date and optional end date. The announcement will only appear during this window." },
      { title: "Publish", body: "Click Publish. The announcement appears in clients' portals according to your settings." },
      { title: "Track views", body: "Review the Views and Dismissals counts to see engagement with your announcement." },
    ],
    tip: "Use announcements for seasonal tips, service reminders, and policy updates. Save individual messages for conversations that need a personal touch.",
    keywords: ["announcement", "broadcast", "banner", "modal", "all clients", "notification"],
  },
  {
    id: "admin-ai-communications",
    category: "Communication",
    title: "Using the AI Agent to Draft Communications",
    description: "Let the AI Agent help you write messages, follow-ups, and client updates.",
    audience: "admin",
    steps: [
      { title: "Open the AI Agent", body: "Click the AI Agent panel in the right rail of any client workspace, or use the global AI button." },
      { title: "Ask for a draft", body: "Tell the agent what you need: 'Draft a follow-up message about the HVAC project' or 'Write a welcome message for this new client.'" },
      { title: "Review the output", body: "The agent generates a message using the client's report data, project status, and conversation history for context." },
      { title: "Edit and send", body: "Copy the message, paste it into the Messages tab, make any edits, and send." },
      { title: "Other communication tasks", body: "The agent can also draft meeting prep notes, annual review summaries, and proposal introductions — all personalized to the client." },
    ],
    tip: "The more context the AI has (completed report, active projects, message history), the better its drafts will be. Keep client records up to date for best results.",
    keywords: ["ai agent", "draft", "communication", "message", "follow up", "write", "compose"],
  },
];
