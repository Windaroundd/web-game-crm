"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconExternalLink,
  IconWorld,
  IconCalendar,
  IconCode,
  IconEye,
  IconEyeOff,
  IconRoute,
  IconTarget,
  IconLink,
} from "@tabler/icons-react";
import type { TextlinkWithWebsite } from "@/hooks/use-textlinks";

interface TextlinkDetailsProps {
  textlink: TextlinkWithWebsite;
}

export function TextlinkDetails({ textlink }: TextlinkDetailsProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPaths = (paths: string | null) => {
    if (!paths) return [];
    return paths.split("\n").filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLink className="h-5 w-5" />
            Link Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Anchor Text
              </h4>
              <p className="font-medium">{textlink.anchor_text}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Target URL
              </h4>
              <div className="flex items-center gap-2">
                <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={textlink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {textlink.link}
                </a>
              </div>
            </div>
          </div>

          {textlink.title && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Title Attribute
              </h4>
              <p>{textlink.title}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTarget className="h-5 w-5" />
            Link Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Target
              </h4>
              <Badge variant="outline">{textlink.target}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Rel Attribute
              </h4>
              {textlink.rel ? (
                <Badge variant="secondary">rel=&quot;{textlink.rel}&quot;</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placement Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWorld className="h-5 w-5" />
            Placement Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Target Site
            </h4>
            <div className="flex items-center gap-2">
              {textlink.websites ? (
                <>
                  <IconWorld className="h-4 w-4 text-blue-500" />
                  <Badge variant="outline">
                    {textlink.websites.title}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({textlink.websites.url})
                  </span>
                </>
              ) : (
                <>
                  <IconExternalLink className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary">
                    {textlink.custom_domain}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (Custom domain)
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Display Settings
            </h4>
            <div className="flex items-center gap-2">
              {textlink.show_on_all_pages ? (
                <>
                  <IconEye className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Show on all pages</Badge>
                </>
              ) : (
                <>
                  <IconEyeOff className="h-4 w-4 text-orange-500" />
                  <Badge variant="outline">Specific pages only</Badge>
                </>
              )}
            </div>
          </div>

          {!textlink.show_on_all_pages && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {textlink.include_paths && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <IconRoute className="h-4 w-4" />
                    Include Paths
                  </h4>
                  <div className="space-y-1">
                    {formatPaths(textlink.include_paths).map((path, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {textlink.exclude_paths && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <IconRoute className="h-4 w-4" />
                    Exclude Paths
                  </h4>
                  <div className="space-y-1">
                    {formatPaths(textlink.exclude_paths).map((path, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h4>
              <p className="text-sm">{formatDate(textlink.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Last Updated
              </h4>
              <p className="text-sm">{formatDate(textlink.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCode className="h-5 w-5" />
            HTML Preview
          </CardTitle>
          <CardDescription>
            How this textlink will appear in the HTML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm">
              &lt;a href=&quot;{textlink.link}&quot;
              {textlink.target && textlink.target !== "_self" && (
                <> target=&quot;{textlink.target}&quot;</>
              )}
              {textlink.rel && <> rel=&quot;{textlink.rel}&quot;</>}
              {textlink.title && <> title=&quot;{textlink.title}&quot;</>}
              &gt;
              {textlink.anchor_text}
              &lt;/a&gt;
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}