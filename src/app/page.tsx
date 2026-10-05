import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(user.platformRole && user.platformRole !== "NONE" ? "/platform" : "/app");
}
