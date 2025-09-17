"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  IconPlus,
  IconCloud,
  IconTrash,
  IconEdit,
  IconEye,
  IconRefresh,
  IconSettings,
  IconX,
  IconClock,
  IconLoader2,
  IconAlertCircle,
  IconCircleCheck,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from "sonner";
import { cloudflareAccountSchema } from "@/lib/validations/cloudflare";
import { useCloudflareAccounts } from "@/hooks/use-cloudflare-accounts";
import { useCloudflarePurge } from "@/hooks/use-cloudflare-purge";
import { useCloudflareLogsPurge } from "@/hooks/use-cloudflare-purge-logs";
import type { CloudflareAccountFormData } from "@/lib/validations/cloudflare";

// Form interfaces for React Hook Form
type AccountFormInputs = CloudflareAccountFormData;

interface PurgeFormInputs {
  cloudflare_account_id: string;
  zone_id: string;
  mode: "url" | "hostname" | "tag" | "prefix";
  payload: string;
  exclusions?: string;
}

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
  // State management
  const [activeTab, setActiveTab] = useState("accounts");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<number | null>(null);

  // Custom hooks
  const {
    accounts,
    isLoading: accountsLoading,
    error: accountsError,
    createAccount,
    updateAccount,
    deleteAccount,
    refetch: refetchAccounts,
  } = useCloudflareAccounts();

  const {
    isPurging,
    purgeError,
    lastPurgeResult,
    purgeCache,
    clearError,
    clearResult,
  } = useCloudflarePurge();

  const {
    logs: purgeLogs,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useCloudflareLogsPurge({ limit: 10, page: 1 });

  // Ignore unused variables for now
  void refetchAccounts;

  // Form setup for account creation/editing
  const accountForm = useForm<AccountFormInputs>({
    resolver: zodResolver(cloudflareAccountSchema),
    defaultValues: {
      account_name: "",
      email: "",
      api_token: "",
      account_id: "",
    },
  });

  // Form setup for cache purging
  const purgeForm = useForm<PurgeFormInputs>({
    defaultValues: {
      cloudflare_account_id: "",
      zone_id: "",
      mode: "url",
      payload: "",
      exclusions: "",
    },
  });

  // Watch for purge form mode changes to reset payload
  const watchedMode = purgeForm.watch("mode");
  useEffect(() => {
    purgeForm.setValue("payload", "");
    purgeForm.setValue("exclusions", "");
  }, [watchedMode, purgeForm]);

  // Show success/error messages
  useEffect(() => {
    if (lastPurgeResult) {
      if (lastPurgeResult.status === "success") {
        toast.success("Cache purged successfully!");
        setIsPurgeDialogOpen(false);
        purgeForm.reset();
        refetchLogs();
      } else {
        toast.error(lastPurgeResult.error || "Purge failed");
      }
    }
  }, [lastPurgeResult, purgeForm, refetchLogs]);

  // Form handlers
  const onSubmitAccount = async (data: AccountFormInputs) => {
    try {
      const result = editingAccount
        ? await updateAccount(editingAccount, data)
        : await createAccount(data);

      if (result.status === "success") {
        toast.success(
          editingAccount
            ? "Account updated successfully!"
            : "Account created successfully!"
        );
        setIsAddAccountOpen(false);
        setEditingAccount(null);
        accountForm.reset();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const onSubmitPurge = async (data: PurgeFormInputs) => {
    try {
      clearError();
      clearResult();

      const purgeRequest = {
        cloudflare_account_id: Number(data.cloudflare_account_id),
        zone_id: data.zone_id,
        mode: data.mode,
        payload: data.payload.split("\\n").filter((line) => line.trim()),
        exclusions: data.exclusions
          ? data.exclusions.split("\\n").filter((line) => line.trim())
          : undefined,
      };

      await purgeCache(purgeRequest);
    } catch {
      toast.error("Failed to submit purge request");
    }
  };

  const handleEditAccount = (account: { id: number; account_name: string; email: string; account_id: string }) => {
    setEditingAccount(account.id);
    accountForm.setValue("account_name", account.account_name);
    accountForm.setValue("email", account.email);
    accountForm.setValue("api_token", ""); // Don't prefill token for security
    accountForm.setValue("account_id", account.account_id);
    setIsAddAccountOpen(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (confirm("Are you sure you want to delete this account?")) {
      const result = await deleteAccount(id);
      if (result.status === "success") {
        toast.success("Account deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    }
  };

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    accountForm.reset();
    setIsAddAccountOpen(true);
  };

  const handleAccountDialogChange = (open: boolean) => {
    setIsAddAccountOpen(open);
    if (!open) {
      setEditingAccount(null);
      accountForm.reset();
    }
  };

  const handlePurgeDialogChange = (open: boolean) => {
    setIsPurgeDialogOpen(open);
    if (!open) {
      purgeForm.reset();
      clearError();
      clearResult();
    }
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return "secondary";
    return statusCode >= 200 && statusCode < 300 ? "default" : "destructive";
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "url": return "🔗";
      case "hostname": return "🏠";
      case "tag": return "🏷️";
      case "prefix": return "📁";
      default: return "❓";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cloudflare Management</h1>
        <p className="text-muted-foreground">
          Manage multiple Cloudflare accounts and perform cache purge operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="logs">Purge Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Cloudflare Accounts</CardTitle>
                <CardDescription>
                  Manage your Cloudflare accounts and API tokens
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog open={isAddAccountOpen} onOpenChange={handleAccountDialogChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={handleOpenAddAccount}>
                      <IconPlus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAccount ? "Edit Cloudflare Account" : "Add Cloudflare Account"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingAccount
                          ? "Update Cloudflare account details"
                          : "Add a new Cloudflare account for cache management"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-4">
                        <FormField
                          control={accountForm.control}
                          name="account_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My Cloudflare Account" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="admin@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="api_token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Token</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder={editingAccount ? "Leave empty to keep current token" : "Your Cloudflare API Token"}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Token should have Cache Purge permissions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="account_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your Cloudflare Account ID"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAccountDialogChange(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                            {accountForm.formState.isSubmitting && (
                              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingAccount ? "Update Account" : "Add Account"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isPurgeDialogOpen} onOpenChange={handlePurgeDialogChange}>
                  <DialogTrigger asChild>
                    <Button disabled={accounts.length === 0}>
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

                    {/* Show purge error */}
                    {purgeError && (
                      <Alert variant="destructive">
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{purgeError}</AlertDescription>
                      </Alert>
                    )}

                    <Form {...purgeForm}>
                      <form onSubmit={purgeForm.handleSubmit(onSubmitPurge)} className="space-y-4">
                        <FormField
                          control={purgeForm.control}
                          name="cloudflare_account_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cloudflare Account</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={purgeForm.control}
                          name="zone_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zone ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your Cloudflare Zone ID"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Find this in your Cloudflare dashboard under the Overview tab
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={purgeForm.control}
                          name="mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purge Method</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select purge method" />
                                  </SelectTrigger>
                                </FormControl>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={purgeForm.control}
                          name="payload"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {watchedMode === "url" && "URLs (one per line)"}
                                {watchedMode === "hostname" && "Hostnames (one per line)"}
                                {watchedMode === "tag" && "Cache Tags (one per line)"}
                                {watchedMode === "prefix" && "URL Prefixes (one per line)"}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={
                                    watchedMode === "url"
                                      ? "https://example.com/style.css\\nhttps://example.com/script.js"
                                      : watchedMode === "hostname"
                                      ? "cdn.example.com\\nassets.example.com"
                                      : watchedMode === "tag"
                                      ? "product-images\\nhomepage"
                                      : "https://example.com/static/\\nhttps://example.com/uploads/"
                                  }
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedMode === "url" && (
                          <FormField
                            control={purgeForm.control}
                            name="exclusions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Single-file Exclusions (optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="https://example.com/important.css\\nhttps://example.com/critical.js"
                                    className="min-h-[60px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Files to exclude from purge (one per line)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handlePurgeDialogChange(false)}
                            disabled={isPurging}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isPurging}>
                            {isPurging && (
                              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Purge Cache
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Loading and error states */}
              {accountsLoading && (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading accounts...
                </div>
              )}

              {accountsError && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{accountsError}</AlertDescription>
                </Alert>
              )}

              {!accountsLoading && !accountsError && (
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
                      {accounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No Cloudflare accounts found. Add your first account to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        accounts.map((account) => (
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
                                  <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <IconSettings className="mr-2 h-4 w-4" />
                                    Test Connection
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteAccount(account.id)}
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
              )}
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
              {/* Loading state for logs */}
              {logsLoading && (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading logs...
                </div>
              )}

              {!logsLoading && (
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
                      {purgeLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No purge logs found. Perform your first cache purge to see logs here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        purgeLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <IconClock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <IconCloud className="h-4 w-4 text-orange-500" />
                                {(log as { cloudflare_accounts?: { account_name: string } }).cloudflare_accounts?.account_name || 'N/A'}
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
                                  <code className="text-xs">{JSON.stringify(log.payload)}</code>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(log.status_code)}>
                                {log.status_code &&
                                log.status_code >= 200 &&
                                log.status_code < 300 ? (
                                  <IconCircleCheck className="h-3 w-3 mr-1" />
                                ) : (
                                  <IconX className="h-3 w-3 mr-1" />
                                )}
                                {log.status_code || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{log.created_by || 'N/A'}</span>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}