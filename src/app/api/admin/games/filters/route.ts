import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";

export async function GET() {
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

    // Get distinct categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("games")
      .select("category")
      .not("category", "is", null)
      .not("category", "eq", "");

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    }

    // Get distinct developers
    const { data: developersData, error: developersError } = await supabase
      .from("games")
      .select("game_developer")
      .not("game_developer", "is", null)
      .not("game_developer", "eq", "");

    if (developersError) {
      console.error("Error fetching developers:", developersError);
    }

    // Get distinct years
    const { data: yearsData, error: yearsError } = await supabase
      .from("games")
      .select("game_publish_year")
      .not("game_publish_year", "is", null)
      .order("game_publish_year", { ascending: false });

    if (yearsError) {
      console.error("Error fetching years:", yearsError);
    }

    // Process the data to get unique values
    const categories = Array.from(
      new Set(
        (categoriesData || [])
          .map((item: { category: string }) => item.category)
          .filter(Boolean)
      )
    ).sort();

    const developers = Array.from(
      new Set(
        (developersData || [])
          .map((item: { game_developer: string }) => item.game_developer)
          .filter(Boolean)
      )
    ).sort();

    const years = Array.from(
      new Set(
        (yearsData || [])
          .map((item: { game_publish_year: number }) => item.game_publish_year)
          .filter(Boolean)
      )
    ).sort((a: number, b: number) => b - a); // Sort years descending

    return NextResponse.json({
      status: "success",
      data: {
        categories,
        developers,
        years,
      },
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