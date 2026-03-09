

# What's Left to Complete the App

## Already Working
- Auth (login, signup, forgot/reset password, role-based routing)
- Admin: dashboard, client list, new report wizard (with page templates), client detail (overview, report pages, files, comments, projects, payments, schedule)
- Client portal: home, report, projects, payments, contacts, schedule tabs
- AI chat assistant with streaming responses
- PDF export
- Comments (client-side + admin manager)
- File manager with upload
- Image uploader for report pages
- Edit mode for report content

## Gaps & Incomplete Features

### 1. Contacts Tab — Vendor Partners are Hardcoded Placeholders
The "Approved Vendor Partners" section in `ContactsTab.tsx` shows 4 static placeholder cards (General Contractor, HVAC, Electrician, Landscaper) with `opacity-60` and no real data. Needs a `vendors` table and CRUD from the admin side.

### 2. Admin Settings — Notifications & Integrations are "Coming Soon"
`AdminSettings.tsx` has two placeholder cards for Notifications and Integrations with no functionality. The Region "Update" button also does nothing (no save handler).

### 3. FileManager — iGuide Link Input Does Nothing
The iGuide URL text input and "Save" button at the bottom of `FileManager.tsx` are not wired to any storage or save logic.

### 4. No Client-Side File Viewing
`FileManager` is admin-only. The client portal has no "Documents" or "Files" tab to view files shared by the creator.

### 5. No Email Notifications
When a report is published or a comment is replied to, there are no email notifications sent to the client. The `create-client-account` edge function creates the account but doesn't send a branded welcome email.

### 6. Schedule Tab — Clients Can't Request Appointments
The schedule tab is read-only for clients. There's no way for a client to request an appointment or suggest a time.

### 7. Projects Tab — No Client Approval Flow
Clients can see projects but can't approve a tier or change project status. The `approved_tier` and `status` fields exist in the DB but the client UI doesn't expose controls to update them.

### 8. Payments Tab — No Payment Processing
Invoices display but there's no actual payment flow (no Stripe or payment link integration). The "Pay Now" action doesn't exist.

### 9. No Real-Time Updates
Comments, projects, and schedule events don't use Supabase Realtime — changes by the admin don't appear for the client without a page refresh.

### 10. Mobile Responsiveness Gaps
The admin panel sidebar doesn't have a mobile hamburger menu pattern. Some admin tables may overflow on small screens.

---

## Recommended Priority Order

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Wire vendor partners to a real table + admin CRUD | Medium |
| 2 | Client file viewing tab in portal | Small |
| 3 | Project tier approval flow for clients | Small |
| 4 | Wire iGuide link save in FileManager | Small |
| 5 | Wire Region save in AdminSettings | Small |
| 6 | Add Realtime for comments + projects | Medium |
| 7 | Email notifications (comment replies, report published) | Medium |
| 8 | Client appointment request flow | Medium |
| 9 | Payment processing (Stripe integration) | Large |
| 10 | Notification preferences in settings | Medium |

Which of these would you like to tackle first?

