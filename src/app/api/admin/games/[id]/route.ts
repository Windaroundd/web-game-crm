import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { gameSchema, validateFormData } from "@/lib/utils/validations";

// GET - Get single game by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json(
        { status: "error", error: "Invalid game ID" },
        { status: 400 }
      );
    }

    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch game",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!game) {
      return NextResponse.json(
        { status: "error", error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: game,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { status: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update game by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json(
        { status: "error", error: "Invalid game ID" },
        { status: 400 }
      );
    }

    // Get the current user for audit trail
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input data - make url optional for updates
    const updateSchema = gameSchema.partial().extend({
      url: gameSchema.shape.url.optional(),
    });

    const validation = validateFormData(updateSchema, body);

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

    // Build update object with only the fields that were provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData = {} as any;

    updateData.updated_by = user.id;
    updateData.updated_at = new Date().toISOString();

    if (gameData.url !== undefined) updateData.url = gameData.url;
    if (gameData.title !== undefined) updateData.title = gameData.title;
    if (gameData.desc !== undefined) updateData.desc = gameData.desc || null;
    if (gameData.category !== undefined) updateData.category = gameData.category;
    if (gameData.game_url !== undefined) updateData.game_url = gameData.game_url || null;
    if (gameData.game_icon !== undefined) updateData.game_icon = gameData.game_icon?.[0] || null;
    if (gameData.game_thumb !== undefined) updateData.game_thumb = gameData.game_thumb?.[0] || null;
    if (gameData.game_developer !== undefined) updateData.game_developer = gameData.game_developer || null;
    if (gameData.game_publish_year !== undefined) updateData.game_publish_year = gameData.game_publish_year || null;
    if (gameData.game_controls !== undefined) updateData.game_controls = gameData.game_controls;
    if (gameData.game !== undefined) updateData.game = gameData.game || null;
    if (gameData.is_featured !== undefined) updateData.is_featured = gameData.is_featured;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedGame, error } = await (supabase as any)
      .from("games")
      .update(updateData)
      .eq("id", gameId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to update game",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!updatedGame) {
      return NextResponse.json(
        { status: "error", error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: updatedGame,
      message: "Game updated successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { status: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete game by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json(
        { status: "error", error: "Invalid game ID" },
        { status: 400 }
      );
    }

    // Get the current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First, get the game to check if it exists and to clean up any files
    const { data: existingGame, error: fetchError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (fetchError || !existingGame) {
      return NextResponse.json(
        { status: "error", error: "Game not found" },
        { status: 404 }
      );
    }

    // Delete the game from the database
    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to delete game",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // TODO: Clean up associated files from Supabase Storage if needed
    // This would involve deleting game_icon and game_thumb files

    return NextResponse.json({
      status: "success",
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { status: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}