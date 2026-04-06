import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMyTasks } from "../../store/slices/taskSlice.js";
import { fetchWorkspaceDetailsOnly } from "../../store/slices/workspaceSlice.js";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Badge, Avatar, AvatarFallback, AvatarImage } from "../../components/ui/select.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/misc.jsx";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../../components/ui/misc.jsx";
import { cn, getTaskStatusColor, getTaskPriorityColor } from "../../lib/utils.js";
import { CalendarDays, Filter, ArrowUpDown, CheckCircle, Clock, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export function MyTasks() {
  const dispatch = useDispatch();
  const { myTasks, loading } = useSelector((s) => s.task);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [sortDir, setSortDir] = useState(searchParams.get("sort") || "desc");
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => { dispatch(fetchMyTasks()); }, [dispatch]);

  useEffect(() => {
    const params = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    params.filter = filter;
    params.sort = sortDir;
    params.search = search;
    setSearchParams(params, { replace: true });
  }, [filter, sortDir, search]);

  if (loading) return <Loader />;

  const filtered = myTasks
    .filter((t) => {
      if (filter === "todo") return t.status === "To Do";
      if (filter === "inprogress") return t.status === "In Progress";
      if (filter === "done") return t.status === "Done";
      if (filter === "high") return t.priority === "High";
      return true;
    })
    .filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    );

  const sorted = [...filtered].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return sortDir === "asc"
        ? new Date(a.dueDate) - new Date(b.dueDate)
        : new Date(b.dueDate) - new Date(a.dueDate);
    }
    return 0;
  });

  const todoTasks = sorted.filter((t) => t.status === "To Do");
  const inProgressTasks = sorted.filter((t) => t.status === "In Progress");
  const doneTasks = sorted.filter((t) => t.status === "Done");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">All tasks assigned to you ({sorted.length})</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
            <ArrowUpDown className="h-4 w-4 mr-1.5" />
            {sortDir === "asc" ? "Oldest First" : "Newest First"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1.5" />Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[["all","All Tasks"],["todo","To Do"],["inprogress","In Progress"],["done","Done"],["high","High Priority"]].map(([v,l]) => (
                <DropdownMenuItem key={v} onClick={() => setFilter(v)} className={filter === v ? "bg-accent" : ""}>{l}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>

        {/* LIST VIEW */}
        <TabsContent value="list">
          {sorted.length === 0 ? (
            <Card><CardContent className="py-16 text-center"><p className="text-muted-foreground">No tasks found.</p></CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>My Tasks</CardTitle><CardDescription>{sorted.length} tasks</CardDescription></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {sorted.map((task) => (
                    <div key={task._id} className="p-4 hover:bg-muted/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {task.status === "Done" ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <Clock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}
                          <div>
                            <Link
                              to={`/workspaces/${task.project?.workspace}/projects/${task.project?._id}/tasks/${task._id}`}
                              className="font-medium hover:text-primary hover:underline flex items-center gap-1"
                            >
                              {task.title}<ArrowUpRight className="h-3 w-3" />
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTaskStatusColor(task.status))}>{task.status}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTaskPriorityColor(task.priority))}>{task.priority}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5 text-right">
                          {task.dueDate && <div>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</div>}
                          <div>Project: <span className="font-medium">{task.project?.title}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BOARD VIEW */}
        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[["To Do", todoTasks], ["In Progress", inProgressTasks], ["Done", doneTasks]].map(([title, tasks]) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {title}
                    <Badge variant="outline">{tasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tasks.map((task) => (
                    <Link key={task._id} to={`/workspaces/${task.project?.workspace}/projects/${task.project?._id}/tasks/${task._id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer p-3">
                        <p className="font-medium text-sm mb-1">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description || "No description"}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", getTaskPriorityColor(task.priority))}>{task.priority}</span>
                          {task.dueDate && <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), "MMM d")}</span>}
                        </div>
                      </Card>
                    </Link>
                  ))}
                  {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Members export for backward compat
export function Members() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const { currentWorkspace, selectedWorkspaceId, loading } = useSelector((s) => s.workspace);
  const [search, setSearch] = useState("");
  const activeId = workspaceId || selectedWorkspaceId;
  useEffect(() => { if (activeId) dispatch(fetchWorkspaceDetailsOnly(activeId)); }, [activeId, dispatch]);
  if (loading && !currentWorkspace) return <Loader />;
  const members = currentWorkspace?.members || [];
  const filtered = members.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Workspace Members</h1></div>
      <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(({ user, role, joinedAt }) => (
          <Card key={user._id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge variant="outline" className="text-xs capitalize mt-1">{role}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MyTasks;
