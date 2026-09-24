import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/identity/auth";

export default async function PlatformPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.platformRole !== "PLATFORM_OWNER") redirect("/app");
  const rows = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge>Platform console</Badge><h1 className="mt-3 text-3xl font-bold">Organization provisioning</h1><p className="mt-2 text-sm text-muted">Review lifecycle status and provision new tenant workspaces.</p></div><Button asChild><Link href="/platform/organizations/new">Create organization</Link></Button></div><Card><CardHeader><CardTitle>Organizations <span className="ml-2 text-sm font-normal text-muted">{rows.length}</span></CardTitle></CardHeader><CardContent>{rows.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted">No organizations have been created yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-3">Organization</th><th className="px-3 py-3">Slug</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-3 py-4 font-semibold"><Link className="hover:text-primary" href={`/platform/organizations/${row.id}`}>{row.name}</Link></td><td className="px-3 py-4 text-muted">{row.slug}</td><td className="px-3 py-4"><Badge className={row.status === "active" ? "bg-[#dff7ee] text-success" : "bg-[#fff4df] text-warning"}>{row.status}</Badge></td></tr>)}</tbody></table></div>}</CardContent></Card></div>;
}
