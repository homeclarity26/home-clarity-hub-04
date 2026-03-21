import { Tutorial } from "../types";

export const clientReport: Tutorial[] = [
  {
    id: "client-read-report",
    category: "Your Home Report",
    title: "How to Read Your Home Clarity Report",
    description: "Understand the structure, chapters, and condition ratings in your home assessment.",
    audience: "client",
    steps: [
      { title: "Go to the Report tab", body: "Click 'Report' in the top navigation. Your full Home Clarity Report is organized into chapters." },
      { title: "Understand the chapters", body: "Your report has four main sections: Exterior (roof, siding, windows, foundation), Interior (rooms, floors, ceilings), Systems (HVAC, electrical, plumbing), and Strategic Plan (project roadmap)." },
      { title: "Read condition ratings", body: "Each finding has a color-coded rating: Excellent (green), Good (teal), Fair (gold), Poor (orange), or Critical (red)." },
      { title: "Review recommendations", body: "Each section includes your advisor's recommendations with estimated costs across three tiers: Essential, Enhanced, and Signature." },
      { title: "Check Priority Action Items", body: "At the top of your report, the Priority Action Items highlight the most urgent findings requiring attention." },
      { title: "View the Financial Roadmap", body: "The Financial Roadmap page shows a complete cost projection organized by urgency: Urgent, Near-Term, and Planned." },
    ],
    tip: "Don't try to read the whole report in one sitting. Start with the Priority Action Items and your overall Health Score, then explore specific sections as needed.",
    keywords: ["report", "read", "chapters", "condition", "rating", "findings", "assessment"],
  },
  {
    id: "client-health-score",
    category: "Your Home Report",
    title: "Understanding Your Home Health Score",
    description: "Learn what the 0-100 score means and how it improves over time.",
    audience: "client",
    steps: [
      { title: "Find your score", body: "Your Home Health Score is displayed prominently on the Home tab and at the top of your Report." },
      { title: "What the ranges mean", body: "80-100: Your home is in great shape. 60-79: Some areas need attention. 40-59: Several systems need investment. Below 40: Urgent attention needed." },
      { title: "How it's calculated", body: "The score is a weighted average of condition ratings across all three main chapters: Exterior, Interior, and Systems." },
      { title: "How it improves", body: "When projects are completed and your advisor updates the condition ratings, your score automatically improves. It's a living number that reflects real progress." },
      { title: "Track changes over time", body: "Your score history shows how it has changed over months and years — a record of your home's journey." },
    ],
    tip: "Think of your Health Score like a credit score for your home. Every completed project and maintained system moves the needle in the right direction.",
    keywords: ["health score", "score", "rating", "0-100", "improve", "track"],
  },
  {
    id: "client-property-history",
    category: "Your Home Report",
    title: "Viewing Your Property History & Past Versions",
    description: "Access previous report versions and see how your home has changed over time.",
    audience: "client",
    steps: [
      { title: "Go to Report", body: "Open the Report tab from the top navigation." },
      { title: "Look for Version History", body: "If your report has been updated, you can view previous versions to see what changed." },
      { title: "Compare before and after", body: "Version comparisons show which sections were updated, how condition ratings changed, and what new findings were added." },
      { title: "Download any version", body: "Use the Download PDF button to save any version of your report for your records." },
    ],
    tip: "After a major project is completed, check your updated report to see the condition rating improvement. It's satisfying to see your investment reflected in better scores.",
    keywords: ["history", "versions", "past", "compare", "changes", "download", "pdf"],
  },
];
