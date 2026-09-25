import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/app") || path.startsWith("/platform");
  const hasSession = Boolean(request.cookies.get("symphowork_session")?.value);
  if (isProtected && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if ((path === "/login" || path === "/register") && hasSession) return NextResponse.redirect(new URL("/app", request.url));
  const response = NextResponse.next();
  response.headers.set("x-request-id", request.headers.get("x-request-id") ?? crypto.randomUUID());
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("content-security-policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
