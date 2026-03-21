import { Tutorial } from "../types";

export const adminVendors: Tutorial[] = [
  {
    id: "admin-manage-vendors",
    category: "Vendors",
    title: "Adding & Managing Vendors",
    description: "Build your trusted vendor directory with specialties, ratings, and vetting status.",
    audience: "admin",
    steps: [
      { title: "Go to Vendors", body: "Open the Vendor Directory from the admin sidebar." },
      { title: "Click +Add Vendor", body: "Enter the company name, contact person, phone, email, and website." },
      { title: "Set specialties", body: "Tag the vendor's specialties (HVAC, Plumbing, Electrical, Roofing, etc.). These are used for AI vendor matching." },
      { title: "Add vetting details", body: "Log their license number, insurance expiry, service area, cost tier, and your internal rating." },
      { title: "Set status", body: "Mark vendors as Active, Preferred, or Inactive. Only Active and Preferred vendors appear in client portals and AI recommendations." },
      { title: "Assign to report pages", body: "Link vendors to specific report page types (e.g., an HVAC company linked to the HVAC page). They'll appear as recommended vendors on client report pages." },
    ],
    tip: "Keep insurance expiry dates current. The system alerts you when a vendor's insurance is about to expire so you can request updated documentation.",
    keywords: ["vendor", "contractor", "directory", "add", "manage", "specialty", "rating", "vetting"],
  },
  {
    id: "admin-vendor-bids",
    category: "Vendors",
    title: "Requesting Bids & Assigning Vendors to Projects",
    description: "Collect contractor bids and assign the best vendor to each project.",
    audience: "admin",
    steps: [
      { title: "Open a project", body: "From the client's Projects tab, open the project you need a vendor for." },
      { title: "Request bids", body: "Click 'Request Bids' and select which vendors to contact. Each receives a bid request with the project scope and details." },
      { title: "Review submitted bids", body: "As vendors submit bids, they appear in the Bids tab of the project with amount, timeline, scope, and warranty details." },
      { title: "Compare bids", body: "Review all bids side-by-side. The AI Vendor Match tool can recommend the best option based on price, rating, and specialization." },
      { title: "Assign the vendor", body: "Accept a bid and assign the vendor to the project. The project card updates to show the assigned vendor." },
      { title: "Track the work", body: "Update the project status as work progresses. The vendor assignment is visible to the client in their portal." },
    ],
    tip: "Always get at least two bids for any project over $5,000. The bid comparison view makes it easy to present options to your client objectively.",
    keywords: ["bids", "vendor", "assign", "project", "contractor", "compare", "quote"],
  },
];
