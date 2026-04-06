import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchWorkspaceDetailsOnly,
  acceptInviteByToken,
  acceptGenerateInvite,
} from "../../store/slices/workspaceSlice.js";
import { toast } from "sonner";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Loader2, Users } from "lucide-react";

function WorkspaceAvatar({ name, color }) {
  return (
    <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto"
      style={{ backgroundColor: color }}>
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

export default function WorkspaceInvite() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("tk");
  const { currentWorkspace, loading } = useSelector((s) => s.workspace);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (workspaceId) dispatch(fetchWorkspaceDetailsOnly(workspaceId));
  }, [workspaceId, dispatch]);

  const handleAccept = async () => {
    setAccepting(true);
    let result;
    if (token) {
      result = await dispatch(acceptInviteByToken(token));
    } else {
      result = await dispatch(acceptGenerateInvite(workspaceId));
    }
    setAccepting(false);

    const thunk = token ? acceptInviteByToken : acceptGenerateInvite;
    if (thunk.fulfilled.match(result)) {
      toast.success("You've joined the workspace!");
      navigate(`/workspaces/${workspaceId}`);
    } else {
      toast.error(result.payload || "Failed to accept invite");
    }
  };

  const handleDecline = () => {
    toast.info("Invitation declined");
    navigate("/workspaces");
  };

  if (loading && !currentWorkspace) return (
    <div className="flex h-screen items-center justify-center">
      <Loader />
    </div>
  );

  if (!currentWorkspace) return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>This invitation is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate("/workspaces")}>Go to Workspaces</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <WorkspaceAvatar name={currentWorkspace.name} color={currentWorkspace.color} />
          <div>
            <h2 className="text-2xl font-bold">{currentWorkspace.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{currentWorkspace.description || "You've been invited to join this workspace"}</p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{currentWorkspace.members?.length || 0} member{currentWorkspace.members?.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleDecline} disabled={accepting}>Decline</Button>
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Joining...</> : "Accept & Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
