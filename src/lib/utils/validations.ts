import { z } from "zod";

// Website validation schema
export const websiteSchema = z.object({
  url: z.string().url("Must be a valid URL").min(1, "URL is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  desc: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  isGSA: z.boolean().default(false),
  isIndex: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  traffic: z.coerce.number().min(0, "Traffic must be positive").default(0),
  domainRating: z.coerce
    .number()
    .min(0, "Domain rating must be between 0-100")
    .max(100)
    .default(0),
  backlinks: z.coerce.number().min(0, "Backlinks must be positive").default(0),
  referringDomains: z.coerce
    .number()
    .min(0, "Referring domains must be positive")
    .default(0),
  isWP: z.boolean().default(false),
});

export type WebsiteFormData = z.infer<typeof websiteSchema>;

// Game validation schema
export const gameSchema = z.object({
  url: z.string().min(1, "URL slug is required").max(255, "URL slug too long"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  desc: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  game_url: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url("Must be a valid URL")
  ),
  game_icon: z.array(z.string()).optional(),
  game_thumb: z.array(z.string()).optional(),
  game_developer: z.string().optional(),
  game_publish_year: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(1980, "Year must be after 1980").max(new Date().getFullYear(), "Year cannot be in the future").optional()),
  game_controls: z
    .object({
      keyboard: z.boolean().default(false),
      mouse: z.boolean().default(false),
      touch: z.boolean().default(false),
    })
    .default({ keyboard: false, mouse: false, touch: false }),
  game: z.string().optional(),
  is_featured: z.boolean().default(false),
});

export type GameFormData = z.infer<typeof gameSchema>;

// Textlink validation schema
export const textlinkSchema = z
  .object({
    link: z.string().url("Must be a valid URL").min(1, "Link is required"),
    anchorText: z
      .string()
      .min(1, "Anchor text is required")
      .max(255, "Anchor text too long"),
    target: z.enum(["_blank", "_self", "_parent", "_top"]).default("_blank"),
    rel: z.string().optional(),
    title: z.string().optional(),
    websiteId: z.coerce.number().optional().or(z.literal("")),
    customDomain: z.string().optional(),
    showOnAllPages: z.boolean().default(true),
    includePaths: z.string().optional(),
    excludePaths: z.string().optional(),
  })
  .refine((data) => data.websiteId || data.customDomain, {
    message: "Either website or custom domain must be specified",
    path: ["customDomain"],
  });

export type TextlinkFormData = z.infer<typeof textlinkSchema>;

// Cloudflare account validation schema
export const cloudflareAccountSchema = z.object({
  accountName: z
    .string()
    .min(1, "Account name is required")
    .max(255, "Account name too long"),
  email: z.string().email("Must be a valid email").min(1, "Email is required"),
  apiToken: z.string().min(1, "API token is required"),
  accountId: z.string().min(1, "Account ID is required"),
});

export type CloudflareAccountFormData = z.infer<typeof cloudflareAccountSchema>;

// Cloudflare purge validation schema
export const cloudflarePurgeSchema = z
  .object({
    accountId: z.coerce.number().min(1, "Account is required"),
    mode: z.enum(["url", "hostname", "tag", "prefix"]),
    payload: z.array(z.string().min(1)).min(1, "At least one item is required"),
    exclusions: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "url") {
        return data.payload.every(
          (url) => z.string().url().safeParse(url).success
        );
      }
      return true;
    },
    {
      message: "All URLs must be valid when using URL mode",
      path: ["payload"],
    }
  );

export type CloudflarePurgeFormData = z.infer<typeof cloudflarePurgeSchema>;

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email("Must be a valid email").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Must be a valid email")
      .min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
    name: z.string().min(1, "Name is required").max(255, "Name too long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Helper function to parse form data with Zod
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((error) => {
    const path = error.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return { success: false, errors };
}
