import { Tutorial } from "../types";

export const clientPayments: Tutorial[] = [
  {
    id: "client-view-invoices",
    category: "Payments",
    title: "Viewing Your Invoices",
    description: "Find and review all invoices from your advisor in one place.",
    audience: "client",
    steps: [
      { title: "Go to Payments", body: "Click the 'Payments' tab in your portal navigation." },
      { title: "View summary cards", body: "At the top, you'll see three key numbers: Current Balance (what you owe today), Total Paid (all payments to date), and Next Payment (upcoming invoice and due date)." },
      { title: "Browse invoices", body: "Below the summary, the invoice list shows every invoice with its title, amount, due date, and status." },
      { title: "Understand statuses", body: "Sent = awaiting your payment. Paid = payment received. Overdue = past the due date." },
      { title: "View invoice details", body: "Click any invoice to see the full breakdown with line items, descriptions, and payment instructions." },
    ],
    tip: "Keep an eye on the 'Next Payment' card so upcoming invoices never catch you off guard.",
    keywords: ["invoices", "view", "payments", "balance", "due", "list"],
  },
  {
    id: "client-make-payment",
    category: "Payments",
    title: "Making a Payment",
    description: "Pay your invoices online through the secure payment system.",
    audience: "client",
    steps: [
      { title: "Find the invoice", body: "Go to the Payments tab and click on the invoice you want to pay." },
      { title: "Click Pay Now", body: "If online payments are enabled, you'll see a 'Pay Now' button that opens the secure payment form." },
      { title: "Enter payment details", body: "Follow the prompts to complete your payment via the secure Stripe-powered payment page." },
      { title: "Confirmation", body: "Once payment is processed, the invoice status updates to 'Paid' and you'll receive a confirmation." },
      { title: "Other payment methods", body: "If you prefer to pay by check or other methods, contact your advisor through the Messages tab to arrange alternative payment." },
    ],
    tip: "Paying on time helps your advisor plan projects and coordinate vendors more effectively for your home.",
    keywords: ["pay", "payment", "online", "stripe", "invoice", "pay now"],
  },
  {
    id: "client-billing-subscription",
    category: "Payments",
    title: "Understanding Your Billing & Subscription",
    description: "Know your membership plan, billing cycle, and what's included.",
    audience: "client",
    steps: [
      { title: "Check your membership", body: "Your membership tier and billing cycle are visible in the Payments section or your account settings." },
      { title: "What's included", body: "Your membership includes ongoing portal access, your Home Clarity Report, project tracking, document storage, equipment registry, maintenance calendar, and direct advisor communication." },
      { title: "Billing cycle", body: "Membership is billed according to your plan (monthly or annually). Your advisor will send invoices through the portal." },
      { title: "Questions about billing", body: "For any billing questions, send a message to your advisor through the Messages tab or contact HBC Support from the Contacts section." },
    ],
    tip: "Annual billing typically saves you money compared to monthly. Ask your advisor about annual plan options if you're currently on a monthly plan.",
    keywords: ["billing", "subscription", "membership", "plan", "tier", "cycle", "included"],
  },
];
