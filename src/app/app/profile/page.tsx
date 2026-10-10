import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { SelfProfileForm } from "@/components/employees/self-profile-form";
import { ArrowLeft, User, ShieldAlert } from "lucide-react";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.userId, user.id),
        eq(employees.organizationId, tenant.organization.id)
      )
    );

  if (!employee) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-bold text-foreground">
                Employee Profile Not Linked
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted leading-relaxed">
              Your user account does not have a linked employee profile in this organization workspace yet. Contact your human resources administrator to assign your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Workspace Dashboard</span>
        </Link>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                My Employee Profile
              </CardTitle>
              <p className="text-xs text-muted">
                Manage your personal contact information. Employment terms and role assignments are managed by people operations.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <SelfProfileForm initial={employee} />
        </CardContent>
      </Card>
    </div>
  );
}
