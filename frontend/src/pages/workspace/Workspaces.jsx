import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchWorkspaces, createWorkspace } from "../../store/slices/workspaceSlice.js";
import { toast } from "sonner";
import { Loader, NoDataFound } from "../../components/shared.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label, Textarea } from "../../components/ui/input.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Users, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function WorkspaceAvatar({ name, color, size = "md" }) {
  const sizes = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-12 w-12 text-lg" };
  return (
    <div className={`${sizes[size]} rounded-lg flex items-center justify-center text-white font-bold shrink-0`} style={{ backgroundColor: color }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

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
                  className={`h-8 w-8 rounded-full transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Workspaces() {
  const dispatch = useDispatch();
  const { workspaces, loading } = useSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);

  useEffect(() => { dispatch(fetchWorkspaces()); }, [dispatch]);

  if (loading && workspaces.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Manage your collaborative spaces</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Workspace</Button>
      </div>

      {workspaces.length === 0 ? (
        <NoDataFound title="No workspaces yet" description="Create your first workspace to get started" buttonText="Create Workspace" buttonAction={() => setOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws._id} to={`/workspaces/${ws._id}`}>
              <Card className="hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <WorkspaceAvatar name={ws.name} color={ws.color} />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{ws.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(ws.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">{ws.members?.length || 0}</span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{ws.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">View workspace →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
