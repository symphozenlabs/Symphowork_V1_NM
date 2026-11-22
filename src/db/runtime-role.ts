const REQUIRED_RUNTIME_ROLE = 'sympowork_app';

/**
 * Runtime connections must use the dedicated non-owner application role.
 * This deliberately validates the login username from DATABASE_URL; it does
 * not accept a privileged URL with a role override in query parameters.
 */
export function isRuntimeDatabaseUrlAllowed(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') return false;
    if (decodeURIComponent(url.username) !== REQUIRED_RUNTIME_ROLE) return false;

    // postgres.js accepts connection options from the URL query string. Do not
    // let a URL that names the app login also request a different startup role
    // (or replace the login/service configuration) through query parameters.
    // TLS and application_name parameters remain available to local deploys.
    const identityOverrides = new Set(['options', 'role', 'user', 'service']);
    for (const key of url.searchParams.keys()) {
      if (identityOverrides.has(key.toLowerCase())) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function runtimeDatabaseRoleError(): string {
  return `DATABASE_URL must authenticate directly as ${REQUIRED_RUNTIME_ROLE}; owner and administrative roles are not allowed for application runtime.`;
}
