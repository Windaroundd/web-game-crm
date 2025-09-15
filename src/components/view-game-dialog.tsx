"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconCalendar,
  IconUser,
  IconDeviceGamepad2,
  IconStar,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Game } from "@/hooks/use-games";

interface ViewGameDialogProps {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewGameDialog({
  game,
  open,
  onOpenChange,
}: ViewGameDialogProps) {
  if (!game) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getControlsArray = (controls: Record<string, boolean>) => {
    return Object.entries(controls)
      .filter(([, enabled]) => enabled)
      .map(([control]) => control.charAt(0).toUpperCase() + control.slice(1));
  };

  const renderPreview = () => {
    const embed = game.game || "";
    const urlCandidate = embed.startsWith("http") ? embed : game.game_url || "";

    if (embed.includes("<iframe")) {
      return (
        <div
          className="aspect-video w-full border rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: embed }}
        />
      );
    }

    if (urlCandidate) {
      return (
        <iframe
          src={urlCandidate}
          className="aspect-video w-full border rounded-lg"
          frameBorder="0"
          allowFullScreen
        />
      );
    }

    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <IconDeviceGamepad2 className="h-5 w-5" />
                {game.title}
                {game.is_featured && (
                  <Badge variant="secondary" className="text-amber-600">
                    <IconStar className="mr-1 h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Game Details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live Game Preview */}
          {renderPreview()}

          {/* Game Images */}
          <div className="grid grid-cols-2 gap-4">
            {game.game_icon && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Game Icon</h4>
                <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center">
                  <img
                    src={game.game_icon}
                    alt="Game Icon"
                    className="w-[150px] h-[150px] object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
            {game.game_thumb && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Game Thumbnail</h4>
                <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center">
                  <img
                    src={game.game_thumb}
                    alt="Game Thumbnail"
                    className="w-[150px] h-[150px] object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                URL Slug
              </h4>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                /{game.url}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Category
              </h4>
              <Badge variant="outline">
                {game.category
                  ? game.category.charAt(0).toUpperCase() +
                    game.category.slice(1)
                  : "No Category"}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {game.desc && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Description
              </h4>
              <p className="text-sm leading-relaxed p-3 bg-muted/50 rounded-lg">
                {game.desc}
              </p>
            </div>
          )}

          <Separator />

          {/* Game Information */}
          <div className="grid grid-cols-2 gap-4">
            {game.game_developer && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Developer
                </h4>
                <p className="text-sm">{game.game_developer}</p>
              </div>
            )}
            {game.game_publish_year && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IconCalendar className="h-4 w-4" />
                  Publish Year
                </h4>
                <p className="text-sm">{game.game_publish_year}</p>
              </div>
            )}
          </div>

          {/* Game Controls */}
          {game.game_controls &&
            getControlsArray(game.game_controls).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Game Controls
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getControlsArray(game.game_controls).map((control) => (
                    <Badge key={control} variant="secondary">
                      {control}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Game URL */}
          {game.game_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Game URL
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                  {game.game_url}
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={game.game_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Game Embed Code */}
          {game.game && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Game Embed Code
              </h4>
              <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {game.game}
              </pre>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium">Created</p>
              <p>{formatDate(game.created_at)}</p>
              {game.created_by && (
                <p className="text-xs">by {game.created_by}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium">Last Updated</p>
              <p>{formatDate(game.updated_at)}</p>
              {game.updated_by && (
                <p className="text-xs">by {game.updated_by}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
