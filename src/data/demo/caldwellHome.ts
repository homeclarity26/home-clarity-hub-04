// Whole-house facts and the photo placement map for the Caldwell demo.
//
// PHOTO RULE: a photo appears only on the page it actually depicts. Pages
// with no matching photo show none. Do not add entries here unless the image
// truly shows that room, system or project.

import type { DemoHome, DemoPhoto } from "./caldwellTypes";

const P = "/demo/caldwell";

export const caldwellHome: DemoHome = {
  familyName: "The Caldwells",
  propertyName: "The Caldwell Residence",
  addressLine: "2847 Stoneybrook Lane",
  cityLine: "Hudson, OH 44236",
  yearBuilt: 1998,
  sqft: 5240,
  bedrooms: 5,
  bathrooms: 4.5,
  lotSize: "1.4 acres, wooded",
  style: "Two-story Colonial",
  reportDate: "November 2026",
  heroImage: `${P}/exterior-front.jpg`,
  hoverImage: `${P}/exterior-front.jpg`,
  hoverMeta: "Hover scan · 5,157 sqft roof · 4,831 sqft siding · 68 windows",
  iguideImage: `${P}/iguide-tour-kitchen.jpg`,
  iguideMeta: "iGUIDE · 33 panoramic stops · every room",
};

/** Page key → photos. First photo is the page hero; the rest form the gallery. */
export const caldwellPhotos: Record<string, DemoPhoto[]> = {
  // Rooms
  kitchen: [{ src: `${P}/kitchen.jpg`, caption: "Kitchen, looking toward the breakfast nook" }],
  "primary-bathroom": [{ src: `${P}/primary-bath-current.jpg`, caption: "Primary bathroom as it is today" }],
  "home-gym-sauna": [{ src: `${P}/home-gym-sauna.jpg`, caption: "Home gym with the infrared sauna" }],
  "mechanical-room": [{ src: `${P}/mechanical-room.jpg`, caption: "Mechanical room" }],
  "outdoor-kitchen": [{ src: `${P}/outdoor-kitchen.jpg`, caption: "Outdoor kitchen under the pergola" }],
  roof: [{ src: `${P}/roof-detail.jpg`, caption: "Roof field and chimney flashing" }],

  // Systems and appliances
  "furnace-main-zone": [
    { src: `${P}/mechanical-room.jpg`, caption: "Furnace in the mechanical room" },
    { src: `${P}/furnace-serial-plate.jpg`, caption: "Serial plate" },
  ],
  "tankless-water-heater": [
    { src: `${P}/mechanical-room.jpg`, caption: "Wall-mounted tankless unit, right side of the mechanical room" },
  ],
  "infrared-sauna": [{ src: `${P}/home-gym-sauna.jpg`, caption: "Infrared sauna in the home gym" }],
  "built-in-grill": [{ src: `${P}/outdoor-kitchen.jpg`, caption: "Built-in grill at the outdoor kitchen" }],

  // Vision projects
  "vision-primary-bath": [{ src: `${P}/primary-bath-vision.jpg`, caption: "Concept: the spa conversion" }],
  "vision-roof-replacement": [{ src: `${P}/roof-detail.jpg`, caption: "Existing 1998 shingles" }],
};
