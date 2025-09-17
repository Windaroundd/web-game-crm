"use client";

import { useState, useEffect } from "react";
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
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLoader2,
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
import { ViewGameDialog } from "@/components/view-game-dialog";
import { EditGameDialog } from "@/components/edit-game-dialog";
import { useGames, type Game } from "@/hooks/use-games";
import { useDebounce } from "@/hooks/use-debounce";
import { useGameFilters } from "@/hooks/use-game-filters";
import { GameFormData } from "@/lib/utils/validations";
import { DeleteDialog } from "@/components/delete-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canPerformAction } from "@/lib/auth/client";

export default function GamesPage() {
  // Fetch dynamic filter options
  const { filters: gameFilters } = useGameFilters();
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deleteGameId, setDeleteGameId] = useState<number | null>(null);
  const [viewGame, setViewGame] = useState<Game | null>(null);
  const [editGame, setEditGame] = useState<Game | null>(null);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<string>("all");
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [keyboardFilter, setKeyboardFilter] = useState(false);
  const [mouseFilter, setMouseFilter] = useState(false);
  const [touchFilter, setTouchFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use the games hook with current filters
  const {
    games,
    loading,
    error,
    pagination,
    createGame,
    updateGame,
    deleteGame,
    fetchGames,
  } = useGames({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    isFeatured:
      isFeaturedFilter === "featured"
        ? true
        : isFeaturedFilter === "not_featured"
        ? false
        : undefined,
    developer: developerFilter || undefined,
    year: yearFilter ? parseInt(yearFilter) : undefined,
    search: debouncedSearchTerm,
    sort: sortBy,
    order: sortOrder,
    limit: itemsPerPage,
    page: currentPage,
  });

  // Apply client-side filters that aren't handled by the API
  const filteredGames = games.filter((game) => {
    // Advanced filters - Year range (client-side)
    if (
      minYear &&
      game.game_publish_year &&
      game.game_publish_year < parseInt(minYear)
    )
      return false;
    if (
      maxYear &&
      game.game_publish_year &&
      game.game_publish_year > parseInt(maxYear)
    )
      return false;

    // Control filters (client-side)
    if (game.game_controls) {
      if (keyboardFilter && !game.game_controls.keyboard) return false;
      if (mouseFilter && !game.game_controls.mouse) return false;
      if (touchFilter && !game.game_controls.touch) return false;
    }

    return true;
  });

  // Use API pagination
  const paginatedGames = filteredGames;

  // Effect to refetch when filters change
  useEffect(() => {
    fetchGames({
      category: categoryFilter === "all" ? undefined : categoryFilter,
      isFeatured:
        isFeaturedFilter === "featured"
          ? true
          : isFeaturedFilter === "not_featured"
          ? false
          : undefined,
      developer: developerFilter === "all" ? undefined : developerFilter,
      year: yearFilter === "all" ? undefined : parseInt(yearFilter),
      search: debouncedSearchTerm,
      sort: sortBy,
      order: sortOrder,
      limit: itemsPerPage,
      page: currentPage,
    });
  }, [
    categoryFilter,
    isFeaturedFilter,
    developerFilter,
    yearFilter,
    debouncedSearchTerm,
    sortBy,
    sortOrder,
    itemsPerPage,
    currentPage,
    fetchGames,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setMinYear("");
    setMaxYear("");
    setIsFeaturedFilter("all");
    setDeveloperFilter("all");
    setYearFilter("all");
    setKeyboardFilter(false);
    setMouseFilter(false);
    setTouchFilter(false);
    setCurrentPage(1);
  };

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

  const handleAddGame = async (gameData: GameFormData) => {
    const result = await createGame(gameData);
    if (result) {
      setSelectedGames([]);
      // Refresh the games list
      fetchGames();
    }
  };

  const handleUpdateGame = async (
    id: number,
    gameData: Partial<GameFormData>
  ) => {
    const result = await updateGame(id, gameData);
    if (result) {
      setEditGame(null);
      // Refresh the games list
      fetchGames({
        category: categoryFilter === "all" ? undefined : categoryFilter,
        isFeatured:
          isFeaturedFilter === "featured"
            ? true
            : isFeaturedFilter === "not_featured"
            ? false
            : undefined,
        developer: developerFilter || undefined,
        year: yearFilter ? parseInt(yearFilter) : undefined,
        search: debouncedSearchTerm,
        sort: sortBy,
        order: sortOrder,
        limit: itemsPerPage,
        page: currentPage,
      });
    }
  };

  const handleDeleteGame = async (id: number) => {
    const success = await deleteGame(id);

    if (success) {
      setSelectedGames((prev) => prev.filter((gid) => gid !== id));
      setDeleteGameId(null);
      // Refresh the games list
      fetchGames({
        category: categoryFilter === "all" ? undefined : categoryFilter,
        isFeatured:
          isFeaturedFilter === "featured"
            ? true
            : isFeaturedFilter === "not_featured"
            ? false
            : undefined,
        developer: developerFilter || undefined,
        year: yearFilter ? parseInt(yearFilter) : undefined,
        search: debouncedSearchTerm,
        sort: sortBy,
        order: sortOrder,
        limit: itemsPerPage,
        page: currentPage,
      });
    }
  };

  // RBAC: compute permissions
  const { user, loading: userLoading } = useCurrentUser();
  const canWrite = canPerformAction(user, "write"); // editor+

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Games</h1>
        </div>
        {!userLoading && canWrite && (
          <AddGameDialog onAddGame={handleAddGame} />
        )}
      </div>

      {/* Stats Cards */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div> */}

      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
          <CardDescription>
            Manage your game library with previews and metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="space-y-4 mb-6">
            {/* Main Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or developer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {gameFilters.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Featured Filter */}
              <Select
                value={isFeaturedFilter}
                onValueChange={setIsFeaturedFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="not_featured">Not Featured</SelectItem>
                </SelectContent>
              </Select>

              {/* Developer Filter */}
              <Select
                value={developerFilter}
                onValueChange={setDeveloperFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Developer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Developers</SelectItem>
                  {gameFilters.developers.map((developer) => (
                    <SelectItem key={developer} value={developer}>
                      {developer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {gameFilters.years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                {/* <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="game_developer">Developer</SelectItem>
                    <SelectItem value="game_publish_year">
                      Publish Year
                    </SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                  }
                >
                  {sortOrder === "desc" ? <>↓ Desc</> : <>↑ Asc</>}
                </Button> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <IconFilter className="h-4 w-4 mr-1" />
                  Controls
                  {showAdvancedFilters ? (
                    <IconChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <IconChevronDown className="h-4 w-4 ml-1" />
                  )}
                </Button> */}
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <IconX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="flex gap-2">
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

            {/* Controls Filters Panel */}
            {showAdvancedFilters && (
              <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    Game Controls & Advanced Filters
                  </h4>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Game Controls */}
                  <div>
                    <h5 className="text-sm font-medium mb-3 text-muted-foreground">
                      Game Controls
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keyboardFilter"
                          checked={keyboardFilter}
                          onCheckedChange={(checked) =>
                            setKeyboardFilter(!!checked)
                          }
                        />
                        <label
                          htmlFor="keyboardFilter"
                          className="text-sm font-medium"
                        >
                          Keyboard Support
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mouseFilter"
                          checked={mouseFilter}
                          onCheckedChange={(checked) =>
                            setMouseFilter(!!checked)
                          }
                        />
                        <label
                          htmlFor="mouseFilter"
                          className="text-sm font-medium"
                        >
                          Mouse Support
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="touchFilter"
                          checked={touchFilter}
                          onCheckedChange={(checked) =>
                            setTouchFilter(!!checked)
                          }
                        />
                        <label
                          htmlFor="touchFilter"
                          className="text-sm font-medium"
                        >
                          Touch Support
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Year Range */}
                  <div>
                    <h5 className="text-sm font-medium mb-3 text-muted-foreground">
                      Year Range Filter
                    </h5>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min Year"
                          value={minYear}
                          onChange={(e) => setMinYear(e.target.value)}
                          className="text-sm"
                          min="1980"
                          max={new Date().getFullYear()}
                        />
                        <Input
                          type="number"
                          placeholder="Max Year"
                          value={maxYear}
                          onChange={(e) => setMaxYear(e.target.value)}
                          className="text-sm"
                          min="1980"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Additional year range filter (optional)
                      </p>
                    </div>
                  </div>

                  {/* Display Settings */}
                  <div>
                    <h5 className="text-sm font-medium mb-3 text-muted-foreground">
                      Display Settings
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
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

                      <div className="text-sm text-muted-foreground">
                        <strong>{filteredGames.length}</strong> of{" "}
                        {games.length} games shown
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {!userLoading && canWrite && selectedGames.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedGames.length} game
                {selectedGames.length > 1 ? "s" : ""} selected
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading games...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}
          {!loading && !error && (
            <>
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
                            {!userLoading && canWrite ? (
                              <Checkbox
                                checked={
                                  selectedGames.length === filteredGames.length
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            ) : null}
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
                        {paginatedGames.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell>
                              {!userLoading && canWrite ? (
                                <Checkbox
                                  checked={selectedGames.includes(game.id)}
                                  onCheckedChange={() =>
                                    handleSelectGame(game.id)
                                  }
                                />
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                  {game?.game_icon ? (
                                    <img
                                      src={game.game_icon}
                                      alt="Game Icon"
                                      className="absolute inset-0 m-auto  text-muted-foreground"
                                    />
                                  ) : (
                                    <IconDeviceGamepad2 className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">
                                      {game.title}
                                    </div>
                                    {game.is_featured && (
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
                                {game.game_controls?.keyboard && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    KB
                                  </Badge>
                                )}
                                {game.game_controls?.mouse && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Mouse
                                  </Badge>
                                )}
                                {game.game_controls?.touch && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Touch
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {game.is_featured && (
                                <Badge variant="default" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Open menu</span>⋯
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => setViewGame(game)}
                                  >
                                    <IconPlayerPlay className="mr-2 h-4 w-4" />
                                    Preview Game
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setViewGame(game)}
                                  >
                                    <IconEye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!userLoading && canWrite && (
                                    <DropdownMenuItem
                                      onClick={() => setEditGame(game)}
                                    >
                                      <IconEdit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {!userLoading && canWrite && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => setDeleteGameId(game.id)}
                                      >
                                        <IconTrash className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                    {paginatedGames.map((game) => (
                      <Card
                        key={game.id}
                        className="group hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="p-0">
                          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              {game?.game_thumb ? (
                                <img
                                  src={game.game_thumb}
                                  alt="Game Thumbnail"
                                  className="absolute inset-0 m-auto  text-muted-foreground"
                                />
                              ) : (
                                <IconDeviceGamepad2 className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="absolute top-2 left-2">
                              <Checkbox
                                checked={selectedGames.includes(game.id)}
                                onCheckedChange={() =>
                                  handleSelectGame(game.id)
                                }
                              />
                            </div>
                            {game.is_featured && (
                              <div className="absolute top-2 right-2">
                                <IconStar className="h-5 w-5 text-yellow-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setViewGame(game)}
                              >
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
                              {game.game_controls?.keyboard && (
                                <Badge variant="secondary" className="text-xs">
                                  KB
                                </Badge>
                              )}
                              {game.game_controls?.mouse && (
                                <Badge variant="secondary" className="text-xs">
                                  Mouse
                                </Badge>
                              )}
                              {game.game_controls?.touch && (
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
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} games
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
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
                      }
                    )}

                    {pagination.totalPages > 5 &&
                      currentPage < pagination.totalPages - 2 && (
                        <>
                          <span className="text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(pagination.totalPages)
                            }
                            className="w-8"
                          >
                            {pagination.totalPages}
                          </Button>
                        </>
                      )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteGameId !== null}
        onOpenChange={(open) => !open && setDeleteGameId(null)}
        onConfirm={() => deleteGameId && handleDeleteGame(deleteGameId)}
        title="Delete Game"
        description="Are you sure you want to delete this game? This action cannot be undone."
        isLoading={loading}
      />

      {/* View Game Dialog */}
      {viewGame && (
        <ViewGameDialog
          game={viewGame}
          open={viewGame !== null}
          onOpenChange={(open) => !open && setViewGame(null)}
        />
      )}

      {/* Edit Game Dialog */}
      {editGame && (
        <EditGameDialog
          game={editGame}
          open={editGame !== null}
          onOpenChange={(open) => !open && setEditGame(null)}
          onUpdateGame={handleUpdateGame}
        />
      )}
    </div>
  );
}
