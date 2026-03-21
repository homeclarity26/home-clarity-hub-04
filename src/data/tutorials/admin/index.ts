import { adminGettingStarted } from "./getting-started";
import { adminClientManagement } from "./client-management";
import { adminReports } from "./reports";
import { adminProjectsProposals } from "./projects-proposals";
import { adminEquipmentMaintenance } from "./equipment-maintenance";
import { adminPaymentsBilling } from "./payments-billing";
import { adminCommunication } from "./communication";
import { adminAiIntelligence } from "./ai-intelligence";
import { adminScheduling } from "./scheduling";
import { adminVendors } from "./vendors";
import { adminTools } from "./tools";
import { adminAutomations } from "./automations";
import { adminSettings } from "./settings";
import { adminReferenceCards } from "./reference-cards";
import type { Tutorial } from "../types";

export const allAdminTutorials: Tutorial[] = [
  ...adminGettingStarted,
  ...adminClientManagement,
  ...adminReports,
  ...adminProjectsProposals,
  ...adminEquipmentMaintenance,
  ...adminPaymentsBilling,
  ...adminCommunication,
  ...adminAiIntelligence,
  ...adminScheduling,
  ...adminVendors,
  ...adminTools,
  ...adminAutomations,
  ...adminSettings,
];

export const adminCategories = [
  "Getting Started",
  "Client Management",
  "Reports",
  "Projects & Proposals",
  "Equipment & Maintenance",
  "Payments & Billing",
  "Communication",
  "AI & Intelligence",
  "Scheduling & Calendar",
  "Vendors",
  "Tools",
  "Automations",
  "Settings & Admin",
] as const;

export { adminReferenceCards };
