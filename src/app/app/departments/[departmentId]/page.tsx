import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { getDepartmentDetails } from "@/modules/departments/service";
import { DepartmentDetailsView } from "@/components/departments/department-details-view";
import { AppError } from "@/lib/errors";

export const metadata = {
  title: "Department Details | SymphoWork",
  description: "Department workforce roster, team distribution, and attendance management",
};

interface DepartmentDetailsPageProps {
  params: Promise<{ departmentId: string }>;
  searchParams?: Promise<{
    date?: string;
  }>;
}

export default async function DepartmentDetailsPage({
  params,
  searchParams,
}: DepartmentDetailsPageProps) {
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

  const { departmentId } = await params;
  const resolvedParams = searchParams ? await searchParams : {};
  const dateParam = resolvedParams.date || undefined;

  try {
    const department = await getDepartmentDetails(
      tenant.organization.id,
      user.id,
      departmentId,
      dateParam
    );

    return (
      <div className="space-y-6">
        <DepartmentDetailsView
          initialDepartment={department}
          isOrganizationOwner={canManage}
          canManageTeams={department.canManageTeams ?? canManage}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      redirect("/app");
    }
    throw error;
  }
}
