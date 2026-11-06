// The built Caldwell demo report consumed by /demo (src/pages/DemoPortal.tsx).
//
// Wired to the full authored data (81 pages). caldwellSample.ts is a small
// development set kept for the builder's unit tests; to fall back to it,
// swap the imports below for the sample* exports.

import { buildCaldwellDemo } from "./caldwellBuilder";
import { caldwellHome, caldwellPhotos } from "./caldwellHome";
import { caldwellInteriorRooms } from "./caldwellRoomsInterior";
import { caldwellExteriorRooms } from "./caldwellRoomsExterior";
import { caldwellSystems } from "./caldwellSystems";
import { caldwellAppliances } from "./caldwellAppliances";
import { caldwellInfoPages } from "./caldwellInformation";
import { caldwellVisionProjects, caldwellStrategy } from "./caldwellStrategy";

export const caldwellDemo = buildCaldwellDemo({
  home: caldwellHome,
  photos: caldwellPhotos,
  interiorRooms: caldwellInteriorRooms,
  exteriorRooms: caldwellExteriorRooms,
  systems: caldwellSystems,
  appliances: caldwellAppliances,
  infoPages: caldwellInfoPages,
  visionProjects: caldwellVisionProjects,
  strategy: caldwellStrategy,
});
