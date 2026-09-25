import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { BillingOverview } from "@/components/billing/billing-overview";
export default async function BillingPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Billing</Badge><h1 className="mt-3 text-3xl font-bold">Plan and usage</h1><p className="mt-2 text-sm text-muted">Review the organization subscription and measured usage. Payment actions remain unavailable until a provider is configured.</p></div><BillingOverview /></div>; }
