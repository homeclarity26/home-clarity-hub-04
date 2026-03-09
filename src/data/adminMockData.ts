// Admin mock data matching Johnson Residence example

export interface MockClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyName: string;
  propertyId: string;
  yearBuilt: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  reportStatus: "draft" | "review" | "published";
  reportVersion: string;
  lastUpdated: string;
  unreadComments: number;
  totalPages: number;
  completePages: number;
  flaggedPages: number;
  openQuestions: number;
}

export interface MockActivity {
  id: string;
  message: string;
  timestamp: string;
  type: "comment" | "publish" | "upload" | "edit" | "question";
  clientId: string;
  pageId?: string;
}

export interface MockComment {
  id: string;
  clientId: string;
  clientName: string;
  pageTitle: string;
  pageId: string;
  text: string;
  date: string;
  type: "question" | "note";
  resolved: boolean;
  response?: string;
}

export interface MockReportPage {
  id: string;
  title: string;
  group: string;
  status: "complete" | "draft" | "needs_review" | "inactive";
  aiGenerated: boolean;
  lastEdited: string;
  sortOrder: number;
}

export interface MockProject {
  id: string;
  name: string;
  status: "planned" | "in_progress" | "complete";
  contractor: string;
  budget: string;
  timeline: string;
}

export interface MockInvoice {
  id: string;
  number: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  description: string;
}

export interface MockFile {
  id: string;
  name: string;
  category: string;
  type: string;
  uploadDate: string;
  size: string;
  thumbnail?: string;
}

export interface MockPricingTemplate {
  id: string;
  projectType: string;
  essential: { scope: string; priceRange: string };
  enhanced: { scope: string; priceRange: string };
  signature: { scope: string; priceRange: string };
  region: string;
  lastUpdated: string;
  version: number;
}

export const mockClients: MockClient[] = [
  {
    id: "client-1",
    name: "Sarah & Michael Johnson",
    email: "sarah.johnson@email.com",
    phone: "(330) 555-0142",
    address: "445 Elm Street, Hudson, OH 44236",
    propertyName: "Johnson Residence",
    propertyId: "prop-1",
    yearBuilt: 1998,
    sqft: 3200,
    bedrooms: 4,
    bathrooms: 3,
    reportStatus: "review",
    reportVersion: "v2",
    lastUpdated: "2024-02-15",
    unreadComments: 3,
    totalPages: 28,
    completePages: 22,
    flaggedPages: 4,
    openQuestions: 3,
  },
  {
    id: "client-2",
    name: "David & Lisa Chen",
    email: "dchen@email.com",
    phone: "(330) 555-0298",
    address: "1220 Maple Drive, Stow, OH 44224",
    propertyName: "Chen Residence",
    propertyId: "prop-2",
    yearBuilt: 2005,
    sqft: 2800,
    bedrooms: 3,
    bathrooms: 2,
    reportStatus: "draft",
    reportVersion: "v1",
    lastUpdated: "2024-02-12",
    unreadComments: 0,
    totalPages: 24,
    completePages: 8,
    flaggedPages: 2,
    openQuestions: 0,
  },
  {
    id: "client-3",
    name: "Robert Williams",
    email: "rwilliams@email.com",
    phone: "(330) 555-0371",
    address: "890 Oak Lane, Peninsula, OH 44264",
    propertyName: "Williams Estate",
    propertyId: "prop-3",
    yearBuilt: 1985,
    sqft: 4100,
    bedrooms: 5,
    bathrooms: 4,
    reportStatus: "published",
    reportVersion: "v1",
    lastUpdated: "2024-01-28",
    unreadComments: 1,
    totalPages: 30,
    completePages: 30,
    flaggedPages: 0,
    openQuestions: 1,
  },
  {
    id: "client-4",
    name: "Jennifer & Mark Thompson",
    email: "jthompson@email.com",
    phone: "(330) 555-0455",
    address: "567 Birch Court, Cuyahoga Falls, OH 44221",
    propertyName: "Thompson Home",
    propertyId: "prop-4",
    yearBuilt: 2012,
    sqft: 2400,
    bedrooms: 3,
    bathrooms: 2,
    reportStatus: "published",
    reportVersion: "v2",
    lastUpdated: "2024-01-15",
    unreadComments: 0,
    totalPages: 22,
    completePages: 22,
    flaggedPages: 0,
    openQuestions: 0,
  },
  {
    id: "client-5",
    name: "Amanda Foster",
    email: "afoster@email.com",
    phone: "(330) 555-0533",
    address: "234 Pine Street, Bath, OH 44210",
    propertyName: "Foster Residence",
    propertyId: "prop-5",
    yearBuilt: 1972,
    sqft: 3600,
    bedrooms: 4,
    bathrooms: 3,
    reportStatus: "draft",
    reportVersion: "v1",
    lastUpdated: "2024-02-18",
    unreadComments: 0,
    totalPages: 26,
    completePages: 3,
    flaggedPages: 0,
    openQuestions: 0,
  },
];

export const mockActivities: MockActivity[] = [
  {
    id: "act-1",
    message: "Sarah Johnson left a question on Kitchen page",
    timestamp: "2 hours ago",
    type: "question",
    clientId: "client-1",
    pageId: "kitchen",
  },
  {
    id: "act-2",
    message: "Report v2 published for Williams Estate",
    timestamp: "Yesterday",
    type: "publish",
    clientId: "client-3",
  },
  {
    id: "act-3",
    message: "New serial plate photos uploaded for Johnson Residence",
    timestamp: "2 days ago",
    type: "upload",
    clientId: "client-1",
  },
  {
    id: "act-4",
    message: "David Chen viewed the HVAC page for the first time",
    timestamp: "3 days ago",
    type: "edit",
    clientId: "client-2",
    pageId: "hvac",
  },
  {
    id: "act-5",
    message: "Kitchen page narrative updated for Johnson Residence",
    timestamp: "4 days ago",
    type: "edit",
    clientId: "client-1",
    pageId: "kitchen",
  },
  {
    id: "act-6",
    message: "Amanda Foster's report generation started",
    timestamp: "5 days ago",
    type: "edit",
    clientId: "client-5",
  },
  {
    id: "act-7",
    message: "Michael Johnson asked about roof timeline",
    timestamp: "1 week ago",
    type: "question",
    clientId: "client-1",
    pageId: "roof",
  },
];

export const mockComments: MockComment[] = [
  {
    id: "cmt-1",
    clientId: "client-1",
    clientName: "Sarah Johnson",
    pageTitle: "Kitchen",
    pageId: "kitchen",
    text: "Can we get a more detailed breakdown of the countertop options in the Signature tier?",
    date: "2024-02-15",
    type: "question",
    resolved: false,
  },
  {
    id: "cmt-2",
    clientId: "client-1",
    clientName: "Michael Johnson",
    pageTitle: "Roof",
    pageId: "roof",
    text: "What's the realistic timeline if we start in spring? We want to coordinate with the gutter project.",
    date: "2024-02-14",
    type: "question",
    resolved: false,
  },
  {
    id: "cmt-3",
    clientId: "client-1",
    clientName: "Sarah Johnson",
    pageTitle: "HVAC",
    pageId: "hvac",
    text: "We noticed the furnace has been making a clicking noise. Should we mention this?",
    date: "2024-02-10",
    type: "question",
    resolved: false,
  },
  {
    id: "cmt-4",
    clientId: "client-3",
    clientName: "Robert Williams",
    pageTitle: "Electrical",
    pageId: "electrical",
    text: "The panel photo looks outdated — we had the panel replaced last year.",
    date: "2024-01-25",
    type: "note",
    resolved: true,
    response: "Thanks Robert! I've updated the electrical page with the new panel information.",
  },
];

export const mockReportPages: MockReportPage[] = [
  // Information group
  { id: "property-overview", title: "Property Overview", group: "Information", status: "complete", aiGenerated: true, lastEdited: "2024-02-15", sortOrder: 1 },
  { id: "executive-summary", title: "Executive Summary", group: "Information", status: "complete", aiGenerated: true, lastEdited: "2024-02-14", sortOrder: 2 },
  { id: "about-hbc", title: "About HBC", group: "Information", status: "complete", aiGenerated: false, lastEdited: "2024-01-10", sortOrder: 3 },
  // Exterior group
  { id: "roof", title: "Roof", group: "Exterior", status: "complete", aiGenerated: true, lastEdited: "2024-02-13", sortOrder: 4 },
  { id: "siding", title: "Siding & Trim", group: "Exterior", status: "complete", aiGenerated: true, lastEdited: "2024-02-13", sortOrder: 5 },
  { id: "gutters", title: "Gutters & Downspouts", group: "Exterior", status: "needs_review", aiGenerated: true, lastEdited: "2024-02-12", sortOrder: 6 },
  { id: "driveway", title: "Driveway & Walkways", group: "Exterior", status: "complete", aiGenerated: true, lastEdited: "2024-02-12", sortOrder: 7 },
  { id: "landscaping", title: "Landscaping", group: "Exterior", status: "draft", aiGenerated: false, lastEdited: "2024-02-10", sortOrder: 8 },
  // Interior group
  { id: "kitchen", title: "Kitchen", group: "Interior", status: "needs_review", aiGenerated: true, lastEdited: "2024-02-15", sortOrder: 9 },
  { id: "bathrooms", title: "Bathrooms", group: "Interior", status: "complete", aiGenerated: true, lastEdited: "2024-02-11", sortOrder: 10 },
  { id: "flooring", title: "Flooring", group: "Interior", status: "complete", aiGenerated: true, lastEdited: "2024-02-11", sortOrder: 11 },
  { id: "paint", title: "Paint & Walls", group: "Interior", status: "draft", aiGenerated: false, lastEdited: "2024-02-08", sortOrder: 12 },
  { id: "windows", title: "Windows & Doors", group: "Interior", status: "complete", aiGenerated: true, lastEdited: "2024-02-10", sortOrder: 13 },
  // Systems group
  { id: "hvac", title: "HVAC", group: "Systems", status: "needs_review", aiGenerated: true, lastEdited: "2024-02-14", sortOrder: 14 },
  { id: "plumbing", title: "Plumbing", group: "Systems", status: "complete", aiGenerated: true, lastEdited: "2024-02-09", sortOrder: 15 },
  { id: "electrical", title: "Electrical", group: "Systems", status: "complete", aiGenerated: true, lastEdited: "2024-02-09", sortOrder: 16 },
  { id: "water-heater", title: "Water Heater", group: "Systems", status: "complete", aiGenerated: true, lastEdited: "2024-02-08", sortOrder: 17 },
  // Strategy group
  { id: "priorities", title: "Priority Matrix", group: "Strategy", status: "needs_review", aiGenerated: true, lastEdited: "2024-02-15", sortOrder: 18 },
  { id: "budget", title: "Budget Overview", group: "Strategy", status: "draft", aiGenerated: true, lastEdited: "2024-02-14", sortOrder: 19 },
  { id: "timeline", title: "5-Year Timeline", group: "Strategy", status: "inactive", aiGenerated: false, lastEdited: "2024-02-07", sortOrder: 20 },
];

export const mockProjects: MockProject[] = [
  { id: "proj-1", name: "Kitchen Remodel - Phase 1", status: "planned", contractor: "Summit Kitchens LLC", budget: "$45,000 - $62,000", timeline: "Spring 2024" },
  { id: "proj-2", name: "Roof Replacement", status: "planned", contractor: "TBD", budget: "$12,000 - $18,000", timeline: "Summer 2024" },
  { id: "proj-3", name: "HVAC System Upgrade", status: "in_progress", contractor: "Comfort Air Systems", budget: "$8,500 - $12,000", timeline: "Q1 2024" },
];

export const mockInvoices: MockInvoice[] = [
  { id: "inv-1", number: "HBC-2024-001", amount: 2500, date: "2024-01-15", status: "paid", description: "Home Clarity Report - Initial Assessment" },
  { id: "inv-2", number: "HBC-2024-008", amount: 500, date: "2024-02-01", status: "paid", description: "Report Update - Version 2" },
  { id: "inv-3", number: "HBC-2024-015", amount: 350, date: "2024-02-15", status: "pending", description: "Additional Room Analysis (2 rooms)" },
];

export const mockFiles: MockFile[] = [
  { id: "file-1", name: "discovery-call-johnson.mp3", category: "Discovery Call", type: "audio", uploadDate: "2024-01-10", size: "45 MB" },
  { id: "file-2", name: "walkthrough-transcript.pdf", category: "Walkthrough", type: "document", uploadDate: "2024-01-12", size: "2.1 MB" },
  { id: "file-3", name: "exterior-front.jpg", category: "Exterior Photos", type: "image", uploadDate: "2024-01-12", size: "3.4 MB" },
  { id: "file-4", name: "exterior-rear.jpg", category: "Exterior Photos", type: "image", uploadDate: "2024-01-12", size: "2.8 MB" },
  { id: "file-5", name: "kitchen-overview.jpg", category: "Interior Photos", type: "image", uploadDate: "2024-01-12", size: "4.1 MB" },
  { id: "file-6", name: "hvac-serial-plate.jpg", category: "Serial Plates", type: "image", uploadDate: "2024-01-12", size: "1.2 MB" },
  { id: "file-7", name: "water-heater-plate.jpg", category: "Serial Plates", type: "image", uploadDate: "2024-01-12", size: "0.9 MB" },
  { id: "file-8", name: "johnson-hover-3d.zip", category: "hover.to", type: "archive", uploadDate: "2024-01-14", size: "156 MB" },
  { id: "file-9", name: "inspection-report-2023.pdf", category: "External Reports", type: "document", uploadDate: "2024-01-10", size: "8.3 MB" },
];

export const mockPricingTemplates: MockPricingTemplate[] = [
  {
    id: "pt-1",
    projectType: "Kitchen Remodel",
    essential: { scope: "Refinish cabinets, new hardware, basic backsplash", priceRange: "$8,000 - $15,000" },
    enhanced: { scope: "New cabinets, stone countertops, tile backsplash, updated lighting", priceRange: "$25,000 - $45,000" },
    signature: { scope: "Custom cabinetry, premium stone, designer fixtures, layout changes", priceRange: "$50,000 - $85,000" },
    region: "Summit County, OH",
    lastUpdated: "2024-01-20",
    version: 3,
  },
  {
    id: "pt-2",
    projectType: "Roof Replacement",
    essential: { scope: "Standard architectural shingles, basic flashing", priceRange: "$8,000 - $12,000" },
    enhanced: { scope: "Premium shingles, full flashing, ridge vent, ice guard", priceRange: "$12,000 - $18,000" },
    signature: { scope: "Standing seam metal or slate, copper flashing, lifetime warranty", priceRange: "$25,000 - $45,000" },
    region: "Summit County, OH",
    lastUpdated: "2024-02-01",
    version: 2,
  },
  {
    id: "pt-3",
    projectType: "HVAC System",
    essential: { scope: "Replace furnace or AC unit, basic ductwork repair", priceRange: "$4,000 - $7,000" },
    enhanced: { scope: "High-efficiency system, duct sealing, smart thermostat", priceRange: "$8,000 - $14,000" },
    signature: { scope: "Geothermal or dual-fuel, zoned system, full duct replacement", priceRange: "$18,000 - $35,000" },
    region: "Summit County, OH",
    lastUpdated: "2024-01-15",
    version: 2,
  },
  {
    id: "pt-4",
    projectType: "Bathroom Remodel",
    essential: { scope: "New fixtures, paint, basic tile refresh", priceRange: "$3,000 - $6,000" },
    enhanced: { scope: "New vanity, tile shower, updated plumbing fixtures", priceRange: "$10,000 - $20,000" },
    signature: { scope: "Full gut renovation, heated floors, custom tile, frameless glass", priceRange: "$25,000 - $45,000" },
    region: "Summit County, OH",
    lastUpdated: "2024-02-05",
    version: 1,
  },
  {
    id: "pt-5",
    projectType: "Exterior Painting",
    essential: { scope: "Power wash, spot prime, single coat", priceRange: "$2,500 - $4,000" },
    enhanced: { scope: "Full scrape/sand, prime, two coats, trim detail", priceRange: "$5,000 - $8,000" },
    signature: { scope: "Lead abatement if needed, premium paint, accent colors, wood repair", priceRange: "$8,000 - $15,000" },
    region: "Summit County, OH",
    lastUpdated: "2024-01-25",
    version: 1,
  },
];

export const mockStats = {
  activeClients: 5,
  reportsInProgress: 2,
  unansweredQuestions: 4,
  publishedReports: 3,
};
