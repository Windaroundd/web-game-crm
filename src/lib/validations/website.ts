import { z } from "zod";

export const websiteFormSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .max(500, "URL must be less than 500 characters"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  desc: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters"),
  is_gsa: z.boolean(),
  is_index: z.boolean(),
  is_featured: z.boolean(),
  is_wp: z.boolean(),
  traffic: z
    .number()
    .min(0, "Traffic must be a positive number")
    .max(1000000000, "Traffic value is too large"),
  domain_rating: z
    .number()
    .min(0, "Domain rating must be between 0 and 100")
    .max(100, "Domain rating must be between 0 and 100"),
  backlinks: z
    .number()
    .min(0, "Backlinks must be a positive number")
    .max(1000000000, "Backlinks value is too large"),
  referring_domains: z
    .number()
    .min(0, "Referring domains must be a positive number")
    .max(1000000000, "Referring domains value is too large"),
});

export const websiteFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]),
  minTraffic: z.string().optional(),
  minDR: z.string().optional(),
  isGSA: z.boolean(),
  isIndex: z.boolean(),
  isWP: z.boolean(),
  isFeatured: z.boolean(),
});

export type WebsiteFormData = z.infer<typeof websiteFormSchema>;
export type WebsiteFilterData = z.infer<typeof websiteFilterSchema>;
