import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { z } from "zod";


// Validation schema for updates
const updateWebsiteSchema = z.object({
  url: z.string().url("Invalid URL format").optional(),
  title: z.string().min(1, "Title is required").optional(),
  desc: z.string().optional(),
  category: z.string().optional(),
  is_gsa: z.boolean().optional(),
  is_index: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  traffic: z.number().int().min(0).optional(),
  domain_rating: z.number().int().min(0).max(100).optional(),
  backlinks: z.number().int().min(0).optional(),
  referring_domains: z.number().int().min(0).optional(),
  is_wp: z.boolean().optional(),
});

// GET /api/admin/websites/[id] - Get single website
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id);

    if (isNaN(websiteId)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid website ID",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: website, error } = await supabase
      .from("websites")
      .select("*")
      .eq("id", websiteId)
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Website not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch website",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: website,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/websites/[id] - Update website
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id);

    if (isNaN(websiteId)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid website ID",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = updateWebsiteSchema.parse(body);

    // TODO: Get user ID from session for updated_by
    const userId = null; // Replace with actual user ID from auth

    const updateData = {
      ...validatedData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { data: website, error } = await supabase
      .from("websites")
      .update(updateData as never)
      .eq("id", websiteId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Website not found",
          },
          { status: 404 }
        );
      }

      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          {
            status: "error",
            error: "A website with this URL already exists",
            details: error.message,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to update website",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: website,
      message: "Website updated successfully",
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

// DELETE /api/admin/websites/[id] - Delete website
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id);

    if (isNaN(websiteId)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid website ID",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if website has related textlinks
    const { data: textlinks, error: textlinksError } = await supabase
      .from("textlinks")
      .select("id")
      .eq("website_id", websiteId)
      .limit(1);

    if (textlinksError) {
      console.error("Database error checking textlinks:", textlinksError);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to check website dependencies",
          details: textlinksError.message,
        },
        { status: 500 }
      );
    }

    if (textlinks && textlinks.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "Cannot delete website with associated textlinks",
          details: "Please remove all textlinks first",
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("websites")
      .delete()
      .eq("id", websiteId);

    if (error) {
      console.error("Database error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            status: "error",
            error: "Website not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to delete website",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}