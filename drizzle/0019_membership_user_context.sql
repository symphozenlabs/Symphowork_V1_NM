ALTER POLICY "memberships_tenant_isolation" ON "memberships"
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    OR current_setting('app.is_platform_owner', true) = 'true'
    OR user_id::text = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    OR current_setting('app.is_platform_owner', true) = 'true'
  );
