import { createClient } from "@/lib/database/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole, hasRole } from "@/lib/auth/auth";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin app pages
  const protectedRoutes = ["/admin", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing login page with a valid session, redirect to admin
  if (request.nextUrl.pathname === "/auth/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Protect admin APIs: require auth
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optionally enforce minimum role (viewer) for all admin APIs
    const userRole = getUserRole(user);
    if (
      !hasRole(
        { id: user.id, email: user.email || "", role: userRole },
        "viewer"
      )
    ) {
      return NextResponse.json(
        { status: "error", error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
