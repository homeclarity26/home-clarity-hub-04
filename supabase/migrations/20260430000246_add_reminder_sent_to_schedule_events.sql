-- Adds the reminder_sent flag used by the send-maintenance-reminders
-- edge function so a single event isn't emailed twice. Defaults to
-- false so existing rows stay eligible for the next sweep.

ALTER TABLE public.schedule_events
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS schedule_events_reminder_sweep_idx
  ON public.schedule_events (event_date)
  WHERE reminder_sent = false;
