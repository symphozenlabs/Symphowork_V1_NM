import { logout } from "@/modules/identity/auth";
export async function POST() { await logout(); return Response.json({ success: true }); }
