import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAuth, corsHeaders } from "../_shared/auth.ts";

// ─── TOOL DEFINITIONS ───

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requiresConfirmation?: boolean;
  allowedRoles: string[];
}

const TOOLS: ToolDef[] = [
  // ── GROUP A: CLIENT MANAGEMENT ──
  { name: "create_client", description: "Create a new client with property record. Returns the new client ID.", parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, city: { type: "string" }, state: { type: "string" }, zip: { type: "string" }, referral_source: { type: "string" }, notes: { type: "string" } }, required: ["name", "email", "address"] }, allowedRoles: ["creator"] },
  { name: "update_client", description: "Update a client's property or profile fields.", parameters: { type: "object", properties: { client_id: { type: "string" }, fields: { type: "object" } }, required: ["client_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "get_client", description: "Get a client by ID, name, or email. Returns full client profile with property, invoices, projects.", parameters: { type: "object", properties: { client_id: { type: "string" }, name: { type: "string" }, email: { type: "string" } } }, allowedRoles: ["creator"] },
  { name: "list_clients", description: "List clients with optional filters: status, has_overdue_invoice, no_contact_days, tag, health_below. Returns array of client summaries.", parameters: { type: "object", properties: { filter: { type: "object" }, limit: { type: "number" }, sort_by: { type: "string" } } }, allowedRoles: ["creator"] },
  { name: "search_clients", description: "Full-text search across client names, emails, addresses, notes, tags.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }, allowedRoles: ["creator"] },
  { name: "update_client_stage", description: "Update a client's CRM pipeline stage.", parameters: { type: "object", properties: { client_id: { type: "string" }, stage: { type: "string", enum: ["lead","onboarding","active","proposal_out","project_running","completed","at_risk","churned"] } }, required: ["client_id", "stage"] }, allowedRoles: ["creator"] },
  { name: "add_client_tag", description: "Add a tag to a client.", parameters: { type: "object", properties: { client_id: { type: "string" }, tag: { type: "string" } }, required: ["client_id", "tag"] }, allowedRoles: ["creator"] },
  { name: "log_client_activity", description: "Log an activity (call, meeting, email, note, site_visit) to a client's timeline.", parameters: { type: "object", properties: { client_id: { type: "string" }, type: { type: "string", enum: ["call","meeting","email","note","site_visit","custom"] }, title: { type: "string" }, notes: { type: "string" }, duration_minutes: { type: "number" } }, required: ["client_id", "type", "title"] }, allowedRoles: ["creator"] },
  { name: "get_client_timeline", description: "Get a client's activity timeline.", parameters: { type: "object", properties: { client_id: { type: "string" }, limit: { type: "number" } }, required: ["client_id"] }, allowedRoles: ["creator"] },
  { name: "archive_client", description: "Archive a client. This is reversible.", parameters: { type: "object", properties: { client_id: { type: "string" } }, required: ["client_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },

  // ── GROUP B: REPORTS ──
  { name: "get_report", description: "Get a report by client_id or report_id, including all pages.", parameters: { type: "object", properties: { client_id: { type: "string" }, report_id: { type: "string" } } }, allowedRoles: ["creator"] },
  { name: "list_report_pages", description: "List all pages in a report with status and condition ratings.", parameters: { type: "object", properties: { report_id: { type: "string" } }, required: ["report_id"] }, allowedRoles: ["creator"] },
  { name: "update_report_page", description: "Update a report page's condition rating, narrative, status, or other fields.", parameters: { type: "object", properties: { page_id: { type: "string" }, fields: { type: "object" } }, required: ["page_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "set_report_page_status", description: "Set a report page status (draft, complete, flagged).", parameters: { type: "object", properties: { page_id: { type: "string" }, status: { type: "string", enum: ["draft","complete","flagged","published"] } }, required: ["page_id", "status"] }, allowedRoles: ["creator"] },
  { name: "publish_report", description: "Publish a report to make it visible to the client.", parameters: { type: "object", properties: { report_id: { type: "string" } }, required: ["report_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "create_report", description: "Create a new report for a property.", parameters: { type: "object", properties: { property_id: { type: "string" }, title: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["creator"] },
  { name: "add_report_page", description: "Add a page to a report.", parameters: { type: "object", properties: { report_id: { type: "string" }, title: { type: "string" }, page_key: { type: "string" }, group_name: { type: "string" } }, required: ["report_id", "title", "page_key"] }, allowedRoles: ["creator"] },

  // ── GROUP C: FIELD INSPECTION ──
  { name: "create_field_inspection", description: "Start a new field inspection session for a client.", parameters: { type: "object", properties: { client_id: { type: "string" }, property_id: { type: "string" }, notes: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["creator"] },
  { name: "get_field_inspections", description: "Get all inspections for a client/property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["creator"] },

  // ── GROUP D: PROJECTS ──
  { name: "create_project", description: "Create a new project for a client.", parameters: { type: "object", properties: { client_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, estimated_cost: { type: "number" }, priority: { type: "string", enum: ["low","medium","high","urgent"] }, status: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" } }, required: ["client_id", "title"] }, allowedRoles: ["creator"] },
  { name: "update_project", description: "Update a project's fields.", parameters: { type: "object", properties: { project_id: { type: "string" }, fields: { type: "object" } }, required: ["project_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "get_project", description: "Get a project by ID with full details.", parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] }, allowedRoles: ["creator"] },
  { name: "list_projects", description: "List projects with optional filters.", parameters: { type: "object", properties: { filter: { type: "object" }, limit: { type: "number" } } }, allowedRoles: ["creator"] },
  { name: "delete_project", description: "Delete a project permanently.", parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "add_project_task", description: "Add a task to a project.", parameters: { type: "object", properties: { project_id: { type: "string" }, title: { type: "string" }, assignee_id: { type: "string" }, due_date: { type: "string" }, priority: { type: "string" }, description: { type: "string" } }, required: ["project_id", "title"] }, allowedRoles: ["creator"] },
  { name: "update_task", description: "Update a task's fields (status, priority, due_date, etc).", parameters: { type: "object", properties: { task_id: { type: "string" }, fields: { type: "object" } }, required: ["task_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "complete_task", description: "Mark a task as completed.", parameters: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] }, allowedRoles: ["creator"] },
  { name: "create_change_order", description: "Create a change order for a project.", parameters: { type: "object", properties: { project_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, amount: { type: "number" } }, required: ["project_id", "title", "amount"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "get_project_budget_summary", description: "Get budget vs actual, change orders, remaining for a project.", parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] }, allowedRoles: ["creator"] },

  // ── GROUP E: ESTIMATES & INVOICES ──
  { name: "create_estimate", description: "Create an estimate for a client with line items.", parameters: { type: "object", properties: { client_id: { type: "string" }, title: { type: "string" }, line_items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, quantity: { type: "number" }, unit_price: { type: "number" } } } }, notes: { type: "string" }, valid_days: { type: "number" } }, required: ["client_id", "title", "line_items"] }, allowedRoles: ["creator"] },
  { name: "get_estimate", description: "Get an estimate by ID.", parameters: { type: "object", properties: { estimate_id: { type: "string" } }, required: ["estimate_id"] }, allowedRoles: ["creator"] },
  { name: "list_estimates", description: "List estimates with filters.", parameters: { type: "object", properties: { filter: { type: "object" } } }, allowedRoles: ["creator"] },
  { name: "send_estimate", description: "Mark estimate as sent and notify client.", parameters: { type: "object", properties: { estimate_id: { type: "string" } }, required: ["estimate_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "convert_estimate_to_invoice", description: "Convert an estimate to an invoice.", parameters: { type: "object", properties: { estimate_id: { type: "string" }, due_days: { type: "number" } }, required: ["estimate_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "update_estimate", description: "Update an estimate's fields (title, notes, status).", parameters: { type: "object", properties: { estimate_id: { type: "string" }, fields: { type: "object" } }, required: ["estimate_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "delete_estimate", description: "Delete a draft estimate.", parameters: { type: "object", properties: { estimate_id: { type: "string" } }, required: ["estimate_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "create_invoice", description: "Create an invoice for a client.", parameters: { type: "object", properties: { client_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, amount: { type: "number" }, due_date: { type: "string" }, project_id: { type: "string" } }, required: ["client_id", "title", "amount", "due_date"] }, allowedRoles: ["creator"] },
  { name: "update_invoice", description: "Update an invoice's fields.", parameters: { type: "object", properties: { invoice_id: { type: "string" }, fields: { type: "object" } }, required: ["invoice_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "list_invoices", description: "List invoices with optional filters (status, client_id, overdue_only).", parameters: { type: "object", properties: { filter: { type: "object" } } }, allowedRoles: ["creator"] },
  { name: "mark_invoice_paid", description: "Mark an invoice as paid.", parameters: { type: "object", properties: { invoice_id: { type: "string" }, payment_method: { type: "string" }, notes: { type: "string" } }, required: ["invoice_id"] }, allowedRoles: ["creator"] },
  { name: "send_invoice", description: "Send an invoice to the client.", parameters: { type: "object", properties: { invoice_id: { type: "string" } }, required: ["invoice_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "void_invoice", description: "Void/cancel an invoice.", parameters: { type: "object", properties: { invoice_id: { type: "string" } }, required: ["invoice_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "get_financial_summary", description: "Get financial summary: total billed, collected, outstanding, overdue. Optional period filter.", parameters: { type: "object", properties: { client_id: { type: "string" }, period: { type: "string", enum: ["7d","30d","90d","ytd","all"] } } }, allowedRoles: ["creator"] },

  // ── GROUP F: VENDORS / TRADE PARTNERS ──
  { name: "create_vendor", description: "Create a new trade partner/vendor.", parameters: { type: "object", properties: { company_name: { type: "string" }, contact_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, specialties: { type: "array", items: { type: "string" } }, tier: { type: "string", enum: ["preferred","approved","inactive"] }, notes: { type: "string" }, license_number: { type: "string" }, insurance_expiry: { type: "string" } }, required: ["company_name"] }, allowedRoles: ["creator"] },
  { name: "update_vendor", description: "Update a vendor's fields.", parameters: { type: "object", properties: { vendor_id: { type: "string" }, fields: { type: "object" } }, required: ["vendor_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "get_vendor", description: "Get a vendor by ID, name, or specialty.", parameters: { type: "object", properties: { vendor_id: { type: "string" }, name: { type: "string" }, specialty: { type: "string" } } }, allowedRoles: ["creator"] },
  { name: "list_vendors", description: "List vendors with optional filters (specialty, tier, insurance_expiring).", parameters: { type: "object", properties: { filter: { type: "object" } } }, allowedRoles: ["creator"] },
  { name: "create_vendor_performance_review", description: "Create a performance review for a vendor.", parameters: { type: "object", properties: { vendor_id: { type: "string" }, project_id: { type: "string" }, quality_score: { type: "number" }, timeliness_score: { type: "number" }, communication_score: { type: "number" }, professionalism_score: { type: "number" }, notes: { type: "string" } }, required: ["vendor_id", "quality_score", "timeliness_score", "communication_score", "professionalism_score"] }, allowedRoles: ["creator"] },
  { name: "request_bid", description: "Send bid invitations to vendors for a project scope.", parameters: { type: "object", properties: { project_id: { type: "string" }, vendor_ids: { type: "array", items: { type: "string" } }, scope_description: { type: "string" }, due_date: { type: "string" } }, required: ["project_id", "vendor_ids", "scope_description"] }, requiresConfirmation: true, allowedRoles: ["creator"] },

  // ── GROUP G: COMMUNICATION ──
  { name: "send_message", description: "Send a message to a client or vendor.", parameters: { type: "object", properties: { recipient_id: { type: "string" }, recipient_type: { type: "string", enum: ["client","vendor"] }, message: { type: "string" }, subject: { type: "string" } }, required: ["recipient_id", "message"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "ai_write_message", description: "Use AI to draft a message for a client/vendor based on an intent description.", parameters: { type: "object", properties: { recipient_id: { type: "string" }, intent: { type: "string" }, tone: { type: "string", enum: ["professional","friendly","urgent"] } }, required: ["recipient_id", "intent"] }, allowedRoles: ["creator"] },
  { name: "get_inbox", description: "Get inbox messages, optionally filtered by client or unread status.", parameters: { type: "object", properties: { filter: { type: "object" } } }, allowedRoles: ["creator"] },
  { name: "mark_message_read", description: "Mark a message or thread as read.", parameters: { type: "object", properties: { message_id: { type: "string" } }, required: ["message_id"] }, allowedRoles: ["creator"] },

  // ── GROUP H: SCHEDULING ──
  { name: "create_event", description: "Create a calendar event.", parameters: { type: "object", properties: { title: { type: "string" }, type: { type: "string", enum: ["site_visit","consultation","inspection","call","follow_up","maintenance","custom"] }, client_id: { type: "string" }, date: { type: "string" }, time: { type: "string" }, duration_minutes: { type: "number" }, location: { type: "string" }, notes: { type: "string" } }, required: ["title", "type", "date"] }, allowedRoles: ["creator"] },
  { name: "get_calendar_events", description: "Get calendar events within a date range.", parameters: { type: "object", properties: { start_date: { type: "string" }, end_date: { type: "string" }, client_id: { type: "string" } } }, allowedRoles: ["creator"] },
  { name: "get_upcoming_events", description: "Get events in the next N days.", parameters: { type: "object", properties: { days: { type: "number" } }, required: ["days"] }, allowedRoles: ["creator"] },
  { name: "delete_event", description: "Delete a calendar event.", parameters: { type: "object", properties: { event_id: { type: "string" } }, required: ["event_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },
  { name: "update_event", description: "Reschedule or update a calendar event. Can change date, time, location, title, or notes. Use this when asked to move, reschedule, or change an event.", parameters: { type: "object", properties: { event_id: { type: "string", description: "ID of the event to update" }, fields: { type: "object", description: "Fields to update: date (YYYY-MM-DD), time (HH:MM), title, location, notes, duration_minutes" }, notify_client: { type: "boolean", description: "If true, send an email to the client about this change" }, client_id: { type: "string", description: "Required if notify_client is true" } }, required: ["event_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "set_event_reminder", description: "Set an advance reminder alert for an event (e.g. 2 hours before). Creates a scheduled notification.", parameters: { type: "object", properties: { event_id: { type: "string" }, remind_minutes_before: { type: "number", description: "How many minutes before the event to send the reminder. 120 = 2 hours." }, reminder_message: { type: "string" } }, required: ["event_id", "remind_minutes_before"] }, allowedRoles: ["creator"] },

  // ── GROUP I: EQUIPMENT ──
  { name: "add_equipment", description: "Add equipment to a property's registry.", parameters: { type: "object", properties: { property_id: { type: "string" }, name: { type: "string" }, category: { type: "string" }, brand: { type: "string" }, model: { type: "string" }, serial_number: { type: "string" }, install_date: { type: "string" }, warranty_expiry: { type: "string" }, notes: { type: "string" } }, required: ["property_id", "name", "category"] }, allowedRoles: ["creator"] },
  { name: "get_equipment", description: "Get all equipment for a property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["creator", "client"] },
  { name: "update_equipment", description: "Update equipment details.", parameters: { type: "object", properties: { equipment_id: { type: "string" }, fields: { type: "object" } }, required: ["equipment_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "delete_equipment", description: "Delete equipment from registry.", parameters: { type: "object", properties: { equipment_id: { type: "string" } }, required: ["equipment_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },

  // ── GROUP J: HOME GOALS ──
  { name: "create_home_goal", description: "Create a home improvement goal for a client.", parameters: { type: "object", properties: { property_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, category: { type: "string" }, target_date: { type: "string" }, estimated_cost: { type: "number" }, priority: { type: "string", enum: ["high","medium","low"] } }, required: ["property_id", "title"] }, allowedRoles: ["creator", "client"] },
  { name: "list_home_goals", description: "List home goals for a property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["creator", "client"] },
  { name: "update_home_goal", description: "Update a home goal's fields (status, progress, description, target_date).", parameters: { type: "object", properties: { goal_id: { type: "string" }, fields: { type: "object" } }, required: ["goal_id", "fields"] }, allowedRoles: ["creator", "client"] },
  { name: "delete_home_goal", description: "Delete a home goal.", parameters: { type: "object", properties: { goal_id: { type: "string" } }, required: ["goal_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },

  // ── GROUP K: MEMBERSHIP & SERVICES ──
  { name: "list_membership_tiers", description: "List all membership tiers.", parameters: { type: "object", properties: {} }, allowedRoles: ["creator"] },
  { name: "list_services", description: "List all services offered.", parameters: { type: "object", properties: {} }, allowedRoles: ["creator"] },

  // ── GROUP L: AUTOMATIONS ──
  { name: "list_automations", description: "List all automation rules.", parameters: { type: "object", properties: { active_only: { type: "boolean" } } }, allowedRoles: ["creator"] },
  { name: "toggle_automation", description: "Enable or disable an automation rule.", parameters: { type: "object", properties: { automation_id: { type: "string" }, active: { type: "boolean" } }, required: ["automation_id", "active"] }, allowedRoles: ["creator"] },

  // ── GROUP M: ANNOUNCEMENTS ──
  { name: "create_announcement", description: "Create a new announcement for clients.", parameters: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, target_audience: { type: "string" } }, required: ["title", "body"] }, allowedRoles: ["creator"] },
  { name: "list_announcements", description: "List announcements.", parameters: { type: "object", properties: {} }, allowedRoles: ["creator"] },
  { name: "update_announcement", description: "Update an announcement.", parameters: { type: "object", properties: { announcement_id: { type: "string" }, fields: { type: "object" } }, required: ["announcement_id", "fields"] }, allowedRoles: ["creator"] },
  { name: "delete_announcement", description: "Delete an announcement.", parameters: { type: "object", properties: { announcement_id: { type: "string" } }, required: ["announcement_id"] }, requiresConfirmation: true, allowedRoles: ["creator"] },

  // ── GROUP N: STANDALONE TASKS ──
  { name: "create_standalone_task", description: "Create a standalone task (not tied to a project). For to-do items, reminders, follow-ups.", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, due_date: { type: "string" }, priority: { type: "string", enum: ["low","medium","high","urgent"] }, client_id: { type: "string" } }, required: ["title"] }, allowedRoles: ["creator"] },
  { name: "list_standalone_tasks", description: "List standalone tasks with optional filters.", parameters: { type: "object", properties: { filter: { type: "object" } } }, allowedRoles: ["creator"] },
  { name: "update_standalone_task", description: "Update a standalone task.", parameters: { type: "object", properties: { task_id: { type: "string" }, fields: { type: "object" } }, required: ["task_id", "fields"] }, allowedRoles: ["creator"] },

  // ── GROUP O: REFERRALS ──
  { name: "create_referral", description: "Log a client referral.", parameters: { type: "object", properties: { referring_client_id: { type: "string" }, referred_name: { type: "string" }, referred_email: { type: "string" }, referred_phone: { type: "string" }, notes: { type: "string" } }, required: ["referred_name"] }, allowedRoles: ["creator", "client"] },
  { name: "list_referrals", description: "List referrals.", parameters: { type: "object", properties: { client_id: { type: "string" } } }, allowedRoles: ["creator"] },

  // ── GROUP P: ANALYTICS ──
  { name: "get_revenue_metrics", description: "Get revenue metrics: total invoiced, collected, outstanding, overdue. Filter by period.", parameters: { type: "object", properties: { period: { type: "string", enum: ["7d","30d","90d","ytd","all"] } } }, allowedRoles: ["creator"] },
  { name: "get_client_metrics", description: "Get client metrics: top by LTV, health, churn risk, no-contact days.", parameters: { type: "object", properties: { metric: { type: "string", enum: ["ltv","health","churn_risk","no_contact","engagement"] }, top_n: { type: "number" } } }, allowedRoles: ["creator"] },
  { name: "get_admin_dashboard_summary", description: "Get full dashboard summary: active clients, open invoices, projects, revenue, at-risk clients, upcoming events, unread messages.", parameters: { type: "object", properties: {} }, allowedRoles: ["creator"] },

  // ── GROUP Q: SETTINGS ──
  { name: "get_admin_profile", description: "Get the admin's profile.", parameters: { type: "object", properties: {} }, allowedRoles: ["creator"] },
  { name: "update_admin_profile", description: "Update admin profile fields.", parameters: { type: "object", properties: { fields: { type: "object" } }, required: ["fields"] }, allowedRoles: ["creator"] },

  // ── GROUP R: CLIENT PORTAL (client-only) ──
  { name: "client_get_home_summary", description: "Get home summary: health score, urgent items, upcoming maintenance, active projects.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_report", description: "Get the published report for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_projects", description: "Get active projects for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_invoices", description: "Get invoices for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_send_message", description: "Send a message to the HBC advisor.", parameters: { type: "object", properties: { property_id: { type: "string" }, message: { type: "string" } }, required: ["property_id", "message"] }, allowedRoles: ["client"] },
  { name: "client_request_appointment", description: "Request an appointment with the advisor.", parameters: { type: "object", properties: { property_id: { type: "string" }, type: { type: "string" }, preferred_dates: { type: "array", items: { type: "string" } }, notes: { type: "string" } }, required: ["property_id", "type"] }, allowedRoles: ["client"] },
  { name: "client_get_equipment", description: "Get equipment list for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_add_home_goal", description: "Add a home improvement goal.", parameters: { type: "object", properties: { property_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, target_date: { type: "string" }, estimated_cost: { type: "number" } }, required: ["property_id", "title"] }, allowedRoles: ["client"] },
  { name: "client_submit_feedback", description: "Submit feedback/rating.", parameters: { type: "object", properties: { property_id: { type: "string" }, rating: { type: "number" }, comment: { type: "string" } }, required: ["property_id", "rating"] }, allowedRoles: ["client"] },
  { name: "client_get_schedule", description: "Get upcoming scheduled events and maintenance for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_documents", description: "List documents/files for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_warranties", description: "Get equipment with warranty and service status for this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_get_estimates", description: "Get estimates/proposals sent to this property.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_accept_estimate", description: "Accept a sent estimate/proposal.", parameters: { type: "object", properties: { estimate_id: { type: "string" } }, required: ["estimate_id"] }, requiresConfirmation: true, allowedRoles: ["client"] },
  { name: "client_submit_service_request", description: "Submit a concierge/service request to the advisor.", parameters: { type: "object", properties: { property_id: { type: "string" }, service_type: { type: "string" }, description: { type: "string" }, preferred_date: { type: "string" } }, required: ["property_id", "service_type", "description"] }, allowedRoles: ["client"] },
  { name: "client_update_goal", description: "Update or complete a home goal.", parameters: { type: "object", properties: { goal_id: { type: "string" }, fields: { type: "object" } }, required: ["goal_id", "fields"] }, allowedRoles: ["client"] },
  { name: "client_get_maintenance_due", description: "Get equipment and items with maintenance due this month.", parameters: { type: "object", properties: { property_id: { type: "string" } }, required: ["property_id"] }, allowedRoles: ["client"] },
  { name: "client_submit_referral", description: "Submit a friend referral.", parameters: { type: "object", properties: { property_id: { type: "string" }, friend_name: { type: "string" }, friend_email: { type: "string" }, friend_phone: { type: "string" }, notes: { type: "string" } }, required: ["property_id", "friend_name"] }, allowedRoles: ["client"] },
];

// ─── TOOL HANDLERS ───

async function executeTool(supabase: any, toolName: string, params: any, userId: string): Promise<{ success: boolean; result: any; entity_id?: string; entity_type?: string; nav_link?: string }> {
  try {
    switch (toolName) {
      // ── CLIENT MANAGEMENT ──
      case "create_client": {
        const { data: prop, error } = await supabase.from("properties").insert({
          property_name: params.name, address: params.address, city: params.city, state: params.state, zip: params.zip, creator_user_id: userId,
          metadata: { referral_source: params.referral_source },
        }).select().single();
        if (error) throw error;
        await supabase.from("crm_contacts").insert({ contact_type: "client", property_id: prop.id, client_stage: "lead", referral_source: params.referral_source, notes: params.notes, created_by: userId });
        return { success: true, result: { message: `Client "${params.name}" created`, property_id: prop.id }, entity_id: prop.id, entity_type: "client", nav_link: `/admin/clients/${prop.id}` };
      }

      case "update_client": {
        const { error } = await supabase.from("properties").update(params.fields).eq("id", params.client_id);
        if (error) throw error;
        return { success: true, result: { message: "Client updated" }, entity_id: params.client_id, entity_type: "client" };
      }

      case "get_client": {
        let query = supabase.from("properties").select("*");
        if (params.client_id) query = query.eq("id", params.client_id);
        else if (params.name) query = query.ilike("property_name", `%${params.name}%`);
        else if (params.email) {
          const { data: profiles } = await supabase.from("profiles").select("user_id").ilike("email", `%${params.email}%`);
          const uids = (profiles || []).map((p: any) => p.user_id);
          if (uids.length === 0) return { success: true, result: { message: "No client found with that email", clients: [] } };
          query = query.in("client_user_id", uids);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) return { success: true, result: { message: "No clients found", clients: [] } };
        for (const c of data) {
          const { count: invCount } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("property_id", c.id).neq("status", "paid");
          const { count: projCount } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("property_id", c.id).neq("status", "completed");
          c._open_invoices = invCount || 0;
          c._active_projects = projCount || 0;
        }
        if (data.length === 1) return { success: true, result: data[0], entity_id: data[0].id, entity_type: "client", nav_link: `/admin/clients/${data[0].id}` };
        return { success: true, result: { message: `Found ${data.length} clients`, clients: data.map((c: any) => ({ id: c.id, name: c.property_name, address: c.address, open_invoices: c._open_invoices, active_projects: c._active_projects })) } };
      }

      case "list_clients": {
        let query = supabase.from("properties").select("id, property_name, address, city, state, status, created_at").order("created_at", { ascending: false });
        if (params.limit) query = query.limit(params.limit);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { count: (data || []).length, clients: data || [] } };
      }

      case "search_clients": {
        const q = `%${params.query}%`;
        const { data } = await supabase.from("properties").select("id, property_name, address, city, state").or(`property_name.ilike.${q},address.ilike.${q}`).limit(10);
        return { success: true, result: { count: (data || []).length, clients: data || [] } };
      }

      case "update_client_stage": {
        const { data: contacts } = await supabase.from("crm_contacts").select("id, client_stage").eq("property_id", params.client_id).eq("contact_type", "client");
        if (!contacts || contacts.length === 0) {
          await supabase.from("crm_contacts").insert({ contact_type: "client", property_id: params.client_id, client_stage: params.stage, created_by: userId });
        } else {
          const c = contacts[0];
          await supabase.from("crm_contacts").update({ client_stage: params.stage }).eq("id", c.id);
          await supabase.from("crm_pipeline_history").insert({ contact_id: c.id, from_stage: c.client_stage, to_stage: params.stage, changed_by: userId });
        }
        return { success: true, result: { message: `Client stage updated to "${params.stage}"` }, entity_id: params.client_id, entity_type: "client" };
      }

      case "add_client_tag": {
        const { data: contacts } = await supabase.from("crm_contacts").select("id, tags").eq("property_id", params.client_id).eq("contact_type", "client");
        if (contacts && contacts.length > 0) {
          const tags = [...(contacts[0].tags || []), params.tag];
          await supabase.from("crm_contacts").update({ tags }).eq("id", contacts[0].id);
        }
        return { success: true, result: { message: `Tag "${params.tag}" added` }, entity_id: params.client_id, entity_type: "client" };
      }

      case "log_client_activity": {
        const { data: contacts } = await supabase.from("crm_contacts").select("id").eq("property_id", params.client_id).eq("contact_type", "client").limit(1);
        const contactId = contacts?.[0]?.id;
        if (contactId) {
          await supabase.from("crm_activity_log").insert({ contact_id: contactId, activity_type: params.type, content_preview: params.title, metadata: { notes: params.notes, duration_minutes: params.duration_minutes }, logged_by: userId });
        }
        await supabase.from("activity_log").insert({ user_id: userId, property_id: params.client_id, action_type: params.type, message: params.title });
        return { success: true, result: { message: `Activity "${params.title}" logged` }, entity_id: params.client_id, entity_type: "client" };
      }

      case "get_client_timeline": {
        const { data } = await supabase.from("activity_log").select("*").eq("property_id", params.client_id).order("created_at", { ascending: false }).limit(params.limit || 20);
        return { success: true, result: { events: data || [] } };
      }

      case "archive_client": {
        await supabase.from("properties").update({ status: "archived" }).eq("id", params.client_id);
        return { success: true, result: { message: "Client archived" }, entity_id: params.client_id, entity_type: "client" };
      }

      // ── REPORTS ──
      case "get_report": {
        let reportQuery;
        if (params.report_id) reportQuery = supabase.from("reports").select("*, report_pages(*)").eq("id", params.report_id).single();
        else reportQuery = supabase.from("reports").select("*, report_pages(*)").eq("property_id", params.client_id).order("created_at", { ascending: false }).limit(1).single();
        const { data, error } = await reportQuery;
        if (error) return { success: true, result: { message: "No report found" } };
        return { success: true, result: data, entity_id: data.id, entity_type: "report" };
      }

      case "list_report_pages": {
        const { data } = await supabase.from("report_pages").select("id, title, status, condition_rating, sort_order").eq("report_id", params.report_id).order("sort_order");
        return { success: true, result: { pages: data || [] } };
      }

      case "update_report_page": {
        const { error } = await supabase.from("report_pages").update(params.fields).eq("id", params.page_id);
        if (error) throw error;
        return { success: true, result: { message: "Report page updated" }, entity_id: params.page_id, entity_type: "report_page" };
      }

      case "set_report_page_status": {
        await supabase.from("report_pages").update({ status: params.status }).eq("id", params.page_id);
        return { success: true, result: { message: `Page status set to "${params.status}"` } };
      }

      case "publish_report": {
        await supabase.from("reports").update({ status: "published" }).eq("id", params.report_id);
        return { success: true, result: { message: "Report published and now visible to client" }, entity_id: params.report_id, entity_type: "report" };
      }

      case "create_report": {
        const { data, error } = await supabase.from("reports").insert({
          property_id: params.property_id, title: params.title || "Home Assessment Report", status: "draft", completion_percent: 0, created_by: userId,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Report "${data.title}" created`, report_id: data.id }, entity_id: data.id, entity_type: "report" };
      }

      case "add_report_page": {
        const { count } = await supabase.from("report_pages").select("*", { count: "exact", head: true }).eq("report_id", params.report_id);
        const { data, error } = await supabase.from("report_pages").insert({
          report_id: params.report_id, title: params.title, page_key: params.page_key, group_name: params.group_name || "General", status: "draft", sort_order: (count || 0) + 1,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Page "${params.title}" added to report`, page_id: data.id }, entity_id: data.id, entity_type: "report_page" };
      }

      // ── FIELD INSPECTION ──
      case "create_field_inspection": {
        const { data, error } = await supabase.from("field_inspections").insert({ property_id: params.property_id, admin_id: userId, notes: params.notes, status: "in_progress" }).select().single();
        if (error) throw error;
        return { success: true, result: { message: "Inspection started", inspection_id: data.id }, entity_id: data.id, entity_type: "inspection" };
      }

      case "get_field_inspections": {
        const { data } = await supabase.from("field_inspections").select("*").eq("property_id", params.property_id).order("created_at", { ascending: false });
        return { success: true, result: { inspections: data || [] } };
      }

      // ── PROJECTS ──
      case "create_project": {
        const { data, error } = await supabase.from("projects").insert({
          property_id: params.client_id, title: params.title, description: params.description,
          estimated_cost: params.estimated_cost, priority: params.priority || "medium", status: params.status || "planned",
          start_date: params.start_date, end_date: params.end_date,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Project "${params.title}" created`, project_id: data.id }, entity_id: data.id, entity_type: "project", nav_link: `/admin/projects/${data.id}` };
      }

      case "update_project": {
        await supabase.from("projects").update(params.fields).eq("id", params.project_id);
        return { success: true, result: { message: "Project updated" }, entity_id: params.project_id, entity_type: "project" };
      }

      case "get_project": {
        const { data } = await supabase.from("projects").select("*").eq("id", params.project_id).single();
        return { success: true, result: data || { message: "Project not found" }, entity_id: params.project_id, entity_type: "project", nav_link: `/admin/projects/${params.project_id}` };
      }

      case "list_projects": {
        let q = supabase.from("projects").select("id, title, status, priority, estimated_cost, property_id, created_at").order("created_at", { ascending: false });
        if (params.filter?.status) q = q.eq("status", params.filter.status);
        if (params.filter?.client_id) q = q.eq("property_id", params.filter.client_id);
        if (params.limit) q = q.limit(params.limit);
        const { data } = await q;
        return { success: true, result: { count: (data || []).length, projects: data || [] } };
      }

      case "delete_project": {
        await supabase.from("projects").delete().eq("id", params.project_id);
        return { success: true, result: { message: "Project deleted" } };
      }

      case "add_project_task": {
        const { data, error } = await supabase.from("project_tasks").insert({
          project_id: params.project_id, title: params.title, assigned_to: params.assignee_id,
          due_date: params.due_date, priority: params.priority || "medium", description: params.description, status: "not_started",
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Task "${params.title}" added`, task_id: data.id }, entity_id: data.id, entity_type: "task" };
      }

      case "update_task": {
        await supabase.from("project_tasks").update(params.fields).eq("id", params.task_id);
        return { success: true, result: { message: "Task updated" }, entity_id: params.task_id, entity_type: "task" };
      }

      case "complete_task": {
        await supabase.from("project_tasks").update({ status: "complete" }).eq("id", params.task_id);
        return { success: true, result: { message: "Task marked as complete" }, entity_id: params.task_id, entity_type: "task" };
      }

      case "create_change_order": {
        const { data, error } = await supabase.from("change_orders").insert({
          invoice_id: params.project_id, title: params.title, description: params.description, amount: params.amount, status: "pending",
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Change order "${params.title}" created for $${params.amount}`, change_order_id: data.id }, entity_id: data.id, entity_type: "change_order" };
      }

      case "get_project_budget_summary": {
        const { data: project } = await supabase.from("projects").select("estimated_cost, actual_cost").eq("id", params.project_id).single();
        return { success: true, result: { estimated: project?.estimated_cost || 0, actual: project?.actual_cost || 0, remaining: (project?.estimated_cost || 0) - (project?.actual_cost || 0) } };
      }

      // ── ESTIMATES ──
      case "create_estimate": {
        const subtotal = (params.line_items || []).reduce((s: number, li: any) => s + (li.quantity || 1) * (li.unit_price || 0), 0);
        const { data: est, error } = await supabase.from("estimates").insert({
          admin_id: userId, property_id: params.client_id, title: params.title, notes: params.notes,
          subtotal, total: subtotal, status: "draft",
          valid_until: params.valid_days ? new Date(Date.now() + params.valid_days * 86400000).toISOString() : null,
        }).select().single();
        if (error) throw error;
        for (let i = 0; i < (params.line_items || []).length; i++) {
          const li = params.line_items[i];
          await supabase.from("estimate_line_items").insert({
            estimate_id: est.id, description: li.description, quantity: li.quantity || 1, unit_price: li.unit_price || 0,
            total: (li.quantity || 1) * (li.unit_price || 0), sort_order: i,
          });
        }
        return { success: true, result: { message: `Estimate "${params.title}" created for $${subtotal.toLocaleString()}`, estimate_id: est.id, total: subtotal }, entity_id: est.id, entity_type: "estimate" };
      }

      case "get_estimate": {
        const { data } = await supabase.from("estimates").select("*, estimate_line_items(*)").eq("id", params.estimate_id).single();
        return { success: true, result: data || { message: "Estimate not found" }, entity_id: params.estimate_id, entity_type: "estimate" };
      }

      case "list_estimates": {
        let q = supabase.from("estimates").select("id, title, status, total, created_at, property_id").order("created_at", { ascending: false });
        if (params.filter?.client_id) q = q.eq("property_id", params.filter.client_id);
        if (params.filter?.status) q = q.eq("status", params.filter.status);
        const { data } = await q;
        return { success: true, result: { count: (data || []).length, estimates: data || [] } };
      }

      case "send_estimate": {
        await supabase.from("estimates").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", params.estimate_id);
        return { success: true, result: { message: "Estimate marked as sent" }, entity_id: params.estimate_id, entity_type: "estimate" };
      }

      case "convert_estimate_to_invoice": {
        const { data: est } = await supabase.from("estimates").select("*, estimate_line_items(*)").eq("id", params.estimate_id).single();
        if (!est) return { success: false, result: { message: "Estimate not found" } };
        const dueDate = new Date(Date.now() + (params.due_days || 30) * 86400000).toISOString().split("T")[0];
        const { data: inv, error } = await supabase.from("invoices").insert({
          property_id: est.property_id, title: est.title, description: est.notes || "", amount: est.total, status: "pending", due_date: dueDate,
        }).select().single();
        if (error) throw error;
        await supabase.from("estimates").update({ status: "converted", converted_invoice_id: inv.id }).eq("id", params.estimate_id);
        return { success: true, result: { message: `Estimate converted to invoice #${inv.invoice_number || inv.id}`, invoice_id: inv.id }, entity_id: inv.id, entity_type: "invoice" };
      }

      case "update_estimate": {
        await supabase.from("estimates").update(params.fields).eq("id", params.estimate_id);
        return { success: true, result: { message: "Estimate updated" }, entity_id: params.estimate_id, entity_type: "estimate" };
      }

      case "delete_estimate": {
        await supabase.from("estimate_line_items").delete().eq("estimate_id", params.estimate_id);
        await supabase.from("estimates").delete().eq("id", params.estimate_id);
        return { success: true, result: { message: "Estimate deleted" } };
      }

      // ── INVOICES ──
      case "create_invoice": {
        const { data, error } = await supabase.from("invoices").insert({
          property_id: params.client_id, title: params.title, description: params.description || "",
          amount: params.amount, due_date: params.due_date, status: "pending",
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Invoice created for $${params.amount}`, invoice_id: data.id, invoice_number: data.invoice_number }, entity_id: data.id, entity_type: "invoice" };
      }

      case "update_invoice": {
        await supabase.from("invoices").update(params.fields).eq("id", params.invoice_id);
        return { success: true, result: { message: "Invoice updated" }, entity_id: params.invoice_id, entity_type: "invoice" };
      }

      case "list_invoices": {
        let q = supabase.from("invoices").select("id, invoice_number, title, amount, status, due_date, paid_date, property_id").order("created_at", { ascending: false });
        if (params.filter?.client_id) q = q.eq("property_id", params.filter.client_id);
        if (params.filter?.status) q = q.eq("status", params.filter.status);
        if (params.filter?.overdue_only) q = q.eq("status", "overdue");
        const { data } = await q;
        return { success: true, result: { count: (data || []).length, invoices: data || [] } };
      }

      case "mark_invoice_paid": {
        await supabase.from("invoices").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", params.invoice_id);
        return { success: true, result: { message: "Invoice marked as paid" }, entity_id: params.invoice_id, entity_type: "invoice" };
      }

      case "send_invoice": {
        await supabase.from("invoices").update({ status: "sent" }).eq("id", params.invoice_id);
        return { success: true, result: { message: "Invoice sent to client" }, entity_id: params.invoice_id, entity_type: "invoice" };
      }

      case "void_invoice": {
        await supabase.from("invoices").update({ status: "cancelled" }).eq("id", params.invoice_id);
        return { success: true, result: { message: "Invoice voided" }, entity_id: params.invoice_id, entity_type: "invoice" };
      }

      case "get_financial_summary": {
        let q = supabase.from("invoices").select("amount, status, due_date, paid_date");
        if (params.client_id) q = q.eq("property_id", params.client_id);
        const { data: invoices } = await q;
        const all = invoices || [];
        const total = all.reduce((s: number, i: any) => s + (i.amount || 0), 0);
        const paid = all.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount || 0), 0);
        const outstanding = all.filter((i: any) => i.status !== "paid" && i.status !== "cancelled").reduce((s: number, i: any) => s + (i.amount || 0), 0);
        const overdue = all.filter((i: any) => i.status === "overdue").reduce((s: number, i: any) => s + (i.amount || 0), 0);
        return { success: true, result: { total_invoiced: total, total_collected: paid, outstanding, overdue, invoice_count: all.length } };
      }

      // ── VENDORS ──
      case "create_vendor": {
        const { data, error } = await supabase.from("central_vendors").insert({
          admin_id: userId, company_name: params.company_name, contact_name: params.contact_name,
          email: params.email, phone: params.phone, specialties: params.specialties,
          tier: params.tier || "approved", notes: params.notes, license_number: params.license_number,
          insurance_expiry: params.insurance_expiry, status: "active",
        }).select().single();
        if (error) throw error;
        await supabase.from("crm_contacts").insert({ contact_type: "trade_partner", vendor_id: data.id, partner_stage: "approved", created_by: userId });
        return { success: true, result: { message: `Vendor "${params.company_name}" created`, vendor_id: data.id }, entity_id: data.id, entity_type: "vendor", nav_link: `/admin/crm/trade-partners/${data.id}` };
      }

      case "update_vendor": {
        await supabase.from("central_vendors").update(params.fields).eq("id", params.vendor_id);
        return { success: true, result: { message: "Vendor updated" }, entity_id: params.vendor_id, entity_type: "vendor" };
      }

      case "get_vendor": {
        let q = supabase.from("central_vendors").select("*");
        if (params.vendor_id) q = q.eq("id", params.vendor_id);
        else if (params.name) q = q.ilike("company_name", `%${params.name}%`);
        else if (params.specialty) q = q.contains("specialties", [params.specialty]);
        const { data } = await q;
        return { success: true, result: data?.length === 1 ? data[0] : { vendors: data || [] } };
      }

      case "list_vendors": {
        let q = supabase.from("central_vendors").select("id, company_name, contact_name, specialties, tier, rating, email, phone, status").eq("status", "active").order("company_name");
        if (params.filter?.tier) q = q.eq("tier", params.filter.tier);
        const { data } = await q;
        return { success: true, result: { count: (data || []).length, vendors: data || [] } };
      }

      case "create_vendor_performance_review": {
        const { data, error } = await supabase.from("vendor_performance_reviews").insert({
          vendor_id: params.vendor_id, project_id: params.project_id, reviewer_id: userId,
          quality_score: params.quality_score, timeliness_score: params.timeliness_score,
          communication_score: params.communication_score, professionalism_score: params.professionalism_score,
          overall_score: Math.round((params.quality_score + params.timeliness_score + params.communication_score + params.professionalism_score) / 4 * 10) / 10,
          notes: params.notes, recommend: true,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: "Performance review submitted" }, entity_id: data.id, entity_type: "review" };
      }

      case "request_bid": {
        for (const vid of params.vendor_ids) {
          await supabase.from("contractor_bids").insert({ project_id: params.project_id, contractor_name: vid, scope_of_work: params.scope_description, status: "pending", bid_date: params.due_date });
        }
        return { success: true, result: { message: `Bid invitations sent to ${params.vendor_ids.length} vendors` } };
      }

      // ── COMMUNICATION ──
      case "send_message": {
        await supabase.from("property_messages").insert({ property_id: params.recipient_id, sender_id: userId, message: params.message });
        return { success: true, result: { message: "Message sent" }, entity_id: params.recipient_id, entity_type: "message" };
      }

      case "ai_write_message": {
        const { data: prop } = await supabase.from("properties").select("property_name, address").eq("id", params.recipient_id).single();
        const clientName = prop?.property_name || "the client";
        const draft = `Dear ${clientName},\n\n${params.intent}\n\nBest regards,\nAdam Kilgore\nHometown Builders Club`;
        return { success: true, result: { draft, message: "Here's a draft message you can review and send:" } };
      }

      case "get_inbox": {
        let q = supabase.from("property_messages").select("*, properties(property_name)").order("created_at", { ascending: false }).limit(20);
        if (params.filter?.unread_only) q = q.eq("is_read", false);
        if (params.filter?.client_id) q = q.eq("property_id", params.filter.client_id);
        const { data } = await q;
        return { success: true, result: { messages: data || [] } };
      }

      case "mark_message_read": {
        await supabase.from("property_messages").update({ is_read: true }).eq("id", params.message_id);
        return { success: true, result: { message: "Message marked as read" } };
      }

      // ── SCHEDULING ──
      case "create_event": {
        const { data, error } = await supabase.from("schedule_events").insert({
          title: params.title, property_id: params.client_id, event_type: params.type,
          event_date: params.date, start_time: params.time, duration_minutes: params.duration_minutes || 60,
          location: params.location, notes: params.notes, created_by: userId,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Event "${params.title}" created`, event_id: data.id }, entity_id: data.id, entity_type: "event" };
      }

      case "get_calendar_events": {
        let q = supabase.from("schedule_events").select("*").order("event_date");
        if (params.start_date) q = q.gte("event_date", params.start_date);
        if (params.end_date) q = q.lte("event_date", params.end_date);
        if (params.client_id) q = q.eq("property_id", params.client_id);
        const { data } = await q;
        return { success: true, result: { events: data || [] } };
      }

      case "get_upcoming_events": {
        const end = new Date(Date.now() + (params.days || 7) * 86400000).toISOString().split("T")[0];
        const { data } = await supabase.from("schedule_events").select("*").gte("event_date", new Date().toISOString().split("T")[0]).lte("event_date", end).order("event_date");
        return { success: true, result: { events: data || [] } };
      }

      case "delete_event": {
        await supabase.from("schedule_events").delete().eq("id", params.event_id);
        return { success: true, result: { message: "Event deleted" } };
      }

      // ── EQUIPMENT ──
      case "add_equipment": {
        const { data, error } = await supabase.from("equipment").insert({
          property_id: params.property_id, name: params.name, category: params.category,
          brand: params.brand, model: params.model, serial_number: params.serial_number,
          install_date: params.install_date, warranty_expiry: params.warranty_expiry, notes: params.notes,
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Equipment "${params.name}" added`, equipment_id: data.id }, entity_id: data.id, entity_type: "equipment" };
      }

      case "get_equipment": {
        const { data } = await supabase.from("equipment").select("*").eq("property_id", params.property_id).order("category, name");
        return { success: true, result: { count: (data || []).length, equipment: data || [] } };
      }

      case "update_equipment": {
        await supabase.from("equipment").update(params.fields).eq("id", params.equipment_id);
        return { success: true, result: { message: "Equipment updated" } };
      }

      case "delete_equipment": {
        await supabase.from("equipment").delete().eq("id", params.equipment_id);
        return { success: true, result: { message: "Equipment removed" } };
      }

      // ── HOME GOALS ──
      case "create_home_goal": {
        const { data, error } = await supabase.from("client_goals").insert({
          property_id: params.property_id, client_id: userId, title: params.title,
          description: params.description, category: params.category, target_date: params.target_date, status: "active",
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Goal "${params.title}" created`, goal_id: data.id }, entity_id: data.id, entity_type: "goal" };
      }

      case "list_home_goals": {
        const { data } = await supabase.from("client_goals").select("*").eq("property_id", params.property_id).order("created_at", { ascending: false });
        return { success: true, result: { goals: data || [] } };
      }

      case "update_home_goal": {
        await supabase.from("client_goals").update(params.fields).eq("id", params.goal_id);
        return { success: true, result: { message: "Goal updated" }, entity_id: params.goal_id, entity_type: "goal" };
      }

      case "delete_home_goal": {
        await supabase.from("client_goals").delete().eq("id", params.goal_id);
        return { success: true, result: { message: "Goal deleted" } };
      }

      // ── MEMBERSHIP & SERVICES ──
      case "list_membership_tiers": {
        const { data } = await supabase.from("membership_tiers").select("*").order("sort_order");
        return { success: true, result: { tiers: data || [] } };
      }

      case "list_services": {
        const { data } = await supabase.from("services").select("*").order("name");
        return { success: true, result: { services: data || [] } };
      }

      // ── AUTOMATIONS ──
      case "list_automations": {
        let q = supabase.from("automation_rules").select("*").order("created_at");
        if (params.active_only) q = q.eq("is_enabled", true);
        const { data } = await q;
        return { success: true, result: { rules: data || [] } };
      }

      case "toggle_automation": {
        await supabase.from("automation_rules").update({ is_enabled: params.active }).eq("id", params.automation_id);
        return { success: true, result: { message: `Automation ${params.active ? "enabled" : "disabled"}` } };
      }

      // ── ANNOUNCEMENTS ──
      case "create_announcement": {
        const { data, error } = await supabase.from("announcements").insert({
          title: params.title, body: params.body, target_audience: params.target_audience || "all",
          created_by: userId, start_date: new Date().toISOString(),
        }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Announcement "${params.title}" created`, announcement_id: data.id }, entity_id: data.id, entity_type: "announcement" };
      }

      case "list_announcements": {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        return { success: true, result: { announcements: data || [] } };
      }

      case "update_announcement": {
        await supabase.from("announcements").update(params.fields).eq("id", params.announcement_id);
        return { success: true, result: { message: "Announcement updated" }, entity_id: params.announcement_id, entity_type: "announcement" };
      }

      case "delete_announcement": {
        await supabase.from("announcements").delete().eq("id", params.announcement_id);
        return { success: true, result: { message: "Announcement deleted" } };
      }

      // ── STANDALONE TASKS ──
      case "create_standalone_task": {
        const { data, error } = await supabase.from("admin_tasks").insert({
          title: params.title, description: params.description, due_date: params.due_date,
          priority: params.priority || "medium", property_id: params.client_id, created_by: userId, status: "pending",
        }).select().single();
        if (error) {
          // Fallback to schedule_events if admin_tasks doesn't exist
          const { data: evt, error: evtErr } = await supabase.from("schedule_events").insert({
            title: params.title, notes: params.description, event_date: params.due_date || new Date().toISOString().split("T")[0],
            event_type: "task", property_id: params.client_id, created_by: userId,
          }).select().single();
          if (evtErr) throw evtErr;
          return { success: true, result: { message: `Task "${params.title}" created as calendar event`, task_id: evt.id }, entity_id: evt.id, entity_type: "event" };
        }
        return { success: true, result: { message: `Task "${params.title}" created`, task_id: data.id }, entity_id: data.id, entity_type: "task" };
      }

      case "list_standalone_tasks": {
        const { data, error } = await supabase.from("admin_tasks").select("*").order("created_at", { ascending: false });
        if (error) {
          // Fallback to schedule events with type=task
          const { data: evts } = await supabase.from("schedule_events").select("*").eq("event_type", "task").order("event_date");
          return { success: true, result: { tasks: evts || [] } };
        }
        return { success: true, result: { tasks: data || [] } };
      }

      case "update_standalone_task": {
        const { error } = await supabase.from("admin_tasks").update(params.fields).eq("id", params.task_id);
        if (error) {
          await supabase.from("schedule_events").update(params.fields).eq("id", params.task_id);
        }
        return { success: true, result: { message: "Task updated" }, entity_id: params.task_id, entity_type: "task" };
      }

      // ── REFERRALS ──
      case "create_referral": {
        const { data, error } = await supabase.from("referrals").insert({
          referring_client_id: params.referring_client_id, referred_name: params.referred_name,
          referred_email: params.referred_email, referred_phone: params.referred_phone,
          notes: params.notes, status: "pending", created_by: userId,
        }).select().single();
        if (error) {
          // Fallback: log as activity
          await supabase.from("activity_log").insert({ user_id: userId, property_id: params.referring_client_id, action_type: "referral", message: `Referral: ${params.referred_name} (${params.referred_email || "no email"})` });
          return { success: true, result: { message: `Referral for "${params.referred_name}" logged` } };
        }
        return { success: true, result: { message: `Referral for "${params.referred_name}" created`, referral_id: data.id }, entity_id: data.id, entity_type: "referral" };
      }

      case "list_referrals": {
        const { data, error } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
        if (error) {
          const { data: logs } = await supabase.from("activity_log").select("*").eq("action_type", "referral").order("created_at", { ascending: false });
          return { success: true, result: { referrals: logs || [] } };
        }
        return { success: true, result: { referrals: data || [] } };
      }

      // ── ANALYTICS ──
      case "get_revenue_metrics": {
        const { data: invoices } = await supabase.from("invoices").select("amount, status");
        const all = invoices || [];
        return { success: true, result: {
          total_invoiced: all.reduce((s: number, i: any) => s + (i.amount || 0), 0),
          total_collected: all.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount || 0), 0),
          outstanding: all.filter((i: any) => !["paid","cancelled"].includes(i.status)).reduce((s: number, i: any) => s + (i.amount || 0), 0),
          overdue: all.filter((i: any) => i.status === "overdue").reduce((s: number, i: any) => s + (i.amount || 0), 0),
        }};
      }

      case "get_client_metrics": {
        const { data: clients } = await supabase.from("properties").select("id, property_name, created_at").order("created_at", { ascending: false }).limit(params.top_n || 10);
        return { success: true, result: { clients: clients || [] } };
      }

      case "get_admin_dashboard_summary": {
        const { count: clientCount } = await supabase.from("properties").select("*", { count: "exact", head: true });
        const { count: openInvoices } = await supabase.from("invoices").select("*", { count: "exact", head: true }).neq("status", "paid").neq("status", "cancelled");
        const { count: activeProjects } = await supabase.from("projects").select("*", { count: "exact", head: true }).neq("status", "completed").neq("status", "cancelled");
        const { count: unreadMessages } = await supabase.from("property_messages").select("*", { count: "exact", head: true }).eq("is_read", false);
        const { data: invoices } = await supabase.from("invoices").select("amount, status");
        const revenue = (invoices || []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount || 0), 0);
        const outstanding = (invoices || []).filter((i: any) => !["paid","cancelled"].includes(i.status)).reduce((s: number, i: any) => s + (i.amount || 0), 0);
        return { success: true, result: { active_clients: clientCount || 0, open_invoices: openInvoices || 0, active_projects: activeProjects || 0, unread_messages: unreadMessages || 0, total_revenue: revenue, outstanding_balance: outstanding } };
      }

      // ── SETTINGS ──
      case "get_admin_profile": {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
        return { success: true, result: data || {} };
      }

      case "update_admin_profile": {
        await supabase.from("profiles").update(params.fields).eq("user_id", userId);
        return { success: true, result: { message: "Profile updated" } };
      }

      // ── CLIENT PORTAL TOOLS ──
      case "client_get_home_summary": {
        const { data: projects } = await supabase.from("projects").select("id, title, status").eq("property_id", params.property_id).neq("status", "completed");
        const { data: invoices } = await supabase.from("invoices").select("id, title, amount, status, due_date").eq("property_id", params.property_id);
        const { data: equipment } = await supabase.from("equipment").select("id, name, next_service_date, condition").eq("property_id", params.property_id);
        return { success: true, result: { active_projects: (projects || []).length, projects: projects || [], pending_invoices: (invoices || []).filter((i: any) => i.status !== "paid").length, invoices: invoices || [], equipment_count: (equipment || []).length } };
      }

      case "client_get_report": {
        const { data } = await supabase.from("reports").select("id, title, status, completion_percent").eq("property_id", params.property_id).eq("status", "published").limit(1).single();
        if (!data) return { success: true, result: { message: "No published report yet" } };
        const { data: pages } = await supabase.from("report_pages").select("id, title, condition_rating, status").eq("report_id", data.id).order("sort_order");
        return { success: true, result: { report: data, pages: pages || [] } };
      }

      case "client_get_projects": {
        const { data } = await supabase.from("projects").select("*").eq("property_id", params.property_id).order("created_at", { ascending: false });
        return { success: true, result: { projects: data || [] } };
      }

      case "client_get_invoices": {
        const { data } = await supabase.from("invoices").select("*").eq("property_id", params.property_id).order("created_at", { ascending: false });
        return { success: true, result: { invoices: data || [] } };
      }

      case "client_send_message": {
        await supabase.from("property_messages").insert({ property_id: params.property_id, sender_id: userId, message: params.message });
        return { success: true, result: { message: "Message sent to your HBC advisor" } };
      }

      case "client_request_appointment": {
        await supabase.from("appointment_requests").insert({ client_id: userId, property_id: params.property_id, topic: params.type, preferred_slots_json: params.preferred_dates || [], notes: params.notes });
        return { success: true, result: { message: "Appointment request submitted — your advisor will confirm shortly" } };
      }

      case "client_get_equipment": {
        const { data } = await supabase.from("equipment").select("*").eq("property_id", params.property_id).order("category, name");
        return { success: true, result: { equipment: data || [] } };
      }

      case "client_add_home_goal": {
        const { data, error } = await supabase.from("client_goals").insert({ property_id: params.property_id, client_id: userId, title: params.title, description: params.description, target_date: params.target_date, status: "active" }).select().single();
        if (error) throw error;
        return { success: true, result: { message: `Goal "${params.title}" added` } };
      }

      case "client_submit_feedback": {
        await supabase.from("feedback").insert({ property_id: params.property_id, user_id: userId, rating: params.rating, comment: params.comment, entity_type: "general" });
        return { success: true, result: { message: "Thank you for your feedback!" } };
      }

      case "client_get_schedule": {
        const { data } = await supabase.from("schedule_events").select("*").eq("property_id", params.property_id).gte("event_date", new Date().toISOString().split("T")[0]).order("event_date");
        return { success: true, result: { events: data || [] } };
      }

      case "client_get_documents": {
        const { data } = await supabase.from("client_files").select("*").eq("property_id", params.property_id).order("created_at", { ascending: false });
        return { success: true, result: { documents: data || [] } };
      }

      case "client_get_warranties": {
        const { data } = await supabase.from("equipment").select("id, name, category, brand, model, warranty_expiry, next_service_date, last_service_date, condition, install_date").eq("property_id", params.property_id).order("warranty_expiry");
        const now = new Date().toISOString().split("T")[0];
        const items = (data || []).map((e: any) => ({
          ...e,
          warranty_status: !e.warranty_expiry ? "unknown" : e.warranty_expiry < now ? "expired" : "active",
          service_status: !e.next_service_date ? "no_schedule" : e.next_service_date < now ? "overdue" : "upcoming",
        }));
        return { success: true, result: { equipment: items } };
      }

      case "client_get_estimates": {
        const { data } = await supabase.from("estimates").select("id, title, status, total, created_at, valid_until, sent_at").eq("property_id", params.property_id).in("status", ["sent", "accepted", "declined"]).order("created_at", { ascending: false });
        return { success: true, result: { estimates: data || [] } };
      }

      case "client_accept_estimate": {
        await supabase.from("estimates").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", params.estimate_id);
        return { success: true, result: { message: "Estimate accepted! Your advisor will follow up with next steps." }, entity_id: params.estimate_id, entity_type: "estimate" };
      }

      case "client_submit_service_request": {
        await supabase.from("appointment_requests").insert({
          client_id: userId, property_id: params.property_id, topic: params.service_type,
          notes: `Service Request: ${params.description}. Preferred date: ${params.preferred_date || "flexible"}`,
          preferred_slots_json: params.preferred_date ? [params.preferred_date] : [],
        });
        return { success: true, result: { message: `Service request for "${params.service_type}" submitted. Your advisor will be in touch!` } };
      }

      case "client_update_goal": {
        await supabase.from("client_goals").update(params.fields).eq("id", params.goal_id);
        return { success: true, result: { message: "Goal updated" }, entity_id: params.goal_id, entity_type: "goal" };
      }

      case "client_get_maintenance_due": {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        const { data } = await supabase.from("equipment").select("id, name, category, brand, next_service_date, last_service_date, condition").eq("property_id", params.property_id).not("next_service_date", "is", null).lte("next_service_date", endOfMonth).order("next_service_date");
        return { success: true, result: { maintenance_items: data || [], count: (data || []).length } };
      }

      case "client_submit_referral": {
        await supabase.from("activity_log").insert({
          property_id: params.property_id, action_type: "referral", user_id: userId,
          message: `Client referral: ${params.friend_name} (${params.friend_email || ""} ${params.friend_phone || ""})`,
          metadata: { friend_name: params.friend_name, friend_email: params.friend_email, friend_phone: params.friend_phone, notes: params.notes },
        });
        return { success: true, result: { message: `Thank you for referring ${params.friend_name}! Your advisor will reach out to them.` } };
      }

      default:
        return { success: false, result: { message: `Unknown tool: ${toolName}` } };
    }
  } catch (err: any) {
    console.error(`Tool ${toolName} error:`, err);
    return { success: false, result: { message: `Error executing ${toolName}: ${err.message}` } };
  }
}

// ─── SYSTEM PROMPTS ───

const ADMIN_SYSTEM_PROMPT = `You are HBC Agent — the AI brain of Home Clarity Hub, a residential home stewardship platform run by Adam Kilgore of Hometown Builders Club serving Summit County, OH.

You have complete access to every function in the system and can execute any action a human admin can perform.

Your personality: highly competent, proactive, warm, and concise. You are like the best business partner Adam has ever had — you anticipate needs, take initiative, and handle the operational work so he can focus on clients.

Core behaviors:
1. ALWAYS confirm before sending communications to clients or vendors.
2. ALWAYS show a plan before executing multi-step workflows.
3. Ask ONE clarifying question at a time — never interrogate the user.
4. After completing any action, suggest 2-3 most logical next steps.
5. Use context from the current page — never ask for info you already have.
6. For bulk actions, always show what's affected before doing it.
7. Speak plainly — say "I created an invoice" not "The create_invoice tool was invoked".
8. If something fails, explain it in plain English and offer an alternative.
9. Track what you've done in this conversation — "want me to send that estimate I just created?"
10. You can do everything in this app. If asked if you can do something, say yes and do it.
11. Parse natural language dates: "next Tuesday", "end of month", "in 2 weeks" etc.
12. When you receive page context, use it — don't ask for IDs you already know.

## APP KNOWLEDGE — ADMIN SIDE

### Navigation & Pages
- **Dashboard** (/admin): Daily Brief with 4 zones — Briefing (client count, revenue, setup), Action Required (overdue invoices, tasks, follow-ups), Insights (revenue chart, pipeline), Reference (map, calendar). Widgets are collapsible and reorderable.
- **Inbox** (/admin/inbox): All client messages in one place. Unread badge. Reply inline. Filter by client.
- **Clients** (/admin/clients): Master client list with search, filters (stage, tags, health), bulk actions. Click a client → opens the **Client Workspace**.
- **Client Workspace** (/admin/clients/:id): The unified hub for a single client. Has a left Context Card (identity, health, quick actions), center Tab Content area, and a right AI Agent Rail (me!). Tabs are grouped:
  - **Property**: Overview (inline edit all fields), Report (page editor, WYSIWYG, AI draft, serial plate scanner), Digital Twin (document intelligence), Equipment (full CRUD with service tracking)
  - **Work**: Projects (Kanban/List/Calendar/Gantt views, phases, tasks, budget, change orders), Schedule (events, inspections), Field Inspection (GPS check-in, on-site mode)
  - **Financial**: Invoices (create/send/mark paid/void, auto-numbering HBC-XXXX), Estimates (create with line items, send as proposals, convert to invoice), Payments (payment tracking)
  - **Communication**: Messages (chat-style with client), Files (upload/download documents), Comments (threaded per report page), Announcements
  - **Intelligence**: AI Insights, Score Explainer, Condition Forecast, Meeting Prep, Annual Review
- **CRM Hub** (/admin/crm): Dual swimlane Kanban for Clients and Trade Partners. Client stages: Lead → Onboarding → Active → Proposal Out → Project Running → Completed → At Risk → Churned. Partner stages: Prospecting → Vetting → Approved → Preferred → On Hold → Inactive. 10 profile tabs for clients, 9 for partners.
- **Projects** (/admin/projects): All projects across all clients. Kanban board + list view.
- **Tasks** (/admin/tasks): Standalone task board (not tied to projects). For follow-ups, reminders, to-dos.
- **Calendar** (/admin/calendar): All events, inspections, deadlines. Syncs with Google Calendar if configured.
- **Analytics** (/admin/analytics): Revenue tracking, client metrics, pipeline analysis, engagement scores.
- **Goals** (/admin/goals): Client home improvement goals across all properties.
- **Referrals** (/admin/referrals): Track client referrals, status, conversion.
- **Announcements** (/admin/announcements): Create/manage announcements for all clients or specific ones.
- **Automations** (/admin/automations): Rule-based workflows — auto-reminders, follow-ups, status changes. Enable/disable toggle.
- **Knowledge Base** (/admin/knowledge-base): Templates for pricing, scope of work, system descriptions. Two tabs: Knowledge Base articles + Report Templates.
- **Settings** (/admin/settings): Profile, company info, branding, integrations hub (Google Suite, Stripe, QuickBooks, Slack, Zapier, Calendly, etc.), notification preferences, API keys.
- **Command Palette** (Cmd+K): Quick search and jump to any page, client, project, or action.

### How-To Guides
- **Create a new client**: Go to Clients → "+ New Client" button → fill wizard (4 steps: Client Info → Digital Assets → Select Report Pages → Review & Publish). Or ask me and I'll do it.
- **Build a report**: Client Workspace → Report tab → pages are auto-created from wizard. Click any page to edit in WYSIWYG. Use "Draft with AI" for narrative generation. Set condition ratings. Upload photos. Mark pages complete. Click "Publish" when ready.
- **Send a proposal/estimate**: Client Workspace → Financial tab → Estimates → "Create Estimate" → add line items → "Send Estimate". Client receives it in their portal. Can also use the Proposal Builder for premium presentations.
- **Create an invoice**: Financial tab → Invoices → "Create Invoice" or convert from estimate. Auto-numbers as HBC-XXXX. Send to client. Mark as paid when collected.
- **Schedule a visit**: Calendar or Client Workspace → Schedule tab → "Create Event" → pick type, date, time, location. Assign to a client.
- **Manage projects**: Client Workspace → Projects tab → create project → add phases/tasks → assign vendors → track budget → log daily updates → manage change orders.
- **Use the CRM**: CRM Hub → drag cards between stages. Click card for full profile. Log activities. Set follow-up reminders. Filter/search contacts.
- **Run an Annual Review**: Client Workspace → Intelligence tab → Annual Review. Generates a full year-in-review briefing: health score changes, completed projects, financial summary.
- **Use AI tools**: Client Workspace → Intelligence tab. Available: Score Explainer (why the health score is what it is), Condition Forecast (5-year failure risk), Meeting Prep (client briefing), Maintenance Schedule (AI-generated 12-month plan).
- **Field inspection**: Client Workspace → Schedule → Start Inspection. GPS check-in, on-site photo capture, notes.
- **Manage trade partners**: CRM Hub → Trade Partners swimlane. Add vendor → vet (license, insurance, W-9) → rate after project → track performance.

### Graceful Limits
If asked to do something I don't have a tool for yet, I will:
1. Clearly say what I can't do and why
2. Offer to walk the admin through doing it manually in the app
3. Suggest flagging it as a feature request`;

const CLIENT_SYSTEM_PROMPT = (clientName: string, enrichment?: any) => {
  let prompt = `You are a friendly home assistant for ${clientName}'s Home Clarity Hub portal. You help homeowners understand their home, track projects, stay on top of maintenance, and communicate with their HBC team.

You are warm, encouraging, and speak without technical jargon. You can only access ${clientName}'s own home data. For anything requiring admin action, send a message to their HBC advisor on their behalf and let them know you've done it.

You use emoji naturally and keep responses concise and actionable.

## APP KNOWLEDGE — CLIENT PORTAL

### Navigation & Tabs
The portal is organized into tabs at the top. Here's what each one does:
- **Home**: Your dashboard. Shows health score, quick stats (open projects, pending invoices, equipment count), and quick-action cards for navigating to other sections. Has an "Ask a question" button that opens me.
- **Report**: Your comprehensive home assessment. Organized by chapters (Roof, HVAC, Plumbing, etc.). Each chapter has a condition rating (Excellent → Critical), detailed narrative, specs, photos, and tiered pricing recommendations (Essential/Enhanced/Signature). Also includes a Financial Roadmap (total costs by urgency) and Action Plan (prioritized to-do list). You can click any chapter in the sidebar to jump to it.
- **Projects**: Active work being done on your home. Shows status (Planned, In Progress, Completed), priority, timeline, and budget tracking.
- **Payments**: All invoices from your advisor. Shows amount, due date, status (Pending, Paid, Overdue). Overdue items are highlighted in red.
- **Equipment**: Your home's equipment registry. Every major system (HVAC, water heater, appliances, etc.) with brand, model, serial number, install date, warranty status, and next service date. Color-coded status badges (Overdue, Due Soon, Warranty Expired, Up to Date).
- **Documents**: Files shared by your advisor — reports, contracts, photos, etc.
- **Messages**: Direct chat with your HBC advisor. Send messages, ask questions.
- **Photos**: Property photos organized by area.
- **Services**: Concierge services you can request — HVAC tune-up, plumbing check, electrical inspection, etc.
- **Estimates**: Proposals/estimates from your advisor. View details, accept, or decline.
- **Schedule**: Upcoming visits, inspections, and maintenance appointments.
- **Goals**: Your home improvement goals. Track progress toward kitchen renovation, landscaping, etc.
- **Billing**: Subscription/membership management.
- **Refer**: Refer a friend to HBC and earn rewards.
- **Contacts**: Your advisor's contact information and your property contacts.

### How-To Guides
- **View your report**: Click the "Report" tab. Use the sidebar to jump between chapters. Each chapter shows what was found and what's recommended.
- **See your warranties**: Go to "Equipment" tab. Each item shows its warranty expiry date and a status badge. Items with expired warranties are flagged.
- **Check what maintenance is due**: Go to "Equipment" tab — items with upcoming service dates are highlighted as "Due Soon" or "Overdue". Or just ask me!
- **View/accept an estimate**: Go to "Estimates" tab. Click on any sent estimate to see the full breakdown. Click "Accept" to approve it.
- **Upload a document**: Go to "Documents" tab → "Upload" button. Select your file.
- **Send a message to your advisor**: Go to "Messages" tab and type your message. Or just tell me what you want to say and I'll send it for you!
- **Add a home goal**: Go to "Goals" tab → "Add Goal". Give it a title, category, and target date. Or tell me and I'll add it.
- **Request a service**: Go to "Services" tab and pick a service. Or tell me what you need and I'll submit the request.
- **Refer a friend**: Go to "Refer" tab and enter your friend's info. Or tell me their name and contact info.
- **Update notification preferences**: Go to your profile settings → Notifications.

### Graceful Limits
If asked to do something I can't do:
1. I'll clearly explain what I can't do and why
2. I'll offer to walk you through doing it yourself in the portal
3. If it needs your advisor's help, I'll send them a message on your behalf`;

  if (enrichment) {
    const parts: string[] = [];
    if (enrichment.healthScore !== undefined) parts.push(`Health Score: ${enrichment.healthScore}/100`);
    if (enrichment.reportCompletion !== undefined) parts.push(`Report: ${enrichment.reportCompletion}% complete`);
    if (enrichment.openInvoiceCount !== undefined) parts.push(`Open Invoices: ${enrichment.openInvoiceCount}`);
    if (enrichment.activeProjectCount !== undefined) parts.push(`Active Projects: ${enrichment.activeProjectCount}`);
    if (enrichment.equipmentNeedingService !== undefined) parts.push(`Equipment Needing Service: ${enrichment.equipmentNeedingService}`);
    if (enrichment.propertyAddress) parts.push(`Property: ${enrichment.propertyAddress}`);
    if (parts.length > 0) {
      prompt += `\n\n## CURRENT HOME STATUS\n${parts.join("\n")}`;
    }
  }

  return prompt;
};

// ─── MAIN HANDLER ───

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  // ─── AUTH ───
  // Require a valid JWT and derive userId + role server-side. Previously
  // userId and role came from the request body; a malicious client could
  // claim to be a creator and call admin-only tools. NOW role comes from
  // user_roles in the DB.
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { message, history, context, confirm_action } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Trusted values derived from JWT + user_roles, NOT from the request body.
    const userId = auth.user.id;
    const role: "creator" | "client" | "trade_partner" =
      auth.roles.includes("creator") ? "creator"
      : auth.roles.includes("trade_partner") ? "trade_partner"
      : "client";

    // Filter tools by role — still applied, but now `role` is trustworthy.
    const allowedTools = TOOLS.filter((t) => t.allowedRoles.includes(role));

    // ─── SMART CONTEXT INJECTION (Self-Learning Layer) ───
    let smartContext: any = {};
    try {
      const scResp = await fetch(`${supabaseUrl}/functions/v1/get-smart-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({
          role,
          userId,
          entityType: context?.currentEntityType,
          entityId: context?.currentEntityId,
          propertyId: context?.propertyId || context?.currentEntityId,
          pageKey: context?.activeTab,
        }),
      });
      if (scResp.ok) smartContext = await scResp.json();
    } catch (scErr) {
      console.warn("Smart context fetch failed (non-fatal):", scErr);
    }

    // Build system prompt with context injection
    let systemPrompt: string;
    if (role === "client") {
      systemPrompt = CLIENT_SYSTEM_PROMPT(context?.currentEntityName || "Homeowner", context?.enrichment);
    } else {
      systemPrompt = ADMIN_SYSTEM_PROMPT;
    }

    // Inject learned patterns into system prompt
    if (smartContext.advisor_patterns && smartContext.advisor_patterns.length > 0) {
      systemPrompt += `\n\n## LEARNED PATTERNS (from your past work)\n`;
      for (const p of smartContext.advisor_patterns) {
        systemPrompt += `- **${p.type}** (${p.key}): ${JSON.stringify(p.data).slice(0, 200)} [confidence: ${p.confidence}, uses: ${p.uses}]\n`;
      }
      systemPrompt += `\nUse these patterns to inform your suggestions. When you pre-fill or suggest content based on learned patterns, note it with "✨ Suggested based on your past work".`;
    }

    if (smartContext.suggestion_history) {
      systemPrompt += `\n\n## AI SUGGESTION ACCEPTANCE RATES\n`;
      for (const [type, stats] of Object.entries(smartContext.suggestion_history as Record<string, any>)) {
        systemPrompt += `- ${type}: ${stats.acceptance_rate}% accepted (${stats.total} total)\n`;
      }
    }

    if (smartContext.cross_client_insights && smartContext.cross_client_insights.length > 0) {
      systemPrompt += `\n\n## CROSS-CLIENT INTELLIGENCE\n`;
      for (const i of smartContext.cross_client_insights) {
        systemPrompt += `- ${i.insight_key}: ${JSON.stringify(i.insight_data).slice(0, 200)}\n`;
      }
    }

    if (smartContext.behavior_profile) {
      const bp = smartContext.behavior_profile;
      systemPrompt += `\n\n## CLIENT BEHAVIOR PROFILE\n`;
      systemPrompt += `Engagement: ${bp.engagement_level} | Communication preference: ${bp.communication_preference} | Satisfaction: ${bp.satisfaction_trend} | Active goals: ${bp.goals_active}\n`;
      if (bp.engagement_level === "high") {
        systemPrompt += `This client is highly engaged — offer proactive suggestions, detailed insights, and advanced features.\n`;
      } else if (bp.engagement_level === "low" || bp.engagement_level === "dormant") {
        systemPrompt += `This client has low engagement — keep responses simple, short, and encouraging. Gentle prompts work better than detailed explanations.\n`;
      }
    }

    if (smartContext.home_insights && smartContext.home_insights.length > 0) {
      systemPrompt += `\n\n## INSIGHTS FOR HOMES LIKE YOURS\n`;
      for (const i of smartContext.home_insights) {
        systemPrompt += `- ${JSON.stringify(i).slice(0, 200)}\n`;
      }
    }

    if (context?.currentEntityType && context?.currentEntityId) {
      systemPrompt += `\n\nCurrent context: You are on the ${context.currentEntityType} page for "${context.currentEntityName}" (ID: ${context.currentEntityId}). Page: ${context.currentPage || "unknown"}.`;
      if (context?.activeTab) systemPrompt += ` Active tab: ${context.activeTab}.`;
      if (context?.enrichment && role === "creator") {
        const e = context.enrichment;
        const ctxParts: string[] = [];
        if (e.propertyAddress) ctxParts.push(`Address: ${e.propertyAddress}`);
        if (e.healthScore !== undefined) ctxParts.push(`Health: ${e.healthScore}/100`);
        if (e.openInvoiceCount !== undefined) ctxParts.push(`Open invoices: ${e.openInvoiceCount}`);
        if (e.overdueAmount !== undefined) ctxParts.push(`Overdue: $${e.overdueAmount}`);
        if (e.activeProjectCount !== undefined) ctxParts.push(`Active projects: ${e.activeProjectCount}`);
        if (e.reportCompletion !== undefined) ctxParts.push(`Report: ${e.reportCompletion}% complete`);
        if (e.lastContactDays !== undefined) ctxParts.push(`Last contact: ${e.lastContactDays} days ago`);
        if (ctxParts.length > 0) systemPrompt += `\nClient data: ${ctxParts.join(" | ")}`;
      }
      systemPrompt += ` Use this context — don't ask for this entity's ID.`;
    }

    // Build messages array
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-12),
      { role: "user", content: message },
    ];

    // Build OpenAI-compatible tools array
    const toolDefs = allowedTools.map(t => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    // ReAct loop
    const toolsCalled: any[] = [];
    let iterations = 0;
    const MAX_ITERATIONS = 10;
    let finalReply = "";
    let needsConfirmation = false;
    let confirmationPayload: any = null;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const _aiText = await callAI({ messages: messages, model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        if (response.status === 429) { finalReply = "I'm a bit busy right now — please try again in a moment."; break; }
        if (response.status === 402) { finalReply = "AI credits have been exhausted. Please add credits in your Lovable workspace settings."; break; }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) { finalReply = "I encountered an issue processing your request. Please try again."; break; }

      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls) {
        const assistantMsg = choice.message;
        messages.push(assistantMsg);

        for (const tc of assistantMsg.tool_calls || []) {
          const toolName = tc.function.name;
          let toolParams: any;
          try { toolParams = JSON.parse(tc.function.arguments || "{}"); } catch { toolParams = {}; }

          const toolDef = TOOLS.find(t => t.name === toolName);
          if (toolDef?.requiresConfirmation && !confirm_action) {
            needsConfirmation = true;
            confirmationPayload = {
              summary: `I need your confirmation to: ${toolDef.description}`,
              items: [{ tool: toolName, params: toolParams }],
              reversible: !["delete_client", "delete_project", "void_invoice"].includes(toolName),
              pending_tool_call: { tool_name: toolName, params: toolParams },
            };
            messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ status: "awaiting_confirmation", message: "User must confirm this action before I can proceed." }) });
            continue;
          }

          const result = await executeTool(supabase, toolName, toolParams, userId);
          toolsCalled.push({
            tool_name: toolName, params: toolParams,
            result_summary: result.result?.message || JSON.stringify(result.result).slice(0, 200),
            success: result.success, entity_id: result.entity_id, entity_type: result.entity_type, nav_link: result.nav_link,
          });
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result.result) });
        }

        if (needsConfirmation) {
          const _confirmText = await callAI({ messages, model: "google/gemini-2.5-flash" });
          const confirmResp = { ok: true, json: async () => ({ choices: [{ message: { content: _confirmText } }] }) };
          const confirmData = await confirmResp.json();
          finalReply = confirmData.choices?.[0]?.message?.content || "I need your confirmation before proceeding.";
          break;
        }
        continue;
      }

      finalReply = choice.message?.content || "";
      break;
    }

    const duration = Date.now() - startTime;

    // ─── LOG LEARNING EVENTS for each tool call ───
    for (const tc of toolsCalled) {
      supabase.from("learning_events").insert({
        event_type: `tool_${tc.tool_name}`,
        actor_id: userId,
        actor_role: role,
        entity_type: tc.entity_type,
        entity_id: tc.entity_id,
        event_data: { params: tc.params, success: tc.success, result_summary: tc.result_summary },
      }).then(() => {}).catch(() => {});
    }

    if (userId) {
      await supabase.from("agent_logs").insert({
        user_id: userId, role, session_id: context?.sessionId, user_message: message,
        agent_reply: finalReply, tools_called: toolsCalled, duration_ms: duration,
        tokens_used: 0, page_context: context, actions_taken: toolsCalled.filter(t => t.success).length,
      }).then(() => {}).catch(() => {});
    }

    return new Response(JSON.stringify({
      reply: finalReply, actions_taken: toolsCalled, needs_confirmation: needsConfirmation,
      confirmation_payload: confirmationPayload, clarifying_question: null, suggested_next_actions: [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("hbc-agent error:", err);
    return new Response(JSON.stringify({
      reply: `Sorry, I ran into an error: ${err.message}. Please try again.`,
      actions_taken: [], needs_confirmation: false, confirmation_payload: null, error: err.message,
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
