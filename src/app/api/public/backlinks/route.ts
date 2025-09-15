import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { z } from "zod";

// Query parameters validation schema
const querySchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 100)),
});

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
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

    const { domain, page, limit } = validatedQuery;

    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase();

    // Patterns for ILIKE
    const pattern = `%${normalizedDomain}%`;
    const labels = normalizedDomain.split(".").filter(Boolean);
    const baseDomain =
      labels.length >= 2 ? labels.slice(-2).join(".") : normalizedDomain;
    const basePattern = `%${baseDomain}%`;

    type WebsiteRef = { url: string; title: string | null } | null;
    type TextlinkWithWebsite = {
      id: number;
      link: string;
      anchor_text: string;
      title: string | null;
      rel: string | null;
      target: string | null;
      custom_domain: string | null;
      websites: WebsiteRef;
    };

    // Query 1: matches custom_domain on base table (use base domain)
    const { data: textlinksByCustomDomain, error: errA } = await supabase
      .from("textlinks")
      .select(
        `
        *,
        websites(url, title)
      `
      )
      .ilike("custom_domain", basePattern);

    if (errA) {
      console.error("Database error (custom_domain):", errA);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch backlinks",
          details: errA.message,
        },
        { status: 500 }
      );
    }

    // Query 2: matches websites.url via inner join filter
    const { data: textlinksByWebsiteUrl, error: errB } = await supabase
      .from("textlinks")
      .select(
        `
        *,
        websites!inner(url, title)
      `
      )
      // Use dot notation to filter on the related table column
      .ilike("websites.url", pattern);

    // Query 3: matches link host directly (for absolute links containing the host)
    const { data: textlinksByLink, error: errC } = await supabase
      .from("textlinks")
      .select(
        `
        *,
        websites(url, title)
      `
      )
      .ilike("link", pattern);

    if (errC) {
      console.error("Database error (link):", errC);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch backlinks",
          details: errC.message,
        },
        { status: 500 }
      );
    }

    if (errB) {
      console.error("Database error (websites.url):", errB);
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch backlinks",
          details: errB.message,
        },
        { status: 500 }
      );
    }

    // Merge and de-duplicate by id
    const merged: TextlinkWithWebsite[] = [
      ...((textlinksByCustomDomain as unknown as TextlinkWithWebsite[]) || []),
      ...((textlinksByWebsiteUrl as unknown as TextlinkWithWebsite[]) || []),
      ...((textlinksByLink as unknown as TextlinkWithWebsite[]) || []),
    ];
    const uniqueByIdMap = new Map<number | string, TextlinkWithWebsite>();
    for (const row of merged) {
      const key = row.id ?? `${row.link}|${row.anchor_text}`;
      if (!uniqueByIdMap.has(key)) uniqueByIdMap.set(key, row);
    }
    const unique = Array.from(uniqueByIdMap.values());

    // Apply pagination in memory
    const offset = (page - 1) * limit;
    const paged = unique.slice(offset, offset + limit);

    // Transform data to match the required format
    const backlinks = (paged || []).map(
      (textlink: {
        link: string;
        anchor_text: string;
        title: string | null;
        rel: string | null;
        target: string | null;
      }) => ({
        url: textlink.link,
        textlink: textlink.anchor_text,
        title: textlink.title || textlink.anchor_text,
        rel: textlink.rel || "",
        target: textlink.target || "_blank",
      })
    );

    const totalCount = unique.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        status: "success",
        data: backlinks,
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
          "Cache-Control": "public, max-age=300",
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

// Handle CORS preflight requests
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
