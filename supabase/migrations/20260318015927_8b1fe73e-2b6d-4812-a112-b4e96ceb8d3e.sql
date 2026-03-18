-- Migration 4: Create property_messages table
CREATE TABLE IF NOT EXISTS public.property_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS property_messages_property_id_idx ON public.property_messages(property_id);
CREATE INDEX IF NOT EXISTS property_messages_sender_id_idx ON public.property_messages(sender_id);
CREATE INDEX IF NOT EXISTS property_messages_created_at_idx ON public.property_messages(created_at DESC);

ALTER TABLE public.property_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their property messages"
  ON public.property_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_messages.property_id
        AND properties.client_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can send messages"
  ON public.property_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_messages.property_id
        AND properties.client_user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can view all property messages"
  ON public.property_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creators can send messages"
  ON public.property_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.has_role(auth.uid(), 'creator')
  );

CREATE POLICY "Creators can update messages"
  ON public.property_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can mark messages read"
  ON public.property_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_messages.property_id
        AND properties.client_user_id = auth.uid()
    )
  );