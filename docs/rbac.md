# RBAC

Roles are database-backed and attached to memberships. Permissions use stable `resource.action` keys from `src/modules/rbac/permissions.ts`. Authorization resolves the authenticated user, membership, role, and permission on the server; role names are not scattered through UI components.

`PLATFORM_OWNER` is stored on the user identity as a platform-level role and is not an organization membership. Organization roles are provisioned per organization and may later be extended with custom roles.

Employee permissions include organization setup, employee CRUD, invitations, onboarding, activation/deactivation, self-service, and document metadata access. Manager scope is intentionally conservative until team/direct-report query policies are expanded.
