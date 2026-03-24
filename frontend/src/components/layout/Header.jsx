import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Menu, User, LogOut, ChevronDown, Check, Bell, PlusCircle, X, CheckCheck } from "lucide-react";
import { logout } from "../../store/slices/authSlice.js";
import { fetchWorkspaces, setSelectedWorkspaceId, createWorkspace } from "../../store/slices/workspaceSlice.js";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../../store/slices/notificationSlice.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/select.jsx";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/misc.jsx";
import { Button } from "../ui/button.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog.jsx";
import { Input, Label, Textarea } from "../ui/input.jsx";
import { cn } from "../../lib/utils.js";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function CreateWorkspaceDialog({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.workspace);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createWorkspace(form));
    if (createWorkspace.fulfilled.match(result)) {
      toast.success("Workspace created!");
      onOpenChange(false);
      setForm({ name: "", description: "", color: COLORS[0] });
    } else {
      toast.error(result.payload || "Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="My Workspace" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="What's this workspace for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
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
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceSwitcher({ onCreateWorkspace }) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { workspaces, selectedWorkspaceId } = useSelector((s) => s.workspace);

  useEffect(() => { if (!workspaces.length) dispatch(fetchWorkspaces()); }, [dispatch]);

  const selected = workspaces.find((w) => w._id === selectedWorkspaceId);

  const handleSelect = (id) => {
    dispatch(setSelectedWorkspaceId(id));
    const params = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    params.workspaceId = id;
    setSearchParams(params, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 max-w-[200px] h-8 text-sm">
          {selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : "Select workspace"}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws._id} onClick={() => handleSelect(ws._id)} className="flex items-center gap-2 cursor-pointer">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ws.color }} />
            <span className="flex-1 truncate">{ws.name}</span>
            {ws._id === selectedWorkspaceId && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateWorkspace} className="flex items-center gap-2 cursor-pointer text-primary">
          <PlusCircle className="h-4 w-4" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((s) => s.notification);
  const [open, setOpen] = useState(false);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markNotificationRead(id));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleMarkAllRead = () => { dispatch(markAllNotificationsRead()); };

  const handleNotificationClick = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[480px] overflow-hidden flex flex-col p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-7 text-xs gap-1">
              <CheckCheck className="h-3.5 w-3.5" />Mark all read
            </Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 max-h-[380px]">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors group",
                  !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  <AvatarImage src={n.sender?.profilePicture} />
                  <AvatarFallback className="text-xs">{n.sender?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!n.isRead && (
                    <button onClick={(e) => handleMarkRead(e, n._id)} title="Mark as read"
                      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-blue-100 text-blue-600">
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  <button onClick={(e) => handleDelete(e, n._id)} title="Delete"
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-red-100 text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [createWsOpen, setCreateWsOpen] = useState(false);

  const handleLogout = () => { dispatch(logout()); navigate("/sign-in"); };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-muted md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <WorkspaceSwitcher onCreateWorkspace={() => setCreateWsOpen(true)} />
        </div>

        <div className="flex items-center gap-2">
          <NotificationPanel />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profilePicture} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/user/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    </>
  );
}
