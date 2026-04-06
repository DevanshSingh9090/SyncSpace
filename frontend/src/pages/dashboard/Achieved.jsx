import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyTasks } from "../../store/slices/taskSlice.js";
import { Loader } from "../../components/shared.jsx";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn, getTaskPriorityColor } from "../../lib/utils.js";

export default function Achieved() {
  const dispatch = useDispatch();
  const { myTasks, loading } = useSelector((s) => s.task);

  useEffect(() => { dispatch(fetchMyTasks()); }, [dispatch]);

  if (loading) return <Loader />;

  const completedTasks = myTasks.filter((t) => t.status === "Done");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achieved</h1>
        <p className="text-muted-foreground">Tasks you have completed</p>
      </div>

      {completedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No completed tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tasks marked as Done will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedTasks.map((task) => (
            <Link
              key={task._id}
              to={`/workspaces/${task.project?.workspace}/projects/${task.project?._id}/tasks/${task._id}`}
            >
              <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate line-through text-muted-foreground">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTaskPriorityColor(task.priority))}>
                            {task.priority}
                          </span>
                          {task.project?.title && (
                            <span className="text-xs text-muted-foreground">· {task.project.title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
