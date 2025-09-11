"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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

// Mock data
const mockWebsites = [
  { id: 1, url: "https://example.com", title: "Example Website" },
  { id: 2, url: "https://techblog.dev", title: "Tech Blog" },
  { id: 3, url: "https://gamereviews.net", title: "Game Reviews" },
];

// Interface matching req.md textlinks table exactly
interface Textlink {
  id: number;
  link: string; // ✅ (string, not null)
  anchor_text: string; // ✅ (string, not null) - req.md uses snake_case
  target: string; // ✅ (string, default '_blank')
  rel: string; // ✅ (string, default '')
  title: string | null; // ✅ (string, optional)
  website_id: number | null; // ✅ (FK → websites.id, nullable)
  custom_domain: string | null; // ✅ (string, optional)
  show_on_all_pages: boolean; // ✅ (boolean, default true)
  include_paths: string | null; // ✅ (string[] / text, optional)
  exclude_paths: string | null; // ✅ (string[] / text, optional)
  created_at: string; // ✅ (timestamptz)
  updated_at: string; // ✅ (timestamptz)
  websiteName?: string | null; // For display purposes
}

const mockTextlinks: Textlink[] = [
  {
    id: 1,
    link: "https://targetsite.com/page1",
    anchor_text: "Best Gaming Reviews",
    target: "_blank",
    rel: "nofollow",
    title: "Gaming Reviews Site",
    website_id: 3,
    websiteName: "Game Reviews",
    custom_domain: null,
    show_on_all_pages: true,
    include_paths: null,
    exclude_paths: null,
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
  {
    id: 2,
    link: "https://techtools.com",
    anchor_text: "Developer Tools",
    target: "_blank",
    rel: "",
    title: "Best Developer Tools",
    website_id: 2,
    websiteName: "Tech Blog",
    custom_domain: null,
    show_on_all_pages: false,
    include_paths: "/tools\n/resources",
    exclude_paths: "/admin",
    created_at: "2024-02-20",
    updated_at: "2024-02-20",
  },
  {
    id: 3,
    link: "https://customdomain.example.com",
    anchor_text: "Custom Domain Link",
    target: "_self",
    rel: "nofollow sponsored",
    title: "Custom Domain Example",
    website_id: null,
    websiteName: "Tech Blog",
    custom_domain: "custom.example.com",
    show_on_all_pages: true,
    include_paths: null,
    exclude_paths: null,
    created_at: "2024-03-01",
    updated_at: "2024-03-01",
  },
];

export default function TextlinksPage() {
  const [textlinks, setTextlinks] = useState(mockTextlinks);
  const [selectedTextlinks, setSelectedTextlinks] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewDomain, setPreviewDomain] = useState("");

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showOnAllPagesFilter, setShowOnAllPagesFilter] = useState(false);
  const [targetFilter, setTargetFilter] = useState("all");
  const [relFilter, setRelFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state - using exact req.md field names
  const [formData, setFormData] = useState({
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
  });

  const filteredTextlinks = textlinks
    .filter((textlink) => {
      // Website filter
      if (websiteFilter !== "all") {
        if (websiteFilter === "custom") {
          if (!textlink.custom_domain) return false;
        } else {
          if (textlink.website_id !== parseInt(websiteFilter)) return false;
        }
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          textlink.anchor_text.toLowerCase().includes(searchLower) ||
          textlink.link.toLowerCase().includes(searchLower) ||
          (textlink.websiteName &&
            textlink.websiteName.toLowerCase().includes(searchLower)) ||
          (textlink.custom_domain &&
            textlink.custom_domain.toLowerCase().includes(searchLower)) ||
          (textlink.title && textlink.title.toLowerCase().includes(searchLower))
        );
      }

      // Advanced filters
      if (showOnAllPagesFilter && !textlink.show_on_all_pages) return false;
      if (
        targetFilter &&
        targetFilter !== "all" &&
        textlink.target !== targetFilter
      )
        return false;
      if (relFilter && relFilter !== "all" && !textlink.rel.includes(relFilter))
        return false;

      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      return sortOrder === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTextlinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTextlinks = filteredTextlinks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  const resetForm = () => {
    setFormData({
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
    });
  };

  const handleAddTextlink = () => {
    const newTextlink: Textlink = {
      id: Math.max(...textlinks.map((t) => t.id)) + 1,
      link: formData.link,
      anchor_text: formData.anchor_text,
      target: formData.target,
      rel: formData.rel,
      title: formData.title || null,
      website_id: formData.website_id ? parseInt(formData.website_id) : null,
      custom_domain: formData.custom_domain || null,
      show_on_all_pages: formData.show_on_all_pages,
      include_paths: formData.include_paths || null,
      exclude_paths: formData.exclude_paths || null,
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
      websiteName: formData.website_id
        ? mockWebsites.find((w) => w.id === parseInt(formData.website_id))
            ?.title
        : undefined,
    };
    setTextlinks([...textlinks, newTextlink]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const generatePreviewJson = () => {
    const domainTextlinks = textlinks.filter(
      (t) =>
        (t.websiteName &&
          mockWebsites
            .find((w) => w.id === t.website_id)
            ?.url.includes(previewDomain)) ||
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Textlink</DialogTitle>
                <DialogDescription>
                  Create a new textlink for a website or custom domain
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="link">Target URL *</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          link: e.target.value,
                        }))
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anchor_text">Anchor Text *</Label>
                    <Input
                      id="anchor_text"
                      value={formData.anchor_text}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          anchor_text: e.target.value,
                        }))
                      }
                      placeholder="Click here"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target</Label>
                    <Select
                      value={formData.target}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, target: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="rel">Rel Attribute</Label>
                    <Input
                      id="rel"
                      value={formData.rel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rel: e.target.value,
                        }))
                      }
                      placeholder="nofollow, sponsored, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Link title for accessibility"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Placement Target</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="website_id">Managed Website</Label>
                      <Select
                        value={formData.website_id}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            website_id: value,
                            custom_domain: "",
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a managed website" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockWebsites.map((website) => (
                            <SelectItem
                              key={website.id}
                              value={website.id.toString()}
                            >
                              {website.title} ({website.url})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      OR
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom_domain">Custom Domain</Label>
                      <Input
                        id="custom_domain"
                        value={formData.custom_domain}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            custom_domain: e.target.value,
                            website_id: "",
                          }))
                        }
                        placeholder="example.com"
                        disabled={!!formData.website_id}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show_on_all_pages"
                      checked={formData.show_on_all_pages}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          show_on_all_pages: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="show_on_all_pages">Show on all pages</Label>
                  </div>

                  {!formData.show_on_all_pages && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="include_paths">
                          Include Paths (optional)
                        </Label>
                        <Textarea
                          id="include_paths"
                          value={formData.include_paths}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              include_paths: e.target.value,
                            }))
                          }
                          placeholder="/blog&#10;/products"
                          className="min-h-[60px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          One path per line
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exclude_paths">
                          Exclude Paths (optional)
                        </Label>
                        <Textarea
                          id="exclude_paths"
                          value={formData.exclude_paths}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              exclude_paths: e.target.value,
                            }))
                          }
                          placeholder="/admin&#10;/private"
                          className="min-h-[60px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          One path per line
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTextlink}
                  disabled={
                    !formData.link ||
                    !formData.anchor_text ||
                    (!formData.website_id && !formData.custom_domain)
                  }
                >
                  Add Textlink
                </Button>
              </DialogFooter>
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
                  <SelectItem value="custom">Custom Domains</SelectItem>
                  {mockWebsites.map((website) => (
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
                        {textlink.websiteName ? (
                          <>
                            <IconWorld className="h-4 w-4 text-blue-500" />
                            <Badge variant="outline">
                              {textlink.websiteName}
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
                            Include: {textlink.include_paths.split("\n").length}{" "}
                            paths
                          </div>
                        )}
                        {textlink.exclude_paths && (
                          <div className="text-xs text-muted-foreground">
                            Exclude: {textlink.exclude_paths.split("\n").length}{" "}
                            paths
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
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredTextlinks.length)} of{" "}
              {filteredTextlinks.length} filtered textlinks ({textlinks.length}{" "}
              total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
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
