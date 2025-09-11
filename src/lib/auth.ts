import { createClient } from "@/lib/supabase/server";
import { createClient as createClientComponent } from "@/lib/supabase/client";

export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get user role from JWT claims
 */
export function getUserRole(user: {
  user_metadata?: any;
  app_metadata?: any;
}): UserRole {
  if (!user) return "viewer";

  // Check user_metadata first, then app_metadata
  const role = user.user_metadata?.role || user.app_metadata?.role;

  // Validate role
  if (role && ["admin", "editor", "viewer"].includes(role)) {
    return role as UserRole;
  }

  return "viewer";
}

/**
 * Get current user with role (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: getUserRole(user),
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get current user with role (client-side)
 */
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    const supabase = createClientComponent();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: getUserRole(user),
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  user: User | null,
  action: "read" | "write" | "delete"
): boolean {
  if (!user) return false;

  switch (action) {
    case "read":
      return true; // All authenticated users can read
    case "write":
      return hasRole(user, "editor");
    case "delete":
      return hasRole(user, "admin");
    default:
      return false;
  }
}
