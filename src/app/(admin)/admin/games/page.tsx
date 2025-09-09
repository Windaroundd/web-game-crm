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
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconStar,
  IconDeviceGamepad2,
  IconPlayerPlay,
  IconCalendar,
  IconUser,
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
import { AddGameDialog } from "@/components/add-game-dialog";

// Mock data - replace with actual data fetching
const mockGames = [
  {
    id: 1,
    url: "retro-bowl",
    title: "Retro Bowl",
    desc: "American football game with retro graphics",
    category: "sports",
    game_url: "https://games.example.com/retro-bowl",
    game_icon: "/game-icons/retro-bowl.jpg",
    game_thumb: "/game-thumbs/retro-bowl.jpg",
    game_developer: "New Star Games",
    game_publish_year: 2020,
    game_controls: JSON.stringify({
      keyboard: true,
      mouse: true,
      touch: false,
    }),
    game: '<iframe src="https://games.example.com/retro-bowl" width="100%" height="600"></iframe>',
    isFeatured: true,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    url: "puzzle-master",
    title: "Puzzle Master",
    desc: "Challenging puzzle game for all ages",
    category: "puzzle",
    game_url: "https://games.example.com/puzzle-master",
    game_icon: "/game-icons/puzzle-master.jpg",
    game_thumb: "/game-thumbs/puzzle-master.jpg",
    game_developer: "Brain Games Studio",
    game_publish_year: 2023,
    game_controls: JSON.stringify({
      keyboard: false,
      mouse: true,
      touch: true,
    }),
    game: '<iframe src="https://games.example.com/puzzle-master" width="100%" height="600"></iframe>',
    isFeatured: false,
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    url: "space-shooter",
    title: "Space Shooter",
    desc: "Classic arcade-style space shooting game",
    category: "arcade",
    game_url: "https://games.example.com/space-shooter",
    game_icon: "/game-icons/space-shooter.jpg",
    game_thumb: "/game-thumbs/space-shooter.jpg",
    game_developer: "Retro Arcade",
    game_publish_year: 2022,
    game_controls: JSON.stringify({
      keyboard: true,
      mouse: false,
      touch: true,
    }),
    game: '<iframe src="https://games.example.com/space-shooter" width="100%" height="600"></iframe>',
    isFeatured: true,
    createdAt: "2024-01-10",
  },
];

const gameCategories = [
  "all",
  "sports",
  "puzzle",
  "arcade",
  "strategy",
  "action",
  "adventure",
];

export default function GamesPage() {
  const [games, setGames] = useState(mockGames);
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const filteredGames = games
    .filter((game) => {
      if (categoryFilter !== "all" && game.category !== categoryFilter)
        return false;
      if (
        searchTerm &&
        !game.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !game.game_developer?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
      return sortOrder === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });

  const handleSelectAll = () => {
    if (selectedGames.length === filteredGames.length) {
      setSelectedGames([]);
    } else {
      setSelectedGames(filteredGames.map((g) => g.id));
    }
  };

  const handleSelectGame = (id: number) => {
    setSelectedGames((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleAddGame = (newGame: {
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
  }) => {
    const game = {
      id: Math.max(...games.map((g) => g.id)) + 1,
      ...newGame,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setGames([...games, game]);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Games</h1>
          <p className="text-muted-foreground">Manage your game collection</p>
        </div>
        <AddGameDialog onAddGame={handleAddGame} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <IconDeviceGamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{games.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {games.filter((g) => g.isFeatured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <IconFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(games.map((g) => g.category)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developers</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(games.map((g) => g.game_developer)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
          <CardDescription>
            Manage your game library with previews and metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <IconFilter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {gameCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all"
                      ? "All Categories"
                      : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="game_developer">Developer</SelectItem>
                <SelectItem value="game_publish_year">Publish Year</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
              >
                {sortOrder === "desc" ? "↓" : "↑"}
              </Button>
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "table" | "grid")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedGames.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedGames.length} game{selectedGames.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="destructive" size="sm">
                  <IconTrash className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "table" | "grid")}
          >
            <TabsContent value="table">
              {/* Table View */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedGames.length === filteredGames.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Controls</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGames.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedGames.includes(game.id)}
                            onCheckedChange={() => handleSelectGame(game.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                              <IconDeviceGamepad2 className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{game.title}</div>
                                {game.isFeatured && (
                                  <IconStar className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {game.desc}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconUser className="h-3 w-3 text-muted-foreground" />
                            {game.game_developer}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{game.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconCalendar className="h-3 w-3 text-muted-foreground" />
                            {game.game_publish_year}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {JSON.parse(game.game_controls).keyboard && (
                              <Badge variant="secondary" className="text-xs">
                                KB
                              </Badge>
                            )}
                            {JSON.parse(game.game_controls).mouse && (
                              <Badge variant="secondary" className="text-xs">
                                Mouse
                              </Badge>
                            )}
                            {JSON.parse(game.game_controls).touch && (
                              <Badge variant="secondary" className="text-xs">
                                Touch
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {game.isFeatured && (
                            <Badge variant="default" className="text-xs">
                              Featured
                            </Badge>
                          )}
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
                                <IconPlayerPlay className="mr-2 h-4 w-4" />
                                Preview Game
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
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
            </TabsContent>

            <TabsContent value="grid">
              {/* Grid View */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGames.map((game) => (
                  <Card
                    key={game.id}
                    className="group hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="p-0">
                      <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconDeviceGamepad2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={selectedGames.includes(game.id)}
                            onCheckedChange={() => handleSelectGame(game.id)}
                          />
                        </div>
                        {game.isFeatured && (
                          <div className="absolute top-2 right-2">
                            <IconStar className="h-5 w-5 text-yellow-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary">
                            <IconPlayerPlay className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">
                            {game.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {game.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {game.desc}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{game.game_developer}</span>
                          <span>{game.game_publish_year}</span>
                        </div>
                        <div className="flex gap-1">
                          {JSON.parse(game.game_controls).keyboard && (
                            <Badge variant="secondary" className="text-xs">
                              KB
                            </Badge>
                          )}
                          {JSON.parse(game.game_controls).mouse && (
                            <Badge variant="secondary" className="text-xs">
                              Mouse
                            </Badge>
                          )}
                          {JSON.parse(game.game_controls).touch && (
                            <Badge variant="secondary" className="text-xs">
                              Touch
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {filteredGames.length} of {games.length} games
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
