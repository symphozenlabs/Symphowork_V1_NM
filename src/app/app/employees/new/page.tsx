import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";
import { EmployeeCreateForm } from "@/components/employees/employee-create-form";
export default async function NewEmployeePage() { const user = await getSessionUser(); if (!user) redirect("/login"); return <div className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle>Create employee</CardTitle><p className="text-sm text-muted">Create the HR record first; account linking and onboarding can follow.</p></CardHeader><CardContent><EmployeeCreateForm /></CardContent></Card></div>; }
