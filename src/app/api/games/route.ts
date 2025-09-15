import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { z } from "zod";

// Query parameters validation schema
const querySchema = z.object({
  category: z.string().optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) =>
      val == null ? undefined : val === "1" || val === "true"
    ),
  developer: z.string().optional(),
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  sort: z
    .enum(["title", "game_publish_year", "publish_year", "created_at"])
    .optional()
    .default("created_at"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 10)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limit per req.md (60 req/min)
    const rateLimit = checkRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          status: "error",
          error: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: getRateLimitHeaders(
            rateLimit.allowed,
            rateLimit.remaining,
            rateLimit.resetTime
          ),
        }
      );
    }
    const supabase = await createClient();

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const { category, isFeatured, developer, year, sort, limit, page } =
      validatedQuery;

    // Build query
    let query = supabase.from("games").select("*");

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (isFeatured !== undefined) {
      query = query.eq("is_featured", isFeatured);
    }

    if (developer) {
      query = query.ilike("game_developer", `%${developer}%`);
    }

    if (year !== undefined) {
      query = query.eq("game_publish_year", year);
    }

    // Apply sorting (support alias publish_year)
    const sortColumn = sort === "publish_year" ? "game_publish_year" : sort;
    const sortOrder = sortColumn === "created_at" ? "desc" : "asc";
    query = query.order(sortColumn, { ascending: sortOrder === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: games, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch games",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    // Count with the same filters
    let countQuery = supabase.from("games").select("*", {
      count: "exact",
      head: true,
    });

    if (category) {
      countQuery = countQuery.eq("category", category);
    }
    if (isFeatured !== undefined) {
      countQuery = countQuery.eq("is_featured", isFeatured);
    }
    if (developer) {
      countQuery = countQuery.ilike("game_developer", `%${developer}%`);
    }
    if (year !== undefined) {
      countQuery = countQuery.eq("game_publish_year", year);
    }

    const { count: totalCount } = await countQuery;

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json(
      {
        status: "success",
        data: games || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
          ...getRateLimitHeaders(
            rateLimit.allowed,
            rateLimit.remaining,
            rateLimit.resetTime
          ),
        },
      }
    );
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


// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
