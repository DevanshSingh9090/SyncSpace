import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "You are not a member of this workspace" });

    const tagArray = tags ? tags.split(",").map((t) => t.trim()) : [];

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members,
      createdBy: req.user._id,
    });

    workspace.projects.push(newProject._id);
    await workspace.save();

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("members.user", "name profilePicture email");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("members.user", "name profilePicture email");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });

    const tasks = await Task.find({ project: projectId, isArchived: false })
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ project, tasks });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags ? tags.split(",").map((t) => t.trim()) : [];
    if (members !== undefined) project.members = members;
    await project.save();
    const updated = await Project.findById(projectId).populate("members.user", "name profilePicture email");
    res.status(200).json({ message: "Project updated successfully", project: updated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this project" });
    // Delete all tasks in the project
    await Task.deleteMany({ project: projectId });
    // Remove project from workspace
    await Workspace.updateOne({ _id: project.workspace }, { $pull: { projects: projectId } });
    await Project.findByIdAndDelete(projectId);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getArchivedProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this workspace" });
    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: true,
      members: { $elemMatch: { user: req.user._id } },
    }).populate("tasks", "status");
    res.status(200).json(projects);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createProject, getProjectDetails, getProjectTasks, updateProject, deleteProject, getArchivedProjects };
