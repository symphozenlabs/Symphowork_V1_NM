import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function BillingPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Billing</Badge><h1 className="mt-3 text-3xl font-bold">Plan and usage</h1><p className="mt-2 text-sm text-muted">Review subscription status, usage, and available entitlements.</p></div><Card><CardHeader><CardTitle>Billing provider</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">Payment provider configuration is managed server-side. The FREE plan remains available without payment credentials.</p></CardContent></Card></div>; }
