import { useState } from "react";
import { Play, CheckCircle, BookOpen, LayoutGrid, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AdminHeader from "@/components/admin/AdminHeader";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

// Tour definitions
const tours = [
  { id: "dashboard-tour", title: "Admin Dashboard Tour", steps: 6, description: "Learn your command center for all clients and business activity." },
  { id: "create-report-tour", title: "Creating a Client & Publishing a Report", steps: 8, description: "Walk through the full workflow from new client to published report." },
  { id: "inbox-tour", title: "Using the Unified Inbox", steps: 5, description: "Master your client communication hub with AI-assisted replies." },
  { id: "projects-vendors-tour", title: "Managing Projects & Vendors", steps: 6, description: "Track projects, assign vendors, and create invoices seamlessly." },
  { id: "automations-tour", title: "Setting Up Automations", steps: 5, description: "Configure background rules for follow-ups and alerts." },
];

// Reference cards data
const referenceCards = [
  { title: "Condition Rating Scale", icon: "🎯", items: ["Excellent (green) — Like new, no action needed", "Good (teal) — Minor wear, monitor annually", "Fair (gold) — Showing age, plan in 1-3 years", "Poor (orange) — Needs attention within 12 months", "Critical (red) — Immediate action required", "No Data (grey) — Not yet assessed"] },
  { title: "Report Chapter Overview", icon: "📋", items: ["Exterior — Roof, siding, windows, gutters, foundation, landscaping", "Interior — Rooms, ceilings, floors, doors, attic, basement", "Systems — HVAC, electrical, plumbing, water heater", "Strategic Plan — Year 1 to 5+ project roadmap"] },
  { title: "Project Status Labels", icon: "🔧", items: ["Planned — Approved, not yet started", "In Progress — Work is currently underway", "Complete — Finished, report updated", "Upcoming Consideration — Recommended for future planning"] },
  { title: "Invoice Status Labels", icon: "💰", items: ["Draft — Created but not sent to client", "Sent — Delivered to client, awaiting payment", "Paid — Payment received and confirmed", "Overdue — Past due date, escalation may be active"] },
  { title: "AI Tools at a Glance", icon: "✨", items: ["Draft Assistant — Field notes → polished report narrative", "Score Explainer — Score + ratings → plain-English summary", "Cost Estimator — Project details → 3-tier cost range", "Message Suggestions — Thread context → 3 reply drafts", "Vendor Matching — Project + vendor list → top 3 recommendations", "Transcript Summarizer — Discovery call → structured findings"] },
  { title: "Automation Rules Summary", icon: "⚡", items: ["Client inactive 30 days → check-in message", "Equipment service due, no project → admin task", "Invoice overdue → escalation + task", "Project stalled 45 days → follow-up task", "Message unanswered 24 hrs → email alert + task", "Poor score, no project → flag task", "Client anniversary → renewal task"] },
  { title: "Admin Keyboard Shortcuts", icon: "⌨️", items: ["/ — Open global search", "N — New Report (from Clients page)", "I — Go to Inbox", "T — Go to Tasks", "Esc — Close any open modal or panel"] },
  { title: "Key Admin Metrics Explained", icon: "📊", items: ["Active Clients — Clients with published reports + portal access", "Collection Rate — Total collected ÷ total invoiced × 100", "Message Friction Cost — Estimated admin cost per message exchange", "Home Health Score — 0-100 weighted average across 3 report chapters", "Client Profitability Score — Revenue ÷ estimated time cost per client"] },
];

const ProTip = ({ children }: { children: string }) => (
  <div className="border-l-[3px] border-l-accent bg-accent/5 rounded-r-md p-3 mt-3">
    <p className="text-xs font-sans text-foreground">
      <span className="font-semibold text-accent">Pro Tip:</span> {children}
    </p>
  </div>
);

const GuideStep = ({ num, title, body }: { num: number; title: string; body: string }) => (
  <div className="flex gap-3 mb-3">
    <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">{num}</span>
    <div>
      <p className="text-xs font-sans text-foreground"><strong>{title}</strong></p>
      <p className="text-xs font-sans text-muted-foreground">{body}</p>
    </div>
  </div>
);

// Guides content
const guideTabs = {
  "Getting Started": [
    {
      title: "Setting Up Your Admin Account",
      steps: [
        { title: "Update your profile", body: "Go to Settings and update your full name and phone number. Your name appears on client-facing communications." },
        { title: "Connect Stripe", body: "In Settings under Stripe Integration, paste your Stripe secret key to enable online invoice payments from clients." },
        { title: "Set your service area", body: "Enter your default service area (e.g., Summit County, OH) in Settings. This pre-fills location fields when creating new clients." },
        { title: "Configure notifications", body: "Toggle the email notifications you want in Settings. We recommend enabling all five by default so nothing slips through." },
        { title: "Set your hourly rate", body: "In the Business Intelligence section of Settings, enter your target hourly rate. This is used to calculate per-client profitability scores." },
        { title: "Add your first vendor", body: "Go to Vendors and add at least one contractor before creating your first project, so you can assign them right away." },
      ],
      tip: "Complete the Admin Setup Checklist on your Dashboard — it tracks your progress through all first-time setup steps automatically.",
    },
    {
      title: "Adding Your First Client",
      steps: [
        { title: "Go to Clients", body: "Click \"+New Client.\"" },
        { title: "Enter client details", body: "Enter the client's full name, email address, and phone number." },
        { title: "Enter the property address", body: "The system will geocode this address and place a pin on your admin map." },
        { title: "Set membership date", body: "Set the membership start date." },
        { title: "Create the client", body: "Click Create Client. The client record is created and a portal is automatically provisioned for them." },
        { title: "Send welcome message", body: "Go to the Messages tab on the new client record and send a welcome message so they know their portal is ready." },
        { title: "Start a report", body: "Start a new report by clicking \"+New Report\" from the client record." },
      ],
      tip: "You can also create a new client directly from the '+New Report' button in the top right — it will prompt you to create the client first if they don't exist yet.",
    },
  ],
  "Reports": [
    {
      title: "Writing a Home Clarity Report",
      steps: [
        { title: "Open client record", body: "Click \"+New Report.\"" },
        { title: "Set property details", body: "Confirm the property address and estimated market value in the report header fields." },
        { title: "Navigate to Exterior chapter", body: "Add each finding (e.g., Roof, Gutters, Siding) and set a condition rating for each using the dropdown." },
        { title: "Use AI Draft Assistant", body: "Paste your bullet-point field notes for that section, select \"Exterior,\" and click Generate Draft. Review and edit, then click Insert." },
        { title: "Repeat for all chapters", body: "Repeat for the Interior and Systems chapters." },
        { title: "Build the Strategic Plan", body: "Add recommended projects with timeframes (Year 1, Year 2-3, Year 3-5) and urgency labels." },
        { title: "Review Health Scores", body: "Review the auto-calculated Health Scores for each chapter. Use the \"Explain This Score\" button to generate plain-English summaries." },
        { title: "Add Priority Action Items", body: "These should reflect the most urgent Poor or Critical findings." },
        { title: "Preview", body: "Click Preview to review the full report exactly as the client will see it." },
        { title: "Publish", body: "Click Publish. The report goes live in the client's portal and triggers an email notification to the client." },
      ],
      tip: "Save your report as a Draft frequently while writing. The report auto-saves, but publishing is always a manual step so you control exactly when the client sees it.",
    },
    {
      title: "Updating a Report After Project Completion",
      steps: [
        { title: "Open client record", body: "Click into their existing published report." },
        { title: "Navigate to the finding", body: "Go to the chapter and finding that was addressed by the completed project." },
        { title: "Update condition rating", body: "E.g., change HVAC from Poor to Fair now that the furnace has been serviced." },
        { title: "Adjust Health Score", body: "Adjust the Health Score for that chapter if warranted." },
        { title: "Add a note", body: "E.g., \"Furnace replaced April 2026 — new Carrier 58STA unit installed by Comfort First HVAC.\"" },
        { title: "Review version history", body: "Click Version History to review the before/after comparison and confirm changes." },
        { title: "Publish", body: "Click Publish to push the updated report to the client portal." },
      ],
      tip: "Updating reports after project completion is one of the most powerful ways to show clients the value of their HBC membership — their score visibly improves.",
    },
  ],
  "Clients & Communication": [
    {
      title: "Managing Day-to-Day Client Communication",
      steps: [
        { title: "Check your Inbox every morning", body: "The Inbox nav item shows a red badge with your total unread count." },
        { title: "Use the Awaiting Reply filter", body: "See only threads where the client sent the last message and is waiting on you." },
        { title: "Use AI Suggested Replies", body: "The AI reads the client's full report and conversation history to generate relevant, accurate replies." },
        { title: "Add Timeline notes", body: "For important conversations, add a note to the client's Timeline so you have a record of what was discussed and when." },
        { title: "Use Announcements for broadcasts", body: "For non-urgent messages (seasonal tips, service reminders, policy updates) rather than individual messages." },
      ],
      tip: "If a client asks a technical question about their report, open their report in a second browser tab while replying so you have their exact findings in front of you.",
    },
    {
      title: "Reading the Client Timeline",
      steps: [
        { title: "Open client Timeline tab", body: "Open a client record and click the Timeline tab." },
        { title: "Review chronologically", body: "The timeline shows every touchpoint in reverse chronological order — messages, invoices, report publishes, project updates, documents, logins, and AI actions." },
        { title: "Look for activity gaps", body: "If you don't see a client login in 30+ days, the Automations system should have already flagged this." },
        { title: "Add internal notes", body: "Click \"+Add Note\" to write an internal admin note. These notes are private — clients never see them." },
        { title: "Log phone calls", body: "Use notes to log phone call summaries, meeting notes, or anything that doesn't fit neatly into another part of the system." },
      ],
      tip: "The sparkle icon on timeline events indicates an AI action was taken — like a draft being generated or a vendor match being run. This gives you a full audit trail of AI usage per client.",
    },
  ],
  "Billing": [
    {
      title: "Creating and Sending an Invoice",
      steps: [
        { title: "Open Payments tab", body: "Go to a client record and click the Payments tab, or create an invoice directly from a Project card using the \"Create Invoice\" button." },
        { title: "Create manually or from project", body: "If creating manually: click \"+New Invoice,\" set the title, add line items, and set the due date." },
        { title: "From project", body: "Click \"Create Invoice\" on the project card. The modal pre-fills with the project name, scope, and cost estimate." },
        { title: "Create & Send", body: "The invoice is created with a \"Sent\" status and the client receives an email notification." },
        { title: "Monitor payment status", body: "Overdue invoices trigger the payment escalation automation rules configured in Settings." },
      ],
      tip: "Set your due date to 14 days from today as a default. Clients with autopay or Stripe saved cards will often pay within 48 hours of receiving the invoice.",
    },
    {
      title: "Configuring Payment Escalation Rules",
      steps: [
        { title: "Go to Settings", body: "Scroll to the Payment Escalation Rules section." },
        { title: "Review pre-built rules", body: "Four rules: Day 1 gentle reminder, Day 7 firm follow-up, Day 14 final notice + admin flag, Day 30 collections risk + urgent task." },
        { title: "Toggle rules on/off", body: "Toggle each rule depending on your preferred escalation style." },
        { title: "Automated execution", body: "These rules run automatically — you don't need to manually send reminders. The system handles it." },
        { title: "Audit trail", body: "All escalation activity is logged in the client's Timeline so you have a full audit trail." },
      ],
      tip: "We recommend enabling all four rules. The Day 14 admin flag is especially useful — it creates a Task in your Task Board so overdue invoices stay visible to you.",
    },
  ],
  "AI Features": [
    {
      title: "Using the AI Report Draft Assistant",
      steps: [
        { title: "Open report editor", body: "Navigate to the section you want to draft (Exterior, Interior, Systems, or Strategic Plan)." },
        { title: "Paste field notes", body: "In the AI Draft Assistant panel, paste your field notes as bullet points. Example: \"Roof — 14 years old, 2 missing shingles south face.\"" },
        { title: "Select section", body: "Select the section from the dropdown." },
        { title: "Generate Draft", body: "The AI returns a polished paragraph in the voice of a trusted home advisor." },
        { title: "Review and edit", body: "Review the draft. Edit any details as needed." },
        { title: "Insert into Section", body: "Push the text into the report's narrative field for that section." },
        { title: "Repeat", body: "Repeat for each section. Use \"Generate All Score Explanations\" for score summaries in one click." },
      ],
      tip: "The more specific your bullet-point notes are, the better the AI output. Include ages, brands, conditions, and specific observations rather than general statements.",
    },
    {
      title: "AI Message Reply Suggestions",
      steps: [
        { title: "Open the Inbox", body: "Click on any client conversation." },
        { title: "View suggestions", body: "Below the reply input, the \"AI Suggested Replies\" panel shows three pre-generated options based on the conversation and client report." },
        { title: "Load a suggestion", body: "Click any suggestion card to load it into the reply input field." },
        { title: "Edit and send", body: "Edit the text as needed, then press Send. The message is delivered to the client's portal in real time." },
        { title: "Regenerate", body: "Click the Regenerate button (circular arrow icon) to get three new suggestions if the first set doesn't fit." },
      ],
      tip: "AI suggestions work best when the client's report is fully published. The AI reads their actual findings to give contextually accurate answers about their home.",
    },
    {
      title: "AI Cost Estimator for Projects",
      steps: [
        { title: "Open a project", body: "Open a project in a client record (or create a new one)." },
        { title: "Click AI Cost Estimate", body: "Click the \"AI Cost Estimate\" button in the project panel." },
        { title: "Fill in details", body: "Project Type, System Age, Brand/Model if known, and Condition." },
        { title: "Generate Estimate", body: "The AI returns three cost tiers: Conservative, Recommended, and Premium — each with a dollar amount and rationale." },
        { title: "Use a tier", body: "Click \"Use Recommended\" (or Conservative/Premium) to auto-fill the project's cost estimate field." },
      ],
      tip: "Always share the Recommended estimate with clients rather than just the Conservative one. It sets realistic expectations and reduces surprise costs mid-project.",
    },
  ],
  "Automations & Settings": [
    {
      title: "Setting Up Your First Automation Rules",
      steps: [
        { title: "Go to Automations", body: "Go to the Automations section in the admin sidebar." },
        { title: "Review pre-built rules", body: "Review the seven pre-built rules. Read the description of each rule before toggling it on." },
        { title: "Set thresholds", body: "For rules with configurable thresholds (like \"client hasn't logged in for X days\"), set the number that matches your service standard. 30 days is a good starting point." },
        { title: "Enable key rules", body: "Start with at least: Client Inactivity Check-In, Invoice Overdue Task, and Project Stalled Alert." },
        { title: "Review after one week", body: "Come back and review the Trigger Count and Last Triggered columns to see which rules are firing." },
        { title: "Check logs", body: "Check the Automation Logs section for a full history of all actions taken." },
      ],
      tip: "Don't enable all seven rules at once on day one. Start with three, get comfortable with how they work, then layer in the rest.",
    },
    {
      title: "Customizing Client Portal Branding",
      steps: [
        { title: "Go to Settings", body: "Scroll to the Branding section." },
        { title: "Update company name", body: "Update the company display name if needed." },
        { title: "Upload your logo", body: "This appears in the client portal header and on PDF reports." },
        { title: "Confirm colors", body: "Confirm your primary color settings match your brand." },
        { title: "Preview Portal", body: "Use the \"Preview Portal\" button to see how the client-facing portal looks with your branding applied." },
      ],
      tip: "Upload a high-resolution PNG logo with a transparent background for the best result across both the light cream portal and the dark navy report header.",
    },
  ],
};

const AdminHelpCenter = () => {
  const { progress, markTourComplete } = useTutorialProgress();
  const completedTours = (progress?.completed_tours || []) as string[];

  const handleStartTour = (tourId: string) => {
    // For now, mark tour as complete immediately. 
    // Full interactive tour overlay would require targeting specific DOM elements
    markTourComplete(tourId);
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Help & Tutorials" }]} />
      <div className="p-6 max-w-7xl space-y-8">

        {/* Section 1: Interactive Walkthroughs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-foreground">Interactive Walkthroughs</h2>
          </div>
          <p className="text-sm font-sans text-muted-foreground mb-4">
            Step-by-step guided tours that walk you through key workflows in the admin panel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map((tour) => {
              const done = completedTours.includes(tour.id);
              return (
                <Card key={tour.id} className="p-5 border-l-[3px] border-l-accent">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-sans font-semibold text-foreground pr-2">{tour.title}</h3>
                    {done && (
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0 text-accent border-accent">
                        <CheckCircle className="w-3 h-3 mr-1" /> Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-sans text-muted-foreground mb-3">{tour.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{tour.steps} steps</span>
                    <Button
                      size="sm"
                      variant={done ? "outline" : "default"}
                      className="text-xs font-sans h-7"
                      onClick={() => handleStartTour(tour.id)}
                    >
                      {done ? "Restart Tour" : "Start Tour →"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Section 2: Step-by-Step Guides */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-foreground">Step-by-Step Guides</h2>
          </div>
          <Tabs defaultValue="Getting Started">
            <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {Object.keys(guideTabs).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="text-xs font-sans">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(guideTabs).map(([tabName, guides]) => (
              <TabsContent key={tabName} value={tabName} className="mt-4">
                <Accordion type="single" collapsible className="space-y-2">
                  {guides.map((guide, gi) => (
                    <AccordionItem key={gi} value={`guide-${tabName}-${gi}`} className="border rounded-md px-4">
                      <AccordionTrigger className="text-sm font-sans font-medium text-foreground hover:text-accent py-3 [&[data-state=open]]:text-accent">
                        {guide.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {guide.steps.map((step, si) => (
                          <GuideStep key={si} num={si + 1} title={step.title} body={step.body} />
                        ))}
                        {guide.tip && <ProTip>{guide.tip}</ProTip>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Section 3: Quick Reference Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-foreground">Quick Reference Cards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referenceCards.map((card, i) => (
              <Card key={i} className="p-5 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{card.icon}</span>
                  <h3 className="text-sm font-sans font-semibold text-foreground">{card.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {card.items.map((item, j) => (
                    <li key={j} className="text-xs font-sans text-muted-foreground flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHelpCenter;
