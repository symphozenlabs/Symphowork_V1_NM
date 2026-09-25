import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentCenter } from "@/components/documents/document-center";
export default async function DocumentsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Documents</Badge><h1 className="mt-3 text-3xl font-bold">Your documents</h1><p className="mt-2 text-sm text-muted">Upload private employee documents through the configured storage provider.</p></div><Card><CardHeader><CardTitle>Document center</CardTitle></CardHeader><CardContent><DocumentCenter /></CardContent></Card></div>; }
