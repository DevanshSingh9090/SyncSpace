import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchTaskById, updateTaskTitle, updateTaskDescription,
  updateTaskStatus, updateTaskPriority, updateTaskAssignees,
  addSubTask, updateSubTask, fetchComments, addComment,
  fetchActivity, watchTask, archiveTask, clearCurrentTask, deleteTask,
  addTaskAttachment, deleteTaskAttachment, toggleCommentReaction,
} from "../../store/slices/taskSlice.js";
import { fetchProjectTasks } from "../../store/slices/projectSlice.js";
import { toast } from "sonner";
import { Loader, BackButton } from "../../components/shared.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/input.jsx";
import { Avatar, AvatarFallback, AvatarImage, Badge, Progress } from "../../components/ui/select.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/misc.jsx";
import { Checkbox } from "../../components/ui/misc.jsx";
import { ScrollArea } from "../../components/ui/misc.jsx";
import { Separator } from "../../components/ui/misc.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import {
  Eye, EyeOff, Plus, Check, X, Pencil, Loader2, CalendarDays,
  MessageSquare, Activity, ListTodo, Trash2,
  CheckSquare, FileEdit, CheckCircle, FolderPlus, FolderEdit, CheckCircle2,
  Building2, UserPlus, UserMinus, LogIn, Upload, Paperclip, ExternalLink, SmilePlus,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn, getTaskStatusColor, getTaskPriorityColor } from "../../lib/utils.js";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

function ActivityIcon({ action }) {
  const map = {
    created_task: { icon: CheckSquare, color: "bg-green-600/10 text-green-600" },
    created_subtask: { icon: CheckSquare, color: "bg-emerald-600/10 text-emerald-600" },
    updated_task: { icon: FileEdit, color: "bg-blue-600/10 text-blue-600" },
    updated_subtask: { icon: FileEdit, color: "bg-blue-600/10 text-blue-600" },
    completed_task: { icon: CheckCircle, color: "bg-green-600/10 text-green-600" },
    created_project: { icon: FolderPlus, color: "bg-blue-600/10 text-blue-600" },
    updated_project: { icon: FolderEdit, color: "bg-blue-600/10 text-blue-600" },
    completed_project: { icon: CheckCircle2, color: "bg-green-600/10 text-green-600" },
    created_workspace: { icon: Building2, color: "bg-blue-600/10 text-blue-600" },
    added_comment: { icon: MessageSquare, color: "bg-blue-600/10 text-blue-600" },
    added_member: { icon: UserPlus, color: "bg-blue-600/10 text-blue-600" },
    removed_member: { icon: UserMinus, color: "bg-red-600/10 text-red-600" },
    joined_workspace: { icon: LogIn, color: "bg-blue-600/10 text-blue-600" },
    added_attachment: { icon: Upload, color: "bg-blue-600/10 text-blue-600" },
  };
  const cfg = map[action] || { icon: FileEdit, color: "bg-gray-100 text-gray-500" };
  const Icon = cfg.icon;
  return <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", cfg.color)}><Icon className="h-4 w-4" /></div>;
}

function EditableField({ value, onSave, multiline = false, placeholder = "Click to edit..." }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  useEffect(() => { setVal(value || ""); }, [value]);
  const handleSave = () => { if (val !== value) onSave(val); setEditing(false); };
  if (editing) return (
    <div className="flex gap-2 items-start">
      {multiline
        ? <Textarea value={val} onChange={(e) => setVal(e.target.value)} autoFocus className="flex-1 text-sm" rows={3} />
        : <Input value={val} onChange={(e) => setVal(e.target.value)} autoFocus className="flex-1 h-8 text-sm" />}
      <div className="flex gap-1 mt-1">
        <Button size="icon" className="h-7 w-7" onClick={handleSave}><Check className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setVal(value || ""); setEditing(false); }}><X className="h-3 w-3" /></Button>
      </div>
    </div>
  );
  return (
    <div onClick={() => setEditing(true)} className="group flex items-start gap-2 cursor-pointer rounded-md p-1 -ml-1 hover:bg-muted/50 transition-colors">
      <span className={cn("text-sm flex-1", !value && "text-muted-foreground")}>{value || placeholder}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 mt-1 shrink-0" />
    </div>
  );
}

function AssigneesSelector({ task, projectMembers }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.task);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState((task.assignees || []).map((a) => a._id || a));
  useEffect(() => { setSelectedIds((task.assignees || []).map((a) => a._id || a)); }, [task.assignees]);
  const handleSave = async () => {
    const result = await dispatch(updateTaskAssignees({ taskId: task._id, assignees: selectedIds }));
    if (updateTaskAssignees.fulfilled.match(result)) { toast.success("Assignees updated"); setOpen(false); }
    else toast.error("Failed to update assignees");
  };
  const toggle = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {selectedIds.length === 0 ? <span className="text-xs text-muted-foreground">Unassigned</span>
          : (projectMembers || []).filter((m) => selectedIds.includes(m.user._id)).map((m) => (
            <div key={m.user._id} className="flex items-center bg-muted rounded px-1.5 py-0.5 gap-1">
              <Avatar className="h-4 w-4"><AvatarImage src={m.user.profilePicture} /><AvatarFallback className="text-[9px]">{m.user.name?.charAt(0)}</AvatarFallback></Avatar>
              <span className="text-xs">{m.user.name}</span>
            </div>
          ))}
      </div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-muted-foreground w-full border rounded px-2 py-1.5 text-left hover:bg-muted/50 transition-colors">
          {selectedIds.length === 0 ? "Select assignees" : `${selectedIds.length} selected — click to edit`}
        </button>
      ) : (
        <div className="border rounded shadow-sm bg-background">
          <div className="flex justify-between px-2 py-1 border-b">
            <button onClick={() => setSelectedIds((projectMembers || []).map((m) => m.user._id))} className="text-xs text-blue-600 hover:underline">Select all</button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-red-600 hover:underline">Clear all</button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {(projectMembers || []).map((m) => (
              <label key={m.user._id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50">
                <Checkbox checked={selectedIds.includes(m.user._id)} onCheckedChange={() => toggle(m.user._id)} />
                <Avatar className="h-6 w-6"><AvatarImage src={m.user.profilePicture} /><AvatarFallback className="text-xs">{m.user.name?.charAt(0)}</AvatarFallback></Avatar>
                <span className="text-sm">{m.user.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between px-2 py-1.5 border-t gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="flex-1" disabled={loading} onClick={handleSave}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WatchersList({ watchers }) {
  return (
    <div className="space-y-2">
      {watchers?.length > 0 ? watchers.map((w) => (
        <div key={w._id || w} className="flex items-center gap-2">
          <Avatar className="h-6 w-6"><AvatarImage src={w.profilePicture} /><AvatarFallback className="text-xs">{w.name?.charAt(0)}</AvatarFallback></Avatar>
          <span className="text-sm text-muted-foreground">{w.name}</span>
        </div>
      )) : <p className="text-xs text-muted-foreground">No watchers</p>}
    </div>
  );
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

function CommentsSection({ taskId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { comments, commentLoading } = useSelector((s) => s.task);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  useEffect(() => { dispatch(fetchComments(taskId)); }, [taskId, dispatch]);
  const handlePost = async () => {
    if (!text.trim()) return;
    const result = await dispatch(addComment({ taskId, text }));
    if (addComment.fulfilled.match(result)) { setText(""); toast.success("Comment posted"); }
    else toast.error("Failed to post comment");
  };
  const handleReaction = (commentId, emoji) => {
    dispatch(toggleCommentReaction({ commentId, emoji }));
    setShowEmojiPicker(null);
  };
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[280px] pr-2">
        {commentLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          : comments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          : <div className="space-y-4">
            {comments.map((c) => {
              const reactionMap = {};
              (c.reactions || []).forEach((r) => {
                if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, hasMe: false };
                reactionMap[r.emoji].count++;
                if (r.user === user?._id || r.user?._id === user?._id) reactionMap[r.emoji].hasMe = true;
              });
              return (
                <div key={c._id} className="flex gap-3 group">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5"><AvatarImage src={c.author?.profilePicture} /><AvatarFallback className="text-xs">{c.author?.name?.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.author?.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm break-words">{c.text}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {Object.entries(reactionMap).map(([emoji, data]) => (
                        <button key={emoji} onClick={() => handleReaction(c._id, emoji)}
                          className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                            data.hasMe ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300" : "bg-muted border-border hover:bg-muted/70")}>
                          <span>{emoji}</span><span>{data.count}</span>
                        </button>
                      ))}
                      <div className="relative">
                        <button onClick={() => setShowEmojiPicker(showEmojiPicker === c._id ? null : c._id)}
                          className="h-5 w-5 rounded-full border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                          <SmilePlus className="h-3 w-3" />
                        </button>
                        {showEmojiPicker === c._id && (
                          <div className="absolute bottom-full left-0 mb-1 z-20 bg-card border rounded-lg shadow-lg p-2 flex gap-1 flex-wrap w-44">
                            {REACTION_EMOJIS.map((e) => (
                              <button key={e} onClick={() => handleReaction(c._id, e)} className="text-base hover:scale-125 transition-transform p-0.5">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
      </ScrollArea>
      <Separator />
      <div className="space-y-2">
        <Textarea placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        <div className="flex justify-end">
          <Button size="sm" onClick={handlePost} disabled={!text.trim() || commentLoading}>
            {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttachmentsSection({ task }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.task);
  const [mode, setMode] = useState("url"); // url | upload
  const [form, setForm] = useState({ fileName: "", fileUrl: "", fileType: "" });
  const fileInputRef = useRef(null);

  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!form.fileName || !form.fileUrl) { toast.error("Name and URL are required"); return; }
    const result = await dispatch(addTaskAttachment({ taskId: task._id, data: { ...form, fileType: form.fileType || "link" } }));
    if (addTaskAttachment.fulfilled.match(result)) { setForm({ fileName: "", fileUrl: "", fileType: "" }); toast.success("Attachment added!"); }
    else toast.error(result.payload || "Failed to add attachment");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const result = await dispatch(addTaskAttachment({ taskId: task._id, data: { fileName: file.name, fileUrl: dataUrl, fileType: file.type, fileSize: file.size } }));
      if (addTaskAttachment.fulfilled.match(result)) toast.success("File attached!");
      else toast.error(result.payload || "Failed to attach file");
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (attachmentId) => {
    const result = await dispatch(deleteTaskAttachment({ taskId: task._id, attachmentId }));
    if (deleteTaskAttachment.fulfilled.match(result)) toast.success("Attachment removed");
    else toast.error(result.payload || "Failed to remove attachment");
  };

  const attachments = task.attachments || [];

  return (
    <div className="space-y-4">
      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a._id} className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-muted/50 group">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.fileName}</p>
                {a.fileSize && <p className="text-xs text-muted-foreground">{(a.fileSize / 1024).toFixed(1)} KB</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Open"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </a>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a._id)} disabled={loading} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Add attachment */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "url" ? "default" : "outline"} onClick={() => setMode("url")} className="h-7 text-xs">By URL</Button>
          <Button size="sm" variant={mode === "upload" ? "default" : "outline"} onClick={() => setMode("upload")} className="h-7 text-xs">Upload File</Button>
        </div>
        {mode === "url" ? (
          <form onSubmit={handleAddUrl} className="space-y-2">
            <Input placeholder="Attachment name" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} className="h-8 text-sm" />
            <Input placeholder="https://..." type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="h-8 text-sm" />
            <Button type="submit" size="sm" disabled={loading} className="h-7 text-xs">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Link"}
            </Button>
          </form>
        ) : (
          <div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading} className="h-7 text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {loading ? "Uploading..." : "Choose File (max 5MB)"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivitySection({ taskId }) {
  const dispatch = useDispatch();
  const { activity, activityLoading } = useSelector((s) => s.task);
  useEffect(() => { dispatch(fetchActivity(taskId)); }, [taskId, dispatch]);
  if (activityLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <ScrollArea className="h-[320px] pr-2">
      {activity.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
        : <div className="space-y-3">
          {activity.map((log) => (
            <div key={log._id} className="flex gap-3">
              <ActivityIcon action={log.action} />
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-medium">{log.user?.name}</span> <span className="text-muted-foreground">{log.details?.description || log.action}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>}
    </ScrollArea>
  );
}

function SubTasksSection({ taskId, subtasks }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.task);
  const [newTitle, setNewTitle] = useState("");
  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const result = await dispatch(addSubTask({ taskId, title: newTitle }));
    if (addSubTask.fulfilled.match(result)) { setNewTitle(""); toast.success("Subtask added"); }
    else toast.error("Failed");
  };
  const handleToggle = async (subTaskId, completed) => {
    const result = await dispatch(updateSubTask({ taskId, subTaskId, completed }));
    if (!updateSubTask.fulfilled.match(result)) toast.error("Failed");
  };
  const done = subtasks?.filter((s) => s.completed).length || 0;
  const total = subtasks?.length || 0;
  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground"><span>{done}/{total} completed</span><span>{total ? Math.round((done / total) * 100) : 0}%</span></div>
          <Progress value={total ? Math.round((done / total) * 100) : 0} className="h-1.5" />
        </div>
      )}
      <div className="space-y-1.5">
        {subtasks?.map((sub) => (
          <div key={sub._id} className="flex items-center gap-2 py-1">
            <Checkbox checked={sub.completed} onCheckedChange={(c) => handleToggle(sub._id, c)} disabled={loading} />
            <span className={cn("text-sm flex-1", sub.completed && "line-through text-muted-foreground")}>{sub.title}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Add subtask..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="h-8 text-sm" />
        <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || loading}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export default function TaskDetails() {
  const dispatch = useDispatch();
  const { taskId, workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentTask, currentProject, loading } = useSelector((s) => s.task);
  const { user } = useSelector((s) => s.auth);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => { if (taskId) dispatch(fetchTaskById(taskId)); return () => dispatch(clearCurrentTask()); }, [taskId, dispatch]);

  if (loading && !currentTask) return <Loader />;
  if (!currentTask) return <div className="text-center py-16 text-muted-foreground">Task not found.</div>;

  const isWatching = currentTask.watchers?.some((w) => (w._id || w) === user?._id);

  const handleUpdateTitle = async (title) => { const r = await dispatch(updateTaskTitle({ taskId, title })); if (!updateTaskTitle.fulfilled.match(r)) toast.error("Failed"); };
  const handleUpdateDescription = async (description) => { const r = await dispatch(updateTaskDescription({ taskId, description })); if (!updateTaskDescription.fulfilled.match(r)) toast.error("Failed"); };
  const handleUpdateStatus = async (status) => { const r = await dispatch(updateTaskStatus({ taskId, status })); if (!updateTaskStatus.fulfilled.match(r)) toast.error("Failed"); };
  const handleUpdatePriority = async (priority) => { const r = await dispatch(updateTaskPriority({ taskId, priority })); if (!updateTaskPriority.fulfilled.match(r)) toast.error("Failed"); };
  const handleWatchToggle = async () => { const r = await dispatch(watchTask(taskId)); if (watchTask.fulfilled.match(r)) toast.success(isWatching ? "Stopped watching" : "Now watching"); };
  const handleArchive = async () => {
    const r = await dispatch(archiveTask(taskId));
    if (archiveTask.fulfilled.match(r)) toast.success(currentTask.isArchived ? "Task unarchived" : "Task archived");
    else toast.error("Failed");
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteTask(taskId));
    if (deleteTask.fulfilled.match(r)) {
      toast.success("Task deleted");
      if (projectId && workspaceId) {
        dispatch(fetchProjectTasks(projectId));
        navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
      } else {
        navigate(-1);
      }
    } else {
      toast.error("Failed to delete task");
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <BackButton />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={currentTask.priority === "High" ? "destructive" : currentTask.priority === "Medium" ? "default" : "outline"} className="capitalize">
            {currentTask.priority} Priority
          </Badge>
          {currentTask.isArchived && <Badge variant="outline">Archived</Badge>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleWatchToggle} disabled={loading}>
            {isWatching ? <><EyeOff className="h-4 w-4 mr-1.5" />Unwatch</> : <><Eye className="h-4 w-4 mr-1.5" />Watch</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={loading}>
            {currentTask.isArchived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-1.5" />Delete Task
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created {formatDistanceToNow(new Date(currentTask.createdAt), { addSuffix: true })}</p>
            <EditableField value={currentTask.title} onSave={handleUpdateTitle} placeholder="Task title" />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle></CardHeader>
            <CardContent>
              <EditableField value={currentTask.description} onSave={handleUpdateDescription} multiline placeholder="Add a description..." />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="subtasks">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="subtasks"><ListTodo className="h-4 w-4 mr-1.5" />Subtasks</TabsTrigger>
                  <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-1.5" />Comments</TabsTrigger>
                  <TabsTrigger value="attachments"><Paperclip className="h-4 w-4 mr-1.5" />Files</TabsTrigger>
                  <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1.5" />Activity</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="subtasks"><SubTasksSection taskId={taskId} subtasks={currentTask.subtasks} /></TabsContent>
                  <TabsContent value="comments"><CommentsSection taskId={taskId} /></TabsContent>
                  <TabsContent value="attachments"><AttachmentsSection task={currentTask} /></TabsContent>
                  <TabsContent value="activity"><ActivitySection taskId={taskId} /></TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: properties */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Properties</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <Select value={currentTask.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Priority</p>
                <Select value={currentTask.priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {currentTask.dueDate && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Due Date</p>
                  <div className="flex items-center gap-1.5 text-sm"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{format(new Date(currentTask.dueDate), "MMM d, yyyy")}</div>
                </div>
              )}
              {currentTask.estimatedHours && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Estimated Hours</p>
                  <p className="text-sm">{currentTask.estimatedHours}h</p>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Assignees</p>
                <AssigneesSelector task={currentTask} projectMembers={currentProject?.members} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Watchers ({currentTask.watchers?.length || 0})</p>
                <Card className="border-dashed">
                  <CardContent className="p-3"><WatchersList watchers={currentTask.watchers} /></CardContent>
                </Card>
                <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={handleWatchToggle}>
                  {isWatching ? <><EyeOff className="h-3 w-3 mr-1.5" />Unwatch</> : <><Eye className="h-3 w-3 mr-1.5" />Watch</>}
                </Button>
              </div>
              <Separator />
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Created</span><span>{format(new Date(currentTask.createdAt), "MMM d, yyyy")}</span></div>
                <div className="flex justify-between"><span>Updated</span><span>{formatDistanceToNow(new Date(currentTask.updatedAt), { addSuffix: true })}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>"{currentTask.title}"</strong>? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
