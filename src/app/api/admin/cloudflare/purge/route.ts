import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { getCurrentUser, canPerformAction } from "@/lib/auth/auth";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type CloudflarePurgeLogInsert = Database["public"]["Tables"]["cloudflare_purge_logs"]["Insert"];

// Validation schema for purge requests
const purgeRequestSchema = z.object({
  cloudflare_account_id: z.number().int().positive("Account ID is required"),
  zone_id: z.string().min(1, "Zone ID is required"),
  mode: z.enum(["url", "hostname", "tag", "prefix"]),
  payload: z.array(z.string()).min(1, "At least one item to purge is required"),
  exclusions: z.array(z.string()).optional(),
});

// POST /api/admin/cloudflare/purge - Purge Cloudflare cache
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser();
    if (!user || !canPerformAction(user, "write")) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = purgeRequestSchema.parse(body);
    const { cloudflare_account_id, zone_id, mode, payload, exclusions } = validatedData;

    // Get Cloudflare account details (including API token)
    const { data: account, error: accountError } = await supabase
      .from("cloudflare_accounts")
      .select("*")
      .eq("id", cloudflare_account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        {
          status: "error",
          error: "Cloudflare account not found",
        },
        { status: 404 }
      );
    }

    // Prepare Cloudflare API request payload
    let cloudflarePayload: Record<string, string[]> = {};

    switch (mode) {
      case "url":
        cloudflarePayload = { files: payload };
        if (exclusions && exclusions.length > 0) {
          // Note: Cloudflare doesn't support exclusions directly in the API
          // This would need custom logic to filter out exclusions from the payload
          const filteredFiles = payload.filter(file => !exclusions.includes(file));
          cloudflarePayload = { files: filteredFiles };
        }
        break;
      case "hostname":
        cloudflarePayload = { hosts: payload };
        break;
      case "tag":
        cloudflarePayload = { tags: payload };
        break;
      case "prefix":
        cloudflarePayload = { prefixes: payload };
        break;
    }

    const userId = user.id;

    let statusCode: number;
    let result: Record<string, unknown>;

    try {
      // Make request to Cloudflare API
      const cloudflareResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone_id}/purge_cache`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${(account as { api_token: string }).api_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cloudflarePayload),
        }
      );

      statusCode = cloudflareResponse.status;
      result = await cloudflareResponse.json();

      // Log the purge request to database
      const logData: CloudflarePurgeLogInsert = {
        cloudflare_account_id,
        mode,
        payload: payload as unknown[], // Cast to jsonb
        exclusions: exclusions as unknown[], // Cast to jsonb
        status_code: statusCode,
        result: result as Record<string, unknown>, // Cast to jsonb
        created_by: userId,
      };

      const { error: logError } = await supabase
        .from("cloudflare_purge_logs")
        .insert(logData as never);

      if (logError) {
        console.error("Failed to log purge request:", logError);
        // Continue anyway, as the purge itself succeeded/failed
      // Note: In production, you might want to handle this differently
      }

      // Return response based on Cloudflare API result
      if (statusCode >= 200 && statusCode < 300 && (result as { success?: boolean }).success) {
        return NextResponse.json({
          status: "success",
          data: {
            cloudflare_response: result,
            purge_id: (result as { result?: { id?: string } }).result?.id,
            mode,
            payload,
            exclusions,
          },
          message: "Cache purge completed successfully",
        });
      } else {
        return NextResponse.json(
          {
            status: "error",
            error: "Cloudflare purge failed",
            details: result.errors || result.messages || "Unknown error",
            cloudflare_response: result,
          },
          { status: statusCode >= 400 ? statusCode : 400 }
        );
      }
    } catch (fetchError) {
      // Log failed request to database
      statusCode = 0; // Indicates network/connection error
      result = {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : "Network error",
        type: "network_error"
      };

      const logData: CloudflarePurgeLogInsert = {
        cloudflare_account_id,
        mode,
        payload: payload as unknown[],
        exclusions: exclusions as unknown[],
        status_code: statusCode,
        result: result as Record<string, unknown>,
        created_by: userId,
      };

      const { error: logError } = await supabase
        .from("cloudflare_purge_logs")
        .insert(logData as never);

      if (logError) {
        console.error("Failed to log purge request:", logError);
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to connect to Cloudflare API",
          details: fetchError instanceof Error ? fetchError.message : "Network error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid purge request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}