import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { Badge } from "@/components/ui/badge";
import { MasterDataManager } from "@/components/settings/master-data-manager";
export default async function OrganizationSettingsPage() { const user = await getSessionUser(); if (!user) redirect("/login"); const tenant = await resolveTenantContext(); if (!tenant.organization) redirect("/platform"); try { await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.read" }); } catch { redirect("/app"); } return <div className="space-y-6"><div><Badge>Organization setup</Badge><h1 className="mt-3 text-3xl font-bold">{tenant.organization.name}</h1><p className="mt-2 text-sm text-muted">Manage the organization master data used by employees, attendance, payroll, and recruitment.</p></div><MasterDataManager /></div>; }
