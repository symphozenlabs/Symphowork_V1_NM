import { headers } from "next/headers";
import { PlatformShell } from "@/components/platform/platform-shell";

export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  if (pathname === "/platform/login" || pathname.startsWith("/platform/login")) {
    return <>{children}</>;
  }

  return <PlatformShell>{children}</PlatformShell>;
}
