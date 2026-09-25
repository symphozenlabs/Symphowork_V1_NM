import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationEditor } from "@/components/platform/configuration-editor";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlatformConfiguration } from "@/modules/platform/configuration";
export default async function ConfigurationPage() { try { await authorizePlatform(PLATFORM_PERMISSIONS.configurationView); } catch { redirect("/platform/login"); } const configuration = await getPlatformConfiguration(); return <div className="space-y-6"><div><Badge>Safe settings</Badge><h1 className="mt-3 text-3xl font-bold">Platform configuration</h1><p className="mt-2 text-sm text-muted">Only typed, allowlisted operational settings are shown. Infrastructure secrets remain outside the application.</p></div><Card><CardHeader><CardTitle>Operational defaults</CardTitle></CardHeader><CardContent className="space-y-4">{configuration.map((setting) => <div key={setting.key}><p className="mb-1 text-sm font-semibold">{setting.key}</p><ConfigurationEditor setting={setting} /></div>)}</CardContent></Card></div>; }
