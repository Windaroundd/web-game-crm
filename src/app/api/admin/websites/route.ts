import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type WebsiteInsert = Database["public"]["Tables"]["websites"]["Insert"];

// Validation schemas
const createWebsiteSchema = z.object({
  url: z.string().url("Invalid URL format"),
  title: z.string().min(1, "Title is required"),
  desc: z.string().optional(),
  category: z.string().optional(),
  is_gsa: z.boolean().default(false),
  is_index: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  traffic: z.number().int().min(0).default(0),
  domain_rating: z.number().int().min(0).max(100).default(0),
  backlinks: z.number().int().min(0).default(0),
  referring_domains: z.number().int().min(0).default(0),
  is_wp: z.boolean().default(false),
});


const querySchema = z.object({
  category: z.string().optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  isIndex: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  isGSA: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  isWP: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  minTraffic: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  minDR: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  sort: z
    .enum([
      "traffic",
      "domain_rating",
      "backlinks",
      "referring_domains",
      "created_at",
      "title",
      "category",
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
  search: z.string().optional(),
});

// GET /api/admin/websites - List websites with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Categories-only query: /api/admin/websites?distinct=category
    const urlForDistinct = new URL(request.url);
    const distinctParam = urlForDistinct.searchParams.get("distinct");
    if (distinctParam === "category") {
      const { data, error } = await supabase
        .from("websites")
        .select("category")
        .neq("category", null)
        .order("category", { ascending: true });

      if (error) {
        return NextResponse.json(
          {
            status: "error",
            error: "Failed to fetch categories",
            details: error.message,
          },
          { status: 500 }
        );
      }

      const unique = Array.from(
        new Set(
          (data || [])
            .map((r: { category: string | null }) => r.category || "")
            .filter(Boolean)
        )
      );

      return NextResponse.json({ status: "success", data: ["all", ...unique] });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const {
      category,
      isFeatured,
      isIndex,
      isGSA,
      isWP,
      minTraffic,
      minDR,
      sort,
      order,
      limit,
      page,
      search,
    } = validatedQuery;

    // Build query
    let query = supabase.from("websites").select("*");

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (isFeatured !== undefined) {
      query = query.eq("is_featured", isFeatured);
    }

    if (isIndex !== undefined) {
      query = query.eq("is_index", isIndex);
    }

    if (isGSA !== undefined) {
      query = query.eq("is_gsa", isGSA);
    }

    if (isWP !== undefined) {
      query = query.eq("is_wp", isWP);
    }

    if (minTraffic !== undefined) {
      query = query.gte("traffic", minTraffic);
    }

    if (minDR !== undefined) {
      query = query.gte("domain_rating", minDR);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,url.ilike.%${search}%,desc.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: websites, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch websites",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("websites")
      .select("*", { count: "exact", head: true });

    // Apply same filters for count
    if (category) countQuery = countQuery.eq("category", category);
    if (isFeatured !== undefined)
      countQuery = countQuery.eq("is_featured", isFeatured);
    if (isIndex !== undefined) countQuery = countQuery.eq("is_index", isIndex);
    if (isGSA !== undefined) countQuery = countQuery.eq("is_gsa", isGSA);
    if (isWP !== undefined) countQuery = countQuery.eq("is_wp", isWP);
    if (minTraffic !== undefined)
      countQuery = countQuery.gte("traffic", minTraffic);
    if (minDR !== undefined)
      countQuery = countQuery.gte("domain_rating", minDR);
    if (search) {
      countQuery = countQuery.or(
        `title.ilike.%${search}%,url.ilike.%${search}%,desc.ilike.%${search}%`
      );
    }

    const { count: totalCount } = await countQuery;
    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      status: "success",
      data: websites || [],
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

// POST /api/admin/websites - Create new website
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = createWebsiteSchema.parse(body);

    // TODO: Get user ID from session for created_by/updated_by
    const userId = null; // Replace with actual user ID from auth

    const websiteData: WebsiteInsert = {
      ...validatedData,
      created_by: userId,
      updated_by: userId,
    };

    const { data: website, error } = await supabase
      .from("websites")
      .insert(websiteData as never)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

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
          error: "Failed to create website",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        data: website,
        message: "Website created successfully",
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
