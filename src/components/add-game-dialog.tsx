"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPlus } from "@tabler/icons-react";

const gameCategories = ["sports", "puzzle", "arcade", "strategy", "action", "adventure"];

interface AddGameDialogProps {
  onAddGame: (game: {
    url: string;
    title: string;
    desc: string;
    category: string;
    game_url: string;
    game_icon?: string;
    game_thumb?: string;
    game_developer?: string;
    game_publish_year?: number;
    game_controls: string;
    game: string;
    isFeatured: boolean;
  }) => void;
}

export function AddGameDialog({ onAddGame }: AddGameDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    desc: "",
    category: "",
    game_url: "",
    game_icon: "",
    game_thumb: "",
    game_developer: "",
    game_publish_year: "",
    game_controls: "",
    game: "",
    isFeatured: false,
    keyboardControl: false,
    mouseControl: false,
    touchControl: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || !formData.title || !formData.category || !formData.game_url || !formData.game) {
      return;
    }

    // Build controls JSON
    const controls = {
      keyboard: formData.keyboardControl,
      mouse: formData.mouseControl,
      touch: formData.touchControl,
    };
    
    const gameData = {
      url: formData.url,
      title: formData.title,
      desc: formData.desc,
      category: formData.category,
      game_url: formData.game_url,
      game_icon: formData.game_icon || undefined,
      game_thumb: formData.game_thumb || undefined,
      game_developer: formData.game_developer || undefined,
      game_publish_year: formData.game_publish_year ? parseInt(formData.game_publish_year) : undefined,
      game_controls: JSON.stringify(controls),
      game: formData.game,
      isFeatured: formData.isFeatured,
    };
    
    onAddGame(gameData);
    setFormData({
      url: "",
      title: "",
      desc: "",
      category: "",
      game_url: "",
      game_icon: "",
      game_thumb: "",
      game_developer: "",
      game_publish_year: "",
      game_controls: "",
      game: "",
      isFeatured: false,
      keyboardControl: false,
      mouseControl: false,
      touchControl: false,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Game</DialogTitle>
          <DialogDescription>
            Add a new game to your collection. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL Slug *</Label>
              <Input
                id="url"
                placeholder="game-slug"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Game title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desc">Description *</Label>
            <Textarea
              id="desc"
              placeholder="Brief description of the game"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {gameCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="game_url">Game URL *</Label>
              <Input
                id="game_url"
                type="url"
                placeholder="https://games.example.com/game"
                value={formData.game_url}
                onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game_icon">Game Icon URL</Label>
              <Input
                id="game_icon"
                type="url"
                placeholder="https://example.com/icon.jpg"
                value={formData.game_icon}
                onChange={(e) => setFormData({ ...formData, game_icon: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="game_thumb">Thumbnail URL</Label>
              <Input
                id="game_thumb"
                type="url"
                placeholder="https://example.com/thumb.jpg"
                value={formData.game_thumb}
                onChange={(e) => setFormData({ ...formData, game_thumb: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game_developer">Developer</Label>
              <Input
                id="game_developer"
                placeholder="Developer name"
                value={formData.game_developer}
                onChange={(e) => setFormData({ ...formData, game_developer: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="game_publish_year">Publish Year</Label>
              <Input
                id="game_publish_year"
                type="number"
                min="1900"
                max="2030"
                placeholder="2024"
                value={formData.game_publish_year}
                onChange={(e) => setFormData({ ...formData, game_publish_year: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Game Controls</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keyboardControl"
                  checked={formData.keyboardControl}
                  onCheckedChange={(checked) => setFormData({ ...formData, keyboardControl: !!checked })}
                />
                <Label htmlFor="keyboardControl" className="text-sm font-normal">
                  Keyboard
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mouseControl"
                  checked={formData.mouseControl}
                  onCheckedChange={(checked) => setFormData({ ...formData, mouseControl: !!checked })}
                />
                <Label htmlFor="mouseControl" className="text-sm font-normal">
                  Mouse
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="touchControl"
                  checked={formData.touchControl}
                  onCheckedChange={(checked) => setFormData({ ...formData, touchControl: !!checked })}
                />
                <Label htmlFor="touchControl" className="text-sm font-normal">
                  Touch
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="game">Game Embed Code *</Label>
            <Textarea
              id="game"
              placeholder='<iframe src="https://games.example.com/game" width="100%" height="600"></iframe>'
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="font-mono text-sm"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the iframe embed code, file URL, or other game integration code.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: !!checked })}
              />
              <Label htmlFor="isFeatured" className="text-sm font-normal">
                Featured game
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Game</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}