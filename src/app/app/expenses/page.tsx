import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
export default async function ExpensesPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Expenses</Badge><h1 className="mt-3 text-3xl font-bold">Expense claims</h1><p className="mt-2 text-sm text-muted">Build a claim from itemized expenses and submit it to the configured approval workflow.</p></div><Card><CardHeader><CardTitle>New expense claim</CardTitle></CardHeader><CardContent><ExpenseDashboard /></CardContent></Card></div>; }
