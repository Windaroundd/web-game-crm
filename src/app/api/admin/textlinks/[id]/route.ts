import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type TextlinkUpdate = Database["public"]["Tables"]["textlinks"]["Update"];

// Validation schema for updates
const updateTextlinkSchema = z.object({
  link: z.string().url("Invalid URL format").optional(),
  anchor_text: z.string().min(1, "Anchor text is required").optional(),
  target: z.string().optional(),
  rel: z.string().optional(),
  title: z.string().optional(),
  website_id: z.number().int().positive().optional(),
  custom_domain: z.string().optional(),
  show_on_all_pages: z.boolean().optional(),
  include_paths: z.string().optional(),
  exclude_paths: z.string().optional(),
})
.refine(
  (data) => {
    // If either website_id or custom_domain is being updated, ensure at least one is provided
    if (data.website_id !== undefined || data.custom_domain !== undefined) {
      return data.website_id || data.custom_domain;
    }
    return true;
  },
  {
    message: "Either website_id or custom_domain is required",
    path: ["website_id"],
  }
);

const paramsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

// GET /api/admin/textlinks/[id] - Get single textlink
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    const { data: textlink, error } = await supabase
      .from("textlinks")
      .select(`
        *,
        websites (
          id,
          url,
          title
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Textlink not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch textlink",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: textlink,
    });
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid textlink ID",
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

// PUT /api/admin/textlinks/[id] - Update textlink
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);
    const body = await request.json();

    // Validate input
    const validatedData = updateTextlinkSchema.parse(body);

    // TODO: Get user ID from session for updated_by
    const userId = null; // Replace with actual user ID from auth

    const textlinkData: TextlinkUpdate = {
      ...validatedData,
      updated_by: userId,
    };

    const { data: textlink, error } = await supabase
      .from("textlinks")
      .update(textlinkData as never)
      .eq("id", id)
      .select(`
        *,
        websites (
          id,
          url,
          title
        )
      `)
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Textlink not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to update textlink",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: textlink,
      message: "Textlink updated successfully",
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

// DELETE /api/admin/textlinks/[id] - Delete textlink
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    const { error } = await supabase
      .from("textlinks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to delete textlink",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Textlink deleted successfully",
    });
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid textlink ID",
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