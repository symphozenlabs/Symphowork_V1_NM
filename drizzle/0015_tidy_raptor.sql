ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation" ON "roles"
  USING (
    organization_id IS NULL
    OR organization_id::text = current_setting('app.current_organization_id', true)
    OR current_setting('app.is_platform_owner', true) = 'true'
  );--> statement-breakpoint
ALTER TABLE "provisioning_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "provisioning_jobs_platform_isolation" ON "provisioning_jobs"
  USING (current_setting('app.is_platform_owner', true) = 'true')
  WITH CHECK (current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
ALTER TABLE "platform_support_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "platform_support_notes_platform_isolation" ON "platform_support_notes"
  USING (current_setting('app.is_platform_owner', true) = 'true')
  WITH CHECK (current_setting('app.is_platform_owner', true) = 'true');
