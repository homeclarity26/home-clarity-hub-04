import { Tutorial } from "../types";

export const clientPhotosDocuments: Tutorial[] = [
  {
    id: "client-upload-photos",
    category: "Photos & Documents",
    title: "Uploading Photos of Your Home",
    description: "Add photos to your home's record for your advisor to review.",
    audience: "client",
    steps: [
      { title: "Go to Photos", body: "Navigate to the Photos section (you may find it under the 'More' menu in your tabs)." },
      { title: "Upload photos", body: "Click the upload area or drag and drop photos from your computer or phone." },
      { title: "Add context", body: "When uploading, you can add a description or tag the photo with a category (e.g., 'Exterior,' 'Kitchen,' 'Damage')." },
      { title: "Browse your gallery", body: "All uploaded photos appear in a searchable gallery organized by date and category." },
      { title: "Flag for advisor", body: "If you notice something concerning (a crack, stain, or damage), flag the photo so your advisor reviews it on their next visit." },
    ],
    tip: "Take photos of any changes or concerns you notice around your home and upload them. Your advisor can often assess the urgency from a photo before scheduling a visit.",
    keywords: ["photos", "upload", "gallery", "images", "pictures", "flag"],
  },
  {
    id: "client-manage-documents",
    category: "Photos & Documents",
    title: "Uploading & Managing Documents",
    description: "Store and access important home documents in your portal.",
    audience: "client",
    steps: [
      { title: "Go to Documents", body: "Click the 'Documents' tab in your portal navigation." },
      { title: "Browse by category", body: "Documents are organized by type: Discovery Call Notes, Exterior Photos, Reports, Vendor Estimates, Warranties, and more." },
      { title: "Upload a file", body: "Drag and drop a file onto the upload area, or click 'Browse Files.' Supported types: PDF, JPG, PNG, MP3, MP4, and Word documents." },
      { title: "Search for files", body: "Use the search bar to find specific documents by name." },
      { title: "View a file", body: "Click any file card to open it in a new browser tab for viewing or downloading." },
    ],
    tip: "Upload warranty documents, permits, and inspection reports to keep everything in one place. Your advisor can reference them when planning future work.",
    keywords: ["documents", "upload", "files", "pdf", "download", "storage", "warranty"],
  },
  {
    id: "client-request-service",
    category: "Photos & Documents",
    title: "Requesting a Service",
    description: "Ask your advisor to coordinate a service or vendor visit for your home.",
    audience: "client",
    steps: [
      { title: "Identify the need", body: "Check your Equipment tab for overdue service items, or review your report for items rated Poor or Critical." },
      { title: "Send a service request", body: "Go to the Messages tab and describe what you need: 'My HVAC unit is making a strange noise' or 'I'd like to schedule annual furnace maintenance.'" },
      { title: "Your advisor coordinates", body: "Your advisor will review your equipment registry and report, then coordinate with a trusted vendor on your behalf." },
      { title: "Track the project", body: "If the service becomes a project, it will appear in your Projects tab with status updates as work progresses." },
    ],
    tip: "You can also ask Bobby to look up details about your equipment before requesting service — just ask 'What brand is my furnace?' or 'When was my AC last serviced?'",
    keywords: ["service", "request", "vendor", "repair", "maintenance", "help"],
  },
];
