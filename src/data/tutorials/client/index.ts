import { clientGettingStarted } from "./getting-started";
import { clientReport } from "./report";
import { clientMaintenanceEquipment } from "./maintenance-equipment";
import { clientProjectsGoals } from "./projects-goals";
import { clientPayments } from "./payments";
import { clientSchedule } from "./schedule";
import { clientPhotosDocuments } from "./photos-documents";
import { clientCommunication } from "./communication";
import { clientReferrals } from "./referrals";
import { clientFAQ } from "./faq";
import type { Tutorial } from "../types";

export const allClientTutorials: Tutorial[] = [
  ...clientGettingStarted,
  ...clientReport,
  ...clientMaintenanceEquipment,
  ...clientProjectsGoals,
  ...clientPayments,
  ...clientSchedule,
  ...clientPhotosDocuments,
  ...clientCommunication,
  ...clientReferrals,
];

export const clientCategories = [
  "Getting Started",
  "Your Home Report",
  "Maintenance & Equipment",
  "Projects & Goals",
  "Payments",
  "Schedule",
  "Photos & Documents",
  "Communication",
  "Referrals",
] as const;

export { clientFAQ };
