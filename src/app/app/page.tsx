import { redirect } from "next/navigation";
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
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Workspace Unavailable
              </span>
            </div>
            <CardTitle className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Organization Workspace is not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm leading-relaxed text-muted">
              Your organization workspace is currently not accessible. This may occur if the organization is pending activation, suspended, or undergoing administrative review.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Please contact your organization owner or platform support for assistance.
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
