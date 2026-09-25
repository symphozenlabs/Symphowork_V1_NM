import { redirect } from "next/navigation";
import { Overview } from "@/components/dashboard/overview";
import { getSessionUser } from "@/modules/identity/auth";

export default async function WorkspacePage() { const user = await getSessionUser(); if (!user) redirect("/login"); return <Overview fullName={user.fullName} />; }
