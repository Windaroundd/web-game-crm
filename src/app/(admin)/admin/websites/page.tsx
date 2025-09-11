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
import { AddWebsiteDialog } from "@/components/add-website-dialog";

// Mock data - replace with actual data fetching
const mockWebsites = [
  {
    id: 1,
    url: "https://example.com",
    title: "Example Website",
    desc: "A sample website for demonstration",
    category: "blog",
    isGSA: true,
    isIndex: true,
    isFeatured: false,
    traffic: 15000,
    domainRating: 65,
    backlinks: 1200,
    referringDomains: 890,
    isWP: true,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    url: "https://techblog.dev",
    title: "Tech Blog",
    desc: "Technology focused blog",
    category: "tech",
    isGSA: false,
    isIndex: true,
    isFeatured: true,
    traffic: 45000,
    domainRating: 78,
    backlinks: 3400,
    referringDomains: 2100,
    isWP: false,
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    url: "https://gamereviews.net",
    title: "Game Reviews",
    desc: "Video game reviews and news",
    category: "gaming",
    isGSA: true,
    isIndex: true,
    isFeatured: true,
    traffic: 28000,
    domainRating: 72,
    backlinks: 2100,
    referringDomains: 1450,
    isWP: true,
    createdAt: "2024-01-10",
  },
  {
    id: 4,
    url: "https://sportsnews.com",
    title: "Sports News Daily",
    desc: "Latest sports news and updates",
    category: "sports",
    isGSA: false,
    isIndex: false,
    isFeatured: false,
    traffic: 8500,
    domainRating: 45,
    backlinks: 650,
    referringDomains: 320,
    isWP: true,
    createdAt: "2024-03-05",
  },
  {
    id: 5,
    url: "https://healthtips.org",
    title: "Health & Wellness Tips",
    desc: "Your guide to healthy living",
    category: "health",
    isGSA: true,
    isIndex: true,
    isFeatured: false,
    traffic: 32000,
    domainRating: 68,
    backlinks: 1800,
    referringDomains: 1200,
    isWP: false,
    createdAt: "2024-02-15",
  },
];

const categories = [
  "all",
  "blog",
  "tech",
  "gaming",
  "news",
  "entertainment",
  "sports",
  "health",
];

export default function WebsitesPage() {
  const [websites, setWebsites] = useState(mockWebsites);
  const [selectedWebsites, setSelectedWebsites] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("traffic");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minTraffic, setMinTraffic] = useState("");
  const [maxTraffic, setMaxTraffic] = useState("");
  const [minDR, setMinDR] = useState("");
  const [maxDR, setMaxDR] = useState("");
  const [minBacklinks, setMinBacklinks] = useState("");
  const [maxBacklinks, setMaxBacklinks] = useState("");
  const [minReferringDomains, setMinReferringDomains] = useState("");
  const [maxReferringDomains, setMaxReferringDomains] = useState("");
  const [isGSAFilter, setIsGSAFilter] = useState(false);
  const [isIndexFilter, setIsIndexFilter] = useState(false);
  const [isWPFilter, setIsWPFilter] = useState(false);
  const [isFeaturedFilter, setIsFeaturedFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredWebsites = websites
    .filter((website) => {
      // Category filter
      if (categoryFilter !== "all" && website.category !== categoryFilter)
        return false;

      // Search filter
      if (
        searchTerm &&
        !website.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !website.url.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      // Advanced filters - Numeric fields
      if (minTraffic && website.traffic < parseInt(minTraffic)) return false;
      if (maxTraffic && website.traffic > parseInt(maxTraffic)) return false;
      if (minDR && website.domainRating < parseInt(minDR)) return false;
      if (maxDR && website.domainRating > parseInt(maxDR)) return false;
      if (minBacklinks && website.backlinks < parseInt(minBacklinks))
        return false;
      if (maxBacklinks && website.backlinks > parseInt(maxBacklinks))
        return false;
      if (
        minReferringDomains &&
        website.referringDomains < parseInt(minReferringDomains)
      )
        return false;
      if (
        maxReferringDomains &&
        website.referringDomains > parseInt(maxReferringDomains)
      )
        return false;

      // Boolean filters (checked = show only true values, unchecked = show all)
      if (isGSAFilter && !website.isGSA) return false;
      if (isIndexFilter && !website.isIndex) return false;
      if (isWPFilter && !website.isWP) return false;
      if (isFeaturedFilter && !website.isFeatured) return false;

      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
      return sortOrder === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredWebsites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWebsites = filteredWebsites.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setMinTraffic("");
    setMaxTraffic("");
    setMinDR("");
    setMaxDR("");
    setMinBacklinks("");
    setMaxBacklinks("");
    setMinReferringDomains("");
    setMaxReferringDomains("");
    setIsGSAFilter(false);
    setIsIndexFilter(false);
    setIsWPFilter(false);
    setIsFeaturedFilter(false);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedWebsites.length === filteredWebsites.length) {
      setSelectedWebsites([]);
    } else {
      setSelectedWebsites(filteredWebsites.map((w) => w.id));
    }
  };

  const handleSelectWebsite = (id: number) => {
    setSelectedWebsites((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  const handleAddWebsite = (newWebsite: {
    url: string;
    title: string;
    desc: string;
    category: string;
    isGSA: boolean;
    isIndex: boolean;
    isFeatured: boolean;
    traffic: number;
    domainRating: number;
    backlinks: number;
    referringDomains: number;
    isWP: boolean;
  }) => {
    const website = {
      id: Math.max(...websites.map((w) => w.id)) + 1,
      ...newWebsite,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWebsites([...websites, website]);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
        </div>
        <AddWebsiteDialog onAddWebsite={handleAddWebsite} />
      </div>

      {/* Stats Cards */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Websites
            </CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websites.length}</div>
            <p className="text-xs text-muted-foreground">
              {websites.filter((w) => w.isIndex).length} indexed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter((w) => w.isFeatured).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (websites.filter((w) => w.isFeatured).length /
                  websites.length) *
                  100
              )}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              WordPress Sites
            </CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter((w) => w.isWP).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (websites.filter((w) => w.isWP).length / websites.length) * 100
              )}
              % WordPress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GSA Sites</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter((w) => w.isGSA).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg DR:{" "}
              {Math.round(
                websites
                  .filter((w) => w.isGSA)
                  .reduce((acc, w) => acc + w.domainRating, 0) /
                  Math.max(websites.filter((w) => w.isGSA).length, 1)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.reduce((acc, w) => acc + w.traffic, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg:{" "}
              {Math.round(
                websites.reduce((acc, w) => acc + w.traffic, 0) /
                  websites.length
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div> */}

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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="domainRating">Domain Rating</SelectItem>
                  <SelectItem value="backlinks">Backlinks</SelectItem>
                  <SelectItem value="referringDomains">
                    Referring Domains
                  </SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
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

                {/* Numeric Filters Section */}
                <div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Traffic Filter */}
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

                    {/* Domain Rating Filter */}
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

                    {/* Backlinks Filter */}
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

                    {/* Referring Domains Filter */}
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
                </div>

                {/* Boolean Filters Section */}
                <div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGSA"
                        checked={isGSAFilter}
                        onCheckedChange={(checked) => setIsGSAFilter(!!checked)}
                      />
                      <label htmlFor="isGSA" className="text-sm font-medium">
                        GSA
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isIndex"
                        checked={isIndexFilter}
                        onCheckedChange={(checked) =>
                          setIsIndexFilter(!!checked)
                        }
                      />
                      <label htmlFor="isIndex" className="text-sm font-medium">
                        Indexed
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={isFeaturedFilter}
                        onCheckedChange={(checked) =>
                          setIsFeaturedFilter(!!checked)
                        }
                      />
                      <label
                        htmlFor="isFeatured"
                        className="text-sm font-medium"
                      >
                        Featured
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isWP"
                        checked={isWPFilter}
                        onCheckedChange={(checked) => setIsWPFilter(!!checked)}
                      />
                      <label htmlFor="isWP" className="text-sm font-medium">
                        WordPress site
                      </label>
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        <strong>{filteredWebsites.length}</strong> of{" "}
                        {websites.length} websites
                      </div>
                    </div>
                  </div>
                </div>
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
                        selectedWebsites.length === filteredWebsites.length
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
                {paginatedWebsites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedWebsites.includes(website.id)}
                        onCheckedChange={() => handleSelectWebsite(website.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{website.title}</div>
                          {website.isFeatured && (
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
                          website.domainRating >= 70 ? "default" : "secondary"
                        }
                      >
                        {website.domainRating}
                      </Badge>
                    </TableCell>
                    <TableCell>{website.backlinks.toLocaleString()}</TableCell>
                    <TableCell>
                      {website.referringDomains.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {website.isIndex && (
                          <Badge variant="outline" className="text-xs">
                            Indexed
                          </Badge>
                        )}
                        {website.isGSA && (
                          <Badge variant="secondary" className="text-xs">
                            GSA
                          </Badge>
                        )}
                        {website.isWP && (
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
              {Math.min(startIndex + itemsPerPage, filteredWebsites.length)} of{" "}
              {filteredWebsites.length} filtered websites ({websites.length}{" "}
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
