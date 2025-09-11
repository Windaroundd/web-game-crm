"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        // Test basic connection by fetching user session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // Test database connection by counting websites
        const { count, error: countError } = await supabase
          .from("websites")
          .select("*", { count: "exact", head: true });

        if (countError) {
          throw countError;
        }

        setConnectionStatus("connected");
      } catch (err) {
        setConnectionStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    testConnection();
  }, []);

  if (connectionStatus === "checking") {
    return (
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <p className="text-blue-800">Testing Supabase connection...</p>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <h3 className="font-semibold text-red-800">
          Supabase Connection Failed
        </h3>
        <p className="text-red-700 mt-1">{error}</p>
        <div className="mt-3 text-sm text-red-600">
          <p>Please check:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Environment variables are set correctly</li>
            <li>Supabase project is running</li>
            <li>Database schema is applied</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
      <h3 className="font-semibold text-green-800">
        ✅ Supabase Connected Successfully
      </h3>
      <p className="text-green-700 mt-1">
        Your Supabase setup is working correctly!
      </p>
    </div>
  );
}
