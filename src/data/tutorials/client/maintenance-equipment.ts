import { Tutorial } from "../types";

export const clientMaintenanceEquipment: Tutorial[] = [
  {
    id: "client-equipment-registry",
    category: "Maintenance & Equipment",
    title: "Viewing Your Equipment Registry",
    description: "See every major system and appliance in your home with its details and status.",
    audience: "client",
    steps: [
      { title: "Go to Equipment", body: "Click the 'Equipment' tab in the top navigation." },
      { title: "Browse by category", body: "Equipment is grouped by type: HVAC, Plumbing, Electrical, Appliances, Exterior, Structure, and Safety." },
      { title: "View details", body: "Each item shows its brand, model, serial number, install date, condition rating, and estimated replacement cost." },
      { title: "Check service badges", body: "Look for status badges: 'Overdue' (past due for service), 'Due Soon' (within 60 days), 'Warranty Expired,' or 'Up to Date.'" },
      { title: "Take action on alerts", body: "If you see overdue or due-soon items, message your advisor to coordinate a service visit." },
    ],
    tip: "Keep this page bookmarked; it's incredibly useful when a repair technician asks for the model number or age of a system.",
    keywords: ["equipment", "registry", "appliance", "system", "brand", "model", "serial"],
  },
  {
    id: "client-warranty-service",
    category: "Maintenance & Equipment",
    title: "Understanding Warranty & Service Status",
    description: "Know which items are covered, which need service, and when to act.",
    audience: "client",
    steps: [
      { title: "Check warranty dates", body: "Each equipment item shows its warranty expiry date. Items with active warranties show a green indicator." },
      { title: "Warranty Expired badge", body: "A 'Warranty Expired' badge means repairs are out-of-pocket. This is informational; no immediate action required unless the item needs service." },
      { title: "Service Due Soon", body: "Items within 60 days of their next service date show 'Due Soon.' Contact your advisor to schedule the service." },
      { title: "Overdue items", body: "Items past their service date show 'Overdue' in red. These should be addressed as soon as possible." },
      { title: "Alert banners", body: "At the top of the Equipment tab, alert banners summarize how many items are overdue or due soon across all categories." },
    ],
    tip: "When an equipment item is under warranty and needs service, mention the warranty to your advisor; they can help ensure the repair is covered.",
    keywords: ["warranty", "service", "overdue", "due soon", "expired", "coverage", "status"],
  },
  {
    id: "client-seasonal-checklist",
    category: "Maintenance & Equipment",
    title: "Your Seasonal Maintenance Checklist",
    description: "Follow season-by-season maintenance tasks customized for your home.",
    audience: "client",
    steps: [
      { title: "Go to Schedule", body: "Click the 'Schedule' tab to see your maintenance calendar and checklists." },
      { title: "Find Seasonal Checklists", body: "Below the calendar, you'll see four seasonal cards: Spring, Summer, Fall, and Winter." },
      { title: "View tasks", body: "Click 'View Tasks' on any season to see the full checklist. Tasks are customized based on your home's specific systems and equipment." },
      { title: "Complete tasks", body: "Work through the list each season. Check off items as you complete them." },
      { title: "Ask for help", body: "If any task feels unfamiliar or you need a professional, message your advisor; they can coordinate with a trusted vendor." },
    ],
    tip: "Set a reminder on your phone for the first day of each season to check your seasonal checklist. Staying on top of maintenance prevents costly surprises.",
    keywords: ["seasonal", "checklist", "maintenance", "spring", "summer", "fall", "winter", "tasks"],
  },
];
