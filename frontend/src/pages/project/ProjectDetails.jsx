import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchProjectTasks, updateProject, deleteProject } from "../../store/slices/projectSlice.js";
import { createTask, updateTaskStatus } from "../../store/slices/taskSlice.js";
import { toast } from "sonner";
import { Loader, BackButton } from "../../components/shared.jsx";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/input.jsx";
import { Progress, Avatar, AvatarFallback, AvatarImage, Badge } from "../../components/ui/select.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/misc.jsx";
import { Checkbox } from "../../components/ui/misc.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form.jsx";
import { Plus, Loader2, CalendarDays, AlertCircle, Clock, CheckCircle, BookOpen, Settings, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn, getTaskStatusColor, getTaskPriorityColor, getProjectProgress } from "../../lib/utils.js";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Review", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().min(1, "Due date is required"),
  assignees: z.array(z.string()).min(1, "At least one assignee is required"),
});

function CreateTaskDialog({ open, onOpenChange, projectId, projectMembers }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.task);
  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", status: "To Do", priority: "Medium", dueDate: "", assignees: [] },
  });
  const onSubmit = async (values) => {
    const result = await dispatch(createTask({ projectId, taskData: values }));
    if (createTask.fulfilled.match(result)) {
      toast.success("Task created!");
      onOpenChange(false);
      form.reset();
      dispatch(fetchProjectTasks(projectId));
    } else {
      toast.error(result.payload || "Failed to create task");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title *</FormLabel><FormControl><Input placeholder="Task title" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Task details..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Due Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="assignees" render={({ field }) => (
              <FormItem><FormLabel>Assignees *</FormLabel>
                <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                  {projectMembers?.map(({ user }) => (
                    <label key={user._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                      <Checkbox checked={field.value?.includes(user._id)} onCheckedChange={(checked) => { const cur = field.value || []; field.onChange(checked ? [...cur, user._id] : cur.filter((id) => id !== user._id)); }} />
                      <Avatar className="h-6 w-6"><AvatarImage src={user.profilePicture} /><AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback></Avatar>
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))}
                </div><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({ task, onClick, projectId }) {
  const dispatch = useDispatch();
  const handleStatusChange = async (e, newStatus) => {
    e.stopPropagation();
    const result = await dispatch(updateTaskStatus({ taskId: task._id, status: newStatus }));
    if (updateTaskStatus.fulfilled.match(result)) { toast.success(`Moved to ${newStatus}`); dispatch(fetchProjectTasks(projectId)); }
  };
  const doneSubs = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubs = (task.subtasks || []).length;
  return (
    <Card onClick={() => onClick(task._id)} className="cursor-pointer hover:shadow-md transition-all group">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", getTaskPriorityColor(task.priority))}>{task.priority}</span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {task.status !== "To Do" && <button title="Mark To Do" onClick={(e) => handleStatusChange(e, "To Do")} className="p-0.5 rounded hover:bg-muted"><AlertCircle className="h-3.5 w-3.5 text-slate-500" /></button>}
            {task.status !== "In Progress" && <button title="Mark In Progress" onClick={(e) => handleStatusChange(e, "In Progress")} className="p-0.5 rounded hover:bg-muted"><Clock className="h-3.5 w-3.5 text-blue-500" /></button>}
            {task.status !== "Review" && <button title="Mark Review" onClick={(e) => handleStatusChange(e, "Review")} className="p-0.5 rounded hover:bg-muted"><BookOpen className="h-3.5 w-3.5 text-purple-500" /></button>}
            {task.status !== "Done" && <button title="Mark Done" onClick={(e) => handleStatusChange(e, "Done")} className="p-0.5 rounded hover:bg-muted"><CheckCircle className="h-3.5 w-3.5 text-green-500" /></button>}
          </div>
        </div>
        <p className="font-medium text-sm line-clamp-2">{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
        <div className="flex items-center justify-between">
          {task.assignees?.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 5).map((a) => (<Avatar key={a._id} className="h-5 w-5 border border-background" title={a.name}><AvatarImage src={a.profilePicture} /><AvatarFallback className="text-[9px]">{a.name?.charAt(0)}</AvatarFallback></Avatar>))}
              {task.assignees.length > 5 && <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px]">+{task.assignees.length - 5}</div>}
            </div>
          )}
          {task.dueDate && <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"><CalendarDays className="h-3 w-3" />{format(new Date(task.dueDate), "MMM d")}</span>}
        </div>
        {totalSubs > 0 && <p className="text-xs text-muted-foreground">{doneSubs}/{totalSubs} subtasks</p>}
      </CardContent>
    </Card>
  );
}

function TaskColumn({ status, tasks, onTaskClick, projectId }) {
  const icons = { "To Do": <AlertCircle className="h-4 w-4 text-slate-500" />, "In Progress": <Clock className="h-4 w-4 text-blue-500" />, "Review": <BookOpen className="h-4 w-4 text-purple-500" />, "Done": <CheckCircle className="h-4 w-4 text-green-500" /> };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        {icons[status]}<span className="font-medium text-sm">{status}</span>
        <Badge variant="outline" className="ml-auto text-xs">{tasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => <TaskCard key={task._id} task={task} onClick={onTaskClick} projectId={projectId} />)}
        {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">No tasks</p>}
      </div>
    </div>
  );
}

const PROJECT_STATUSES = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
const COLORS_PLACEHOLDER = [];

function EditProjectDialog({ open, onOpenChange, project, workspaceId }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.project);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    status: project?.status || "Planning",
    startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
    dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : "",
    tags: project?.tags?.join(", ") || "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [tab, setTab] = useState("edit");

  const handleUpdate = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProject({ projectId: project._id, data: form }));
    if (updateProject.fulfilled.match(result)) {
      toast.success("Project updated!");
      onOpenChange(false);
      dispatch(fetchProjectTasks(project._id));
    } else { toast.error(result.payload || "Failed to update project"); }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== project.title) { toast.error("Please type the project name to confirm"); return; }
    const result = await dispatch(deleteProject(project._id));
    if (deleteProject.fulfilled.match(result)) {
      toast.success("Project deleted");
      onOpenChange(false);
      navigate(`/workspaces/${workspaceId}`);
    } else { toast.error(result.payload || "Failed to delete project"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Project Settings</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1"><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit</TabsTrigger>
            <TabsTrigger value="danger" className="flex-1 text-destructive"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={1} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Input placeholder="design, api" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="danger" className="mt-4 space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">Delete Project</p>
              <p className="text-xs text-destructive/80 mt-1">This will permanently delete all tasks in this project. This cannot be undone.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type <strong>{project?.title}</strong> to confirm</label>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={project?.title} />
            </div>
            <Button variant="destructive" onClick={handleDelete} disabled={loading || deleteConfirm !== project?.title} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />{loading ? "Deleting..." : "Delete Project"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectDetails() {
  const dispatch = useDispatch();
  const { projectId, workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentProject, tasks, loading } = useSelector((s) => s.project);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { if (projectId) dispatch(fetchProjectTasks(projectId)); }, [projectId, dispatch]);

  if (loading && !currentProject) return <Loader />;
  if (!currentProject) return <div className="text-center py-16 text-muted-foreground">Project not found.</div>;

  const progress = getProjectProgress(tasks);
  const byStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s) }), {});
  const handleTaskClick = (taskId) => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{currentProject.title}</h1>
          {currentProject.description && <p className="text-sm text-muted-foreground mt-1">{currentProject.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-36">
            <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
            <Progress value={progress} className="h-2 flex-1" />
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Task</Button>
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} title="Project Settings"><Settings className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <span key={s} className={cn("text-xs px-2.5 py-1 rounded-full font-medium", getTaskStatusColor(s))}>
            {byStatus[s]?.length || 0} {s}
          </span>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          {STATUSES.map((s) => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid md:grid-cols-4 gap-6">
            {STATUSES.map((s) => <TaskColumn key={s} status={s} tasks={byStatus[s]} onTaskClick={handleTaskClick} projectId={projectId} />)}
          </div>
        </TabsContent>
        {STATUSES.map((s) => (
          <TabsContent key={s} value={s} className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byStatus[s].map((task) => <TaskCard key={task._id} task={task} onClick={handleTaskClick} projectId={projectId} />)}
              {byStatus[s].length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-12">No tasks with status "{s}"</p>}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} projectMembers={currentProject.members} />
      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={currentProject} workspaceId={workspaceId} />
    </div>
  );
}
