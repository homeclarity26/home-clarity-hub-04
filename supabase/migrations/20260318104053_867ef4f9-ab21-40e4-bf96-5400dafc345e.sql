
-- Tasks table for admin task management
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  client_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Time entries table for time tracking
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  client_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 0,
  activity_type text NOT NULL DEFAULT 'other',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage time entries" ON public.time_entries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));
