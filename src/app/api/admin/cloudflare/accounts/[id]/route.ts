import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { getCurrentUser, canPerformAction } from "@/lib/auth/auth";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type CloudflareAccountUpdate = Database["public"]["Tables"]["cloudflare_accounts"]["Update"];

// Validation schema for updates
const updateAccountSchema = z.object({
  account_name: z.string().min(1, "Account name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  api_token: z.string().min(1, "API token is required").optional(),
  account_id: z.string().min(1, "Account ID is required").optional(),
});

const paramsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

// GET /api/admin/cloudflare/accounts/[id] - Get single cloudflare account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    const { data: account, error } = await supabase
      .from("cloudflare_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Cloudflare account not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch cloudflare account",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Mask API token in response
    const maskedAccount = Object.assign({}, account, {
      api_token: "***hidden***"
    });

    return NextResponse.json({
      status: "success",
      data: maskedAccount,
    });
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid account ID",
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

// PUT /api/admin/cloudflare/accounts/[id] - Update cloudflare account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);
    const body = await request.json();

    // Validate input
    const validatedData = updateAccountSchema.parse(body);

    // Remove empty api_token if not provided (for security)
    const accountData: CloudflareAccountUpdate = {
      ...validatedData,
      updated_by: user.id,
    };

    if (accountData.api_token === "") {
      delete accountData.api_token;
    }

    const { data: account, error } = await supabase
      .from("cloudflare_accounts")
      .update(accountData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Cloudflare account not found",
          },
          { status: 404 }
        );
      }

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
          error: "Failed to update cloudflare account",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Mask API token in response
    const maskedAccount = Object.assign({}, account, {
      api_token: "***hidden***"
    });

    return NextResponse.json({
      status: "success",
      data: maskedAccount,
      message: "Cloudflare account updated successfully",
    });
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

// DELETE /api/admin/cloudflare/accounts/[id] - Delete cloudflare account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser();
    if (!user || !canPerformAction(user, "delete")) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    // Check if account has associated purge logs
    const { count: logsCount } = await supabase
      .from("cloudflare_purge_logs")
      .select("*", { count: "exact", head: true })
      .eq("cloudflare_account_id", id);

    if (logsCount && logsCount > 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "Cannot delete account with existing purge logs. Delete logs first or contact administrator.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("cloudflare_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to delete cloudflare account",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Cloudflare account deleted successfully",
    });
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid account ID",
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