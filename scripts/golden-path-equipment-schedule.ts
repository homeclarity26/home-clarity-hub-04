#!/usr/bin/env bun
/**
 * Golden Path — equipment registry + schedule.
 *
 * The ongoing-care layer. After the report is published, Adam keeps
 * adding real home data (HVAC serial numbers, service dates) and
 * scheduling visits. Clients need to see every addition on their portal.
 *
 * 1. Creator adds an equipment item (2018 Lennox AC with serial number)
 * 2. Client sees it on her equipment query
 * 3. Creator schedules a service event
 * 4. Client sees the event on her schedule query
 * 5. Creator updates equipment (marks service as completed)
 * 6. Client sees the updated last_service_date
 *
 * Exits 0/1. Cleans up test rows.
 */

import {
  loadEnv, restPost, restGet, restPatch, restDelete,
  adminCreateUser, signIn, invokeFn, randSuffix,
  seedTestClient,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  let creatorId = "", creatorJWT = "", clientJWT = "";
  let testPropertyId = "";
  let equipmentId = "", scheduleId = "";

  try {
    const email = `gp-equip-${stamp}-${randSuffix()}@clarityhub.test`;
    const pw = `GP-${randSuffix()}`;
    creatorId = await adminCreateUser(ctx, email, pw, { role: "creator", full_name: "GP Equipment Creator" });
    ctx.cleanups.push(async () => { await restDelete(ctx, `/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signIn(ctx, email, pw);
    const seeded = await seedTestClient(ctx, "gp-equip");
    clientJWT = seeded.jwt;
    testPropertyId = seeded.propertyId;
  } catch (e) {
    results.push({ name: "0. Setup", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 1: Creator adds equipment
  const UNIQUE_SN = `GP-SN-${stamp}-${randSuffix()}`;
  try {
    const [eq] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/equipment`,
      {
        property_id: testPropertyId,
        name: `Test AC — ${stamp}`,
        category: "HVAC",
        brand: "Lennox",
        model: "XC16-036",
        serial_number: UNIQUE_SN,
        install_date: "2018-06-15",
        condition: "Good",
        notes: "Golden Path test equipment, safe to delete.",
      },
      true,
      creatorJWT,
    );
    equipmentId = eq.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/equipment?id=eq.${equipmentId}`); });
    results.push({
      name: "1. Creator adds equipment",
      status: "PASS",
      dataVisible: `id=${equipmentId.slice(0, 8)}… Lennox XC16-036 SN=${UNIQUE_SN.slice(-10)}`,
    });
  } catch (e) {
    results.push({ name: "1. Creator adds equipment", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 2: Client sees it
  try {
    const eq = await restGet<Array<{ id: string; name: string; serial_number: string }>>(
      ctx,
      `/rest/v1/equipment?select=id,name,serial_number&property_id=eq.${testPropertyId}`,
      clientJWT,
    );
    const found = eq.find((e) => e.id === equipmentId);
    if (!found) throw new Error("client doesn't see creator's new equipment");
    if (found.serial_number !== UNIQUE_SN) throw new Error(`serial number mismatch: "${found.serial_number}" vs "${UNIQUE_SN}"`);
    results.push({
      name: "2. Client sees equipment on portal",
      status: "PASS",
      dataVisible: `found id=${found.id.slice(0, 8)}… SN matches`,
    });
  } catch (e) {
    results.push({ name: "2. Client sees equipment on portal", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 3: Creator schedules a service event
  const EVENT_TITLE = `Spring AC tune-up — ${stamp}`;
  try {
    const [ev] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/schedule_events`,
      {
        property_id: testPropertyId,
        title: EVENT_TITLE,
        description: "Annual spring tune-up for the Lennox AC.",
        event_date: new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10),
        event_type: "maintenance",
        status: "scheduled",
      },
      true,
      creatorJWT,
    );
    scheduleId = ev.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/schedule_events?id=eq.${scheduleId}`); });
    results.push({
      name: "3. Creator schedules event",
      status: "PASS",
      dataVisible: `id=${scheduleId.slice(0, 8)}… "${EVENT_TITLE.slice(0, 40)}…"`,
    });
  } catch (e) {
    results.push({ name: "3. Creator schedules event", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 4: Client sees event
  try {
    const events = await restGet<Array<{ id: string; title: string; status: string }>>(
      ctx,
      `/rest/v1/schedule_events?select=id,title,status&property_id=eq.${testPropertyId}`,
      clientJWT,
    );
    const found = events.find((e) => e.id === scheduleId);
    if (!found) throw new Error("client doesn't see scheduled event");
    results.push({
      name: "4. Client sees event on portal",
      status: "PASS",
      dataVisible: `"${found.title.slice(0, 50)}…" status=${found.status}`,
    });
  } catch (e) {
    results.push({ name: "4. Client sees event on portal", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 5: Creator marks service completed — updates equipment.last_service_date
  const SERVICE_DATE = new Date().toISOString().slice(0, 10);
  try {
    await restPatch(ctx, `/rest/v1/equipment?id=eq.${equipmentId}`, { last_service_date: SERVICE_DATE, condition: "Excellent" }, creatorJWT);
    results.push({
      name: "5. Creator logs service completion",
      status: "PASS",
      dataVisible: `last_service_date=${SERVICE_DATE}, condition→Excellent`,
    });
  } catch (e) {
    results.push({ name: "5. Creator logs service completion", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 6: Client sees the update on her own query
  try {
    const [eq] = await restGet<Array<{ last_service_date: string; condition: string }>>(
      ctx,
      `/rest/v1/equipment?select=last_service_date,condition&id=eq.${equipmentId}`,
      clientJWT,
    );
    if (eq.last_service_date !== SERVICE_DATE) throw new Error(`client sees last_service_date=${eq.last_service_date}, expected ${SERVICE_DATE}`);
    if (eq.condition !== "Excellent") throw new Error(`client sees condition=${eq.condition}, expected Excellent`);
    results.push({
      name: "6. Client sees service update",
      status: "PASS",
      dataVisible: `last_service=${eq.last_service_date} condition=${eq.condition}`,
    });
  } catch (e) {
    results.push({ name: "6. Client sees service update", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 7: schedule_events.reminder_sent column exists.
  // Single-column SELECT — fails 400 if the column was dropped.
  try {
    await restGet(ctx, `/rest/v1/schedule_events?select=reminder_sent&limit=1`);
    results.push({
      name: "7. schedule_events.reminder_sent column exists",
      status: "PASS",
      dataVisible: `column readable via REST`,
    });
  } catch (e) {
    results.push({ name: "7. schedule_events.reminder_sent column exists", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 8: send-maintenance-reminders flips reminder_sent on a fresh event.
  // The cron sweeps the next 7 days; insert one at today+3, then invoke and
  // verify the row's reminder_sent transitioned to true. We don't assert
  // whether email was sent (RESEND_API_KEY may be unset in CI; the function
  // logs only and still flips reminder_sent because successfulIds is filled).
  try {
    const inThreeDays = new Date(Date.now() + 3 * 86400 * 1000).toISOString().slice(0, 10);
    const [reminderEvent] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/schedule_events`,
      {
        property_id: testPropertyId,
        title: `GP reminder sweep — ${stamp}`,
        description: "Test event for send-maintenance-reminders sweep.",
        event_date: inThreeDays,
        event_type: "maintenance",
        status: "scheduled",
        reminder_sent: false,
      },
      true,
      creatorJWT,
    );
    const reminderEventId = reminderEvent.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/schedule_events?id=eq.${reminderEventId}`); });

    // NO AUTH function — pass service role JWT so invokeFn can assemble headers.
    await invokeFn(
      ctx,
      "send-maintenance-reminders",
      ctx.serviceRoleKey,
      {},
      60_000,
    );

    const [verified] = await restGet<Array<{ reminder_sent: boolean }>>(
      ctx,
      `/rest/v1/schedule_events?select=reminder_sent&id=eq.${reminderEventId}`,
    );
    if (verified.reminder_sent !== true) {
      throw new Error(`reminder_sent did not flip after sweep: ${verified.reminder_sent}`);
    }

    results.push({
      name: "8. send-maintenance-reminders flips reminder_sent",
      status: "PASS",
      dataVisible: `event id=${reminderEventId.slice(0, 8)}… reminder_sent=true`,
    });
  } catch (e) {
    results.push({ name: "8. send-maintenance-reminders flips reminder_sent", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — equipment + schedule", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (equipment/schedule) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (equipment/schedule) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

main()
  .then((code) => process.exit(code))
  .catch(async (e) => {
    console.error("[golden-path-equipment-schedule] uncaught:", e);
    await runCleanups(ctx);
    process.exit(1);
  });
