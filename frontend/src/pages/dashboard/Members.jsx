import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMyTasks } from "../../store/slices/taskSlice.js";
import { fetchWorkspaceDetailsOnly } from "../../store/slices/workspaceSlice.js";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Badge, Avatar, AvatarFallback, AvatarImage } from "../../components/ui/select.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Button } from "../../components/ui/button.jsx";
import { LayoutGrid, List, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils.js";

export default function Members() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const { currentWorkspace, selectedWorkspaceId, loading } = useSelector((s) => s.workspace);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const activeId = workspaceId || selectedWorkspaceId;

  useEffect(() => {
    if (activeId) dispatch(fetchWorkspaceDetailsOnly(activeId));
  }, [activeId, dispatch]);

  if (loading && !currentWorkspace) return <Loader />;

  const members = currentWorkspace?.members || [];
  const filtered = members.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspace Members</h1>
          <p className="text-muted-foreground text-sm">{members.length} member{members.length !== 1 ? "s" : ""} in this workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 rounded-none", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 rounded-none border-l", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">{search ? "No members match your search" : "No members found"}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(({ user, role, joinedAt }) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                  <AvatarFallback className="text-xl">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 break-all">{user.email}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs capitalize font-semibold border",
                      role === "owner"
                        ? "text-blue-600 border-blue-400 bg-blue-50 dark:bg-blue-950 dark:text-blue-300"
                        : "text-green-600 border-green-400 bg-green-50 dark:bg-green-950 dark:text-green-300"
                    )}
                  >
                    {role}
                  </Badge>
                  {currentWorkspace?.name && (
                    <Badge variant="outline" className="text-xs">{currentWorkspace.name}</Badge>
                  )}
                </div>
                {joinedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    Joined {format(new Date(joinedAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>Avatar</span>
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {filtered.map(({ user, role, joinedAt }, idx) => (
            <div
              key={user._id}
              className={cn(
                "grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors",
                idx !== filtered.length - 1 && "border-b"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="text-sm">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs capitalize font-semibold border",
                  role === "owner"
                    ? "text-blue-600 border-blue-400 bg-blue-50 dark:bg-blue-950 dark:text-blue-300"
                    : "text-green-600 border-green-400 bg-green-50 dark:bg-green-950 dark:text-green-300"
                )}
              >
                {role}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {joinedAt ? format(new Date(joinedAt), "MMM d, yyyy") : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
