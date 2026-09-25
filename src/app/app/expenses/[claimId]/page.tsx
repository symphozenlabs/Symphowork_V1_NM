import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDetail } from "@/components/expenses/expense-detail";
export default async function ExpenseDetailPage({ params }: { params: Promise<{ claimId: string }> }) { if (!(await getSessionUser())) redirect("/login"); const { claimId } = await params; return <div className="space-y-6"><div><Badge>Expense detail</Badge><h1 className="mt-3 text-3xl font-bold">Claim details</h1></div><Card><CardHeader><CardTitle>Claim and approval status</CardTitle></CardHeader><CardContent><ExpenseDetail claimId={claimId} /></CardContent></Card></div>; }
