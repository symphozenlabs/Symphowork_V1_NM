import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";
import { OrganizationCreateForm } from "@/components/platform/organization-create-form";
export default async function NewOrganizationPage() { const user = await getSessionUser(); if (!user) redirect("/login"); if (user.platformRole !== "PLATFORM_OWNER") redirect("/app"); return <div className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle>Create organization</CardTitle><p className="text-sm text-muted">New tenants begin in pending status until approved.</p></CardHeader><CardContent><OrganizationCreateForm /></CardContent></Card></div>; }
