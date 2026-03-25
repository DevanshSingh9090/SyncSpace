import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { fetchWorkspaceDetails, setSelectedWorkspaceId } from "../../store/slices/workspaceSlice.js";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Progress, Badge } from "../../components/ui/select.jsx";
import { FolderKanban, CheckSquare, Clock, TrendingUp, CalendarDays } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn, getTaskStatusColor, getProjectProgress } from "../../lib/utils.js";
import { format } from "date-fns";

export default function Dashboard() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { currentWorkspace, currentProjects, stats, taskTrendsData, projectStatusData, taskPriorityData, workspaceProductivityData, upcomingTasks, recentProjects, loading, selectedWorkspaceId } = useSelector((s) => s.workspace);
  const { user } = useSelector((s) => s.auth);

  const workspaceId = searchParams.get("workspaceId") || selectedWorkspaceId;

  useEffect(() => {
    if (workspaceId) {
      dispatch(setSelectedWorkspaceId(workspaceId));
      dispatch(fetchWorkspaceDetails(workspaceId));
    }
  }, [workspaceId, dispatch]);

  if (loading && !stats) return <Loader />;

  if (!workspaceId) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold">No workspace selected</p>
      <p className="text-muted-foreground text-sm mt-1">Select or create a workspace using the switcher above</p>
      <Link to="/workspaces" className="mt-4 text-primary text-sm hover:underline">Go to Workspaces →</Link>
    </div>
  );

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: FolderKanban, color: "text-blue-600 bg-blue-50" },
    { label: "Total Tasks", value: stats?.totalTasks ?? 0, icon: CheckSquare, color: "text-purple-600 bg-purple-50" },
    { label: "In Progress", value: stats?.totalProjectInProgress ?? 0, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { label: "Completed Tasks", value: stats?.totalTaskCompleted ?? 0, icon: TrendingUp, color: "text-green-600 bg-green-50" },
  ];

  const trendData = taskTrendsData || [];
  const projStatusData = projectStatusData || [];
  const priorityData = taskPriorityData || [];
  const productivityData = workspaceProductivityData || [];
  const upcoming = upcomingTasks || [];
  const recent = recentProjects || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">{currentWorkspace?.name} — here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color)}><Icon className="h-5 w-5" /></div>
              </div>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Trends Line Chart (day of week) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Task Trends (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Completed" />
                <Line type="monotone" dataKey="inProgress" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="In Progress" />
                <Line type="monotone" dataKey="toDo" stroke="#6b7280" strokeWidth={2} dot={{ r: 4 }} name="To Do" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Task Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { name: "To Do", value: stats?.totalTaskToDo || 0, fill: "#6366f1" },
                  { name: "In Progress", value: stats?.totalTaskInProgress || 0, fill: "#f59e0b" },
                  { name: "Done", value: stats?.totalTaskCompleted || 0, fill: "#22c55e" },
                ]} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {[{}, {}, {}].map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Project Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={projStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {projStatusData.map((e, i) => <Cell key={i} fill={e.color || "#6366f1"} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Task Priority Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Project Productivity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" name="Done" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects + Upcoming Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Projects</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {recent.map((project) => {
                  const tasks = project.tasks || [];
                  const progress = getProjectProgress(tasks);
                  return (
                    <Link key={project._id} to={`/workspaces/${workspaceId}/projects/${project._id}`}>
                      <div className="p-3 rounded-lg border hover:border-primary hover:bg-muted/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium truncate flex-1">{project.title}</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2", getTaskStatusColor(project.status))}>{project.status}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground"><span>{tasks.length} tasks</span><span>{progress}%</span></div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Tasks</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", getTaskStatusColor(task.status))}>{task.status}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-3">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
