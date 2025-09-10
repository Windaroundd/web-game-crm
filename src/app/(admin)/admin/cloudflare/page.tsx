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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  IconPlus,
  IconCloud,
  IconTrash,
  IconEdit,
  IconEye,
  IconRefresh,
  IconSettings,
  IconCheck,
  IconX,
  IconClock,
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
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

// Interface matching req.md cloudflare_accounts table exactly
interface CloudflareAccount {
  id: number;
  account_name: string; // ✅ (text, not null)
  email: string; // ✅ (text, not null)
  api_token: string; // ✅ (text, not null) - store token; restrict access via RLS
  account_id: string; // ✅ (text, not null)
  created_at: string; // ✅ (timestamptz default now())
  created_by?: string; // ✅ (uuid references auth.users(id))
}

// Interface matching req.md cloudflare_purge_logs table exactly
interface CloudflarePurgeLog {
  id: number;
  cloudflare_account_id: number | null; // ✅ (bigint references cloudflare_accounts(id) on delete set null)
  mode: "url" | "hostname" | "tag" | "prefix"; // ✅ (text not null check mode in ('url','hostname','tag','prefix'))
  payload: string[]; // ✅ (jsonb not null) - what was purged
  exclusions?: string[] | null; // ✅ (jsonb) - for single-file exclusions (url mode), optional
  status_code?: number; // ✅ (int)
  result?: Record<string, unknown>; // ✅ (jsonb) - API response
  created_at: string; // ✅ (timestamptz default now())
  created_by?: string; // ✅ (uuid references auth.users(id))
  accountName?: string; // For display purposes
}

const mockAccounts: CloudflareAccount[] = [
  {
    id: 1,
    account_name: "Main Account",
    email: "admin@company.com",
    api_token: "***hidden***",
    account_id: "abc123def456",
    created_at: "2024-01-15",
    created_by: "admin@company.com",
  },
  {
    id: 2,
    account_name: "Client Account A",
    email: "client-a@example.com",
    api_token: "***hidden***",
    account_id: "xyz789ghi012",
    created_at: "2024-02-20",
    created_by: "admin@company.com",
  },
];

const mockPurgeLogs: CloudflarePurgeLog[] = [
  {
    id: 1,
    cloudflare_account_id: 1,
    accountName: "Main Account",
    mode: "url",
    payload: ["https://example.com/style.css", "https://example.com/script.js"],
    exclusions: null,
    status_code: 200,
    result: { success: true, id: "purge-123" },
    created_at: "2024-03-01 14:30:00",
    created_by: "admin@company.com",
  },
  {
    id: 2,
    cloudflare_account_id: 1,
    accountName: "Main Account",
    mode: "hostname",
    payload: ["cdn.example.com"],
    exclusions: null,
    status_code: 200,
    result: { success: true, id: "purge-124" },
    created_at: "2024-03-01 12:15:00",
    created_by: "admin@company.com",
  },
  {
    id: 3,
    cloudflare_account_id: 2,
    accountName: "Client Account A",
    mode: "tag",
    payload: ["product-images", "homepage"],
    exclusions: null,
    status_code: 200,
    result: { success: true, id: "purge-125" },
    created_at: "2024-02-28 16:45:00",
    created_by: "admin@company.com",
  },
  {
    id: 4,
    cloudflare_account_id: 1,
    accountName: "Main Account",
    mode: "url",
    payload: ["https://example.com/old-file.js"],
    exclusions: ["https://example.com/important.css"],
    status_code: 422,
    result: { success: false, errors: ["Invalid URL format"] },
    created_at: "2024-02-25 09:15:00",
    created_by: "admin@company.com",
  },
];

const purgeTypes = [
  { value: "url", label: "By URLs", description: "Purge specific file URLs" },
  {
    value: "hostname",
    label: "By Hostname",
    description: "Purge entire hostnames",
  },
  { value: "tag", label: "By Tag", description: "Purge by Cache-Tag header" },
  {
    value: "prefix",
    label: "By Prefix",
    description: "Purge by directory prefix",
  },
];

export default function CloudflarePage() {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [purgeLogs, setPurgeLogs] = useState(mockPurgeLogs);
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [purgeMode, setPurgeMode] = useState<
    "url" | "hostname" | "tag" | "prefix"
  >("url");
  const [purgePayload, setPurgePayload] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  // Filters and pagination for logs
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Form state for adding account - using exact req.md field names
  const [accountFormData, setAccountFormData] = useState({
    account_name: "",
    email: "",
    api_token: "",
    account_id: "",
  });

  const handlePurge = () => {
    // Mock purge action - create new log entry
    const newLog: CloudflarePurgeLog = {
      id: Math.max(...purgeLogs.map((l) => l.id)) + 1,
      cloudflare_account_id: parseInt(selectedAccount),
      accountName: accounts.find((a) => a.id === parseInt(selectedAccount))
        ?.account_name,
      mode: purgeMode,
      payload: purgePayload.split("\n").filter((line) => line.trim()),
      exclusions: exclusions
        ? exclusions.split("\n").filter((line) => line.trim())
        : null,
      status_code: 200,
      result: { success: true, id: `purge-${Date.now()}` },
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      created_by: "admin@company.com",
    };
    setPurgeLogs([newLog, ...purgeLogs]);
    setIsPurgeDialogOpen(false);
    // Reset form
    setPurgePayload("");
    setExclusions("");
    setSelectedAccount("");
  };

  const handleAddAccount = () => {
    const newAccount: CloudflareAccount = {
      id: Math.max(...accounts.map((a) => a.id)) + 1,
      account_name: accountFormData.account_name,
      email: accountFormData.email,
      api_token: accountFormData.api_token,
      account_id: accountFormData.account_id,
      created_at: new Date().toISOString().split("T")[0],
      created_by: "admin@company.com",
    };
    setAccounts([...accounts, newAccount]);
    setIsAddAccountOpen(false);
    resetAccountForm();
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return "secondary";
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 400 && statusCode < 500) return "destructive";
    return "secondary";
  };

  // Filtered and sorted logs
  const filteredLogs = purgeLogs
    .filter((log) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          log.accountName?.toLowerCase().includes(searchLower) ||
          log.mode.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.payload).toLowerCase().includes(searchLower) ||
          log.created_by?.toLowerCase().includes(searchLower)
        );
      }

      // Advanced filters
      if (modeFilter !== "all" && log.mode !== modeFilter) return false;
      if (
        accountFilter !== "all" &&
        log.cloudflare_account_id !== parseInt(accountFilter)
      )
        return false;
      if (
        statusFilter === "success" &&
        (!log.status_code || log.status_code < 200 || log.status_code >= 300)
      )
        return false;
      if (
        statusFilter === "error" &&
        log.status_code &&
        log.status_code >= 200 &&
        log.status_code < 300
      )
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
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
      return sortOrder === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setModeFilter("all");
    setAccountFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const resetAccountForm = () => {
    setAccountFormData({
      account_name: "",
      email: "",
      api_token: "",
      account_id: "",
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "url":
        return "🔗";
      case "hostname":
        return "🌐";
      case "tag":
        return "🏷️";
      case "prefix":
        return "📁";
      default:
        return "❓";
    }
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloudflare Management</h1>
          {/* <p className="text-muted-foreground">
            Manage multiple Cloudflare accounts and cache purging
          </p> */}
        </div>
        <div className="flex gap-2">
          <Dialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconRefresh className="h-4 w-4 mr-2" />
                Purge Cache
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Purge Cache</DialogTitle>
                <DialogDescription>
                  Select purge method and specify what to purge
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Cloudflare Account</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id.toString()}
                        >
                          {account.account_name} ({account.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Purge Method</Label>
                  <Select
                    value={purgeMode}
                    onValueChange={(value) =>
                      setPurgeMode(
                        value as "url" | "hostname" | "tag" | "prefix"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purge method" />
                    </SelectTrigger>
                    <SelectContent>
                      {purgeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payload">
                    {purgeMode === "url" && "URLs (one per line)"}
                    {purgeMode === "hostname" && "Hostnames (one per line)"}
                    {purgeMode === "tag" && "Cache Tags (one per line)"}
                    {purgeMode === "prefix" && "URL Prefixes (one per line)"}
                  </Label>
                  <Textarea
                    id="payload"
                    value={purgePayload}
                    onChange={(e) => setPurgePayload(e.target.value)}
                    placeholder={
                      purgeMode === "url"
                        ? "https://example.com/style.css\nhttps://example.com/script.js"
                        : purgeMode === "hostname"
                        ? "cdn.example.com\nassets.example.com"
                        : purgeMode === "tag"
                        ? "product-images\nhomepage"
                        : "https://example.com/static/\nhttps://example.com/uploads/"
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {purgeMode === "url" && (
                  <div className="space-y-2">
                    <Label htmlFor="exclusions">
                      Single-file Exclusions (optional)
                    </Label>
                    <Textarea
                      id="exclusions"
                      value={exclusions}
                      onChange={(e) => setExclusions(e.target.value)}
                      placeholder="https://example.com/important.css&#10;https://example.com/critical.js"
                      className="min-h-[60px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Files to exclude from purge (one per line)
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPurgeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurge}
                  disabled={!selectedAccount || !purgePayload.trim()}
                >
                  Purge Cache
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cloudflare Account</DialogTitle>
                <DialogDescription>
                  Add a new Cloudflare account for cache management
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    placeholder="My Cloudflare Account"
                    value={accountFormData.account_name}
                    onChange={(e) =>
                      setAccountFormData((prev) => ({
                        ...prev,
                        account_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={accountFormData.email}
                    onChange={(e) =>
                      setAccountFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_token">API Token</Label>
                  <Input
                    id="api_token"
                    type="password"
                    placeholder="Your Cloudflare API Token"
                    value={accountFormData.api_token}
                    onChange={(e) =>
                      setAccountFormData((prev) => ({
                        ...prev,
                        api_token: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Token should have Cache Purge permissions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_id">Account ID</Label>
                  <Input
                    id="account_id"
                    placeholder="Your Cloudflare Account ID"
                    value={accountFormData.account_id}
                    onChange={(e) =>
                      setAccountFormData((prev) => ({
                        ...prev,
                        account_id: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddAccountOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAccount}
                  disabled={
                    !accountFormData.account_name ||
                    !accountFormData.email ||
                    !accountFormData.api_token ||
                    !accountFormData.account_id
                  }
                >
                  Add Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="logs">Purge Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare Accounts</CardTitle>
              <CardDescription>
                Manage your Cloudflare account credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <IconCloud className="h-4 w-4 text-orange-500" />
                            {account.account_name}
                          </div>
                        </TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {account.account_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(account.created_at).toLocaleDateString()}
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
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconSettings className="mr-2 h-4 w-4" />
                                Test Connection
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Purge Logs</CardTitle>
              <CardDescription>
                History of all cache purge requests
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
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select
                    value={accountFilter}
                    onValueChange={setAccountFilter}
                  >
                    <SelectTrigger className="w-[200px]">
                      <IconFilter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id.toString()}
                        >
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="mode">Purge Mode</SelectItem>
                      <SelectItem value="status_code">Status Code</SelectItem>
                      <SelectItem value="created_by">User</SelectItem>
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

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Purge Mode
                        </label>
                        <Select
                          value={modeFilter}
                          onValueChange={setModeFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Modes</SelectItem>
                            <SelectItem value="url">By URLs</SelectItem>
                            <SelectItem value="hostname">
                              By Hostname
                            </SelectItem>
                            <SelectItem value="tag">By Tag</SelectItem>
                            <SelectItem value="prefix">By Prefix</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Status
                        </label>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">
                              Success (2xx)
                            </SelectItem>
                            <SelectItem value="error">
                              Error (4xx/5xx)
                            </SelectItem>
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
                          <strong>{filteredLogs.length}</strong> of{" "}
                          {purgeLogs.length} logs
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Payload</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconClock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.created_at}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconCloud className="h-4 w-4 text-orange-500" />
                            {log.accountName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getModeIcon(log.mode)}</span>
                            <Badge variant="outline">{log.mode}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {Array.isArray(log.payload) ? (
                              <div className="space-y-1">
                                {log.payload.slice(0, 2).map((item, i) => (
                                  <div
                                    key={i}
                                    className="text-xs font-mono bg-muted px-1 py-0.5 rounded truncate"
                                  >
                                    {item}
                                  </div>
                                ))}
                                {log.payload.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{log.payload.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <code className="text-xs">{log.payload}</code>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(log.status_code)}>
                            {log.status_code &&
                            log.status_code >= 200 &&
                            log.status_code < 300 ? (
                              <IconCheck className="h-3 w-3 mr-1" />
                            ) : (
                              <IconX className="h-3 w-3 mr-1" />
                            )}
                            {log.status_code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.created_by}</span>
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
                                <IconRefresh className="mr-2 h-4 w-4" />
                                Repeat Purge
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
                  {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of{" "}
                  {filteredLogs.length} filtered logs ({purgeLogs.length} total)
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
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
