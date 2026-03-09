-- Drop ALL existing restrictive policies and recreate as permissive

-- activity_log
DROP POLICY IF EXISTS "Creators can view activity" ON public.activity_log;
CREATE POLICY "Creators can manage activity" ON public.activity_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- client_files
DROP POLICY IF EXISTS "Clients can view their files" ON public.client_files;
DROP POLICY IF EXISTS "Creators can manage files" ON public.client_files;
CREATE POLICY "Clients can view their files" ON public.client_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = client_files.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage files" ON public.client_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- invoices
DROP POLICY IF EXISTS "Clients can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Creators can manage invoices" ON public.invoices;
CREATE POLICY "Clients can view their invoices" ON public.invoices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = invoices.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- knowledge_templates
DROP POLICY IF EXISTS "Creators can manage templates" ON public.knowledge_templates;
CREATE POLICY "Creators can manage templates" ON public.knowledge_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- page_templates
DROP POLICY IF EXISTS "Creators can manage templates" ON public.page_templates;
DROP POLICY IF EXISTS "Everyone can view templates" ON public.page_templates;
CREATE POLICY "Creators can manage page templates" ON public.page_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Everyone can view page templates" ON public.page_templates FOR SELECT TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "Creators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Creators can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- projects
DROP POLICY IF EXISTS "Clients can insert their projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can manage projects" ON public.projects;
CREATE POLICY "Clients can view their projects" ON public.projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = projects.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Clients can insert their projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = projects.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Clients can update their projects" ON public.projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = projects.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- properties
DROP POLICY IF EXISTS "Clients can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Creators can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Creators can view all properties" ON public.properties;
CREATE POLICY "Clients can view their own properties" ON public.properties FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Creators can manage properties" ON public.properties FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- report_comments
DROP POLICY IF EXISTS "Clients can add comments" ON public.report_comments;
DROP POLICY IF EXISTS "Clients can view their comments" ON public.report_comments;
DROP POLICY IF EXISTS "Creators can manage comments" ON public.report_comments;
CREATE POLICY "Clients can view their comments" ON public.report_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM report_pages JOIN reports ON reports.id = report_pages.report_id JOIN properties ON properties.id = reports.property_id WHERE report_pages.id = report_comments.report_page_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Clients can add comments" ON public.report_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM report_pages JOIN reports ON reports.id = report_pages.report_id JOIN properties ON properties.id = reports.property_id WHERE report_pages.id = report_comments.report_page_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage comments" ON public.report_comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- report_edit_history
DROP POLICY IF EXISTS "Clients can view edit history" ON public.report_edit_history;
DROP POLICY IF EXISTS "Creators can manage edit history" ON public.report_edit_history;
CREATE POLICY "Clients can view edit history" ON public.report_edit_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM report_pages JOIN reports ON reports.id = report_pages.report_id JOIN properties ON properties.id = reports.property_id WHERE report_pages.id = report_edit_history.report_page_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage edit history" ON public.report_edit_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- report_pages
DROP POLICY IF EXISTS "Clients can view their report pages" ON public.report_pages;
DROP POLICY IF EXISTS "Creators can manage report pages" ON public.report_pages;
CREATE POLICY "Clients can view their report pages" ON public.report_pages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM reports JOIN properties ON properties.id = reports.property_id WHERE reports.id = report_pages.report_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage report pages" ON public.report_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- reports
DROP POLICY IF EXISTS "Clients can view reports for their properties" ON public.reports;
DROP POLICY IF EXISTS "Creators can manage reports" ON public.reports;
CREATE POLICY "Clients can view reports for their properties" ON public.reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = reports.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage reports" ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- schedule_events
DROP POLICY IF EXISTS "Clients can view their events" ON public.schedule_events;
DROP POLICY IF EXISTS "Creators can manage events" ON public.schedule_events;
CREATE POLICY "Clients can view their events" ON public.schedule_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = schedule_events.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Creators can manage events" ON public.schedule_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- user_roles
DROP POLICY IF EXISTS "Creators can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Creators can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Creators can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));