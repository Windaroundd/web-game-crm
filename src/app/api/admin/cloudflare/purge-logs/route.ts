import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { getCurrentUser, canPerformAction } from "@/lib/auth/auth";
import { z } from "zod";

// Validation schemas
const querySchema = z.object({
  search: z.string().optional(),
  cloudflare_account_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  mode: z.enum(["url", "hostname", "tag", "prefix"]).optional(),
  status_filter: z.enum(["success", "error"]).optional(),
  sort: z
    .enum(["created_at", "mode", "status_code"])
    .optional()
    .default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 25)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
});

// GET /api/admin/cloudflare/purge-logs - List purge logs with filters and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser();
    if (!user || !canPerformAction(user, "read")) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const {
      search,
      cloudflare_account_id,
      mode,
      status_filter,
      sort,
      order,
      limit,
      page,
    } = validatedQuery;

    // Build query with join to cloudflare_accounts table
    let query = supabase
      .from("cloudflare_purge_logs")
      .select(`
        *,
        cloudflare_accounts (
          id,
          account_name,
          email
        )
      `);

    // Apply filters
    if (cloudflare_account_id !== undefined) {
      query = query.eq("cloudflare_account_id", cloudflare_account_id);
    }

    if (mode) {
      query = query.eq("mode", mode);
    }

    if (status_filter === "success") {
      query = query.gte("status_code", 200).lt("status_code", 300);
    } else if (status_filter === "error") {
      query = query.or("status_code.lt.200,status_code.gte.300");
    }

    if (search) {
      query = query.or(
        `mode.ilike.%${search}%,payload::text.ilike.%${search}%,created_by.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch purge logs",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("cloudflare_purge_logs")
      .select("*", { count: "exact", head: true });

    // Apply same filters for count
    if (cloudflare_account_id !== undefined)
      countQuery = countQuery.eq("cloudflare_account_id", cloudflare_account_id);
    if (mode) countQuery = countQuery.eq("mode", mode);
    if (status_filter === "success") {
      countQuery = countQuery.gte("status_code", 200).lt("status_code", 300);
    } else if (status_filter === "error") {
      countQuery = countQuery.or("status_code.lt.200,status_code.gte.300");
    }
    if (search) {
      countQuery = countQuery.or(
        `mode.ilike.%${search}%,payload::text.ilike.%${search}%,created_by.ilike.%${search}%`
      );
    }

    const { count: totalCount } = await countQuery;
    const totalPages = Math.ceil((totalCount || 0) / limit);

    // Transform data to include account name
    const transformedLogs = (logs || []).map((log: Record<string, unknown>) =>
      Object.assign({}, log, {
        accountName: (log.cloudflare_accounts as { account_name?: string })?.account_name || "Unknown Account",
      })
    );

    return NextResponse.json({
      status: "success",
      data: transformedLogs,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid query parameters",
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