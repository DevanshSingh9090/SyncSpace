import Workspace from "../models/workspace.js";
import User from "../models/user.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import Task from "../models/task.js";
import Project from "../models/project.js";
import { recordActivity } from "../libs/index.js";
import { sendEmail } from "../libs/send-email.js";
import jwt from "jsonwebtoken";

const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const workspace = await Workspace.create({
      name, description, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "owner", joinedAt: new Date() }],
    });
    await recordActivity(req.user._id, "created_workspace", "Workspace", workspace._id, { description: `Created workspace ${name}` });
    res.status(201).json({ message: "Workspace created successfully", workspace });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user._id }).populate("members.user", "name profilePicture email");
    res.status(200).json(workspaces);
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId)
      .populate("members.user", "name profilePicture email")
      .populate("owner", "name profilePicture email");
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    res.status(200).json(workspace);
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate("members.user", "name profilePicture email");
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this workspace" });

    const currentMember = workspace.members.find((m) => m.user._id.toString() === req.user._id.toString());
    const isOwner = currentMember?.role === "owner";

    // Owner sees all projects; others see only projects they are members of
    const projectQuery = { workspace: workspaceId };
    if (!isOwner) {
      projectQuery.members = { $elemMatch: { user: req.user._id } };
    }

    const projects = await Project.find(projectQuery).populate("tasks", "status");
    res.status(200).json({ workspace, projects });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate({ path: "projects", populate: { path: "tasks" } });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const projects = workspace.projects || [];
    const allTasks = projects.flatMap((p) => p.tasks || []);
    const stats = {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      totalProjectInProgress: projects.filter((p) => p.status === "In Progress").length,
      totalTaskCompleted: allTasks.filter((t) => t.status === "Done").length,
      totalTaskToDo: allTasks.filter((t) => t.status === "To Do").length,
      totalTaskInProgress: allTasks.filter((t) => t.status === "In Progress").length,
    };

    // Task trends — last 7 days by day of week
    const taskTrendsData = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((name) => ({ name, completed: 0, inProgress: 0, toDo: 0 }));
    const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    allTasks.forEach((t) => {
      const taskDate = new Date(t.updatedAt);
      const dayIdx = last7Days.findIndex((d) => d.toDateString() === taskDate.toDateString());
      if (dayIdx !== -1) {
        const dayName = last7Days[dayIdx].toLocaleDateString("en-US", { weekday: "short" });
        const dayData = taskTrendsData.find((d) => d.name === dayName);
        if (dayData) {
          if (t.status === "Done") dayData.completed++;
          else if (t.status === "In Progress") dayData.inProgress++;
          else if (t.status === "To Do") dayData.toDo++;
        }
      }
    });

    // Project status distribution
    const projectStatusColors = { Planning: "#8b5cf6", "In Progress": "#3b82f6", "On Hold": "#f59e0b", Completed: "#22c55e", Cancelled: "#ef4444" };
    const projectStatusCounts = {};
    projects.forEach((p) => { projectStatusCounts[p.status] = (projectStatusCounts[p.status] || 0) + 1; });
    const projectStatusData = Object.entries(projectStatusCounts).map(([name, value]) => ({ name, value, color: projectStatusColors[name] || "#6b7280" }));

    // Task priority distribution
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    allTasks.forEach((t) => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
    const taskPriorityData = [
      { name: "High", value: priorityCounts.High, color: "#ef4444" },
      { name: "Medium", value: priorityCounts.Medium, color: "#f59e0b" },
      { name: "Low", value: priorityCounts.Low, color: "#22c55e" },
    ];

    // Workspace productivity
    const workspaceProductivityData = projects.slice(0, 6).map((p) => ({
      name: p.title.length > 12 ? p.title.slice(0, 12) + "…" : p.title,
      completed: (p.tasks || []).filter((t) => t.status === "Done").length,
      total: (p.tasks || []).length,
    }));

    // Upcoming tasks (due in next 7 days, not done)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = allTasks
      .filter((t) => t.status !== "Done" && t.dueDate && new Date(t.dueDate) <= sevenDaysFromNow && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const recentProjects = projects.slice(-5).reverse();
    res.status(200).json({ stats, taskTrendsData, projectStatusData, taskPriorityData, workspaceProductivityData, upcomingTasks, recentProjects });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const userMemberInfo = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!userMemberInfo || !["admin", "owner"].includes(userMemberInfo.role)) return res.status(403).json({ message: "Not authorized to invite members" });
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(400).json({ message: "User not found" });
    const isMember = workspace.members.some((m) => m.user.toString() === existingUser._id.toString());
    if (isMember) return res.status(400).json({ message: "User already a member" });
    const isInvited = await WorkspaceInvite.findOne({ user: existingUser._id, workspaceId });
    if (isInvited && isInvited.expiresAt > new Date()) return res.status(400).json({ message: "User already invited" });
    if (isInvited) await WorkspaceInvite.deleteOne({ _id: isInvited._id });
    const inviteToken = jwt.sign({ user: existingUser._id, workspaceId, role: role || "member" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    await WorkspaceInvite.create({ user: existingUser._id, workspaceId, token: inviteToken, role: role || "member", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;
    const emailContent = `<p>You've been invited to join <strong>${workspace.name}</strong>.</p><p><a href="${invitationLink}">Click here to join</a></p>`;
    await sendEmail(email, "You have been invited to join a workspace", emailContent);
    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const acceptGenerateInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ message: "You are already a member" });
    workspace.members.push({ user: req.user._id, role: "member", joinedAt: new Date() });
    await workspace.save();
    await recordActivity(req.user._id, "joined_workspace", "Workspace", workspaceId, { description: `Joined ${workspace.name}` });
    res.status(200).json({ message: "Invitation accepted successfully" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const acceptInviteByToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { user, workspaceId, role } = decoded;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isMember = workspace.members.some((m) => m.user.toString() === user.toString());
    if (isMember) return res.status(400).json({ message: "User already a member" });
    const inviteInfo = await WorkspaceInvite.findOne({ user, workspaceId });
    if (!inviteInfo) return res.status(404).json({ message: "Invitation not found" });
    if (inviteInfo.expiresAt < new Date()) return res.status(400).json({ message: "Invitation has expired" });
    workspace.members.push({ user, role: role || "member", joinedAt: new Date() });
    await workspace.save();
    await Promise.all([WorkspaceInvite.deleteOne({ _id: inviteInfo._id }), recordActivity(user, "joined_workspace", "Workspace", workspaceId, { description: `Joined ${workspace.name}` })]);
    res.status(200).json({ message: "Invitation accepted successfully" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, color } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const memberInfo = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!memberInfo || !["owner", "admin"].includes(memberInfo.role))
      return res.status(403).json({ message: "You are not authorized to update this workspace" });
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (color) workspace.color = color;
    await workspace.save();
    const updated = await Workspace.findById(workspaceId).populate("members.user", "name profilePicture email");
    res.status(200).json({ message: "Workspace updated successfully", workspace: updated });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isOwner = workspace.members.find((m) => m.user.toString() === req.user._id.toString() && m.role === "owner");
    if (!isOwner) return res.status(403).json({ message: "Only the workspace owner can delete it" });
    // Delete all projects and tasks in the workspace
    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map((p) => p._id);
    const Task = (await import("../models/task.js")).default;
    await Task.deleteMany({ project: { $in: projectIds } });
    await Project.deleteMany({ workspace: workspaceId });
    await Workspace.findByIdAndDelete(workspaceId);
    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const transferOwnership = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { newOwnerId } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const currentOwner = workspace.members.find((m) => m.user.toString() === req.user._id.toString() && m.role === "owner");
    if (!currentOwner) return res.status(403).json({ message: "Only the owner can transfer ownership" });
    const newOwnerMember = workspace.members.find((m) => m.user.toString() === newOwnerId.toString());
    if (!newOwnerMember) return res.status(400).json({ message: "New owner must be a member of this workspace" });
    // Demote current owner to admin
    workspace.members = workspace.members.map((m) => {
      if (m.user.toString() === req.user._id.toString()) return { ...m.toObject(), role: "admin" };
      if (m.user.toString() === newOwnerId.toString()) return { ...m.toObject(), role: "owner" };
      return m;
    });
    workspace.owner = newOwnerId;
    await workspace.save();
    await recordActivity(req.user._id, "transferred_workspace_ownership", "Workspace", workspaceId, { description: `Transferred ownership to new owner` });
    const updated = await Workspace.findById(workspaceId).populate("members.user", "name profilePicture email");
    res.status(200).json({ message: "Ownership transferred successfully", workspace: updated });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

export { createWorkspace, getWorkspaces, getWorkspaceDetails, getWorkspaceProjects, getWorkspaceStats, inviteUserToWorkspace, acceptGenerateInvite, acceptInviteByToken, updateWorkspace, deleteWorkspace, transferOwnership };
