import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { gameSchema, validateFormData } from "@/lib/utils/validations";
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
  search: z.string().optional(), // General search for title and developer
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  sort: z
    .enum(["title", "game_publish_year", "publish_year", "created_at", "game_developer"])
    .optional()
    .default("created_at"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 10)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
});

// GET - Admin games list with all fields
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const { category, isFeatured, developer, search, year, sort, order, limit, page } =
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

    if (search) {
      // Search in both title and developer fields
      query = query.or(`title.ilike.%${search}%,game_developer.ilike.%${search}%`);
    }

    if (year !== undefined) {
      query = query.eq("game_publish_year", year);
    }

    // Apply sorting (support alias publish_year)
    const sortColumn = sort === "publish_year" ? "game_publish_year" : sort;
    query = query.order(sortColumn, { ascending: order === "asc" });

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
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,game_developer.ilike.%${search}%`);
    }
    if (year !== undefined) {
      countQuery = countQuery.eq("game_publish_year", year);
    }

    const { count: totalCount } = await countQuery;

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
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

// POST - Create new game (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user for audit trail
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input data
    const validation = validateFormData(gameSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const gameData = validation.data;

    // Transform form data to database format
    const dbData = {
      url: gameData.url,
      title: gameData.title,
      desc: gameData.desc || null,
      category: gameData.category,
      game_url: gameData.game_url || null,
      game_icon: gameData.game_icon?.[0] || null,
      game_thumb: gameData.game_thumb?.[0] || null,
      game_developer: gameData.game_developer || null,
      game_publish_year: gameData.game_publish_year || null,
      game_controls: gameData.game_controls,
      game: gameData.game || null,
      is_featured: gameData.is_featured,
      created_by: user.id,
      updated_by: user.id,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newGame, error } = await (supabase as any)
      .from("games")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to create game",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        data: newGame,
        message: "Game created successfully",
      },
      { status: 201 }
    );
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