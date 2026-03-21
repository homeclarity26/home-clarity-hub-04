import { Tutorial } from "../types";

export const adminSettings: Tutorial[] = [
  {
    id: "admin-account-settings",
    category: "Settings & Admin",
    title: "Account Settings & Notification Preferences",
    description: "Manage your profile, notification preferences, and system configuration.",
    audience: "admin",
    steps: [
      { title: "Go to Settings", body: "Click Settings in the admin sidebar." },
      { title: "Update your profile", body: "Edit your name, email, phone, and profile photo. These appear in client-facing communications." },
      { title: "Configure notifications", body: "Toggle notifications for: New Messages, Invoice Payments, Report Views, Client Logins, and Automation Alerts." },
      { title: "Set business defaults", body: "Configure your default service area, hourly rate, and standard payment terms." },
      { title: "Manage API keys", body: "View and manage API keys for integrations. Generate new keys or revoke existing ones as needed." },
    ],
    tip: "Keep your notification preferences up to date as your practice grows. What made sense with 5 clients may be too noisy with 50.",
    keywords: ["settings", "account", "notifications", "profile", "preferences", "configuration"],
  },
  {
    id: "admin-command-palette",
    category: "Settings & Admin",
    title: "Using the Command Palette & Keyboard Shortcuts",
    description: "Navigate the platform faster with keyboard shortcuts and the global command palette.",
    audience: "admin",
    steps: [
      { title: "Open the Command Palette", body: "Press / (forward slash) from anywhere in the admin to open the global search and command palette." },
      { title: "Search for anything", body: "Type a client name, page title, or action to quickly jump to it. Results update in real time as you type." },
      { title: "Quick navigation", body: "Type a destination like 'Calendar,' 'Inbox,' or a client name to navigate directly." },
      { title: "Key shortcuts", body: "N = New Report (from Clients page), I = Go to Inbox, T = Go to Tasks, Esc = Close any modal or panel." },
      { title: "Use from any page", body: "The Command Palette works everywhere in the admin — it's the fastest way to get where you need to go." },
    ],
    tip: "The Command Palette is the power user's secret weapon. Once you get used to pressing / instead of clicking through menus, you'll never go back.",
    keywords: ["command palette", "keyboard", "shortcuts", "search", "navigation", "quick", "slash"],
  },
];
