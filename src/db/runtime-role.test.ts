import { describe, expect, it } from 'vitest';
import { isRuntimeDatabaseUrlAllowed, runtimeDatabaseRoleError } from './runtime-role';

describe('runtime database role guard', () => {
  it('accepts the dedicated application login role', () => {
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb')).toBe(true);
  });

  it('rejects the table-owning database role', () => {
    expect(isRuntimeDatabaseUrlAllowed('postgresql://neondb_owner@qa.example/neondb')).toBe(false);
  });

  it('does not accept a privileged login with a role override parameter', () => {
    expect(isRuntimeDatabaseUrlAllowed('postgresql://neondb_owner@qa.example/neondb?options=-c%20role%3Dsympowork_app')).toBe(false);
  });

  it('rejects identity and startup overrides even when the URL names the app role', () => {
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb?options=-c%20role%3Dneondb_owner')).toBe(false);
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb?ROLE=neondb_owner')).toBe(false);
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb?user=neondb_owner')).toBe(false);
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb?service=privileged')).toBe(false);
  });

  it('continues to allow ordinary TLS and application-name options', () => {
    expect(isRuntimeDatabaseUrlAllowed('postgresql://sympowork_app@qa.example/neondb?sslmode=require&application_name=symphowork')).toBe(true);
  });

  it('rejects malformed or non-PostgreSQL URLs without exposing the input', () => {
    expect(isRuntimeDatabaseUrlAllowed('not-a-url')).toBe(false);
    expect(isRuntimeDatabaseUrlAllowed('https://user:secret@example.test')).toBe(false);
    expect(runtimeDatabaseRoleError()).not.toContain('secret');
  });
});
