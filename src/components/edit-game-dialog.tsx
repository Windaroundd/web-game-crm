"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IconLoader2 } from "@tabler/icons-react";
import { GameFormData, gameSchema } from "@/lib/utils/validations";
import { FileUpload } from "@/components/file-upload";
import type { Game } from "@/hooks/use-games";
import { useGameFilters } from "@/hooks/use-game-filters";

interface EditGameDialogProps {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateGame: (id: number, game: Partial<GameFormData>) => Promise<void>;
}

export function EditGameDialog({
  game,
  open,
  onOpenChange,
  onUpdateGame,
}: EditGameDialogProps) {
  const [loading, setLoading] = useState(false);
  const { filters: gameFilters } = useGameFilters();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GameFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(gameSchema) as any,
    defaultValues: {
      url: "",
      title: "",
      desc: "",
      category: "",
      game_url: "",
      game_icon: [],
      game_thumb: [],
      game_developer: "",
      game_publish_year: undefined,
      game: "",
      is_featured: false,
      game_controls: {
        keyboard: false,
        mouse: false,
        touch: false,
      },
    },
  });

  // Populate form when game changes
  useEffect(() => {
    if (game && open) {
      setValue("url", game.url);
      setValue("title", game.title);
      setValue("desc", game.desc || "");
      setValue("category", game.category || "");
      setValue("game_url", game.game_url || "");
      setValue("game_icon", game.game_icon ? [game.game_icon] : []);
      setValue("game_thumb", game.game_thumb ? [game.game_thumb] : []);
      setValue("game_developer", game.game_developer || "");
      setValue("game_publish_year", game.game_publish_year || undefined);
      setValue("game", game.game || "");
      setValue("is_featured", game.is_featured);
      setValue("game_controls", game.game_controls as { keyboard: boolean; mouse: boolean; touch: boolean; });
    }
  }, [game, open, setValue]);

  const onSubmit = async (data: GameFormData) => {
    if (!game) return;

    setLoading(true);
    try {
      await onUpdateGame(game.id, data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating game:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      reset();
    }
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Edit the game details below. All changes will be saved to the database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL Slug *</Label>
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <Input
                    id="url"
                    placeholder="game-slug"
                    {...field}
                    className={errors.url ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.url && (
                <p className="text-sm text-red-600">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    id="title"
                    placeholder="Game title"
                    {...field}
                    className={errors.title ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Controller
              name="desc"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="desc"
                  placeholder="Brief description of the game"
                  {...field}
                  className={errors.desc ? "border-red-500" : ""}
                />
              )}
            />
            {errors.desc && (
              <p className="text-sm text-red-600">{errors.desc.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={errors.category ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameFilters.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="game_url">Game URL</Label>
              <Controller
                name="game_url"
                control={control}
                render={({ field }) => (
                  <Input
                    id="game_url"
                    type="url"
                    placeholder="https://games.example.com/game"
                    {...field}
                    className={errors.game_url ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.game_url && (
                <p className="text-sm text-red-600">{errors.game_url.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Controller
                name="game_icon"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    label="Game Icon"
                    description="Upload game icon"
                    accept="image/*"
                    maxSize={2}
                    multiple={false}
                    bucket="games"
                    folder="icons"
                    value={field.value}
                    onUpload={(urls) => field.onChange(urls)}
                    onRemove={() => field.onChange([])}
                    className={errors.game_icon ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.game_icon && (
                <p className="text-sm text-red-600">
                  {errors.game_icon.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Controller
                name="game_thumb"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    label="Game Thumbnail"
                    description="Upload game thumbnail"
                    accept="image/*"
                    maxSize={5}
                    multiple={false}
                    bucket="games"
                    folder="thumbnails"
                    value={field.value}
                    onUpload={(urls) => field.onChange(urls)}
                    onRemove={() => field.onChange([])}
                    className={errors.game_thumb ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.game_thumb && (
                <p className="text-sm text-red-600">
                  {errors.game_thumb.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game_developer">Developer</Label>
              <Controller
                name="game_developer"
                control={control}
                render={({ field }) => (
                  <Input
                    id="game_developer"
                    placeholder="Developer name"
                    {...field}
                    className={errors.game_developer ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.game_developer && (
                <p className="text-sm text-red-600">
                  {errors.game_developer.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="game_publish_year">Publish Year</Label>
              <Controller
                name="game_publish_year"
                control={control}
                render={({ field }) => (
                  <Input
                    id="game_publish_year"
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    placeholder="2024"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    value={field.value || ""}
                    className={errors.game_publish_year ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.game_publish_year && (
                <p className="text-sm text-red-600">
                  {errors.game_publish_year.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Game Controls</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Controller
                  name="game_controls.keyboard"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="keyboardControl"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label
                  htmlFor="keyboardControl"
                  className="text-sm font-normal"
                >
                  Keyboard
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="game_controls.mouse"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="mouseControl"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label htmlFor="mouseControl" className="text-sm font-normal">
                  Mouse
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="game_controls.touch"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="touchControl"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label htmlFor="touchControl" className="text-sm font-normal">
                  Touch
                </Label>
              </div>
            </div>
            {errors.game_controls && (
              <p className="text-sm text-red-600">
                {errors.game_controls.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Game Embed Code</Label>
            <Controller
              name="game"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="game"
                  placeholder='<iframe src="https://games.example.com/game" width="100%" height="600"></iframe>'
                  {...field}
                  className={`font-mono text-sm ${
                    errors.game ? "border-red-500" : ""
                  }`}
                  rows={3}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Enter the iframe embed code, file URL, or other game integration
              code.
            </p>
            {errors.game && (
              <p className="text-sm text-red-600">{errors.game.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_featured"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="is_featured" className="text-sm font-normal">
                Featured game
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Game"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}