"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { Badge } from "@/components/ui/badge";
import { IconDeviceGamepad2, IconSave, IconEye, IconX } from "@tabler/icons-react";

interface GameFormData {
  url: string;
  title: string;
  desc: string;
  category: string;
  gameUrl: string;
  gameIcon: string[];
  gameThumb: string[];
  gameDeveloper: string;
  gamePublishYear: number | "";
  gameControls: {
    keyboard: boolean;
    mouse: boolean;
    touch: boolean;
  };
  game: string;
  isFeatured: boolean;
}

interface GameFormProps {
  initialData?: Partial<GameFormData>;
  onSubmit: (data: GameFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

const gameCategories = ["sports", "puzzle", "arcade", "strategy", "action", "adventure", "rpg", "simulation"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

export function GameForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}: GameFormProps) {
  const [formData, setFormData] = useState<GameFormData>({
    url: "",
    title: "",
    desc: "",
    category: "",
    gameUrl: "",
    gameIcon: [],
    gameThumb: [],
    gameDeveloper: "",
    gamePublishYear: "",
    gameControls: {
      keyboard: false,
      mouse: false,
      touch: false,
    },
    game: "",
    isFeatured: false,
    ...initialData,
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (field: keyof GameFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSelectChange = (field: keyof GameFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field: keyof GameFormData) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleControlChange = (control: keyof GameFormData["gameControls"]) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      gameControls: {
        ...prev.gameControls,
        [control]: checked,
      },
    }));
  };

  const handleFileUpload = (field: "gameIcon" | "gameThumb") => (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: urls,
    }));
  };

  const handleFileRemove = (field: "gameIcon" | "gameThumb") => (index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const generateUrlFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      url: prev.url || generateUrlFromTitle(title),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.url || !formData.category) {
      alert("Please fill in required fields");
      return;
    }

    onSubmit(formData);
  };

  const renderGamePreview = () => {
    if (!formData.game) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <IconDeviceGamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No game content to preview</p>
          </div>
        </div>
      );
    }

    // If it's an iframe embed
    if (formData.game.includes("<iframe")) {
      return (
        <div 
          className="aspect-video w-full border rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: formData.game }}
        />
      );
    }

    // If it's a URL
    if (formData.game.startsWith("http")) {
      return (
        <iframe
          src={formData.game}
          className="aspect-video w-full border rounded-lg"
          frameBorder="0"
          allowFullScreen
        />
      );
    }

    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Unable to preview game content</p>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Add New Game" : "Edit Game"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create" ? "Create a new game entry" : "Update game information"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <IconEye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <IconSave className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Game"}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconDeviceGamepad2 className="h-5 w-5" />
              {formData.title || "Untitled Game"}
              {formData.isFeatured && <Badge>Featured</Badge>}
            </CardTitle>
            <CardDescription>
              {formData.desc || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">CATEGORY</Label>
                <p className="mt-1">
                  <Badge variant="outline">{formData.category || "None"}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">DEVELOPER</Label>
                <p className="mt-1">{formData.gameDeveloper || "Unknown"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">PUBLISHED</Label>
                <p className="mt-1">{formData.gamePublishYear || "Unknown"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">CONTROLS</Label>
                <div className="flex gap-1 mt-1">
                  {formData.gameControls.keyboard && <Badge variant="secondary" className="text-xs">Keyboard</Badge>}
                  {formData.gameControls.mouse && <Badge variant="secondary" className="text-xs">Mouse</Badge>}
                  {formData.gameControls.touch && <Badge variant="secondary" className="text-xs">Touch</Badge>}
                  {!Object.values(formData.gameControls).some(Boolean) && (
                    <span className="text-sm text-muted-foreground">None specified</span>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">GAME PREVIEW</Label>
              <div className="mt-2">
                {renderGamePreview()}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media & Assets</TabsTrigger>
            <TabsTrigger value="game">Game Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential game details and categorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Game Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Enter game title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL Slug *</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={handleInputChange("url")}
                      placeholder="game-url-slug"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={formData.desc}
                    onChange={handleInputChange("desc")}
                    placeholder="Enter game description"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={handleSelectChange("category")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-8">
                    <Checkbox
                      id="featured"
                      checked={formData.isFeatured}
                      onCheckedChange={handleCheckboxChange("isFeatured")}
                    />
                    <Label htmlFor="featured">Featured Game</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Media Assets</CardTitle>
                <CardDescription>
                  Upload game icons, thumbnails, and other visual assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  label="Game Icon"
                  description="Square icon for the game (recommended: 512x512px)"
                  accept="image/*"
                  maxSize={2}
                  multiple={false}
                  value={formData.gameIcon}
                  onUpload={handleFileUpload("gameIcon")}
                  onRemove={handleFileRemove("gameIcon")}
                  bucket="games"
                  folder="icons"
                />
                
                <FileUpload
                  label="Game Thumbnail"
                  description="Thumbnail image for the game (recommended: 16:9 aspect ratio)"
                  accept="image/*"
                  maxSize={2}
                  multiple={false}
                  value={formData.gameThumb}
                  onUpload={handleFileUpload("gameThumb")}
                  onRemove={handleFileRemove("gameThumb")}
                  bucket="games"
                  folder="thumbs"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Content</CardTitle>
                <CardDescription>
                  Embed code or URL for the actual game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gameUrl">Game URL (optional)</Label>
                  <Input
                    id="gameUrl"
                    value={formData.gameUrl}
                    onChange={handleInputChange("gameUrl")}
                    placeholder="https://games.example.com/my-game"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Game Embed/Content</Label>
                  <Textarea
                    id="game"
                    value={formData.game}
                    onChange={handleInputChange("game")}
                    placeholder="<iframe src='...' width='100%' height='600'></iframe> or game URL"
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                {formData.game && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      {renderGamePreview()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>
                  Additional information about the game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="developer">Developer</Label>
                    <Input
                      id="developer"
                      value={formData.gameDeveloper}
                      onChange={handleInputChange("gameDeveloper")}
                      placeholder="Game developer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Publish Year</Label>
                    <Select 
                      value={formData.gamePublishYear.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gamePublishYear: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Supported Controls</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="keyboard"
                        checked={formData.gameControls.keyboard}
                        onCheckedChange={handleControlChange("keyboard")}
                      />
                      <Label htmlFor="keyboard">Keyboard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mouse"
                        checked={formData.gameControls.mouse}
                        onCheckedChange={handleControlChange("mouse")}
                      />
                      <Label htmlFor="mouse">Mouse</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="touch"
                        checked={formData.gameControls.touch}
                        onCheckedChange={handleControlChange("touch")}
                      />
                      <Label htmlFor="touch">Touch/Mobile</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </form>
  );
}