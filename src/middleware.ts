import { createClient } from "@/lib/database/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole, hasRole } from "@/lib/auth/auth";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ["/admin", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing login page with a valid session, redirect to admin
  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Role-based access control for admin routes
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    const userRole = getUserRole(user);

    // Check if user has at least viewer role
    if (
      !hasRole(
        { id: user.id, email: user.email || "", role: userRole },
        "viewer"
      )
    ) {
      return NextResponse.redirect(
        new URL("/login?error=insufficient_permissions", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
