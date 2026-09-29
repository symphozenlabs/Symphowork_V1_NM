ALTER POLICY "invitations_tenant_isolation" ON "invitations"
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    OR current_setting('app.is_platform_owner', true) = 'true'
    OR token_hash = current_setting('app.current_invitation_token_hash', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    OR current_setting('app.is_platform_owner', true) = 'true'
  );
