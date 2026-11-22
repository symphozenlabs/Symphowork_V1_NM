import { ROLE_PERMISSIONS } from '$lib/domain/rbac/permissions';
export type User = { id: string; email: string; fullName: string; platformRole: string; mustChangePassword: boolean };
export type Context = {
 user: User; organization: { id: string; name: string; timezone: string } | null;
 membership: { organizationId: string; status: string } | null;
 role: { id: string; key: string } | null; permissions: string[]; navigationPermissions?: string[]; isDepartmentManager: boolean;
};
export function can(context: Context | null, permission: string, organizationId?: string): boolean {
 if (!context) return false;
 if (context.user.platformRole === 'PLATFORM_OWNER') return true;
 if (!context.organization || !context.membership || context.membership.status !== 'active' ||
     context.organization.id !== context.membership.organizationId ||
     organizationId && organizationId !== context.organization.id) return false;
 return context.role?.key === 'ORGANIZATION_OWNER' || context.permissions.includes(permission) ||
   Boolean(context.role && ROLE_PERMISSIONS[context.role.key]?.some(p => p === permission));
}

