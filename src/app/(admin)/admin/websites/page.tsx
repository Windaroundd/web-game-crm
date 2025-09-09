"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  IconSearch, 
  IconFilter, 
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconStar,
  IconWorld,
  IconTrendingUp,
  IconLink,
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
    domain_rating: 65,
    backlinks: 1200,
    referring_domains: 890,
    is_wp: true,
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
    domain_rating: 78,
    backlinks: 3400,
    referring_domains: 2100,
    is_wp: false,
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
    domain_rating: 72,
    backlinks: 2100,
    referring_domains: 1450,
    is_wp: true,
    createdAt: "2024-01-10",
  },
];

const categories = ["all", "blog", "tech", "gaming", "news", "entertainment"];

export default function WebsitesPage() {
  const [websites, setWebsites] = useState(mockWebsites);
  const [selectedWebsites, setSelectedWebsites] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("traffic");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredWebsites = websites
    .filter(website => {
      if (categoryFilter !== "all" && website.category !== categoryFilter) return false;
      if (searchTerm && !website.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !website.url.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      return sortOrder === 'desc' ? 
        String(bValue).localeCompare(String(aValue)) : 
        String(aValue).localeCompare(String(bValue));
    });

  const handleSelectAll = () => {
    if (selectedWebsites.length === filteredWebsites.length) {
      setSelectedWebsites([]);
    } else {
      setSelectedWebsites(filteredWebsites.map(w => w.id));
    }
  };

  const handleSelectWebsite = (id: number) => {
    setSelectedWebsites(prev => 
      prev.includes(id) 
        ? prev.filter(wid => wid !== id)
        : [...prev, id]
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
    domain_rating: number;
    backlinks: number;
    referring_domains: number;
    is_wp: boolean;
  }) => {
    const website = {
      id: Math.max(...websites.map(w => w.id)) + 1,
      ...newWebsite,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWebsites([...websites, website]);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground">
            Manage your website portfolio
          </p>
        </div>
        <AddWebsiteDialog onAddWebsite={handleAddWebsite} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.filter(w => w.isFeatured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Traffic</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(websites.reduce((acc, w) => acc + w.traffic, 0) / websites.length).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
            <IconLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websites.reduce((acc, w) => acc + w.backlinks, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traffic">Traffic</SelectItem>
                <SelectItem value="domain_rating">Domain Rating</SelectItem>
                <SelectItem value="backlinks">Backlinks</SelectItem>
                <SelectItem value="referring_domains">Referring Domains</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedWebsites.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedWebsites.length} website{selectedWebsites.length > 1 ? 's' : ''} selected
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
                      checked={selectedWebsites.length === filteredWebsites.length}
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
                {filteredWebsites.map((website) => (
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
                      <Badge variant={website.domain_rating >= 70 ? "default" : "secondary"}>
                        {website.domain_rating}
                      </Badge>
                    </TableCell>
                    <TableCell>{website.backlinks.toLocaleString()}</TableCell>
                    <TableCell>{website.referring_domains.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {website.isIndex && (
                          <Badge variant="outline" className="text-xs">Indexed</Badge>
                        )}
                        {website.isGSA && (
                          <Badge variant="secondary" className="text-xs">GSA</Badge>
                        )}
                        {website.is_wp && (
                          <Badge variant="outline" className="text-xs">WordPress</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            ⋯
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
              Showing {filteredWebsites.length} of {websites.length} websites
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}