// The built Caldwell demo report consumed by /demo (src/pages/DemoPortal.tsx).
//
// Currently wired to the development sample (caldwellSample.ts). To switch
// to the full data, replace the sample imports below with the full modules:
//
//   import { caldwellInteriorRooms } from "./caldwellRoomsInterior";
//   import { caldwellExteriorRooms } from "./caldwellRoomsExterior";
//   import { caldwellSystems } from "./caldwellSystems";
//   import { caldwellAppliances } from "./caldwellAppliances";
//   import { caldwellInfoPages } from "./caldwellInformation";
//   import { caldwellVisionProjects, caldwellStrategy } from "./caldwellStrategy";
//
// and pass them to buildCaldwellDemo in place of the sample* values.

import { buildCaldwellDemo } from "./caldwellBuilder";
import { caldwellHome, caldwellPhotos } from "./caldwellHome";
import {
  sampleInteriorRooms,
  sampleExteriorRooms,
  sampleSystems,
  sampleAppliances,
  sampleInfoPages,
  sampleVisionProjects,
  sampleStrategy,
} from "./caldwellSample";

export const caldwellDemo = buildCaldwellDemo({
  home: caldwellHome,
  photos: caldwellPhotos,
  interiorRooms: sampleInteriorRooms,
  exteriorRooms: sampleExteriorRooms,
  systems: sampleSystems,
  appliances: sampleAppliances,
  infoPages: sampleInfoPages,
  visionProjects: sampleVisionProjects,
  strategy: sampleStrategy,
});
