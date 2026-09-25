import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default async function NotificationsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Notifications</Badge><h1 className="mt-3 text-3xl font-bold">Notification center</h1><p className="mt-2 text-sm text-muted">Approval, leave, attendance, expense, and document updates for your workspace.</p></div><Card><CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader><CardContent><NotificationCenter /></CardContent></Card></div>; }
