CREATE TABLE support_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submitter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitter_name varchar(160) NOT NULL,
  submitter_email varchar(320) NOT NULL,
  organization_name varchar(160) NOT NULL,
  query_type varchar(40) NOT NULL,
  subject varchar(180) NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX support_submissions_org_created_idx ON support_submissions (organization_id, created_at);
--> statement-breakpoint
CREATE INDEX support_submissions_submitter_created_idx ON support_submissions (organization_id, submitter_user_id, created_at);
--> statement-breakpoint
ALTER TABLE support_submissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY support_submissions_access ON support_submissions FOR SELECT USING (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND submitter_user_id::text = current_setting('app.current_user_id', true)));
--> statement-breakpoint
CREATE POLICY support_submissions_insert ON support_submissions FOR INSERT WITH CHECK (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND submitter_user_id::text = current_setting('app.current_user_id', true)));
--> statement-breakpoint
CREATE TABLE support_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES support_submissions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  author_side varchar(16) NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX support_replies_submission_created_idx ON support_replies (submission_id, created_at);
--> statement-breakpoint
CREATE INDEX support_replies_org_created_idx ON support_replies (organization_id, created_at);
--> statement-breakpoint
ALTER TABLE support_replies ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY support_replies_access ON support_replies FOR SELECT USING (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND EXISTS (SELECT 1 FROM support_submissions s WHERE s.id = support_replies.submission_id AND s.organization_id = support_replies.organization_id)));
--> statement-breakpoint
CREATE POLICY support_replies_insert ON support_replies FOR INSERT WITH CHECK (current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE TABLE support_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES support_submissions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  storage_key varchar(500) NOT NULL UNIQUE,
  file_name varchar(240) NOT NULL,
  mime_type varchar(120) NOT NULL,
  file_size integer NOT NULL,
  scan_status file_scan_status NOT NULL DEFAULT 'pending',
  content_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX support_attachments_submission_idx ON support_attachments (organization_id, submission_id);
--> statement-breakpoint
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY support_attachments_access ON support_attachments FOR SELECT USING (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND uploaded_by_user_id::text = current_setting('app.current_user_id', true) AND EXISTS (SELECT 1 FROM support_submissions s WHERE s.id = support_attachments.submission_id AND s.organization_id = support_attachments.organization_id)));
--> statement-breakpoint
CREATE POLICY support_attachments_insert ON support_attachments FOR INSERT WITH CHECK (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND uploaded_by_user_id::text = current_setting('app.current_user_id', true) AND EXISTS (SELECT 1 FROM support_submissions s WHERE s.id = support_attachments.submission_id AND s.organization_id = support_attachments.organization_id)));
--> statement-breakpoint
CREATE TABLE support_announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  author_role varchar(40) NOT NULL,
  title varchar(180) NOT NULL,
  body text NOT NULL,
  audience_type varchar(40) NOT NULL,
  audience_metadata text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX support_announcements_published_idx ON support_announcements (published_at);
--> statement-breakpoint
ALTER TABLE support_announcements ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE support_announcement_recipients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES support_announcements(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX support_announcement_recipient_unique_idx ON support_announcement_recipients (announcement_id, recipient_user_id);
--> statement-breakpoint
CREATE INDEX support_announcement_recipient_user_idx ON support_announcement_recipients (organization_id, recipient_user_id, created_at);
--> statement-breakpoint
ALTER TABLE support_announcement_recipients ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY support_announcement_recipients_access ON support_announcement_recipients FOR SELECT USING (current_setting('app.is_platform_owner', true) = 'true' OR (organization_id::text = current_setting('app.current_organization_id', true) AND recipient_user_id::text = current_setting('app.current_user_id', true)));
--> statement-breakpoint
CREATE POLICY support_announcement_recipients_insert ON support_announcement_recipients FOR INSERT WITH CHECK (current_setting('app.is_platform_owner', true) = 'true');

--> statement-breakpoint
CREATE POLICY support_announcements_access ON support_announcements FOR SELECT USING (current_setting('app.is_platform_owner', true) = 'true' OR (EXISTS (SELECT 1 FROM support_announcement_recipients r WHERE r.announcement_id = support_announcements.id)));
--> statement-breakpoint
CREATE POLICY support_announcements_insert ON support_announcements FOR INSERT WITH CHECK (current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sympowork_app') THEN
    GRANT SELECT, INSERT ON support_submissions, support_replies, support_attachments,
      support_announcements, support_announcement_recipients TO sympowork_app;
  END IF;
END $$;
