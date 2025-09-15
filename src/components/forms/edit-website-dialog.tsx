"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { IconEdit } from "@tabler/icons-react";
import type { Database } from "@/lib/types/database";
import {
  websiteFormSchema,
  type WebsiteFormData,
} from "@/lib/validations/website";

type Website = Database["public"]["Tables"]["websites"]["Row"];

const categories = [
  "blog",
  "tech",
  "gaming",
  "news",
  "entertainment",
  "sports",
  "health",
];

interface EditWebsiteDialogProps {
  website: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditWebsite: (id: number, data: Partial<WebsiteFormData>) => void;
}

export function EditWebsiteDialog({
  website,
  open,
  onOpenChange,
  onEditWebsite,
}: EditWebsiteDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteFormSchema),
    defaultValues: {
      url: "",
      title: "",
      desc: "",
      category: "",
      is_gsa: false,
      is_index: true,
      is_featured: false,
      traffic: 0,
      domain_rating: 0,
      backlinks: 0,
      referring_domains: 0,
      is_wp: false,
    },
  });

  // Populate form when website changes
  useEffect(() => {
    if (website) {
      reset({
        url: website.url,
        title: website.title,
        desc: website.desc || "",
        category: website.category || "",
        is_gsa: website.is_gsa,
        is_index: website.is_index,
        is_featured: website.is_featured,
        traffic: website.traffic,
        domain_rating: website.domain_rating,
        backlinks: website.backlinks,
        referring_domains: website.referring_domains,
        is_wp: website.is_wp,
      });
    }
  }, [website, reset]);

  const onSubmit = async (data: WebsiteFormData) => {
    if (!website) return;

    try {
      await onEditWebsite(website.id, data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating website:", error);
    }
  };

  if (!website) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>
            Update the website information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Website title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Brief description of the website"
              {...register("desc")}
            />
            {errors.desc && (
              <p className="text-sm text-red-600">{errors.desc.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Combobox
              options={categories}
              value={watch("category")}
              onValueChange={(value) => setValue("category", value)}
              placeholder="Select or create category"
              allowCustom={true}
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="traffic">Traffic</Label>
              <Input
                id="traffic"
                type="number"
                min="0"
                placeholder="0"
                {...register("traffic", { valueAsNumber: true })}
              />
              {errors.traffic && (
                <p className="text-sm text-red-600">{errors.traffic.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain_rating">Domain Rating</Label>
              <Input
                id="domain_rating"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                {...register("domain_rating", { valueAsNumber: true })}
              />
              {errors.domain_rating && (
                <p className="text-sm text-red-600">
                  {errors.domain_rating.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="backlinks">Backlinks</Label>
              <Input
                id="backlinks"
                type="number"
                min="0"
                placeholder="0"
                {...register("backlinks", { valueAsNumber: true })}
              />
              {errors.backlinks && (
                <p className="text-sm text-red-600">
                  {errors.backlinks.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referring_domains">Referring Domains</Label>
              <Input
                id="referring_domains"
                type="number"
                min="0"
                placeholder="0"
                {...register("referring_domains", { valueAsNumber: true })}
              />
              {errors.referring_domains && (
                <p className="text-sm text-red-600">
                  {errors.referring_domains.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Website Properties</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="is_index" {...register("is_index")} />
                <Label htmlFor="is_index" className="text-sm font-normal">
                  Indexed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_gsa" {...register("is_gsa")} />
                <Label htmlFor="is_gsa" className="text-sm font-normal">
                  GSA
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_featured" {...register("is_featured")} />
                <Label htmlFor="is_featured" className="text-sm font-normal">
                  Featured
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_wp" {...register("is_wp")} />
                <Label htmlFor="is_wp" className="text-sm font-normal">
                  WordPress
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
