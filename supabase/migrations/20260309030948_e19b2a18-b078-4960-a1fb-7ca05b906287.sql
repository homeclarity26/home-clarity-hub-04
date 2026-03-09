
-- knowledge_templates table
CREATE TABLE public.knowledge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  region text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage templates"
  ON public.knowledge_templates FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

CREATE TRIGGER update_knowledge_templates_updated_at
  BEFORE UPDATE ON public.knowledge_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- activity_log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view activity"
  ON public.activity_log FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- Trigger: log when a comment is added
CREATE OR REPLACE FUNCTION public.log_comment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_page_title text;
BEGIN
  SELECT r.property_id, rp.title INTO v_property_id, v_page_title
  FROM report_pages rp
  JOIN reports r ON r.id = rp.report_id
  WHERE rp.id = NEW.report_page_id;

  INSERT INTO public.activity_log (user_id, property_id, action_type, message, metadata)
  VALUES (
    NEW.user_id,
    v_property_id,
    'comment',
    'New ' || NEW.comment_type || ' on ' || COALESCE(v_page_title, 'a page'),
    jsonb_build_object('comment_id', NEW.id, 'page_id', NEW.report_page_id, 'comment_type', NEW.comment_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_comment_activity
  AFTER INSERT ON public.report_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_comment_activity();

-- Trigger: log when report status changes
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (user_id, property_id, action_type, message, metadata)
    VALUES (
      NEW.created_by,
      NEW.property_id,
      CASE WHEN NEW.status = 'published' THEN 'publish' ELSE 'edit' END,
      'Report status changed to ' || NEW.status,
      jsonb_build_object('report_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_report_status_change
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.log_report_status_change();

-- Trigger: log when a report page is updated
CREATE OR REPLACE FUNCTION public.log_page_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
BEGIN
  SELECT r.property_id INTO v_property_id
  FROM reports r WHERE r.id = NEW.report_id;

  INSERT INTO public.activity_log (property_id, action_type, message, metadata)
  VALUES (
    v_property_id,
    'edit',
    NEW.title || ' page updated',
    jsonb_build_object('page_id', NEW.id, 'report_id', NEW.report_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_page_update
  AFTER UPDATE ON public.report_pages
  FOR EACH ROW EXECUTE FUNCTION public.log_page_update();
