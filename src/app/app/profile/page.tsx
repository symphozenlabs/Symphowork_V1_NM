import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { SelfProfileForm } from "@/components/employees/self-profile-form";
export default async function ProfilePage() { const user = await getSessionUser(); if (!user) redirect("/login"); const tenant = await resolveTenantContext(); if (!tenant.organization) redirect("/platform"); const [employee] = await db.select().from(employees).where(and(eq(employees.userId, user.id), eq(employees.organizationId, tenant.organization.id))); if (!employee) return <Card><CardHeader><CardTitle>Profile not linked</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">Your account does not have an employee record yet.</p></CardContent></Card>; return <div className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle>My profile</CardTitle><p className="text-sm text-muted">Only permitted personal and contact fields can be edited here.</p></CardHeader><CardContent><SelfProfileForm initial={employee} /></CardContent></Card></div>; }
