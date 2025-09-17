import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { getCurrentUser, canPerformAction } from "@/lib/auth/auth";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type CloudflareAccountInsert = Database["public"]["Tables"]["cloudflare_accounts"]["Insert"];

// Validation schemas
const createAccountSchema = z.object({
  account_name: z.string().min(1, "Account name is required"),
  email: z.string().email("Valid email is required"),
  api_token: z.string().min(1, "API token is required"),
  account_id: z.string().min(1, "Account ID is required"),
});

const querySchema = z.object({
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 25)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
});

// GET /api/admin/cloudflare/accounts - List cloudflare accounts
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

    const { search, limit, page } = validatedQuery;

    // Build query
    let query = supabase
      .from("cloudflare_accounts")
      .select("*");

    // Apply search filter
    if (search) {
      query = query.or(
        `account_name.ilike.%${search}%,email.ilike.%${search}%,account_id.ilike.%${search}%`
      );
    }

    // Apply sorting by created_at desc
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: accounts, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch cloudflare accounts",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("cloudflare_accounts")
      .select("*", { count: "exact", head: true });

    // Apply same search filter for count
    if (search) {
      countQuery = countQuery.or(
        `account_name.ilike.%${search}%,email.ilike.%${search}%,account_id.ilike.%${search}%`
      );
    }

    const { count: totalCount } = await countQuery;
    const totalPages = Math.ceil((totalCount || 0) / limit);

    // Mask API tokens in response
    const maskedAccounts = (accounts || []).map(account =>
      Object.assign({}, account, { api_token: "***hidden***" })
    );

    return NextResponse.json({
      status: "success",
      data: maskedAccounts,
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

// POST /api/admin/cloudflare/accounts - Create new cloudflare account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Validate input
    const validatedData = createAccountSchema.parse(body);

    // Get authenticated user ID
    const user = await getCurrentUser();
    if (!user || !canPerformAction(user, "write")) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const accountData: CloudflareAccountInsert = {
      ...validatedData,
      created_by: userId,
    };

    const { data: account, error } = await supabase
      .from("cloudflare_accounts")
      .insert(accountData as never)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          {
            status: "error",
            error: "Account with this email or account ID already exists",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to create cloudflare account",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Mask API token in response
    const maskedAccount = Object.assign({}, account, {
      api_token: "***hidden***"
    });

    return NextResponse.json(
      {
        status: "success",
        data: maskedAccount,
        message: "Cloudflare account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid input data",
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