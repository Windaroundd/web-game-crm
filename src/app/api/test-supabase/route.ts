import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test database connection
    const { data: websites, error } = await supabase
      .from("websites")
      .select("id, title, url")
      .limit(5);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Database connection failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data: {
        websitesCount: websites?.length || 0,
        sampleWebsites: websites || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Server-side Supabase connection failed",
      },
      { status: 500 }
    );
  }
}
