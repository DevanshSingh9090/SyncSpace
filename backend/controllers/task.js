import { recordActivity } from "../libs/index.js";
import ActivityLog from "../models/activity.js";
import Comment from "../models/comment.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import Workspace from "../models/workspace.js";

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assignees, estimatedHours, tags } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this workspace" });
    const newTask = await Task.create({ title, description, status, priority, dueDate, assignees, estimatedHours, tags, project: projectId, createdBy: req.user._id });
    project.tasks.push(newTask._id);
    await project.save();
    await recordActivity(req.user._id, "created_task", "Task", newTask._id, { description: `Created task ${title}` });
    res.status(201).json(newTask);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate("assignees", "name profilePicture").populate("watchers", "name profilePicture");
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project).populate("members.user", "name profilePicture");
    res.status(200).json({ task, project });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    const oldTitle = task.title;
    task.title = title;
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: `Updated task title from "${oldTitle}" to "${title}"` });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.description = description;
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: "Updated task description" });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    const oldStatus = task.status;
    task.status = status;
    if (status === "Done") task.completedAt = new Date();
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: `Updated task status from "${oldStatus}" to "${status}"` });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.assignees = assignees;
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: "Updated task assignees" });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    const oldPriority = task.priority;
    task.priority = priority;
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: `Updated task priority from "${oldPriority}" to "${priority}"` });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.subtasks.push({ title, completed: false });
    await task.save();
    await recordActivity(req.user._id, "created_subtask", "Task", taskId, { description: `Created subtask "${title}"` });
    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const subTask = task.subtasks.find((s) => s._id.toString() === subTaskId);
    if (!subTask) return res.status(404).json({ message: "Subtask not found" });
    subTask.completed = completed;
    await task.save();
    await recordActivity(req.user._id, "updated_subtask", "Task", taskId, { description: `Updated subtask "${subTask.title}"` });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getActivityByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const activity = await ActivityLog.find({ resourceId }).populate("user", "name profilePicture").sort({ createdAt: -1 });
    res.status(200).json(activity);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId }).populate("author", "name profilePicture").sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    const newComment = await Comment.create({ text, task: taskId, author: req.user._id });
    task.comments = task.comments || [];
    task.comments.push(newComment._id);
    await task.save();
    await recordActivity(req.user._id, "added_comment", "Task", taskId, { description: `Added comment: ${text.substring(0, 50)}` });
    const populatedComment = await Comment.findById(newComment._id).populate("author", "name profilePicture");
    res.status(201).json(populatedComment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const watchTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    const isWatching = task.watchers.some((w) => w.toString() === req.user._id.toString());
    if (isWatching) {
      task.watchers = task.watchers.filter((w) => w.toString() !== req.user._id.toString());
    } else {
      task.watchers.push(req.user._id);
    }
    await task.save();
    res.status(200).json({ message: isWatching ? "Unwatched task" : "Watching task", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignees: req.user._id }).populate("project", "title workspace").sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.isArchived = !task.isArchived;
    await task.save();
    await recordActivity(req.user._id, "updated_task", "Task", taskId, { description: `${task.isArchived ? "Archived" : "Unarchived"} task ${task.title}` });
    res.status(200).json({ message: task.isArchived ? "Task archived" : "Task unarchived", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    await Task.findByIdAndDelete(taskId);
    project.tasks = project.tasks.filter((t) => t.toString() !== taskId);
    await project.save();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// ─── Attachments ──────────────────────────────────────────────────────────────
const addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileUrl, fileType, fileSize } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.attachments.push({ fileName, fileUrl, fileType, fileSize, uploadedBy: req.user._id, uploadedAt: new Date() });
    await task.save();
    await recordActivity(req.user._id, "added_attachment", "Task", taskId, { description: `Added attachment: ${fileName}` });
    res.status(201).json(task);
  } catch (error) { console.log(error); return res.status(500).json({ message: "Internal server error" }); }
};

const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    task.attachments = task.attachments.filter((a) => a._id.toString() !== attachmentId);
    await task.save();
    res.status(200).json(task);
  } catch (error) { console.log(error); return res.status(500).json({ message: "Internal server error" }); }
};

// ─── Comment Reactions ────────────────────────────────────────────────────────
const toggleCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
    const Comment = (await import("../models/comment.js")).default;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const existingIdx = comment.reactions.findIndex(
      (r) => r.emoji === emoji && r.user.toString() === req.user._id.toString()
    );
    if (existingIdx !== -1) {
      comment.reactions.splice(existingIdx, 1);
    } else {
      comment.reactions.push({ emoji, user: req.user._id });
    }
    await comment.save();
    const populated = await Comment.findById(commentId).populate("author", "name profilePicture");
    res.status(200).json(populated);
  } catch (error) { console.log(error); return res.status(500).json({ message: "Internal server error" }); }
};

export {
  createTask, getTaskById, updateTaskTitle, updateTaskDescription,
  updateTaskStatus, updateTaskAssignees, updateTaskPriority,
  addSubTask, updateSubTask, getActivityByResourceId,
  getCommentsByTaskId, addComment, watchTask, getMyTasks, archiveTask, deleteTask,
  addAttachment, deleteAttachment, toggleCommentReaction,
};
