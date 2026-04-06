import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

export const fetchProjectTasks = createAsyncThunk("project/fetchTasks", async (projectId, { rejectWithValue }) => {
  try { const res = await api.get(`/projects/${projectId}/tasks`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch project"); }
});

export const createProject = createAsyncThunk("project/create", async ({ workspaceId, data }, { rejectWithValue }) => {
  try { const res = await api.post(`/projects/workspaces/${workspaceId}`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create project"); }
});

export const updateProject = createAsyncThunk("project/update", async ({ projectId, data }, { rejectWithValue }) => {
  try { const res = await api.put(`/projects/${projectId}`, data); return res.data.project; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update project"); }
});

export const deleteProject = createAsyncThunk("project/delete", async (projectId, { rejectWithValue }) => {
  try { await api.delete(`/projects/${projectId}`); return projectId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete project"); }
});

export const updateProjectMembers = createAsyncThunk("project/updateMembers", async ({ projectId, members }, { rejectWithValue }) => {
  try { const res = await api.put(`/projects/${projectId}/members`, { members }); return res.data.project; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update members"); }
});

// Task attachment thunks
export const addTaskAttachment = createAsyncThunk("project/addAttachment", async ({ taskId, data }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/${taskId}/attachments`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to add attachment"); }
});

export const deleteTaskAttachment = createAsyncThunk("project/deleteAttachment", async ({ taskId, attachmentId }, { rejectWithValue }) => {
  try { const res = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete attachment"); }
});

const projectSlice = createSlice({
  name: "project",
  initialState: {
    currentProject: null,
    tasks: [],
    isWorkspaceOwner: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearProjectError(state) { state.error = null; },
    clearCurrentProject(state) { state.currentProject = null; state.tasks = []; state.isWorkspaceOwner = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload.project;
        state.tasks = action.payload.tasks;
        state.isWorkspaceOwner = action.payload.isWorkspaceOwner || false;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(createProject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createProject.fulfilled, (state) => { state.loading = false; })
      .addCase(createProject.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(updateProject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProject.fulfilled, (state, action) => { state.loading = false; state.currentProject = action.payload; })
      .addCase(updateProject.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(deleteProject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteProject.fulfilled, (state) => { state.loading = false; state.currentProject = null; state.tasks = []; })
      .addCase(deleteProject.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(updateProjectMembers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProjectMembers.fulfilled, (state, action) => { state.loading = false; state.currentProject = action.payload; })
      .addCase(updateProjectMembers.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
