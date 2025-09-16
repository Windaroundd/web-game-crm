"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconStar,
  IconTrendingUp,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddWebsiteDialog } from "@/components/forms/add-website-dialog";
import { EditWebsiteDialog } from "@/components/forms/edit-website-dialog";
import { ViewWebsiteDialog } from "@/components/forms/view-website-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { toast } from "sonner";
import type { Database } from "@/lib/types/database";
import { useDebounce } from "@/hooks/use-debounce";
import {
  websiteFilterSchema,
  type WebsiteFormData,
  type WebsiteFilterData,
} from "@/lib/validations/website";

type Website = Database["public"]["Tables"]["websites"]["Row"];

interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

const fetchCategories = async (): Promise<ApiResponse<string[]>> => {
  const response = await fetch("/api/admin/websites?distinct=category");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

interface WebsiteFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  category?: string;
  search?: string;
  minTraffic?: string;
  minDR?: string;
  isGSA?: string;
  isIndex?: string;
  isWP?: string;
  isFeatured?: string;
}

// API functions
const fetchWebsites = async (
  filters: WebsiteFilters
): Promise<ApiResponse<Website[]>> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`/api/admin/websites?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const createWebsite = async (
  websiteData: WebsiteFormData
): Promise<ApiResponse<Website>> => {
  const response = await fetch("/api/admin/websites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(websiteData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const updateWebsite = async (
  id: number,
  websiteData: Partial<WebsiteFormData>
): Promise<ApiResponse<Website>> => {
  const response = await fetch(`/api/admin/websites/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(websiteData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const deleteWebsite = async (id: number): Promise<ApiResponse<null>> => {
  const response = await fetch(`/api/admin/websites/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // React Hook Form for filters
  const {
    register,
    watch,
    setValue,
    reset: resetFilters,
  } = useForm<WebsiteFilterData>({
    resolver: zodResolver(websiteFilterSchema),
    defaultValues: {
      search: "",
      category: "all",
      sort: "traffic",
      order: "desc",
      minTraffic: "",
      minDR: "",
      isGSA: false,
      isIndex: false,
      isWP: false,
      isFeatured: false,
    },
  });

  const watchedFilters = watch();
  const debouncedSearch = useDebounce(watchedFilters.search || "", 300);

  // Dialog states
  const [editWebsite, setEditWebsite] = useState<Website | null>(null);
  const [viewWebsite, setViewWebsite] = useState<Website | null>(null);
  const [deleteWebsiteId, setDeleteWebsiteId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Load data on component mount and when filters change
  const loadWebsites = useCallback(async () => {
    try {
      setLoading(true);
      const filters: WebsiteFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sort: watchedFilters.sort,
        order: watchedFilters.order,
      };

      if (watchedFilters.category !== "all")
        filters.category = watchedFilters.category;
      if (debouncedSearch) filters.search = debouncedSearch;
      if (watchedFilters.minTraffic)
        filters.minTraffic = watchedFilters.minTraffic;
      if (watchedFilters.minDR) filters.minDR = watchedFilters.minDR;
      if (watchedFilters.isGSA) filters.isGSA = "true";
      if (watchedFilters.isIndex) filters.isIndex = "true";
      if (watchedFilters.isWP) filters.isWP = "true";
      if (watchedFilters.isFeatured) filters.isFeatured = "true";

      const response = await fetchWebsites(filters);
      setWebsites(response.data);

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error loading websites:", error);
      toast.error("Failed to load websites");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    watchedFilters.sort,
    watchedFilters.order,
    watchedFilters.category,
    watchedFilters.minTraffic,
    watchedFilters.minDR,
    watchedFilters.isGSA,
    watchedFilters.isIndex,
    watchedFilters.isWP,
    watchedFilters.isFeatured,
    debouncedSearch,
  ]);

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  // Load categories on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCategories();
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          // Keep current filter if still valid; otherwise reset to "all"
          const currentCategory = watchedFilters.category;
          if (currentCategory && res.data.indexOf(currentCategory) === -1) {
            setValue("category", "all");
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback remains ["all"] if request fails
      }
    })();
  }, []); // Only run on mount

  // Reset filters and reload data
  const handleResetFilters = () => {
    resetFilters();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectAll = () => {
    if (selectedWebsites.length === websites.length) {
      setSelectedWebsites([]);
    } else {
      setSelectedWebsites(websites.map((w) => w.id));
    }
  };

  const handleSelectWebsite = (id: number) => {
    setSelectedWebsites((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  const handleAddWebsite = async (newWebsite: WebsiteFormData) => {
    try {
      await createWebsite(newWebsite);
      toast.success("Website added successfully");
      loadWebsites(); // Reload the list
    } catch (error: unknown) {
      console.error("Error adding website:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add website"
      );
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    try {
      await deleteWebsite(id);
      toast.success("Website deleted successfully");
      loadWebsites(); // Reload the list
      setSelectedWebsites((prev) => prev.filter((wid) => wid !== id));
      setDeleteWebsiteId(null);
    } catch (error: unknown) {
      console.error("Error deleting website:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete website"
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // const handleLimitChange = (newLimit: number) => {
  //   setPagination((prev) => ({ ...prev, page: 1, limit: newLimit }));
  // };

  const handleEditWebsite = async (
    id: number,
    data: Partial<WebsiteFormData>
  ) => {
    try {
      await updateWebsite(id, data);
      toast.success("Website updated successfully");
      loadWebsites(); // Reload the list
      setIsEditDialogOpen(false);
      setEditWebsite(null);
    } catch (error: unknown) {
      console.error("Error updating website:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update website"
      );
    }
  };

  const handleViewWebsite = (website: Website) => {
    setViewWebsite(website);
    setIsViewDialogOpen(true);
  };

  const handleOpenEditDialog = (website: Website) => {
    setEditWebsite(website);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
        </div>
        <AddWebsiteDialog onAddWebsite={handleAddWebsite} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Management</CardTitle>
          <CardDescription>
            Filter, sort, and manage your websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search websites..."
                    {...register("search")}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={watchedFilters.category}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger className="w-[180px]">
                  <IconFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all"
                        ? "All Categories"
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={watchedFilters.sort}
                onValueChange={(value) => setValue("sort", value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="domain_rating">Domain Rating</SelectItem>
                  <SelectItem value="backlinks">Backlinks</SelectItem>
                  <SelectItem value="referring_domains">
                    Referring Domains
                  </SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue(
                    "order",
                    watchedFilters.order === "desc" ? "asc" : "desc"
                  )
                }
              >
                {watchedFilters.order === "desc" ? "↓" : "↑"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <IconFilter className="h-4 w-4 mr-1" />
                Advanced
                {showAdvancedFilters ? (
                  <IconChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <IconChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Advanced Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    <IconX className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                {/* Numeric Filters Section */}
                {/* <div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Traffic
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minTraffic}
                          onChange={(e) => setMinTraffic(e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxTraffic}
                          onChange={(e) => setMaxTraffic(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Domain Rating (0-100)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minDR}
                          onChange={(e) => setMinDR(e.target.value)}
                          min="0"
                          max="100"
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxDR}
                          onChange={(e) => setMaxDR(e.target.value)}
                          min="0"
                          max="100"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Backlinks
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minBacklinks}
                          onChange={(e) => setMinBacklinks(e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxBacklinks}
                          onChange={(e) => setMaxBacklinks(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Referring Domains
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minReferringDomains}
                          onChange={(e) =>
                            setMinReferringDomains(e.target.value)
                          }
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxReferringDomains}
                          onChange={(e) =>
                            setMaxReferringDomains(e.target.value)
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* Boolean Filters Section */}
                <div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isGSA" {...register("isGSA")} />
                      <label htmlFor="isGSA" className="text-sm font-medium">
                        GSA
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="isIndex" {...register("isIndex")} />
                      <label htmlFor="isIndex" className="text-sm font-medium">
                        Indexed
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="isFeatured" {...register("isFeatured")} />
                      <label
                        htmlFor="isFeatured"
                        className="text-sm font-medium"
                      >
                        Featured
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="isWP" {...register("isWP")} />
                      <label htmlFor="isWP" className="text-sm font-medium">
                        WordPress site
                      </label>
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                {/* <div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Items per Page
                      </label>
                      <Select
                        value={pagination.limit.toString()}
                        onValueChange={(value) =>
                          handleLimitChange(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="25">25 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm text-muted-foreground">
                        <strong>{pagination.total}</strong> websites total
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedWebsites.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedWebsites.length} website
                {selectedWebsites.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="destructive" size="sm">
                  <IconTrash className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedWebsites.length === websites.length &&
                        websites.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Traffic</TableHead>
                  <TableHead>DR</TableHead>
                  <TableHead>Backlinks</TableHead>
                  <TableHead>Ref. Domains</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading websites...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : websites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No websites found
                    </TableCell>
                  </TableRow>
                ) : (
                  websites.map((website) => (
                    <TableRow key={website.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedWebsites.includes(website.id)}
                          onCheckedChange={() =>
                            handleSelectWebsite(website.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{website.title}</div>
                            {website.is_featured && (
                              <IconStar className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {website.url}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {website.desc}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{website.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IconTrendingUp className="h-3 w-3 text-muted-foreground" />
                          {website.traffic.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            website.domain_rating >= 70
                              ? "default"
                              : "secondary"
                          }
                        >
                          {website.domain_rating}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {website.backlinks.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {website.referring_domains.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {website.is_index && (
                            <Badge variant="outline" className="text-xs">
                              Indexed
                            </Badge>
                          )}
                          {website.is_gsa && (
                            <Badge variant="secondary" className="text-xs">
                              GSA
                            </Badge>
                          )}
                          {website.is_wp && (
                            <Badge variant="outline" className="text-xs">
                              WordPress
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>⋯
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewWebsite(website)}
                            >
                              <IconEye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(website)}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteWebsiteId(website.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} websites
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8"
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}

                  {pagination.totalPages > 5 &&
                    pagination.page < pagination.totalPages - 2 && (
                      <>
                        <span className="text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange(pagination.totalPages)
                          }
                          className="w-8"
                          disabled={loading}
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditWebsiteDialog
        website={editWebsite}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEditWebsite={handleEditWebsite}
      />

      <ViewWebsiteDialog
        website={viewWebsite}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteWebsiteId !== null}
        onOpenChange={(open) => !open && setDeleteWebsiteId(null)}
        onConfirm={() =>
          deleteWebsiteId && handleDeleteWebsite(deleteWebsiteId)
        }
        title="Delete Website"
        description="Are you sure you want to delete this website? This action cannot be undone."
        isLoading={loading}
      />
    </div>
  );
}
