// Seed three demo clients with full Home Clarity Reports, equipment,
// projects, invoices, schedules, goals, and messages.
//
//   node scripts/seed-demo-clients.mjs
//
// Idempotent — safe to rerun. Uses email uniqueness as the re-run guard;
// re-running does NOT duplicate rows (properties are matched by client_user_id
// + property_name prefix, reports/pages/invoices/etc. are keyed off property_id).
//
// Cleanup (one-shot, cascades through FKs):
//   DELETE FROM auth.users WHERE email LIKE '%@homeclarityhub.test';
//   DELETE FROM properties WHERE (metadata->>'demo')::boolean IS TRUE;
// (All lowercase, no special chars — chosen to survive mobile typing.)

import { loadEnv, mgmtQuery, SUPABASE_URL } from "./_webkit-helpers.mjs";
import { ALDERWOOD } from "./_demo-data/home-alderwood.mjs";
import { BROOKHAVEN } from "./_demo-data/home-brookhaven.mjs";
import { COPPERLINE } from "./_demo-data/home-copperline.mjs";

const env = loadEnv();
const PASSWORD = "demohomes2026";
const CREATOR_EMAIL = "adam@hometownbuildersclub.com";

// ─── Low-level helpers ──────────────────────────────────────────────

async function adminCreateOrFindUser(email, password, role, metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: env.serviceRole,
      Authorization: `Bearer ${env.serviceRole}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, ...metadata },
    }),
  });
  if (res.status === 422) {
    // Already exists — look up ID and reset password so login always works.
    const look = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: { apikey: env.serviceRole, Authorization: `Bearer ${env.serviceRole}` } },
    );
    const body = await look.text();
    const j = JSON.parse(body);
    const existing = (j.users || []).find((u) => u.email === email);
    if (!existing) throw new Error(`user ${email} 422 but not findable`);
    // Reset password so rerunning the seed reliably sets password.
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      headers: {
        apikey: env.serviceRole,
        Authorization: `Bearer ${env.serviceRole}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    return existing.id;
  }
  if (!res.ok) throw new Error(`create user ${email}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function ensureClientRole(userId) {
  await mgmtQuery(
    env.pat,
    `INSERT INTO user_roles (user_id, role)
     VALUES ('${userId}', 'client'::app_role)
     ON CONFLICT DO NOTHING`,
  );
}

async function getCreatorUserId() {
  const rows = await mgmtQuery(
    env.pat,
    `SELECT user_id FROM profiles WHERE email = '${CREATOR_EMAIL}' LIMIT 1`,
  );
  if (!rows.length) throw new Error(`no creator user found for ${CREATOR_EMAIL}`);
  return rows[0].user_id;
}

// Escape single quotes for SQL literals. All text coming from the data
// modules is developer-authored; this is defense for apostrophes ("don't").
function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlJsonb(obj) {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function sqlNum(n) {
  if (n === null || n === undefined) return "NULL";
  return String(Number(n));
}

function sqlBool(b) {
  if (b === null || b === undefined) return "NULL";
  return b ? "TRUE" : "FALSE";
}

// ─── Per-home seeders ───────────────────────────────────────────────

async function seedProperty(home, clientUserId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM properties WHERE client_user_id = '${clientUserId}' AND property_name = ${sqlStr(home.property.property_name)} LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO properties (
       address, property_name, client_user_id, property_type,
       city, state, zip, county, estimated_value, metadata
     ) VALUES (
       ${sqlStr(home.property.address)}, ${sqlStr(home.property.property_name)},
       '${clientUserId}', ${sqlStr(home.property.property_type)},
       ${sqlStr(home.property.city)}, ${sqlStr(home.property.state)},
       ${sqlStr(home.property.zip)}, ${sqlStr(home.property.county)},
       ${sqlNum(home.property.estimated_value)}, ${sqlJsonb(home.property.metadata)}
     ) RETURNING id`,
  );
  return created[0].id;
}

async function seedReport(home, propertyId, creatorUserId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM reports WHERE property_id = '${propertyId}' AND title = ${sqlStr(home.reportTitle)} LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO reports (property_id, title, status, created_by, completion_percent)
     VALUES ('${propertyId}', ${sqlStr(home.reportTitle)}, 'published', '${creatorUserId}', 95)
     RETURNING id`,
  );
  return created[0].id;
}

async function seedReportPages(home, reportId) {
  for (const p of home.pages) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM report_pages WHERE report_id = '${reportId}' AND page_key = ${sqlStr(p.page_key)} LIMIT 1`,
    );
    if (existing.length) continue; // Already seeded — skip to preserve edits.
    await mgmtQuery(
      env.pat,
      `INSERT INTO report_pages (
         report_id, page_key, title, group_name, condition_rating,
         narrative, health_bar, specs, tiers, timing, recommendations, images,
         sort_order, status, is_complete
       ) VALUES (
         '${reportId}',
         ${sqlStr(p.page_key)},
         ${sqlStr(p.title)},
         ${sqlStr(p.group_name)},
         ${sqlStr(p.condition_rating)},
         ${sqlJsonb(p.narrative || [])},
         ${p.health_bar ? sqlJsonb(p.health_bar) : "NULL"},
         ${sqlJsonb(p.specs || [])},
         ${p.tiers ? sqlJsonb(p.tiers) : "NULL"},
         ${sqlStr(p.timing)},
         ${sqlJsonb(p.recommendations || [])},
         ${sqlJsonb(p.images || [])},
         ${sqlNum(p.sort_order || 0)},
         'published',
         TRUE
       )`,
    );
  }
}

async function seedEquipment(home, propertyId) {
  for (const e of home.equipment) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM equipment WHERE property_id = '${propertyId}' AND name = ${sqlStr(e.name)} AND COALESCE(model, '') = ${sqlStr(e.model || "")} LIMIT 1`,
    );
    if (existing.length) continue;
    await mgmtQuery(
      env.pat,
      `INSERT INTO equipment (
         property_id, name, category, brand, model, install_date,
         warranty_expiry, condition, estimated_replacement_cost, notes
       ) VALUES (
         '${propertyId}',
         ${sqlStr(e.name)},
         ${sqlStr(e.category)},
         ${sqlStr(e.brand)},
         ${sqlStr(e.model)},
         ${e.install_date ? sqlStr(e.install_date) : "NULL"},
         ${e.warranty_expiry ? sqlStr(e.warranty_expiry) : "NULL"},
         ${sqlStr(e.condition)},
         ${sqlNum(e.estimated_replacement_cost)},
         ${sqlStr(e.notes)}
       )`,
    );
  }
}

async function seedProjects(home, propertyId) {
  for (const proj of home.projects) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM projects WHERE property_id = '${propertyId}' AND title = ${sqlStr(proj.title)} LIMIT 1`,
    );
    let projectId;
    if (existing.length) {
      projectId = existing[0].id;
    } else {
      const created = await mgmtQuery(
        env.pat,
        `INSERT INTO projects (
           property_id, title, description, status, project_type,
           priority, phase, estimated_cost, budget, contingency_pct,
           percent_complete, estimated_start_date, end_date,
           show_in_portal, allow_client_messages, show_budget_to_client, send_milestone_updates
         ) VALUES (
           '${propertyId}',
           ${sqlStr(proj.title)},
           ${sqlStr(proj.description)},
           ${sqlStr(proj.status)},
           ${sqlStr(proj.project_type)},
           ${sqlStr(proj.priority)},
           ${sqlStr(proj.phase)},
           ${sqlNum(proj.estimated_cost)},
           ${sqlNum(proj.budget)},
           ${sqlNum(proj.contingency_pct)},
           ${sqlNum(proj.percent_complete)},
           ${proj.estimated_start_date ? sqlStr(proj.estimated_start_date) : "NULL"},
           ${proj.end_date ? sqlStr(proj.end_date) : "NULL"},
           ${sqlBool(proj.show_in_portal)},
           ${sqlBool(proj.allow_client_messages)},
           ${sqlBool(proj.show_budget_to_client)},
           ${sqlBool(proj.send_milestone_updates)}
         ) RETURNING id`,
      );
      projectId = created[0].id;
    }
    // Phases
    for (const ph of proj.phases || []) {
      const phExisting = await mgmtQuery(
        env.pat,
        `SELECT id FROM project_phases WHERE project_id = '${projectId}' AND name = ${sqlStr(ph.name)} LIMIT 1`,
      );
      if (phExisting.length) continue;
      await mgmtQuery(
        env.pat,
        `INSERT INTO project_phases (project_id, name, status, sort_order)
         VALUES ('${projectId}', ${sqlStr(ph.name)}, ${sqlStr(ph.status)}, ${sqlNum(ph.sort_order)})`,
      );
    }
  }
}

async function seedInvoices(home, propertyId) {
  for (const inv of home.invoices) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM invoices WHERE property_id = '${propertyId}' AND invoice_number = ${sqlStr(inv.invoice_number)} LIMIT 1`,
    );
    let invId;
    if (existing.length) {
      invId = existing[0].id;
    } else {
      const created = await mgmtQuery(
        env.pat,
        `INSERT INTO invoices (
           property_id, description, amount, status, due_date, paid_date,
           invoice_number, title, type, issue_date,
           subtotal, tax, total, balance_due
         ) VALUES (
           '${propertyId}',
           ${sqlStr(inv.description)},
           ${sqlNum(inv.total)},
           ${sqlStr(inv.status)},
           ${inv.due_date ? sqlStr(inv.due_date) : "NULL"},
           ${inv.paid_date ? sqlStr(inv.paid_date) : "NULL"},
           ${sqlStr(inv.invoice_number)},
           ${sqlStr(inv.title)},
           ${sqlStr(inv.type)},
           ${inv.issue_date ? sqlStr(inv.issue_date) : "NULL"},
           ${sqlNum(inv.subtotal)},
           ${sqlNum(inv.tax)},
           ${sqlNum(inv.total)},
           ${sqlNum(inv.balance_due)}
         ) RETURNING id`,
      );
      invId = created[0].id;
    }
    // Line items
    let i = 0;
    for (const li of inv.line_items || []) {
      const liExisting = await mgmtQuery(
        env.pat,
        `SELECT id FROM invoice_line_items WHERE invoice_id = '${invId}' AND description = ${sqlStr(li.description)} AND sort_order = ${i} LIMIT 1`,
      );
      if (liExisting.length) { i++; continue; }
      await mgmtQuery(
        env.pat,
        `INSERT INTO invoice_line_items (
           invoice_id, description, quantity, unit_price, total, item_type, sort_order
         ) VALUES (
           '${invId}',
           ${sqlStr(li.description)},
           ${sqlNum(li.quantity)},
           ${sqlNum(li.unit_price)},
           ${sqlNum(li.total)},
           ${sqlStr(li.item_type)},
           ${i}
         )`,
      );
      i++;
    }
  }
}

async function seedScheduleEvents(home, propertyId) {
  for (const ev of home.schedule_events) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM schedule_events WHERE property_id = '${propertyId}' AND title = ${sqlStr(ev.title)} AND event_date = ${sqlStr(ev.event_date)}::timestamptz LIMIT 1`,
    );
    if (existing.length) continue;
    await mgmtQuery(
      env.pat,
      `INSERT INTO schedule_events (
         property_id, title, description, event_date, event_type, status
       ) VALUES (
         '${propertyId}',
         ${sqlStr(ev.title)},
         ${sqlStr(ev.description)},
         ${sqlStr(ev.event_date)}::timestamptz,
         ${sqlStr(ev.event_type)},
         ${sqlStr(ev.status)}
       )`,
    );
  }
}

async function seedGoals(home, clientUserId) {
  for (const g of home.goals) {
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM home_goals WHERE client_id = '${clientUserId}' AND title = ${sqlStr(g.title)} LIMIT 1`,
    );
    if (existing.length) continue;
    await mgmtQuery(
      env.pat,
      `INSERT INTO home_goals (
         client_id, title, description, target_year, estimated_budget, status
       ) VALUES (
         '${clientUserId}',
         ${sqlStr(g.title)},
         ${sqlStr(g.description)},
         ${sqlNum(g.target_year)},
         ${sqlNum(g.estimated_budget)},
         ${sqlStr(g.status)}
       )`,
    );
  }
}

async function seedMessages(home, propertyId, clientUserId, creatorUserId) {
  for (const m of home.messages) {
    const senderId = m.from === "creator" ? creatorUserId : clientUserId;
    const existing = await mgmtQuery(
      env.pat,
      `SELECT id FROM property_messages WHERE property_id = '${propertyId}' AND sender_id = '${senderId}' AND left(message, 80) = ${sqlStr(m.content.slice(0, 80))} LIMIT 1`,
    );
    if (existing.length) continue;
    await mgmtQuery(
      env.pat,
      `INSERT INTO property_messages (property_id, sender_id, message, message_type)
       VALUES ('${propertyId}', '${senderId}', ${sqlStr(m.content)}, 'text')`,
    );
  }
}

async function seedHome(home, creatorUserId) {
  console.log(`\n── ${home.slug.toUpperCase()} — ${home.clientFullName}`);
  const userId = await adminCreateOrFindUser(home.email, PASSWORD, "client", { full_name: home.clientFullName });
  await ensureClientRole(userId);
  console.log(`  user       ${userId}`);
  const propertyId = await seedProperty(home, userId);
  console.log(`  property   ${propertyId}`);
  const reportId = await seedReport(home, propertyId, creatorUserId);
  console.log(`  report     ${reportId}`);
  await seedReportPages(home, reportId);
  console.log(`  pages      ${home.pages.length} inserted`);
  await seedEquipment(home, propertyId);
  console.log(`  equipment  ${home.equipment.length}`);
  await seedProjects(home, propertyId);
  console.log(`  projects   ${home.projects.length}`);
  await seedInvoices(home, propertyId);
  console.log(`  invoices   ${home.invoices.length}`);
  await seedScheduleEvents(home, propertyId);
  console.log(`  events     ${home.schedule_events.length}`);
  await seedGoals(home, userId);
  console.log(`  goals      ${home.goals.length}`);
  await seedMessages(home, propertyId, userId, creatorUserId);
  console.log(`  messages   ${home.messages.length}`);
  return { email: home.email, userId, propertyId, reportId, slug: home.slug };
}

async function main() {
  console.log("Seeding demo clients into live prod...\n");
  const creatorUserId = await getCreatorUserId();
  console.log(`Creator advisor: ${CREATOR_EMAIL} (${creatorUserId})`);

  const results = [];
  for (const home of [ALDERWOOD, BROOKHAVEN, COPPERLINE]) {
    results.push(await seedHome(home, creatorUserId));
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  Seed complete. Demo clients live in prod.");
  console.log("══════════════════════════════════════════════════════════\n");
  console.log("  Shared password for all three: " + PASSWORD + "\n");
  for (const r of results) {
    console.log(`  ${r.slug.padEnd(11)} ${r.email}`);
    console.log(`             portal: https://home-clarity-hub.vercel.app/portal/${r.propertyId}`);
  }
  console.log("\n  Admin view (as yourself): https://home-clarity-hub.vercel.app/admin/clients");
  console.log("  Each is labeled with a [DEMO] prefix and metadata.demo = true,");
  console.log("  so you can filter them out of any query later:");
  console.log("    WHERE (metadata->>'demo')::boolean IS NOT TRUE");
  console.log("\n  Cleanup — remove everything the seed created in one shot:");
  console.log("    DELETE FROM auth.users WHERE email LIKE '%@homeclarityhub.test';");
  console.log("    DELETE FROM properties WHERE (metadata->>'demo')::boolean IS TRUE;");
}

main().catch((err) => {
  console.error("\nseed failed:", err);
  process.exit(1);
});
