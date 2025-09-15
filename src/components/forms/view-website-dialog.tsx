"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconExternalLink,
  IconCalendar,
  IconTrendingUp,
  IconStar,
  IconEye,
  IconCheck,
  IconX
} from "@tabler/icons-react";
import type { Database } from "@/lib/types/database";

type Website = Database["public"]["Tables"]["websites"]["Row"];

interface ViewWebsiteDialogProps {
  website: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewWebsiteDialog({ website, open, onOpenChange }: ViewWebsiteDialogProps) {
  if (!website) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEye className="h-5 w-5" />
            Website Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{website.title}</h3>
              {website.is_featured && (
                <IconStar className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconExternalLink className="h-4 w-4" />
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {website.url}
              </a>
            </div>
            {website.desc && (
              <p className="text-sm text-muted-foreground mt-2">{website.desc}</p>
            )}
          </div>

          <Separator />

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {website.category || 'Uncategorized'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {website.is_index && (
                  <Badge variant="secondary" className="text-xs">
                    <IconCheck className="h-3 w-3 mr-1" />
                    Indexed
                  </Badge>
                )}
                {website.is_gsa && (
                  <Badge variant="default" className="text-xs">
                    GSA
                  </Badge>
                )}
                {website.is_wp && (
                  <Badge variant="outline" className="text-xs">
                    WordPress
                  </Badge>
                )}
                {website.is_featured && (
                  <Badge variant="default" className="text-xs">
                    <IconStar className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <IconTrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Traffic</span>
                  </div>
                  <span className="font-semibold">{website.traffic.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Domain Rating</span>
                  </div>
                  <Badge variant={website.domain_rating >= 70 ? "default" : "secondary"}>
                    {website.domain_rating}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-purple-500 rounded-full" />
                    <span className="text-sm font-medium">Backlinks</span>
                  </div>
                  <span className="font-semibold">{website.backlinks.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-orange-500 rounded-full" />
                    <span className="text-sm font-medium">Ref. Domains</span>
                  </div>
                  <span className="font-semibold">{website.referring_domains.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(website.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(website.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}