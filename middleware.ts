import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/app") || path.startsWith("/platform");
  const hasSession = Boolean(request.cookies.get("symphowork_session")?.value);
  if (isProtected && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if ((path === "/login" || path === "/register") && hasSession) return NextResponse.redirect(new URL("/app", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/platform/:path*", "/login", "/register"] };
