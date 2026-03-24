import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchWorkspaceDetails, inviteMember, updateWorkspace, deleteWorkspace, transferWorkspaceOwnership } from "../../store/slices/workspaceSlice.js";
import { createProject } from "../../store/slices/projectSlice.js";
import { toast } from "sonner";
import { Loader, NoDataFound, BackButton } from "../../components/shared.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label, Textarea } from "../../components/ui/input.jsx";
import { Progress, Avatar, AvatarFallback, AvatarImage, Badge } from "../../components/ui/select.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/misc.jsx";
import { Separator } from "../../components/ui/misc.jsx";
import { Users, Plus, FolderKanban, CalendarDays, Loader2, UserPlus, Copy, Check, Mail, Settings, Trash2, ArrowRightLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn, getTaskStatusColor, getProjectProgress } from "../../lib/utils.js";

const PROJECT_STATUSES = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
const MEMBER_ROLES = ["admin", "member", "viewer"];
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function WorkspaceAvatar({ name, color, size = "md" }) {
  const sizes = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-14 w-14 text-xl" };
  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-bold shrink-0`} style={{ backgroundColor: color }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

function CreateProjectDialog({ open, onOpenChange, workspaceId, workspaceMembers }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.project);
  const [form, setForm] = useState({ title: "", description: "", status: "Planning", startDate: "", dueDate: "", tags: "" });
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createProject({ workspaceId, data: { ...form, members: selectedMembers } }));
    if (createProject.fulfilled.match(result)) {
      toast.success("Project created!");
      onOpenChange(false);
      setForm({ title: "", description: "", status: "Planning", startDate: "", dueDate: "", tags: "" });
      setSelectedMembers([]);
      dispatch(fetchWorkspaceDetails(workspaceId));
    } else { toast.error(result.payload || "Failed to create project"); }
  };

  const toggleMember = (userId) =>
    setSelectedMembers((prev) => prev.find((m) => m.user === userId) ? prev.filter((m) => m.user !== userId) : [...prev, { user: userId, role: "contributor" }]);
  const updateMemberRole = (userId, role) => setSelectedMembers((prev) => prev.map((m) => m.user === userId ? { ...m, role } : m));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Title *</Label><Input placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tags (comma separated)</Label><Input placeholder="design, frontend" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          {workspaceMembers?.length > 0 && (
            <div className="space-y-2">
              <Label>Add Members</Label>
              <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                {workspaceMembers.map(({ user }) => (
                  <label key={user._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                    <input type="checkbox" checked={!!selectedMembers.find((m) => m.user === user._id)} onChange={() => toggleMember(user._id)} className="rounded" />
                    <Avatar className="h-6 w-6"><AvatarImage src={user.profilePicture} /><AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-sm flex-1">{user.name}</span>
                    {selectedMembers.find((m) => m.user === user._id) && (
                      <select className="text-xs border rounded px-1 py-0.5 bg-background" value={selectedMembers.find((m) => m.user === user._id)?.role || "contributor"} onChange={(e) => { e.stopPropagation(); updateMemberRole(user._id, e.target.value); }} onClick={(e) => e.stopPropagation()}>
                        <option value="manager">Manager</option><option value="contributor">Contributor</option><option value="viewer">Viewer</option>
                      </select>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteMemberDialog({ open, onOpenChange, workspaceId }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.workspace);
  const [form, setForm] = useState({ email: "", role: "member" });
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(inviteMember({ workspaceId, data: form }));
    if (inviteMember.fulfilled.match(result)) { toast.success("Invitation sent!"); onOpenChange(false); setForm({ email: "", role: "member" }); }
    else { toast.error(result.payload || "Failed to send invite"); }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/workspace-invite/${workspaceId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite to Workspace</DialogTitle></DialogHeader>
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1.5" />Send Email</TabsTrigger>
            <TabsTrigger value="link"><Copy className="h-4 w-4 mr-1.5" />Share Link</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="colleague@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MEMBER_ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : "Send Invite"}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Share this link to invite people</Label>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/workspace-invite/${workspaceId}`} className="text-xs" />
                <Button type="button" onClick={handleCopyLink} className="shrink-0">
                  {linkCopied ? <><Check className="h-4 w-4 mr-1.5" />Copied</> : <><Copy className="h-4 w-4 mr-1.5" />Copy</>}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Anyone with this link can join this workspace.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceSettingsDialog({ open, onOpenChange, workspace }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.workspace);
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: workspace?.name || "", description: workspace?.description || "", color: workspace?.color || COLORS[0] });
  const [transferTo, setTransferTo] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [tab, setTab] = useState("general");

  const isOwner = workspace?.members?.find((m) => m.user._id === user?._id && m.role === "owner");
  const isAdmin = workspace?.members?.find((m) => m.user._id === user?._id && ["owner", "admin"].includes(m.role));
  const eligibleForTransfer = workspace?.members?.filter((m) => m.user._id !== user?._id && m.role !== "viewer") || [];

  const handleUpdate = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateWorkspace({ workspaceId: workspace._id, data: form }));
    if (updateWorkspace.fulfilled.match(result)) { toast.success("Workspace updated!"); onOpenChange(false); }
    else { toast.error(result.payload || "Failed to update workspace"); }
  };

  const handleTransfer = async () => {
    if (!transferTo) { toast.error("Please select a member to transfer ownership to"); return; }
    const result = await dispatch(transferWorkspaceOwnership({ workspaceId: workspace._id, newOwnerId: transferTo }));
    if (transferWorkspaceOwnership.fulfilled.match(result)) {
      toast.success("Ownership transferred successfully");
      onOpenChange(false);
      dispatch(fetchWorkspaceDetails(workspace._id));
    } else { toast.error(result.payload || "Failed to transfer ownership"); }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== workspace.name) { toast.error("Please type the workspace name to confirm"); return; }
    const result = await dispatch(deleteWorkspace(workspace._id));
    if (deleteWorkspace.fulfilled.match(result)) {
      toast.success("Workspace deleted");
      onOpenChange(false);
      navigate("/workspaces");
    } else { toast.error(result.payload || "Failed to delete workspace"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Workspace Settings</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            {isOwner && <TabsTrigger value="transfer" className="flex-1">Transfer</TabsTrigger>}
            {isOwner && <TabsTrigger value="danger" className="flex-1 text-destructive">Danger</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="mt-4">
            {isAdmin ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2"><Label>Workspace Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}</Button>
                </DialogFooter>
              </form>
            ) : <p className="text-sm text-muted-foreground py-4">Only admins and owners can edit workspace settings.</p>}
          </TabsContent>

          {isOwner && (
            <TabsContent value="transfer" className="mt-4 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800 font-medium">Transfer Ownership</p>
                <p className="text-xs text-amber-700 mt-1">You will become an admin after transferring. This cannot be undone without the new owner's help.</p>
              </div>
              <div className="space-y-2">
                <Label>Transfer to</Label>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                  <SelectContent>
                    {eligibleForTransfer.map(({ user: u }) => (
                      <SelectItem key={u._id} value={u._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5"><AvatarImage src={u.profilePicture} /><AvatarFallback className="text-[9px]">{u.name?.charAt(0)}</AvatarFallback></Avatar>
                          {u.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTransfer} disabled={loading || !transferTo} className="w-full">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {loading ? "Transferring..." : "Transfer Ownership"}
              </Button>
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="danger" className="mt-4 space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Delete Workspace</p>
                <p className="text-xs text-destructive/80 mt-1">This will permanently delete the workspace, all its projects, and tasks. This action cannot be undone.</p>
              </div>
              <div className="space-y-2">
                <Label>Type <strong>{workspace?.name}</strong> to confirm</Label>
                <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={workspace?.name} />
              </div>
              <Button variant="destructive" onClick={handleDelete} disabled={loading || deleteConfirm !== workspace?.name} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Deleting..." : "Delete Workspace"}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkspaceDetails() {
  const dispatch = useDispatch();
  const { workspaceId } = useParams();
  const { currentWorkspace, currentProjects, loading } = useSelector((s) => s.workspace);
  const { user } = useSelector((s) => s.auth);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => { if (workspaceId) dispatch(fetchWorkspaceDetails(workspaceId)); }, [workspaceId, dispatch]);

  if (loading && !currentWorkspace) return <Loader />;
  if (!currentWorkspace) return <div className="text-center py-16 text-muted-foreground">Workspace not found.</div>;

  const currentUserRole = currentWorkspace.members?.find((m) => m.user._id === user?._id)?.role;
  const canManage = ["owner", "admin"].includes(currentUserRole);

  return (
    <div className="space-y-8">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <WorkspaceAvatar name={currentWorkspace.name} color={currentWorkspace.color} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
            <p className="text-muted-foreground text-sm">{currentWorkspace.description || "No description"}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4 mr-2" />Invite</Button>}
          <Button size="sm" onClick={() => setCreateProjectOpen(true)}><Plus className="h-4 w-4 mr-2" />New Project</Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4 mr-2" />Settings</Button>
        </div>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({currentProjects?.length || 0})</TabsTrigger>
          <TabsTrigger value="members">Members ({currentWorkspace.members?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {!currentProjects?.length ? (
            <NoDataFound title="No projects yet" description="Create your first project in this workspace" buttonText="Create Project" buttonAction={() => setCreateProjectOpen(true)} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProjects.map((project) => {
                const tasks = project.tasks || [];
                const progress = getProjectProgress(tasks);
                return (
                  <Link key={project._id} to={`/workspaces/${workspaceId}/projects/${project._id}`}>
                    <Card className="hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base truncate">{project.title}</CardTitle>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-1", getTaskStatusColor(project.status))}>{project.status}</span>
                        </div>
                        <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{progress}%</span></div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
                            {project.dueDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(project.dueDate), "MMM d")}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentWorkspace.members?.map(({ user: u, role, joinedAt }) => (
              <Card key={u._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarImage src={u.profilePicture} /><AvatarFallback>{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{role}</Badge>
                  </div>
                  {joinedAt && <p className="text-xs text-muted-foreground mt-2">Joined {format(new Date(joinedAt), "MMM d, yyyy")}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} workspaceId={workspaceId} workspaceMembers={currentWorkspace.members} />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} workspaceId={workspaceId} />
      <WorkspaceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} workspace={currentWorkspace} />
    </div>
  );
}
