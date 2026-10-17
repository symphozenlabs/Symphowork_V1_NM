import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { OnboardingWizard } from "@/components/employees/onboarding-wizard";

export const metadata = {
  title: "Onboard Employee | SymphoWork",
  description: "Multi-step role-based workforce onboarding wizard",
};

export default async function NewEmployeePage() {
  const tenant = await resolveTenantContext();
  if (!tenant.organization) {
    redirect("/platform");
  }

  const canCreate = await can({
    userId: tenant.user.id,
    organizationId: tenant.organization.id,
    permission: "employee.create",
  });

  if (!canCreate) {
    redirect("/app/employees");
  }

  return (
    <div className="mx-auto max-w-5xl py-2">
      <OnboardingWizard
        currentUserRole={tenant.role?.key}
        organizationId={tenant.organization.id}
      />
    </div>
  );
}
