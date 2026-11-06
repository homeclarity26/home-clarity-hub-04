import { Tutorial } from "../types";

export const clientProjectsGoals: Tutorial[] = [
  {
    id: "client-view-projects",
    category: "Projects & Goals",
    title: "Viewing Your Active Projects",
    description: "Track the status of all home improvement projects managed by your advisor.",
    audience: "client",
    steps: [
      { title: "Go to Projects", body: "Click the 'Projects' tab to see all your projects." },
      { title: "Understand project types", body: "Active Projects are approved work currently underway or scheduled. Upcoming Considerations are items your advisor recommends for future planning." },
      { title: "Read status badges", body: "Planned = approved but not started. In Progress = work is underway. Complete = finished." },
      { title: "View project details", body: "Click any project to see its full description, priority level, estimated cost, assigned vendor, and timeline." },
      { title: "See how projects connect to your report", body: "Many projects are linked to specific findings in your report. When completed, the related finding's condition rating improves." },
    ],
    tip: "Check your Projects tab regularly to stay informed about what's happening with your home. Your advisor updates project statuses as work progresses.",
    keywords: ["projects", "active", "status", "planned", "in progress", "complete", "tracking"],
  },
  {
    id: "client-add-goal",
    category: "Projects & Goals",
    title: "Adding a Goal or Wishlist Item",
    description: "Tell your advisor what you'd like to accomplish with your home.",
    audience: "client",
    steps: [
      { title: "Go to Goals", body: "Navigate to the Goals section (you may find it under the 'More' menu in your tabs)." },
      { title: "Click +New Goal", body: "Enter a title for your goal (e.g., 'Finish the basement' or 'Upgrade kitchen countertops')." },
      { title: "Add details", body: "Write a description of what you envision, select a category, and optionally set a target date." },
      { title: "Submit", body: "Your advisor will see the goal and can discuss it with you, estimate costs, and incorporate it into your home's plan." },
      { title: "Track progress", body: "As work progresses toward your goal, your advisor updates the progress percentage so you can see how close you are." },
    ],
    tip: "Don't hold back on wishlist items; even long-term dreams help your advisor plan a roadmap that accounts for everything you want to accomplish.",
    keywords: ["goal", "wishlist", "add", "dream", "plan", "want", "future"],
  },
  {
    id: "client-respond-proposal",
    category: "Projects & Goals",
    title: "Reviewing & Responding to a Proposal",
    description: "View proposals from your advisor and accept, decline, or ask questions.",
    audience: "client",
    steps: [
      { title: "Receive notification", body: "When your advisor sends a proposal, you'll see a notification in your portal." },
      { title: "Open the proposal", body: "Click to view the full proposal including scope of work, timeline, pricing, and any optional add-ons." },
      { title: "Review pricing tiers", body: "Proposals often include tiered options. Review what's included in each tier to find the best fit for your budget." },
      { title: "Select optional items", body: "If the proposal has optional line items, check the ones you want included in your project." },
      { title: "Accept or respond", body: "Click Accept to approve the proposal, or send a message to your advisor with questions before deciding." },
    ],
    tip: "If you're unsure about any aspect of a proposal, don't hesitate to message your advisor with questions. They'd rather you feel confident before approving.",
    keywords: ["proposal", "estimate", "accept", "decline", "review", "pricing", "approve"],
  },
];
