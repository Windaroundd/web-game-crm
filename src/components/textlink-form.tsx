"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textlinkSchema, type TextlinkFormData, validateFormData } from "@/lib/utils/validations";
import { useWebsites } from "@/hooks/use-websites";

interface TextlinkFormProps {
  onSubmit: (data: TextlinkFormData) => Promise<void>;
  defaultValues?: Partial<TextlinkFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
}

export function TextlinkForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  submitButtonText = "Save Textlink",
  onCancel,
}: TextlinkFormProps) {
  const { websites } = useWebsites();

  const [formData, setFormData] = useState<TextlinkFormData>({
    link: "",
    anchor_text: "",
    target: "_blank",
    rel: "nofollow",
    title: "",
    website_id: "",
    custom_domain: "",
    show_on_all_pages: true,
    include_paths: "",
    exclude_paths: "",
    ...defaultValues,
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleInputChange = (field: keyof TextlinkFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: [],
      }));
    }
  };

  const handleSelectChange = (field: keyof TextlinkFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: [],
      }));
    }

    // Handle mutual exclusion between website_id and custom_domain
    if (field === "website_id" && value) {
      setFormData((prev) => ({ ...prev, custom_domain: "" }));
    } else if (field === "custom_domain" && value) {
      setFormData((prev) => ({ ...prev, website_id: "" }));
    }
  };

  const handleCheckboxChange = (field: keyof TextlinkFormData) => (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert website_id to number if it's a string
    const dataToValidate = {
      ...formData,
      website_id: formData.website_id ? Number(formData.website_id) : undefined,
    };

    // Validate form data
    const validation = validateFormData(textlinkSchema, dataToValidate);

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="link">Target URL *</Label>
          <Input
            id="link"
            type="url"
            placeholder="https://example.com"
            value={formData.link}
            onChange={handleInputChange("link")}
            disabled={isLoading}
            className={errors.link?.length ? "border-red-500" : ""}
          />
          {errors.link?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="anchor_text">Anchor Text *</Label>
          <Input
            id="anchor_text"
            placeholder="Click here"
            value={formData.anchor_text}
            onChange={handleInputChange("anchor_text")}
            disabled={isLoading}
            className={errors.anchor_text?.length ? "border-red-500" : ""}
          />
          {errors.anchor_text?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target">Target</Label>
          <Select value={formData.target} onValueChange={handleSelectChange("target")}>
            <SelectTrigger>
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_blank">New Window (_blank)</SelectItem>
              <SelectItem value="_self">Same Window (_self)</SelectItem>
              <SelectItem value="_parent">Parent Frame (_parent)</SelectItem>
              <SelectItem value="_top">Top Frame (_top)</SelectItem>
            </SelectContent>
          </Select>
          {errors.target?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rel">Rel Attribute</Label>
          <Input
            id="rel"
            placeholder="nofollow, sponsored, etc."
            value={formData.rel || ""}
            onChange={handleInputChange("rel")}
            disabled={isLoading}
            className={errors.rel?.length ? "border-red-500" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Common values: nofollow, sponsored, ugc
          </p>
          {errors.rel?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Link title for accessibility"
          value={formData.title || ""}
          onChange={handleInputChange("title")}
          disabled={isLoading}
          className={errors.title?.length ? "border-red-500" : ""}
        />
        {errors.title?.map((error, i) => (
          <p key={i} className="text-sm text-red-500">
            {error}
          </p>
        ))}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Placement Target</Label>

        <div className="space-y-2">
          <Label htmlFor="website_id">Managed Website</Label>
          <div className="flex gap-2">
            <Select
              value={formData.website_id?.toString() || undefined}
              onValueChange={(value) => {
                handleSelectChange("website_id")(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a managed website" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id.toString()}>
                    {website.title} ({website.url})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.website_id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectChange("website_id")("")}
              >
                Clear
              </Button>
            )}
          </div>
          {errors.website_id?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">OR</div>

        <div className="space-y-2">
          <Label htmlFor="custom_domain">Custom Domain</Label>
          <Input
            id="custom_domain"
            placeholder="example.com"
            value={formData.custom_domain || ""}
            onChange={handleInputChange("custom_domain")}
            disabled={isLoading || !!formData.website_id}
            className={errors.custom_domain?.length ? "border-red-500" : ""}
          />
          {errors.custom_domain?.map((error, i) => (
            <p key={i} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show_on_all_pages"
            checked={formData.show_on_all_pages}
            onCheckedChange={handleCheckboxChange("show_on_all_pages")}
          />
          <Label htmlFor="show_on_all_pages">Show on all pages</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, this textlink will appear on every page of the website
        </p>

        {!formData.show_on_all_pages && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="include_paths">Include Paths (optional)</Label>
              <Textarea
                id="include_paths"
                placeholder="/blog&#10;/products"
                className="min-h-[80px]"
                value={formData.include_paths || ""}
                onChange={handleInputChange("include_paths")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                One path per line. Only show on these specific paths.
              </p>
              {errors.include_paths?.map((error, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclude_paths">Exclude Paths (optional)</Label>
              <Textarea
                id="exclude_paths"
                placeholder="/admin&#10;/private"
                className="min-h-[80px]"
                value={formData.exclude_paths || ""}
                onChange={handleInputChange("exclude_paths")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                One path per line. Never show on these paths.
              </p>
              {errors.exclude_paths?.map((error, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
}