import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { OrganizationCreateForm } from "@/components/platform/organization-create-form";
export default async function NewOrganizationPage() { try { await authorizePlatform(PLATFORM_PERMISSIONS.organizationCreate); } catch { redirect("/platform/login"); } return <div className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle>Create organization</CardTitle><p className="text-sm text-muted">New tenants begin in pending status until approved and provisioned.</p></CardHeader><CardContent><OrganizationCreateForm /></CardContent></Card></div>; }
