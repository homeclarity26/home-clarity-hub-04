// One-shot seeding for the WebKit deep-E2E suite.
//
// Creates or re-uses 3 test users, a test property wired to the client,
// a test project, and a central_vendors row linking the trade partner to
// that project via a project_tasks assignment. Idempotent — safe to rerun.
//
//   node scripts/webkit-e2e-seed.mjs
//
// Cleanup (when you're done testing):
//   DELETE FROM auth.users WHERE email LIKE '%@homeclarityhub.test';
//   DELETE FROM properties WHERE address LIKE 'e2e-webkit-%';
// (Everything else cascades.)

import { loadEnv, mgmtQuery, SUPABASE_URL, TEST_EMAIL, TEST_PROPERTY_ADDRESS_PREFIX } from "./_webkit-helpers.mjs";

const env = loadEnv();

async function adminCreateUser(email, role) {
  const password = crypto.randomUUID() + "aA1!";
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
      user_metadata: { role, full_name: `E2E ${role}` },
    }),
  });
  if (res.status === 422) {
    // Already exists — fetch id.
    const look = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: { apikey: env.serviceRole, Authorization: `Bearer ${env.serviceRole}` } },
    );
    const txt = await look.text();
    try {
      const j = JSON.parse(txt);
      const existing = (j.users || []).find((u) => u.email === email);
      if (existing) return existing.id;
    } catch {}
    throw new Error(`user ${email} exists but can't look up id: ${txt.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`create user ${email}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function ensureUserRole(userId, role) {
  // handle_new_user trigger should insert the right row, but trigger may
  // miss if we bypass it. Belt-and-suspenders upsert.
  await mgmtQuery(
    env.pat,
    `INSERT INTO user_roles (user_id, role)
     VALUES ('${userId}', '${role}'::app_role)
     ON CONFLICT DO NOTHING`,
  );
  // Remove the auto-assigned 'client' row for non-client users.
  if (role !== "client") {
    await mgmtQuery(
      env.pat,
      `DELETE FROM user_roles WHERE user_id = '${userId}' AND role = 'client'::app_role`,
    );
  }
}

async function ensureProperty(clientUserId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM properties WHERE address LIKE '${TEST_PROPERTY_ADDRESS_PREFIX}%' AND client_user_id = '${clientUserId}' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO properties (address, property_name, client_user_id, property_type, city, state, zip)
     VALUES ('${TEST_PROPERTY_ADDRESS_PREFIX}home-1', 'E2E Test Home', '${clientUserId}', 'single_family', 'Hudson', 'OH', '44236')
     RETURNING id`,
  );
  return created[0].id;
}

async function ensureReport(propertyId, creatorUserId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM reports WHERE property_id = '${propertyId}' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO reports (property_id, title, status, created_by, completion_percent)
     VALUES ('${propertyId}', 'E2E Home Clarity Report', 'published', '${creatorUserId}', 75)
     RETURNING id`,
  );
  return created[0].id;
}

async function ensureProject(propertyId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM projects WHERE property_id = '${propertyId}' AND title LIKE 'E2E %' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO projects (property_id, title, status, project_type, priority, show_in_portal)
     VALUES ('${propertyId}', 'E2E Test Project', 'active', 'renovation', 'medium', true)
     RETURNING id`,
  );
  return created[0].id;
}

async function ensureVendor(tradeUserId, creatorUserId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM central_vendors WHERE user_id = '${tradeUserId}' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO central_vendors (company_name, email, status, admin_id, user_id, specialties)
     VALUES ('E2E Test Trade Co', '${TEST_EMAIL.trade}', 'active', '${creatorUserId}', '${tradeUserId}', ARRAY['general'])
     RETURNING id`,
  );
  return created[0].id;
}

async function ensureProjectPhase(projectId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM project_phases WHERE project_id = '${projectId}' AND name = 'E2E Phase' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO project_phases (project_id, name, status, sort_order)
     VALUES ('${projectId}', 'E2E Phase', 'in_progress', 0)
     RETURNING id`,
  );
  return created[0].id;
}

async function ensureProjectTask(projectId, phaseId, vendorId) {
  const existing = await mgmtQuery(
    env.pat,
    `SELECT id FROM project_tasks WHERE project_id = '${projectId}' AND assigned_vendor_id = '${vendorId}' LIMIT 1`,
  );
  if (existing.length) return existing[0].id;
  const created = await mgmtQuery(
    env.pat,
    `INSERT INTO project_tasks (project_id, phase_id, title, status, assigned_vendor_id)
     VALUES ('${projectId}', '${phaseId}', 'E2E Task', 'todo', '${vendorId}')
     RETURNING id`,
  );
  return created[0].id;
}

async function main() {
  console.log("Seeding WebKit E2E users + property + project + vendor link...\n");

  const creatorId = await adminCreateUser(TEST_EMAIL.creator, "creator");
  await ensureUserRole(creatorId, "creator");
  console.log(`  creator  ${TEST_EMAIL.creator} = ${creatorId}`);

  const clientId = await adminCreateUser(TEST_EMAIL.client, "client");
  await ensureUserRole(clientId, "client");
  console.log(`  client   ${TEST_EMAIL.client} = ${clientId}`);

  const tradeId = await adminCreateUser(TEST_EMAIL.trade, "trade_partner");
  await ensureUserRole(tradeId, "trade_partner");
  console.log(`  trade    ${TEST_EMAIL.trade} = ${tradeId}`);

  const propertyId = await ensureProperty(clientId);
  console.log(`  property ${propertyId}`);

  const reportId = await ensureReport(propertyId, creatorId);
  console.log(`  report   ${reportId}`);

  const projectId = await ensureProject(propertyId);
  console.log(`  project  ${projectId}`);

  const vendorId = await ensureVendor(tradeId, creatorId);
  console.log(`  vendor   ${vendorId}`);

  const phaseId = await ensureProjectPhase(projectId);
  console.log(`  phase    ${phaseId}`);

  const taskId = await ensureProjectTask(projectId, phaseId, vendorId);
  console.log(`  task     ${taskId}`);

  console.log("\nSeeding complete.");
  console.log("Manifest:");
  const manifest = {
    creator: { email: TEST_EMAIL.creator, userId: creatorId },
    client: { email: TEST_EMAIL.client, userId: clientId, propertyId, reportId },
    trade: { email: TEST_EMAIL.trade, userId: tradeId, vendorId, projectId, phaseId, taskId },
  };
  console.log(JSON.stringify(manifest, null, 2));
  // Save for the downstream scripts.
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const HERE = path.dirname(fileURLToPath(import.meta.url));
  fs.writeFileSync(path.join(HERE, "_webkit-e2e-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nwrote ${path.join(HERE, "_webkit-e2e-manifest.json")}`);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
