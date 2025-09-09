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
const mockAccounts = [
  {
    id: 1,
    accountName: "Main Account",
    email: "admin@company.com",
    accountId: "abc123def456",
    createdAt: "2024-01-15",
    status: "active",
  },
  {
    id: 2,
    accountName: "Client Account A",
    email: "client-a@example.com",
    accountId: "xyz789ghi012",
    createdAt: "2024-02-20",
    status: "active",
  },
];

const mockPurgeLogs = [
  {
    id: 1,
    accountId: 1,
    accountName: "Main Account",
    mode: "url",
    payload: ["https://example.com/style.css", "https://example.com/script.js"],
    statusCode: 200,
    result: { success: true, id: "purge-123" },
    createdAt: "2024-03-01 14:30:00",
    createdBy: "admin@company.com",
  },
  {
    id: 2,
    accountId: 1,
    accountName: "Main Account",
    mode: "hostname",
    payload: ["cdn.example.com"],
    statusCode: 200,
    result: { success: true, id: "purge-124" },
    createdAt: "2024-03-01 12:15:00",
    createdBy: "admin@company.com",
  },
  {
    id: 3,
    accountId: 2,
    accountName: "Client Account A",
    mode: "tag",
    payload: ["product-images", "homepage"],
    statusCode: 200,
    result: { success: true, id: "purge-125" },
    createdAt: "2024-02-28 16:45:00",
    createdBy: "admin@company.com",
  },
];

const purgeTypes = [
  { value: "url", label: "By URLs", description: "Purge specific file URLs" },
  { value: "hostname", label: "By Hostname", description: "Purge entire hostnames" },
  { value: "tag", label: "By Tag", description: "Purge by Cache-Tag header" },
  { value: "prefix", label: "By Prefix", description: "Purge by directory prefix" },
];

export default function CloudflarePage() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [purgeMode, setPurgeMode] = useState("url");
  const [purgePayload, setPurgePayload] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  const handlePurge = () => {
    // Mock purge action
    console.log("Purging cache", { selectedAccount, purgeMode, purgePayload, exclusions });
    setIsPurgeDialogOpen(false);
    // Reset form
    setPurgePayload("");
    setExclusions("");
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 400 && statusCode < 500) return "destructive";
    return "secondary";
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "url": return "🔗";
      case "hostname": return "🌐";
      case "tag": return "🏷️";
      case "prefix": return "📁";
      default: return "❓";
    }
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloudflare Management</h1>
          <p className="text-muted-foreground">
            Manage multiple Cloudflare accounts and cache purging
          </p>
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
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountName} ({account.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Purge Method</Label>
                  <Select value={purgeMode} onValueChange={setPurgeMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purge method" />
                    </SelectTrigger>
                    <SelectContent>
                      {purgeTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payload">
                    {purgeMode === 'url' && 'URLs (one per line)'}
                    {purgeMode === 'hostname' && 'Hostnames (one per line)'}
                    {purgeMode === 'tag' && 'Cache Tags (one per line)'}
                    {purgeMode === 'prefix' && 'URL Prefixes (one per line)'}
                  </Label>
                  <Textarea
                    id="payload"
                    value={purgePayload}
                    onChange={(e) => setPurgePayload(e.target.value)}
                    placeholder={
                      purgeMode === 'url' ? 'https://example.com/style.css\nhttps://example.com/script.js' :
                      purgeMode === 'hostname' ? 'cdn.example.com\nassets.example.com' :
                      purgeMode === 'tag' ? 'product-images\nhomepage' :
                      'https://example.com/static/\nhttps://example.com/uploads/'
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {purgeMode === 'url' && (
                  <div className="space-y-2">
                    <Label htmlFor="exclusions">Single-file Exclusions (optional)</Label>
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
                <Button variant="outline" onClick={() => setIsPurgeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePurge} disabled={!selectedAccount || !purgePayload.trim()}>
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
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input id="accountName" placeholder="My Cloudflare Account" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input id="apiToken" type="password" placeholder="Your Cloudflare API Token" />
                  <p className="text-xs text-muted-foreground">
                    Token should have Cache Purge permissions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input id="accountId" placeholder="Your Cloudflare Account ID" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddAccountOpen(false)}>
                  Add Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                    {mockAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <IconCloud className="h-4 w-4 text-orange-500" />
                            {account.accountName}
                          </div>
                        </TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {account.accountId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(account.createdAt).toLocaleDateString()}
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
                    {mockPurgeLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconClock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.createdAt}</span>
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
                                  <div key={i} className="text-xs font-mono bg-muted px-1 py-0.5 rounded truncate">
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
                          <Badge variant={getStatusColor(log.statusCode)}>
                            {log.statusCode === 200 ? (
                              <IconCheck className="h-3 w-3 mr-1" />
                            ) : (
                              <IconX className="h-3 w-3 mr-1" />
                            )}
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.createdBy}</span>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}