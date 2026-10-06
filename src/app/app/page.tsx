import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { AppError } from "@/lib/errors";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";

export default async function WorkspacePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.platformRole && user.platformRole !== "NONE") {
    redirect("/platform");
  }

  let tenant;
  try {
    tenant = await resolveTenantContext();
  } catch (error) {
    if (error instanceof AppError && error.code === "ORG_ACCESS_DENIED") {
      redirect("/login");
    }

    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge>Workspace unavailable</Badge>
            </div>
            <CardTitle className="mt-2 text-2xl font-bold">
              Organization workspace is not available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              Your organization workspace is currently not accessible. This may occur if the organization is pending activation, suspended, or undergoing administrative review.
            </p>
            <p className="text-sm text-muted">
              Please contact your organization administrator or platform support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant?.organization) {
    redirect("/platform");
  }

  return <Overview fullName={user.fullName} />;
}
