import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { listDepartmentsWithMetrics } from "@/modules/departments/service";
import { DepartmentListTable } from "@/components/departments/department-list-table";

export const metadata = {
  title: "Departments | SymphoWork",
  description: "Organization department structure, manager alignment, and attendance overview",
};

interface DepartmentsPageProps {
  searchParams?: Promise<{
    date?: string;
  }>;
}

export default async function DepartmentsPage({ searchParams }: DepartmentsPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  // Enforce server-side authorization: only roles with department.read can view
  const canRead = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "department.read",
    user,
  });

  if (!canRead) {
    redirect("/app");
  }

  const canManage =
    tenant.role?.key === "ORGANIZATION_OWNER" ||
    tenant.role?.key === "HR_ADMIN" ||
    user.platformRole === "PLATFORM_OWNER" ||
    (await can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "department.manage",
      user,
    }));

  const resolvedParams = searchParams ? await searchParams : {};
  const dateParam = resolvedParams.date || undefined;

  const result = await listDepartmentsWithMetrics(
    tenant.organization.id,
    user.id,
    dateParam
  );

  return (
    <div className="space-y-6">
      <DepartmentListTable
        initialItems={result.items}
        initialDateContext={result.dateContext}
        isOrganizationOwner={canManage}
      />
    </div>
  );
}
