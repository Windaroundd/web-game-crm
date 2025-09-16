import { z } from "zod";

export const textlinkFormSchema = z.object({
  link: z
    .string()
    .min(1, "Link is required")
    .url("Please enter a valid URL")
    .max(500, "Link must be less than 500 characters"),
  anchor_text: z
    .string()
    .min(1, "Anchor text is required")
    .max(200, "Anchor text must be less than 200 characters"),
  target: z
    .string()
    .max(20, "Target must be less than 20 characters")
    .default("_blank"),
  rel: z
    .string()
    .max(50, "Rel attribute must be less than 50 characters")
    .default(""),
  title: z
    .string()
    .max(200, "Title must be less than 200 characters")
    .optional(),
  website_id: z
    .number()
    .int()
    .positive("Please select a valid website")
    .optional(),
  custom_domain: z
    .string()
    .max(100, "Custom domain must be less than 100 characters")
    .optional(),
  show_on_all_pages: z.boolean().default(true),
  include_paths: z
    .string()
    .max(2000, "Include paths must be less than 2000 characters")
    .optional(),
  exclude_paths: z
    .string()
    .max(2000, "Exclude paths must be less than 2000 characters")
    .optional(),
})
.refine(
  (data) => data.website_id || data.custom_domain,
  {
    message: "Either select a website or provide a custom domain",
    path: ["website_id"],
  }
);

export const textlinkFilterSchema = z.object({
  search: z.string().optional(),
  website_id: z.string().optional(),
  custom_domain: z.string().optional(),
  show_on_all_pages: z.boolean().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 25)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(parseInt(val), 1) : 1)),
});

export type TextlinkFormData = z.infer<typeof textlinkFormSchema>;
export type TextlinkFilterData = z.infer<typeof textlinkFilterSchema>;