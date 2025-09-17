"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconEye,
  IconDownload,
  IconCode,
  IconWorld,
  IconFilter,
  IconSearch,
  IconExternalLink,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLink,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTextlinks, type TextlinkWithWebsite } from "@/hooks/use-textlinks";
import { TextlinkForm } from "@/components/textlink-form";
import { TextlinkDetails } from "@/components/textlink-details";
import { type TextlinkFormData } from "@/lib/utils/validations";
import { toast } from "sonner";

export default function TextlinksPage() {
  const [selectedTextlinks, setSelectedTextlinks] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewDomain, setPreviewDomain] = useState("");
  const [selectedTextlink, setSelectedTextlink] = useState<TextlinkWithWebsite | null>(null);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showOnAllPagesFilter, setShowOnAllPagesFilter] = useState(false);
  const [targetFilter, setTargetFilter] = useState("all");
  const [relFilter, setRelFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Loading states
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Don't reset during debounce
    setCurrentPage(1);
  }, [debouncedSearchTerm, searchTerm]);

  // API hooks
  const {
    textlinks,
    pagination,
    isLoading,
    error,
    refetch,
    createTextlink,
    updateTextlink,
    deleteTextlink,
  } = useTextlinks({
    search: debouncedSearchTerm,
    website_id:
      websiteFilter !== "all" && websiteFilter !== "custom"
        ? parseInt(websiteFilter)
        : undefined,
    custom_domain: websiteFilter === "custom" ? "%" : undefined,
    show_on_all_pages: showOnAllPagesFilter ? true : undefined,
    sort: sortBy,
    order: sortOrder,
    limit: itemsPerPage,
    page: currentPage,
  });

  // Get unique websites that have textlinks
  const websitesWithTextlinks = Array.from(
    new Map(
      textlinks
        .filter((t) => t.websites)
        .map((t) => [t.websites!.id, t.websites!])
    ).values()
  );

  // Get unique custom domains
  const customDomains = Array.from(
    new Set(
      textlinks.filter((t) => t.custom_domain).map((t) => t.custom_domain!)
    )
  );

  // Apply client-side filters that aren't handled by the API
  const filteredTextlinks = textlinks.filter((textlink) => {
    // Advanced filters that need client-side filtering
    if (
      targetFilter &&
      targetFilter !== "all" &&
      textlink.target !== targetFilter
    )
      return false;
    if (relFilter && relFilter !== "all" && !textlink.rel.includes(relFilter))
      return false;

    return true;
  });

  // Use pagination from API
  const totalPages = pagination.totalPages;
  const startIndex = (pagination.page - 1) * pagination.limit;
  const paginatedTextlinks = filteredTextlinks;

  const resetFilters = () => {
    setSearchTerm("");
    setWebsiteFilter("all");
    setShowOnAllPagesFilter(false);
    setTargetFilter("all");
    setRelFilter("all");
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedTextlinks.length === paginatedTextlinks.length) {
      setSelectedTextlinks([]);
    } else {
      setSelectedTextlinks(paginatedTextlinks.map((t) => t.id));
    }
  };

  const handleSelectTextlink = (id: number) => {
    setSelectedTextlinks((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleAddTextlink = async (data: TextlinkFormData) => {
    setIsSubmittingForm(true);
    try {
      const result = await createTextlink({
        link: data.link,
        anchor_text: data.anchor_text,
        target: data.target,
        rel: data.rel || undefined,
        title: data.title || undefined,
        website_id: data.website_id || undefined,
        custom_domain: data.custom_domain || undefined,
        show_on_all_pages: data.show_on_all_pages,
        include_paths: data.include_paths || undefined,
        exclude_paths: data.exclude_paths || undefined,
      });

      if (result.status === "success") {
        toast.success("Textlink created successfully");
        setIsAddDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to create textlink");
      }
    } catch {
      toast.error("An error occurred while creating the textlink");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleEditTextlink = async (data: TextlinkFormData) => {
    if (!selectedTextlink) return;

    setIsSubmittingForm(true);
    try {
      const result = await updateTextlink(selectedTextlink.id, {
        link: data.link,
        anchor_text: data.anchor_text,
        target: data.target,
        rel: data.rel || undefined,
        title: data.title || undefined,
        website_id: data.website_id || undefined,
        custom_domain: data.custom_domain || undefined,
        show_on_all_pages: data.show_on_all_pages,
        include_paths: data.include_paths || undefined,
        exclude_paths: data.exclude_paths || undefined,
      });

      if (result.status === "success") {
        toast.success("Textlink updated successfully");
        setIsEditDialogOpen(false);
        setSelectedTextlink(null);
      } else {
        toast.error(result.error || "Failed to update textlink");
      }
    } catch {
      toast.error("An error occurred while updating the textlink");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleViewDetails = (textlink: TextlinkWithWebsite) => {
    setSelectedTextlink(textlink);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = (textlink: TextlinkWithWebsite) => {
    setSelectedTextlink(textlink);
    setIsEditDialogOpen(true);
  };

  const generatePreviewJson = () => {
    const domainTextlinks = textlinks.filter(
      (t) =>
        (t.websites && t.websites.url.includes(previewDomain)) ||
        t.custom_domain === previewDomain
    );

    return domainTextlinks.map((t) => ({
      url: t.link,
      textlink: t.anchor_text,
      title: t.title,
      rel: t.rel,
      target: t.target,
    }));
  };

  const handleDeleteTextlink = async (id: number) => {
    try {
      const result = await deleteTextlink(id);
      if (result.status === "success") {
        toast.success("Textlink deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete textlink");
      }
    } catch {
      toast.error("An error occurred while deleting the textlink");
    }
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Textlink Management</h1>
          {/* <p className="text-muted-foreground">
            Manage footer textlinks for websites and custom domains
          </p> */}
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isPreviewDialogOpen}
            onOpenChange={setIsPreviewDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <IconCode className="h-4 w-4 mr-2" />
                Preview JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Preview Textlinks JSON</DialogTitle>
                <DialogDescription>
                  Preview the JSON output for a specific domain
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain to Preview</Label>
                  <Input
                    id="domain"
                    value={previewDomain}
                    onChange={(e) => setPreviewDomain(e.target.value)}
                    placeholder="example.com"
                  />
                </div>
                {previewDomain && (
                  <div className="space-y-2">
                    <Label>JSON Output</Label>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {JSON.stringify(
                        {
                          status: "success",
                          data: generatePreviewJson(),
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Textlink
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Textlink</DialogTitle>
                <DialogDescription>
                  Create a new textlink for a website or custom domain
                </DialogDescription>
              </DialogHeader>
              <TextlinkForm
                onSubmit={handleAddTextlink}
                isLoading={isSubmittingForm}
                submitButtonText="Add Textlink"
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Textlink</DialogTitle>
                <DialogDescription>
                  Update the textlink details
                </DialogDescription>
              </DialogHeader>
              {selectedTextlink && (
                <TextlinkForm
                  onSubmit={handleEditTextlink}
                  defaultValues={{
                    link: selectedTextlink.link,
                    anchor_text: selectedTextlink.anchor_text,
                    target: selectedTextlink.target as "_blank" | "_self" | "_parent" | "_top",
                    rel: selectedTextlink.rel || "",
                    title: selectedTextlink.title || "",
                    website_id: selectedTextlink.website_id || "",
                    custom_domain: selectedTextlink.custom_domain || "",
                    show_on_all_pages: selectedTextlink.show_on_all_pages,
                    include_paths: selectedTextlink.include_paths || "",
                    exclude_paths: selectedTextlink.exclude_paths || "",
                  }}
                  isLoading={isSubmittingForm}
                  submitButtonText="Update Textlink"
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    setSelectedTextlink(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Textlink Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this textlink
                </DialogDescription>
              </DialogHeader>
              {selectedTextlink && (
                <div className="space-y-4">
                  <TextlinkDetails textlink={selectedTextlink} />
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setSelectedTextlink(null);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <IconEdit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Textlinks
            </CardTitle>
            <IconLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTextlinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Sites</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                new Set(
                  textlinks.filter((t) => t.website_id).map((t) => t.website_id)
                ).size
              }
            </div>
            <p className="text-xs text-muted-foreground">Active websites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custom Domains
            </CardTitle>
            <IconExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {textlinks.filter((t) => t.custom_domain).length}
            </div>
            <p className="text-xs text-muted-foreground">External domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Links</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {textlinks.filter((t) => t.show_on_all_pages).length}
            </div>
            <p className="text-xs text-muted-foreground">Show on all pages</p>
          </CardContent>
        </Card>
      </div> */}

      <Card>
        <CardHeader>
          <CardTitle>Textlink Management</CardTitle>
          <CardDescription>
            Manage textlinks for footer placement across websites
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
                    placeholder="Search textlinks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
                <SelectTrigger className="w-[200px]">
                  <IconFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {customDomains.length > 0 && (
                    <SelectItem value="custom">
                      Custom Domains ({customDomains.length})
                    </SelectItem>
                  )}
                  {websitesWithTextlinks.map((website) => (
                    <SelectItem key={website.id} value={website.id.toString()}>
                      {website.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anchor_text">Anchor Text</SelectItem>
                  <SelectItem value="link">Target Link</SelectItem>
                  <SelectItem value="target">Target Type</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
              >
                {sortOrder === "desc" ? "↓" : "↑"}
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
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <IconX className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                {/* Filter Controls */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Target Type
                    </label>
                    <Select
                      value={targetFilter}
                      onValueChange={setTargetFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any target</SelectItem>
                        <SelectItem value="_blank">
                          New Window (_blank)
                        </SelectItem>
                        <SelectItem value="_self">
                          Same Window (_self)
                        </SelectItem>
                        <SelectItem value="_parent">
                          Parent Frame (_parent)
                        </SelectItem>
                        <SelectItem value="_top">Top Frame (_top)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Rel Attribute
                    </label>
                    <Select value={relFilter} onValueChange={setRelFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any rel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any rel</SelectItem>
                        <SelectItem value="nofollow">nofollow</SelectItem>
                        <SelectItem value="sponsored">sponsored</SelectItem>
                        <SelectItem value="ugc">ugc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Items per Page
                    </label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) =>
                        setItemsPerPage(parseInt(value))
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
                      <strong>{filteredTextlinks.length}</strong> of{" "}
                      {textlinks.length} textlinks
                    </div>
                  </div>
                </div>

                {/* Boolean Filters Section */}
                <div>
                  <h5 className="text-sm font-medium mb-3 text-muted-foreground">
                    Display Options
                  </h5>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showOnAllPages"
                        checked={showOnAllPagesFilter}
                        onCheckedChange={(checked) =>
                          setShowOnAllPagesFilter(!!checked)
                        }
                      />
                      <label
                        htmlFor="showOnAllPages"
                        className="text-sm font-medium"
                      >
                        Show on all pages only
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedTextlinks.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTextlinks.length} textlink
                {selectedTextlinks.length > 1 ? "s" : ""} selected
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
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading textlinks...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-2">Error: {error}</p>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            {!isLoading && !error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedTextlinks.length ===
                            paginatedTextlinks.length &&
                          paginatedTextlinks.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Link & Text</TableHead>
                    <TableHead>Target Site</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTextlinks.map((textlink) => (
                    <TableRow key={textlink.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTextlinks.includes(textlink.id)}
                          onCheckedChange={() =>
                            handleSelectTextlink(textlink.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {textlink.anchor_text}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <IconExternalLink className="h-3 w-3" />
                            <a
                              href={textlink.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline truncate max-w-[200px]"
                            >
                              {textlink.link}
                            </a>
                          </div>
                          {textlink.title && (
                            <div className="text-xs text-muted-foreground">
                              Title: {textlink.title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {textlink.websites ? (
                            <>
                              <IconWorld className="h-4 w-4 text-blue-500" />
                              <Badge variant="outline">
                                {textlink.websites.title}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <IconExternalLink className="h-4 w-4 text-green-500" />
                              <Badge variant="secondary">
                                {textlink.custom_domain}
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {textlink.show_on_all_pages ? (
                            <Badge variant="default" className="text-xs">
                              All Pages
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Specific Pages
                            </Badge>
                          )}
                          {textlink.include_paths && (
                            <div className="text-xs text-muted-foreground">
                              Include:{" "}
                              {textlink.include_paths.split("\n").length} paths
                            </div>
                          )}
                          {textlink.exclude_paths && (
                            <div className="text-xs text-muted-foreground">
                              Exclude:{" "}
                              {textlink.exclude_paths.split("\n").length} paths
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {textlink.target}
                          </Badge>
                          {textlink.rel && (
                            <div className="text-xs text-muted-foreground">
                              rel=&quot;{textlink.rel}&quot;
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(textlink.updated_at).toLocaleDateString()}
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
                              onClick={() => handleViewDetails(textlink)}
                            >
                              <IconEye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(textlink)}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteTextlink(textlink.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTextlinks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <IconLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No textlinks found</p>
                          <p className="text-sm">
                            Try adjusting your filters or create a new textlink
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(startIndex + pagination.limit, pagination.total)} of{" "}
              {pagination.total} textlinks
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev || isLoading}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8"
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8"
                      disabled={isLoading}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
