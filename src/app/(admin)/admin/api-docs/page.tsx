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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  IconApi,
  IconCopy,
  IconCode,
  IconShield,
  IconClock,
  IconCheck,
  IconWorld,
  IconDeviceGamepad2,
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

// API endpoints data based on req.md specifications
const publicApis = [
  {
    method: "GET",
    endpoint: "/api/public/backlinks",
    description: "Get textlinks for a specific domain",
    parameters: [
      {
        name: "domain",
        type: "string",
        required: true,
        description: "Domain to get textlinks for (e.g., example.com)",
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number for pagination (default: 1)",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Items per page (default: 100, max: 100)",
      },
    ],
    example: "/api/public/backlinks?domain=retrobowl.me&page=1&limit=50",
    response: {
      status: "success",
      data: [
        {
          url: "https://textlink.com/",
          textlink: "textlink 1",
          title: "textlink 1",
          rel: "",
          target: "_blank",
        },
      ],
    },
  },
  {
    method: "GET",
    endpoint: "/api/games",
    description: "Get games with filtering and pagination",
    parameters: [
      {
        name: "category",
        type: "string",
        required: false,
        description: "Filter by game category",
      },
      {
        name: "isFeatured",
        type: "boolean",
        required: false,
        description: "Filter by featured status",
      },
      {
        name: "developer",
        type: "string",
        required: false,
        description: "Filter by game developer",
      },
      {
        name: "year",
        type: "number",
        required: false,
        description: "Filter by publish year",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Items per page",
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number",
      },
      {
        name: "sort",
        type: "string",
        required: false,
        description:
          "Sort field: publish_year, title, created_at (default: created_at desc)",
      },
    ],
    example: "/api/games?category=puzzle&isFeatured=1&limit=50",
    response: {
      status: "success",
      data: [
        {
          url: "retro-bowl",
          title: "Retro Bowl",
          desc: "American football game with retro graphics",
          category: "sports",
          game_url: "https://games.example.com/retro-bowl",
          game_icon: "/game-icons/retro-bowl.jpg",
          game_thumb: "/game-thumbs/retro-bowl.jpg",
          game_developer: "New Star Games",
          game_publish_year: 2020,
          game_controls: '{"keyboard":true,"mouse":true,"touch":false}',
          game: '<iframe src="https://games.example.com/retro-bowl" width="100%" height="600"></iframe>',
          isFeatured: true,
        },
      ],
      meta: {
        page: 1,
        limit: 50,
        total: 150,
        pages: 3,
      },
    },
  },
  {
    method: "GET",
    endpoint: "/api/websites",
    description: "Get websites with filtering and pagination",
    parameters: [
      {
        name: "category",
        type: "string",
        required: false,
        description: "Filter by website category",
      },
      {
        name: "isFeatured",
        type: "boolean",
        required: false,
        description: "Filter by featured status",
      },
      {
        name: "isIndex",
        type: "boolean",
        required: false,
        description: "Filter by index status",
      },
      {
        name: "minTraffic",
        type: "number",
        required: false,
        description: "Minimum traffic filter",
      },
      {
        name: "minDR",
        type: "number",
        required: false,
        description: "Minimum domain rating filter",
      },
      {
        name: "sort",
        type: "string",
        required: false,
        description:
          "Sort field: traffic, domain_rating, backlinks, referring_domains",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Items per page (default: 10)",
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number (default: 1)",
      },
    ],
    example: "/api/websites?category=blog&sort=traffic&minTraffic=10000",
    response: {
      status: "success",
      data: [
        {
          url: "https://example.com",
          title: "Example Website",
          desc: "A sample website for demonstration",
          category: "blog",
          traffic: 15000,
          domain_rating: 65,
          backlinks: 1200,
          referring_domains: 890,
          is_gsa: false,
          is_index: true,
          is_featured: false,
          is_wp: true,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 45,
        pages: 5,
      },
    },
  },
];

const rateLimits = [
  {
    endpoint: "/api/public/*",
    limit: "60 requests per minute",
    description: "All public API endpoints",
    headers: "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  },
  {
    endpoint: "/api/games",
    limit: "60 requests per minute",
    description: "Games API endpoint",
    headers: "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  },
  {
    endpoint: "/api/websites",
    limit: "60 requests per minute",
    description: "Websites API endpoint",
    headers: "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  },
];

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [testDomain, setTestDomain] = useState("retrobowl.me");
  const [copySuccess, setCopySuccess] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "default";
      case "POST":
        return "secondary";
      case "PUT":
        return "outline";
      case "DELETE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          {/* <p className="text-muted-foreground">
            Public APIs for accessing games, websites, and textlink data
          </p> */}
        </div>
      </div>

      {/* Overview Stats */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Public Endpoints
            </CardTitle>
            <IconApi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicApis.length}</div>
            <p className="text-xs text-muted-foreground">Read-only APIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
            <IconShield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60</div>
            <p className="text-xs text-muted-foreground">Requests per minute</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Response Format
            </CardTitle>
            <IconCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">JSON</div>
            <p className="text-xs text-muted-foreground">All responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CORS</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enabled</div>
            <p className="text-xs text-muted-foreground">All origins allowed</p>
          </CardContent>
        </Card>
      </div> */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>
                Public read-only APIs for accessing content data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Base URL</h4>
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  https://your-domain.com
                </code>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  No authentication required for public endpoints. All APIs are
                  read-only.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Response Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All responses are in JSON format with the following structure:
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                  {`{
  "status": "success" | "error",
  "data": [...] | null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "error": "Error message" // Only present on error
}`}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Available Resources
                </h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <IconLink className="h-4 w-4" />
                    <span className="text-sm font-medium">Textlinks</span>
                    <span className="text-xs text-muted-foreground">
                      - Footer links by domain
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <IconDeviceGamepad2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Games</span>
                    <span className="text-xs text-muted-foreground">
                      - Game catalog with metadata
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <IconWorld className="h-4 w-4" />
                    <span className="text-sm font-medium">Websites</span>
                    <span className="text-xs text-muted-foreground">
                      - Website directory with metrics
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <div className="space-y-6">
            {publicApis.map((api, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant={getMethodColor(api.method)}>
                      {api.method}
                    </Badge>
                    <code className="text-sm">{api.endpoint}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(api.endpoint)}
                      className="h-6 w-6 p-0"
                    >
                      <IconCopy className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription>{api.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Parameters</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {api.parameters.map((param, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">
                                {param.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{param.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {param.required ? (
                                  <Badge variant="destructive">Required</Badge>
                                ) : (
                                  <Badge variant="secondary">Optional</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {param.description}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Example Request
                    </h4>
                    <div className="flex items-center gap-2 bg-muted p-3 rounded">
                      <code className="text-xs flex-1">{api.example}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(api.example)}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Example Response
                    </h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(api.response, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rate-limits">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>
                API rate limits and usage guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Headers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateLimits.map((limit, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {limit.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{limit.limit}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {limit.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {limit.headers}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium">Rate Limit Headers</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      X-RateLimit-Limit
                    </code>
                    <span className="text-muted-foreground">
                      - Request limit per window
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      X-RateLimit-Remaining
                    </code>
                    <span className="text-muted-foreground">
                      - Remaining requests in current window
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      X-RateLimit-Reset
                    </code>
                    <span className="text-muted-foreground">
                      - Unix timestamp when limit resets
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Rate Limit Exceeded (429)
                  </h5>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    When rate limit is exceeded, the API returns HTTP 429 with
                    retry-after header indicating when to retry.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
              <CardDescription>
                Test API endpoints directly from this interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-domain">
                  Test Domain (for backlinks API)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="test-domain"
                    value={testDomain}
                    onChange={(e) => setTestDomain(e.target.value)}
                    placeholder="retrobowl.me"
                  />
                  <Button
                    onClick={() => {
                      const url = `/api/public/backlinks?domain=${testDomain}`;
                      copyToClipboard(url);
                    }}
                  >
                    <IconCopy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>

              {copySuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <IconCheck className="h-4 w-4" />
                  {copySuccess}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Test URLs</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <code className="text-xs">
                      /api/public/backlinks?domain=retrobowl.me
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "/api/public/backlinks?domain=retrobowl.me"
                        )
                      }
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <code className="text-xs">
                      /api/games?category=puzzle&isFeatured=1&limit=50
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "/api/games?category=puzzle&isFeatured=1&limit=50"
                        )
                      }
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <code className="text-xs">
                      /api/websites?category=blog&sort=traffic&minTraffic=10000
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "/api/websites?category=blog&sort=traffic&minTraffic=10000"
                        )
                      }
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <code className="text-xs">
                      /api/websites?isFeatured=1&sort=domain_rating
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "/api/websites?isFeatured=1&sort=domain_rating"
                        )
                      }
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Testing Tips
                </h5>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>
                    • Use browser dev tools or tools like Postman/curl for
                    testing
                  </li>
                  <li>
                    • Check rate limit headers in response to monitor usage
                  </li>
                  <li>
                    • All endpoints support CORS for browser-based testing
                  </li>
                  <li>• Parameters are case-sensitive</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
