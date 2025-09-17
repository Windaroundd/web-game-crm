import { z } from "zod";

// Cloudflare Account validation schemas
export const cloudflareAccountSchema = z.object({
  account_name: z.string().min(1, "Account name is required"),
  email: z.string().email("Valid email is required"),
  api_token: z.string().min(1, "API token is required"),
  account_id: z.string().min(1, "Account ID is required"),
});

export const cloudflareAccountUpdateSchema = z.object({
  account_name: z.string().min(1, "Account name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  api_token: z.string().min(1, "API token is required").optional(),
  account_id: z.string().min(1, "Account ID is required").optional(),
});

// Cloudflare Purge validation schemas
export const cloudflarePurgeSchema = z.object({
  cloudflare_account_id: z.number().int().positive("Account ID is required"),
  zone_id: z.string().min(1, "Zone ID is required"),
  mode: z.enum(["url", "hostname", "tag", "prefix"]),
  payload: z.array(z.string().min(1)).min(1, "At least one item to purge is required"),
  exclusions: z.array(z.string()).optional(),
});

// Type exports
export type CloudflareAccountFormData = z.infer<typeof cloudflareAccountSchema>;
export type CloudflareAccountUpdateData = z.infer<typeof cloudflareAccountUpdateSchema>;
export type CloudflarePurgeFormData = z.infer<typeof cloudflarePurgeSchema>;

// Validation helper function
export function validateFormData<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validatedData = schema.parse(data);
    return { success: true as const, data: validatedData, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return { success: false as const, data: null, errors };
    }
    return { success: false as const, data: null, errors: { general: ["Validation failed"] } };
  }
}