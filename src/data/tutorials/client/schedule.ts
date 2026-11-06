import { Tutorial } from "../types";

export const clientSchedule: Tutorial[] = [
  {
    id: "client-view-calendar",
    category: "Schedule",
    title: "Viewing Your Maintenance Calendar",
    description: "See all upcoming appointments, reminders, and milestones for your home.",
    audience: "client",
    steps: [
      { title: "Go to Schedule", body: "Click the 'Schedule' tab in your portal navigation." },
      { title: "Browse the calendar", body: "The monthly calendar shows all upcoming events: appointments, inspections, reminders, project milestones, and maintenance tasks." },
      { title: "View event details", body: "Click any event to see its full details including type, date, time, and description." },
      { title: "Today and upcoming", body: "Events are also listed below the calendar in groups: Today, This Week, and Upcoming." },
      { title: "Check seasonal checklists", body: "Scroll below the calendar to find your seasonal maintenance checklists for Spring, Summer, Fall, and Winter." },
    ],
    tip: "Check your calendar at the start of each month to see what's coming up. Your advisor adds events as they schedule inspections and project milestones.",
    keywords: ["calendar", "schedule", "events", "appointments", "upcoming", "reminders"],
  },
  {
    id: "client-schedule-consultation",
    category: "Schedule",
    title: "Scheduling a Consultation with Your Advisor",
    description: "Request a call or meeting with your advisor through the portal.",
    audience: "client",
    steps: [
      { title: "Send a message", body: "Go to the Messages tab and send a message to your advisor requesting a consultation." },
      { title: "Include your preferred times", body: "Mention 2-3 time slots that work for you so your advisor can find a match quickly." },
      { title: "Describe the topic", body: "Let your advisor know what you'd like to discuss; a specific project, your annual review, a new concern, etc." },
      { title: "Confirmation", body: "Your advisor will confirm the meeting and it will appear on your Schedule calendar." },
    ],
    tip: "For urgent matters like emergency repairs or critical equipment failures, include the word 'URGENT' at the start of your message so your advisor sees it right away.",
    keywords: ["consultation", "meeting", "schedule", "call", "advisor", "book", "appointment"],
  },
];
