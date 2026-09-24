import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function OrganizationSettingsPage() { const user = await getSessionUser(); if (!user) redirect("/login"); const tenant = await resolveTenantContext(); if (!tenant.organization) redirect("/platform"); return <div className="space-y-6"><div><Badge>Organization setup</Badge><h1 className="mt-3 text-3xl font-bold">{tenant.organization.name}</h1><p className="mt-2 text-sm text-muted">Master data foundations for employee operations.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{["Departments", "Designations", "Locations", "Teams", "Shifts", "Holidays", "Working days", "Employment types"].map((item) => <Card key={item}><CardHeader><CardTitle>{item}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">Tenant-scoped configuration foundation ready for management.</p></CardContent></Card>)}</div></div>; }
