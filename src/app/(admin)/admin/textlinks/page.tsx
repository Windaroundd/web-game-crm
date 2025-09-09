"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  IconPlus, 
  IconLink, 
  IconTrash,
  IconEdit,
  IconEye,
  IconDownload,
  IconCode,
  IconWorld,
  IconFilter,
  IconSearch,
  IconExternalLink,
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

const mockTextlinks = [
  {
    id: 1,
    link: "https://targetsite.com/page1",
    anchorText: "Best Gaming Reviews",
    target: "_blank",
    rel: "nofollow",
    title: "Gaming Reviews Site",
    websiteId: 3,
    websiteName: "Game Reviews",
    customDomain: null,
    showOnAllPages: true,
    includePaths: "",
    excludePaths: "",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: 2,
    link: "https://techtools.com",
    anchorText: "Developer Tools",
    target: "_blank",
    rel: "",
    title: "Best Developer Tools",
    websiteId: 2,
    websiteName: "Tech Blog",
    customDomain: null,
    showOnAllPages: false,
    includePaths: "/tools\n/resources",
    excludePaths: "/admin",
    createdAt: "2024-02-20",
    updatedAt: "2024-02-20",
  },
  {
    id: 3,
    link: "https://customdomain.example.com",
    anchorText: "Custom Domain Link",
    target: "_self",
    rel: "nofollow sponsored",
    title: "Custom Domain Example",
    websiteId: null,
    websiteName: null,
    customDomain: "custom.example.com",
    showOnAllPages: true,
    includePaths: "",
    excludePaths: "",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
];

export default function TextlinksPage() {
  const [selectedTextlinks, setSelectedTextlinks] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewDomain, setPreviewDomain] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    link: "",
    anchorText: "",
    target: "_blank",
    rel: "nofollow",
    title: "",
    websiteId: "",
    customDomain: "",
    showOnAllPages: true,
    includePaths: "",
    excludePaths: "",
  });

  const filteredTextlinks = mockTextlinks.filter(textlink => {
    if (websiteFilter !== "all") {
      if (websiteFilter === "custom") {
        if (!textlink.customDomain) return false;
      } else {
        if (textlink.websiteId !== parseInt(websiteFilter)) return false;
      }
    }
    if (searchTerm) {
      return textlink.anchorText.toLowerCase().includes(searchTerm.toLowerCase()) ||
             textlink.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (textlink.websiteName && textlink.websiteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (textlink.customDomain && textlink.customDomain.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedTextlinks.length === filteredTextlinks.length) {
      setSelectedTextlinks([]);
    } else {
      setSelectedTextlinks(filteredTextlinks.map(t => t.id));
    }
  };

  const handleSelectTextlink = (id: number) => {
    setSelectedTextlinks(prev => 
      prev.includes(id) 
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const resetForm = () => {
    setFormData({
      link: "",
      anchorText: "",
      target: "_blank",
      rel: "nofollow",
      title: "",
      websiteId: "",
      customDomain: "",
      showOnAllPages: true,
      includePaths: "",
      excludePaths: "",
    });
  };

  const handleAddTextlink = () => {
    console.log("Adding textlink:", formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const generatePreviewJson = () => {
    const domainTextlinks = mockTextlinks.filter(t => 
      (t.websiteName && mockWebsites.find(w => w.id === t.websiteId)?.url.includes(previewDomain)) ||
      (t.customDomain === previewDomain)
    );

    return domainTextlinks.map(t => ({
      url: t.link,
      textlink: t.anchorText,
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
          <p className="text-muted-foreground">
            Manage footer textlinks for websites and custom domains
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
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
                      {JSON.stringify({
                        status: "success",
                        data: generatePreviewJson()
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anchorText">Anchor Text *</Label>
                    <Input
                      id="anchorText"
                      value={formData.anchorText}
                      onChange={(e) => setFormData(prev => ({ ...prev, anchorText: e.target.value }))}
                      placeholder="Click here"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target</Label>
                    <Select value={formData.target} onValueChange={(value) => setFormData(prev => ({ ...prev, target: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_blank">New Window (_blank)</SelectItem>
                        <SelectItem value="_self">Same Window (_self)</SelectItem>
                        <SelectItem value="_parent">Parent Frame (_parent)</SelectItem>
                        <SelectItem value="_top">Top Frame (_top)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rel">Rel Attribute</Label>
                    <Input
                      id="rel"
                      value={formData.rel}
                      onChange={(e) => setFormData(prev => ({ ...prev, rel: e.target.value }))}
                      placeholder="nofollow, sponsored, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Link title for accessibility"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Placement Target</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="websiteId">Managed Website</Label>
                      <Select value={formData.websiteId} onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, websiteId: value, customDomain: "" }));
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a managed website" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockWebsites.map(website => (
                            <SelectItem key={website.id} value={website.id.toString()}>
                              {website.title} ({website.url})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">OR</div>
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Custom Domain</Label>
                      <Input
                        id="customDomain"
                        value={formData.customDomain}
                        onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value, websiteId: "" }))}
                        placeholder="example.com"
                        disabled={!!formData.websiteId}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showOnAllPages"
                      checked={formData.showOnAllPages}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnAllPages: checked as boolean }))}
                    />
                    <Label htmlFor="showOnAllPages">Show on all pages</Label>
                  </div>

                  {!formData.showOnAllPages && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="includePaths">Include Paths (optional)</Label>
                        <Textarea
                          id="includePaths"
                          value={formData.includePaths}
                          onChange={(e) => setFormData(prev => ({ ...prev, includePaths: e.target.value }))}
                          placeholder="/blog&#10;/products"
                          className="min-h-[60px]"
                        />
                        <p className="text-xs text-muted-foreground">One path per line</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="excludePaths">Exclude Paths (optional)</Label>
                        <Textarea
                          id="excludePaths"
                          value={formData.excludePaths}
                          onChange={(e) => setFormData(prev => ({ ...prev, excludePaths: e.target.value }))}
                          placeholder="/admin&#10;/private"
                          className="min-h-[60px]"
                        />
                        <p className="text-xs text-muted-foreground">One path per line</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTextlink} disabled={!formData.link || !formData.anchorText || (!formData.websiteId && !formData.customDomain)}>
                  Add Textlink
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Textlinks</CardTitle>
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
              {new Set(mockTextlinks.filter(t => t.websiteId).map(t => t.websiteId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Domains</CardTitle>
            <IconExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTextlinks.filter(t => t.customDomain).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Links</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTextlinks.filter(t => t.showOnAllPages).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Textlink Management</CardTitle>
          <CardDescription>
            Manage textlinks for footer placement across websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                {mockWebsites.map(website => (
                  <SelectItem key={website.id} value={website.id.toString()}>
                    {website.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedTextlinks.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTextlinks.length} textlink{selectedTextlinks.length > 1 ? 's' : ''} selected
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
                      checked={selectedTextlinks.length === filteredTextlinks.length}
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
                {filteredTextlinks.map((textlink) => (
                  <TableRow key={textlink.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTextlinks.includes(textlink.id)}
                        onCheckedChange={() => handleSelectTextlink(textlink.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{textlink.anchorText}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconExternalLink className="h-3 w-3" />
                          <a href={textlink.link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
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
                            <Badge variant="outline">{textlink.websiteName}</Badge>
                          </>
                        ) : (
                          <>
                            <IconExternalLink className="h-4 w-4 text-green-500" />
                            <Badge variant="secondary">{textlink.customDomain}</Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {textlink.showOnAllPages ? (
                          <Badge variant="default" className="text-xs">All Pages</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Specific Pages</Badge>
                        )}
                        {textlink.includePaths && (
                          <div className="text-xs text-muted-foreground">
                            Include: {textlink.includePaths.split('\n').length} paths
                          </div>
                        )}
                        {textlink.excludePaths && (
                          <div className="text-xs text-muted-foreground">
                            Exclude: {textlink.excludePaths.split('\n').length} paths
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">{textlink.target}</Badge>
                        {textlink.rel && (
                          <div className="text-xs text-muted-foreground">
                            rel="{textlink.rel}"
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(textlink.updatedAt).toLocaleDateString()}
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
              Showing {filteredTextlinks.length} of {mockTextlinks.length} textlinks
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