import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type TextlinkInsert = Database["public"]["Tables"]["textlinks"]["Insert"];

// Validation schemas
const createTextlinkSchema = z.object({
  link: z.string().url("Invalid URL format"),
  anchor_text: z.string().min(1, "Anchor text is required"),
  target: z.string().default("_blank"),
  rel: z.string().default(""),
  title: z.string().optional(),
  website_id: z.number().int().positive().optional(),
  custom_domain: z.string().optional(),
  show_on_all_pages: z.boolean().default(true),
  include_paths: z.string().optional(),
  exclude_paths: z.string().optional(),
})
.refine(
  (data) => data.website_id || data.custom_domain,
  {
    message: "Either website_id or custom_domain is required",
    path: ["website_id"],
  }
);

const querySchema = z.object({
  search: z.string().optional(),
  website_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  custom_domain: z.string().optional(),
  show_on_all_pages: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  sort: z
    .enum([
      "anchor_text",
      "link",
      "created_at",
      "updated_at",
    ])
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

// GET /api/admin/textlinks - List textlinks with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const {
      search,
      website_id,
      custom_domain,
      show_on_all_pages,
      sort,
      order,
      limit,
      page,
    } = validatedQuery;

    // Build query with join to websites table
    let query = supabase
      .from("textlinks")
      .select(`
        *,
        websites (
          id,
          url,
          title
        )
      `);

    // Apply filters
    if (website_id !== undefined) {
      query = query.eq("website_id", website_id);
    }

    if (custom_domain) {
      query = query.eq("custom_domain", custom_domain);
    }

    if (show_on_all_pages !== undefined) {
      query = query.eq("show_on_all_pages", show_on_all_pages);
    }

    if (search) {
      query = query.or(
        `anchor_text.ilike.%${search}%,link.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: textlinks, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch textlinks",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("textlinks")
      .select("*", { count: "exact", head: true });

    // Apply same filters for count
    if (website_id !== undefined) countQuery = countQuery.eq("website_id", website_id);
    if (custom_domain) countQuery = countQuery.eq("custom_domain", custom_domain);
    if (show_on_all_pages !== undefined)
      countQuery = countQuery.eq("show_on_all_pages", show_on_all_pages);
    if (search) {
      countQuery = countQuery.or(
        `anchor_text.ilike.%${search}%,link.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    const { count: totalCount } = await countQuery;
    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      status: "success",
      data: textlinks || [],
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

// POST /api/admin/textlinks - Create new textlink
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = createTextlinkSchema.parse(body);

    // TODO: Get user ID from session for created_by/updated_by
    const userId = null; // Replace with actual user ID from auth

    const textlinkData: TextlinkInsert = {
      ...validatedData,
      created_by: userId,
      updated_by: userId,
    };

    const { data: textlink, error } = await supabase
      .from("textlinks")
      .insert(textlinkData as never)
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

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to create textlink",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        data: textlink,
        message: "Textlink created successfully",
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