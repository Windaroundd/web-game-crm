"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";

interface LogoutButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({
  className,
  variant = "ghost",
  size = "default",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error: unknown) {
      console.error("Logout error:", error);
      toast.error(
        (error as Error).message || "Failed to logout. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <IconLogout className="h-4 w-4" />
      {size !== "icon" && (isLoading ? "Logging out..." : "Logout")}
    </Button>
  );
}
