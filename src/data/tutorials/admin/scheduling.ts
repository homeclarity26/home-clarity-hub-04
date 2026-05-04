import { Tutorial } from "../types";

export const adminScheduling: Tutorial[] = [
  {
    id: "admin-calendar",
    category: "Scheduling & Calendar",
    title: "Managing Your Calendar & Events",
    description: "Create, view, and manage appointments, tasks, and milestones across all clients.",
    audience: "admin",
    steps: [
      { title: "Open Calendar", body: "Navigate to the Calendar section in the admin sidebar for a unified view of all events across every client." },
      { title: "Create an event", body: "Click on a date or the +New Event button. Select the event type: Appointment, Milestone, Task, Inspection, or Reminder." },
      { title: "Link to a client", body: "Select the client and optionally a specific project the event relates to." },
      { title: "Set details", body: "Enter the title, description, date/time, and any notes." },
      { title: "View by client", body: "From a client workspace, the Schedule tab shows only that client's events with today/this week/upcoming groupings." },
      { title: "Check the history", body: "Past events appear in the History section, giving you a record of all completed appointments and inspections." },
    ],
    tip: "Use the monthly calendar view to spot scheduling gaps and ensure you're maintaining regular touchpoints with all active clients.",
    keywords: ["calendar", "events", "appointment", "schedule", "milestone", "task", "inspection"],
  },
  {
    id: "admin-annual-reviews",
    category: "Scheduling & Calendar",
    title: "Annual Reviews Overview",
    description: "Prepare for and conduct annual client review meetings.",
    audience: "admin",
    steps: [
      { title: "Open Annual Reviews", body: "Navigate to the Annual Reviews section in the admin sidebar." },
      { title: "Generate a briefing", body: "Select a client and click 'Generate Briefing.' The AI compiles their year in review: condition changes, completed projects, outstanding items, investment totals, and recommended topics." },
      { title: "Schedule the call", body: "Set a review call date. The client is notified of the upcoming meeting." },
      { title: "Conduct the review", body: "Use the generated briefing as your agenda. Walk through accomplishments, current priorities, and the plan for the coming year." },
      { title: "Log outcomes", body: "After the meeting, add outcome notes and any new action items. Mark the review as complete." },
      { title: "Generate the Annual Report Card", body: "Create a shareable Annual Report Card showing the client's year-over-year progress — score improvement, projects completed, and investment value." },
    ],
    tip: "Annual reviews are the single best retention tool. Clients who see their home's improvement over time are far more likely to renew their membership.",
    keywords: ["annual review", "briefing", "meeting", "year in review", "report card", "retention"],
  },
];
