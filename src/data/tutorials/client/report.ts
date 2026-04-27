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
    tip: "Don't try to read the whole report in one sitting. Start with the Priority Action Items, then explore specific sections as needed.",
    keywords: ["report", "read", "chapters", "condition", "rating", "findings", "assessment"],
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
