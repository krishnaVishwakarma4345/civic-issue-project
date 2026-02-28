import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Route Definitions ────────────────────────────────────────

const PUBLIC_ROUTES     = ["/", "/login", "/register"];
const CITIZEN_ROUTES    = ["/dashboard", "/report-issue", "/my-issues", "/issues", "/map"];
const ADMIN_ROUTES      = ["/admin"];

// ─── Helper ───────────────────────────────────────────────────

const matchesRoute = (pathname: string, routes: string[]): boolean => {
  return routes.some((route) => pathname.startsWith(route));
};

// ─── Middleware ───────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Read auth cookie set by client after login
  const authToken = request.cookies.get("auth-token")?.value;
  const userRole  = request.cookies.get("user-role")?.value as
    | "citizen"
    | "admin"
    | undefined;

  const isLoggedIn = !!authToken;

  // ─── Redirect logged-in users away from auth pages ────────

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const redirectTo =
      userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // ─── Protect citizen routes ───────────────────────────────

  if (matchesRoute(pathname, CITIZEN_ROUTES)) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── Protect admin routes ─────────────────────────────────

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== "admin") {
      // Logged in but not admin — redirect to citizen dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};