import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const articles = [
  {
    title: "How to Read Your Home Clarity Report",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>Your Home Clarity Report is divided into four chapters: <strong className="text-foreground">Exterior</strong>, <strong className="text-foreground">Interior</strong>, <strong className="text-foreground">Systems</strong>, and <strong className="text-foreground">Strategic Plan</strong>. Each chapter contains individual findings rated on a five-point condition scale.</p>
        <p>The overall Home Health Score (shown as a number out of 100) is a weighted average across all three scored chapters. Priority Action Items appear at the top of your report and highlight the most urgent findings requiring attention.</p>
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> <span><strong className="text-foreground">Excellent</strong> — Performing well, no action needed</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> <span><strong className="text-foreground">Good</strong> — Minor wear, monitor annually</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> <span><strong className="text-foreground">Fair</strong> — Showing age, plan for service in 1-3 years</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> <span><strong className="text-foreground">Poor</strong> — Needs attention soon, budget this year</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> <span><strong className="text-foreground">Critical</strong> — Immediate action required</span></div>
        </div>
      </div>
    ),
  },
  {
    title: "Understanding Your Home Health Score",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>Your score rates your home's overall condition from 0 to 100. Here's what the ranges mean:</p>
        <ul className="space-y-2 list-none pl-0">
          <li><strong className="text-foreground">80–100:</strong> Your home is in great shape. Keep up with routine maintenance.</li>
          <li><strong className="text-foreground">60–79:</strong> Some areas need attention. Review your Priority Action Items and start planning.</li>
          <li><strong className="text-foreground">40–59:</strong> Several systems need investment. Work with your advisor on a project plan.</li>
          <li><strong className="text-foreground">Below 40:</strong> Urgent attention is needed in multiple areas. Your advisor will help you prioritize.</li>
        </ul>
        <p>Scores improve over time as projects are completed and systems are updated. Your advisor updates your score when your report is revised after work is done.</p>
      </div>
    ),
  },
  {
    title: "How Projects Work",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>Projects come in two forms: <strong className="text-foreground">Active Projects</strong> (approved work currently underway or scheduled) and <strong className="text-foreground">Upcoming Considerations</strong> (items your advisor recommends planning for in the future).</p>
        <p>Each active project shows a status badge: <strong className="text-foreground">Planned</strong> (approved but not yet started), <strong className="text-foreground">In Progress</strong> (work is underway), and <strong className="text-foreground">Complete</strong> (finished).</p>
        <p>Projects are linked directly to findings in your Home Clarity Report. When a project is completed, your advisor will update the related report finding and your Home Health Score may improve.</p>
        <p>To request a new project or ask about a consideration, send a message to your advisor from the Messages section.</p>
      </div>
    ),
  },
  {
    title: "How to Use Payments & Invoices",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>The Payments page shows three key numbers at the top: <strong className="text-foreground">Current Balance</strong> (what you owe today), <strong className="text-foreground">Total Paid</strong> (all payments made to date), and <strong className="text-foreground">Next Payment</strong> (the upcoming invoice and its due date).</p>
        <p>Below that, the Invoices & Estimates tab lists all invoices with their status: <strong className="text-foreground">Sent</strong> (awaiting payment), <strong className="text-foreground">Paid</strong> (payment received and confirmed), and <strong className="text-foreground">Overdue</strong> (past the due date).</p>
        <p>Click any invoice row to view the full invoice detail. If you have a question about an invoice, send a message to your advisor directly from the Messages section.</p>
      </div>
    ),
  },
  {
    title: "Your Equipment Registry Explained",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>The Equipment Registry is a complete record of your home's major systems and appliances — HVAC, electrical, plumbing, and more. Each item shows its brand, model, serial number, install date, warranty status, next recommended service date, and estimated replacement cost.</p>
        <p>The colored dot next to each item reflects its current condition (same scale as your report). A <strong className="text-foreground">"Service Due Soon"</strong> badge appears when a service date is within 60 days. When you see this badge, contact your advisor — they can coordinate with a trusted vendor on your behalf.</p>
        <p><strong className="text-foreground">"Warranty Expired"</strong> badges are informational and remind you that repairs will be out-of-pocket.</p>
      </div>
    ),
  },
  {
    title: "Uploading & Managing Documents",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>The Documents section stores all files shared between you and your advisor, organized by category (Discovery Call Notes, Exterior Photos, Reports, Vendor Estimates, etc.).</p>
        <p>To upload a file yourself, drag and drop it onto the upload area or click Browse Files. Supported file types include PDF, JPG, PNG, MP3, MP4, and Word documents.</p>
        <p>To view a file, click its card — it will open in a new browser tab. To search for a specific file, use the search bar above the file grid. Filter by category using the dropdown on the right.</p>
      </div>
    ),
  },
  {
    title: "How to Message Your Advisor",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>The Messages section is your direct line to your Home Clarity Hub advisor. Type your message in the reply box at the bottom and press Enter (or click Send) to send. Shift+Enter creates a new line without sending.</p>
        <p>Your advisor typically responds within one business day. For urgent matters — such as an emergency repair or a critical equipment failure — include the word <strong className="text-foreground">"URGENT"</strong> at the start of your message so your advisor sees it right away.</p>
        <p>All message history is saved and searchable. This channel is monitored by your advisor directly — not a general support queue.</p>
      </div>
    ),
  },
  {
    title: "Your Annual Maintenance Schedule",
    content: (
      <div className="space-y-3 text-xs font-sans text-muted-foreground leading-relaxed">
        <p>The Schedule page has two parts: a monthly <strong className="text-foreground">Calendar</strong> showing upcoming appointments, reminders, and project milestones; and a <strong className="text-foreground">Seasonal Checklist</strong> section with four lists — Spring, Summer, Fall, and Winter.</p>
        <p>Each checklist contains the maintenance tasks your advisor recommends for that time of year based on your home's specific systems and equipment. Click "View Tasks" on any season card to see the full list.</p>
        <p>Tasks listed here are general recommendations — your advisor has customized them based on your report findings. If you want help scheduling or completing any of these items, message your advisor or check your Active Projects.</p>
      </div>
    ),
  },
];

const HowToGuidesTab = () => (
  <Accordion type="single" collapsible className="space-y-1">
    {articles.map((article, i) => (
      <AccordionItem key={i} value={`article-${i}`} className="border-b border-border/50">
        <AccordionTrigger className="text-sm font-sans font-medium text-foreground hover:text-accent py-3 px-1 [&[data-state=open]]:text-accent">
          {article.title}
        </AccordionTrigger>
        <AccordionContent className="px-1 pb-4">
          {article.content}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export default HowToGuidesTab;
