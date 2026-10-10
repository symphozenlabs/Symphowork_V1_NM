import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";
import { EmployeeCreateForm } from "@/components/employees/employee-create-form";

export default async function NewEmployeePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/app/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Onboard New Employee
              </CardTitle>
              <p className="text-xs text-muted">
                Create the HR profile record first; account credential linking and onboarding checklists follow creation.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <EmployeeCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
