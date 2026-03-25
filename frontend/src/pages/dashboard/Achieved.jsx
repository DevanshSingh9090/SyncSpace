import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMyTasks } from "../../store/slices/taskSlice.js";
import { fetchArchivedProjects } from "../../store/slices/projectSlice.js";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Badge } from "../../components/ui/select.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/misc.jsx";
import { CalendarDays, CheckCircle2, FolderArchive, Archive } from "lucide-react";
import { format } from "date-fns";
import { cn, getTaskPriorityColor, getTaskStatusColor, getProjectProgress } from "../../lib/utils.js";
import { Progress } from "../../components/ui/select.jsx";

export default function Achieved() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const { myTasks, loading: taskLoading } = useSelector((s) => s.task);
  const { archivedProjects, loading: projectLoading } = useSelector((s) => s.project);
  const { selectedWorkspaceId } = useSelector((s) => s.workspace);

  const activeWorkspaceId = workspaceId || selectedWorkspaceId;

  useEffect(() => { dispatch(fetchMyTasks()); }, [dispatch]);
  useEffect(() => {
    if (activeWorkspaceId) dispatch(fetchArchivedProjects(activeWorkspaceId));
  }, [activeWorkspaceId, dispatch]);

  const archivedTasks = myTasks.filter((t) => t.isArchived);

  if (taskLoading || projectLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Archives</h1>
        <p className="text-muted-foreground">Your archived tasks and projects</p>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Archived Tasks ({archivedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderArchive className="h-4 w-4" />
            Archived Projects ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Archived Tasks ── */}
        <TabsContent value="tasks" className="mt-6">
          {archivedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No archived tasks</p>
                <p className="text-sm text-muted-foreground mt-1">Tasks you archive will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {archivedTasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/workspaces/${task.project?.workspace}/projects/${task.project?._id}/tasks/${task._id}`}
                >
                  <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTaskStatusColor(task.status))}>{task.status}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTaskPriorityColor(task.priority))}>{task.priority}</span>
                              {task.project?.title && (
                                <span className="text-xs text-muted-foreground">· {task.project.title}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs mt-1">Archived</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Archived Projects ── */}
        <TabsContent value="projects" className="mt-6">
          {!activeWorkspaceId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FolderArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a workspace to see its archived projects</p>
              </CardContent>
            </Card>
          ) : archivedProjects.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FolderArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No archived projects</p>
                <p className="text-sm text-muted-foreground mt-1">Archived projects will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedProjects.map((project) => {
                const tasks = project.tasks || [];
                const progress = getProjectProgress(tasks);
                return (
                  <Card key={project._id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">{project.title}</CardTitle>
                        <Badge variant="outline" className="text-xs shrink-0 ml-1">Archived</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span><span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
                          {project.dueDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />{format(new Date(project.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
