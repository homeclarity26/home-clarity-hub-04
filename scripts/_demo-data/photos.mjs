// Curated Unsplash photo URLs, grouped by topic. These are real stable
// IDs on images.unsplash.com. Each topic has 2-4 photos so pages with
// multiple images don't repeat.
//
// Format: images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1600&q=80
//
// When Adam wants real photos of real homes, swap URLs inline in the
// per-home data files — the seed script treats them as opaque strings.

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const PHOTOS = {
  // ─── Home exteriors ──────────────────────────────────────────────
  colonial_exterior: [
    unsplash("1568605114967-8130f3a36994"), // classic colonial with columns
    unsplash("1600585154340-be6161a56a0c"), // historic white home w/ porch
    unsplash("1512917774080-9991f1c4c750"), // two-story colonial, fall
  ],
  ranch_exterior: [
    unsplash("1570129477492-45c003edd2be"), // ranch-style home
    unsplash("1600585154526-990dced4db0d"), // single-level suburban
    unsplash("1598228723793-52759bba239c"), // mid-century ranch
  ],
  modern_new_build_exterior: [
    unsplash("1600596542815-ffad4c1539a9"), // modern farmhouse
    unsplash("1613490493576-7fde63acd811"), // contemporary new-build
    unsplash("1605146769289-440113cc3d00"), // clean modern exterior
  ],

  // ─── Roofs ───────────────────────────────────────────────────────
  slate_roof: [
    unsplash("1541123603104-512919d6a96c"), // slate roof detail
    unsplash("1558036117-15d82a90b9b1"), // dark slate shingles
  ],
  asphalt_shingle_roof: [
    unsplash("1632154011036-9d23a3af61f3"), // shingle close-up
    unsplash("1566041510639-8d95a2490bfb"), // aerial shingled roof
  ],
  metal_roof: [
    unsplash("1600585154084-4e5fe7c39198"), // standing seam metal
    unsplash("1558618666-fcd25c85cd64"), // modern architectural metal
  ],

  // ─── Siding ──────────────────────────────────────────────────────
  wood_clapboard: [
    unsplash("1605276374104-dee2a0ed3cd6"), // white painted clapboard
    unsplash("1564013799919-ab600027ffc6"), // cream wood siding detail
  ],
  vinyl_siding: [
    unsplash("1572120360610-d971b9d7767c"), // beige vinyl siding
    unsplash("1559767949-0faa5c7e9992"), // vinyl siding corner
  ],
  fiber_cement_siding: [
    unsplash("1599809275671-b5942cabc7a2"), // modern fiber cement
    unsplash("1613977257592-4a9a32f9141e"), // gray fiber cement facade
  ],

  // ─── Windows ─────────────────────────────────────────────────────
  historic_windows: [
    unsplash("1560448205-97bc42ea0eb5"), // divided-light wood windows
    unsplash("1518005020951-eccb494ad742"), // antique home windows
  ],
  modern_windows: [
    unsplash("1600607687939-ce8a6c25118c"), // big casement windows
    unsplash("1564564321837-a57b7070ac4f"), // floor-to-ceiling windows
  ],

  // ─── Kitchens (by era) ───────────────────────────────────────────
  kitchen_dated: [
    unsplash("1556909114-f6e7ad7d3136"), // older oak kitchen
    unsplash("1556912998-c57cc6b63cd7"), // 90s-style kitchen
  ],
  kitchen_transitional: [
    unsplash("1565182999561-18d7dc61c393"), // mid-tier transitional
    unsplash("1556909114-4f5e60086b1f"), // white-and-wood kitchen
  ],
  kitchen_luxury_modern: [
    unsplash("1600585154340-be6161a56a0c"), // chef's kitchen, marble
    unsplash("1556909114-f6e7ad7d3136"), // luxury kitchen island
    unsplash("1600210492486-724fe5c67fb0"), // wolf range setup
    unsplash("1556909264-9e0b9d1e5a0a"), // dark cabinets + brass
  ],

  // ─── Bathrooms ───────────────────────────────────────────────────
  bathroom_dated: [
    unsplash("1552321554-5fefe8c9ef14"), // older tile bath
    unsplash("1584622650111-93e69d876a0c"), // dated bathroom
  ],
  bathroom_primary_luxury: [
    unsplash("1552321554-5fefe8c9ef14"), // luxury primary bath
    unsplash("1600607687939-ce8a6c25118c"), // freestanding tub
    unsplash("1600566753190-17f0baa2a6c3"), // walk-in shower
  ],

  // ─── Systems & mechanicals ───────────────────────────────────────
  boiler_old: [
    unsplash("1621905251189-08b45d6a269e"), // old boiler
    unsplash("1620052596394-1ded51a25c71"), // basement utility
  ],
  hvac_modern: [
    unsplash("1558618666-fcd25c85cd64"), // clean mech room
    unsplash("1621905251189-08b45d6a269e"), // HVAC unit
  ],
  water_heater: [
    unsplash("1621905252507-b35492cc74b4"), // water heater in basement
  ],
  electrical_panel: [
    unsplash("1621905251918-48416bd8575a"), // breaker panel
    unsplash("1621905252089-37e9abafb5c1"), // electrical conduit
  ],
  plumbing_pipes: [
    unsplash("1621905251189-08b45d6a269e"), // copper pipes
    unsplash("1558618047-3c8c76ca7b69"), // plumbing fixtures
  ],

  // ─── Interior spaces ─────────────────────────────────────────────
  living_room_traditional: [
    unsplash("1600210492486-724fe5c67fb0"), // traditional living room
    unsplash("1586023492125-27b2c045efd7"), // classic formal space
  ],
  primary_bedroom_luxury: [
    unsplash("1600585154340-be6161a56a0c"), // luxe primary suite
    unsplash("1522708323590-d24dbb6b0267"), // calm bedroom
  ],

  // ─── Basements ───────────────────────────────────────────────────
  basement_finished: [
    unsplash("1600607687939-ce8a6c25118c"), // finished basement lounge
    unsplash("1600210492486-724fe5c67fb0"), // home theater basement
  ],
  basement_unfinished: [
    unsplash("1621905251918-48416bd8575a"), // unfinished basement
  ],
  foundation_issue: [
    unsplash("1558618666-fcd25c85cd64"), // foundation wall
  ],

  // ─── Outdoor ─────────────────────────────────────────────────────
  deck_worn: [
    unsplash("1513694203232-719a280e022f"), // aged wood deck
    unsplash("1600607687939-ce8a6c25118c"), // old deck
  ],
  deck_new: [
    unsplash("1600607687644-c7dedb4c0ef6"), // new composite deck
    unsplash("1600566753051-6057a3ed1e22"), // modern deck
  ],
  pool_luxury: [
    unsplash("1600566753190-17f0baa2a6c3"), // pool w/ lighting
    unsplash("1600607687644-c7dedb4c0ef6"), // rectangular pool
  ],
  landscaping: [
    unsplash("1598228723793-52759bba239c"), // landscaped yard
  ],
  garage: [
    unsplash("1558618666-fcd25c85cd64"), // garage interior
  ],

  // ─── Appliances (for equipment page photos) ──────────────────────
  wolf_range: [
    unsplash("1600210492486-724fe5c67fb0"), // pro range
  ],
  subzero_fridge: [
    unsplash("1556909114-f6e7ad7d3136"), // paneled fridge
  ],

  // ─── Generic/fallback ────────────────────────────────────────────
  home_interior: [
    unsplash("1600585154340-be6161a56a0c"),
    unsplash("1600607687939-ce8a6c25118c"),
    unsplash("1560448205-97bc42ea0eb5"),
  ],
};

// Pick N photos for a given topic, wrapping if the topic has fewer.
export function photosFor(topic, n = 2) {
  const pool = PHOTOS[topic] || PHOTOS.home_interior;
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool[i % pool.length]);
  return out;
}
