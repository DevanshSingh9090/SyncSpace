import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { taskSchema } from "../libs/validate-schema.js";
import {
  createTask, getTaskById, updateTaskTitle, updateTaskDescription,
  updateTaskStatus, updateTaskAssignees, updateTaskPriority,
  addSubTask, updateSubTask, getActivityByResourceId,
  getCommentsByTaskId, addComment, getMyTasks, deleteTask,
  addAttachment, deleteAttachment, toggleCommentReaction,
} from "../controllers/task.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/projects/:projectId", validateRequest({ params: z.object({ projectId: z.string() }), body: taskSchema }), createTask);
router.get("/my-tasks", getMyTasks);
router.get("/:taskId", validateRequest({ params: z.object({ taskId: z.string() }) }), getTaskById);
router.patch("/:taskId/title", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ title: z.string() }) }), updateTaskTitle);
router.patch("/:taskId/description", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ description: z.string() }) }), updateTaskDescription);
router.patch("/:taskId/status", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ status: z.string() }) }), updateTaskStatus);
router.patch("/:taskId/assignees", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ assignees: z.array(z.string()) }) }), updateTaskAssignees);
router.patch("/:taskId/priority", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ priority: z.string() }) }), updateTaskPriority);
router.post("/:taskId/subtasks", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ title: z.string() }) }), addSubTask);
router.patch("/:taskId/subtasks/:subTaskId", validateRequest({ params: z.object({ taskId: z.string(), subTaskId: z.string() }), body: z.object({ completed: z.boolean() }) }), updateSubTask);
router.get("/:resourceId/activity", validateRequest({ params: z.object({ resourceId: z.string() }) }), getActivityByResourceId);
router.get("/:taskId/comments", validateRequest({ params: z.object({ taskId: z.string() }) }), getCommentsByTaskId);
router.post("/:taskId/comments", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ text: z.string() }) }), addComment);
router.delete("/:taskId", validateRequest({ params: z.object({ taskId: z.string() }) }), deleteTask);
// Attachments
router.post("/:taskId/attachments", validateRequest({ params: z.object({ taskId: z.string() }), body: z.object({ fileName: z.string(), fileUrl: z.string(), fileType: z.string().optional(), fileSize: z.number().optional() }) }), addAttachment);
router.delete("/:taskId/attachments/:attachmentId", validateRequest({ params: z.object({ taskId: z.string(), attachmentId: z.string() }) }), deleteAttachment);
// Comment reactions
router.post("/comments/:commentId/reactions", validateRequest({ params: z.object({ commentId: z.string() }), body: z.object({ emoji: z.string() }) }), toggleCommentReaction);

export default router;
