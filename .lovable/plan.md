

# Feature Ideas for Admin & Client Portal

## Already Strong
The app already has: report builder, invoicing with AI, messaging, equipment tracking, scheduling, file management, vendor management, PDF generation, and project tracking.

## High-Impact Additions (ordered by value)

### 1. Email Notifications System
**What**: Automatically notify clients via email when key events happen — new invoice sent, report published, message received, project status changed.
**How**: A backend function triggered by status changes that sends branded HTML emails via the built-in email service. Admin gets notified of client messages and new comments too.
**Why**: Right now nothing leaves the portal. Clients won't know to log in unless you manually tell them.

### 2. Admin Dashboard Enhancements
**What**: Add revenue metrics (total invoiced, total collected, outstanding balance), overdue invoice alerts, and a "clients needing attention" list (unread messages + unanswered comments + overdue invoices) to the admin dashboard.
**How**: Aggregate queries across invoices, payments_posted, property_messages, and report_comments tables. Display as summary cards and a prioritized action list.
**Why**: The current dashboard shows activity but doesn't surface what needs immediate attention.

### 3. Client Onboarding Progress Tracker
**What**: A visual checklist on the admin side showing intake completion: property details filled, discovery notes added, digital assets uploaded, report started, report published, client account created. On the client side, show a "Getting Started" wizard on first login.
**Why**: The `intake_status` and `digital_assets_status` fields exist but aren't surfaced in the UI.

### 4. Bulk Actions & Search on Admin Client List
**What**: Add a search/filter bar to the client list (search by name, address, status). Add bulk actions like "mark all reports as published" or "send reminder to all overdue invoices."
**Why**: As the client list grows, finding specific clients or acting on groups becomes essential.

### 5. Client Activity Timeline
**What**: On each client's detail page, add a unified timeline showing all activity: messages sent, invoices created, payments received, report pages completed, projects updated. Pull from `activity_log` table.
**Why**: Gives the admin a single view of the entire client relationship history.

### 6. Photo Gallery on Report Pages (Client Side)
**What**: The report pages store images but the client-facing view may not display them prominently. Add a lightbox-style photo gallery to each report page so clients can view full-resolution inspection photos.
**Why**: Photos are the most compelling part of a home report for clients.

### 7. Seasonal Maintenance Reminders
**What**: Auto-generate seasonal maintenance checklists based on the property's equipment and report findings. Show on the client Schedule tab and optionally send email reminders.
**How**: Use AI to analyze report pages and equipment data, generate season-appropriate tasks, store as schedule_events.
**Why**: Turns the portal from a one-time report into an ongoing relationship tool.

### 8. Client Satisfaction / Feedback System
**What**: After a report is published or a project is completed, prompt the client to leave a rating and short comment. Admin sees aggregated satisfaction scores on the dashboard.
**How**: New `feedback` table with rating (1-5), comment, and linked entity (report/project). Simple star-rating UI in the portal.

---

## My Recommendation
**Start with #1 (Email Notifications)** — it's the single biggest gap. Without it, every feature you've built requires clients to proactively check the portal. Then **#2 (Dashboard Enhancements)** to help you manage your workload, followed by **#5 (Client Activity Timeline)** for relationship visibility.

