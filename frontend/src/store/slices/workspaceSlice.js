import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

export const fetchWorkspaces = createAsyncThunk("workspace/fetchAll", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/workspaces"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch workspaces"); }
});

export const fetchWorkspaceDetails = createAsyncThunk("workspace/fetchDetails", async (workspaceId, { rejectWithValue }) => {
  try {
    const [detailsRes, projectsRes, statsRes] = await Promise.all([
      api.get(`/workspaces/${workspaceId}`),
      api.get(`/workspaces/${workspaceId}/projects`),
      api.get(`/workspaces/${workspaceId}/stats`),
    ]);
    return { workspace: detailsRes.data, projects: projectsRes.data.projects, stats: statsRes.data };
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch workspace"); }
});

export const fetchWorkspaceDetailsOnly = createAsyncThunk("workspace/fetchDetailsOnly", async (workspaceId, { rejectWithValue }) => {
  try { const res = await api.get(`/workspaces/${workspaceId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch workspace"); }
});

export const createWorkspace = createAsyncThunk("workspace/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/workspaces", data); return res.data.workspace; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create workspace"); }
});

export const updateWorkspace = createAsyncThunk("workspace/update", async ({ workspaceId, data }, { rejectWithValue }) => {
  try { const res = await api.put(`/workspaces/${workspaceId}`, data); return res.data.workspace; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update workspace"); }
});

export const deleteWorkspace = createAsyncThunk("workspace/delete", async (workspaceId, { rejectWithValue }) => {
  try { await api.delete(`/workspaces/${workspaceId}`); return workspaceId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete workspace"); }
});

export const transferWorkspaceOwnership = createAsyncThunk("workspace/transferOwnership", async ({ workspaceId, newOwnerId }, { rejectWithValue }) => {
  try { const res = await api.post(`/workspaces/${workspaceId}/transfer-ownership`, { newOwnerId }); return res.data.workspace; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to transfer ownership"); }
});

export const inviteMember = createAsyncThunk("workspace/inviteMember", async ({ workspaceId, data }, { rejectWithValue }) => {
  try { const res = await api.post(`/workspaces/${workspaceId}/invite`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to invite member"); }
});

export const acceptInviteByToken = createAsyncThunk("workspace/acceptInviteByToken", async (token, { rejectWithValue }) => {
  try { const res = await api.post("/workspaces/accept-invite-by-token", { token }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to accept invite"); }
});

export const acceptGenerateInvite = createAsyncThunk("workspace/acceptGenerateInvite", async (workspaceId, { rejectWithValue }) => {
  try { const res = await api.post(`/workspaces/${workspaceId}/accept-invite`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to accept invite"); }
});

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    workspaces: [],
    currentWorkspace: null,
    currentProjects: [],
    stats: null,
    taskTrendsData: [],
    projectStatusData: [],
    taskPriorityData: [],
    workspaceProductivityData: [],
    upcomingTasks: [],
    recentProjects: [],
    selectedWorkspaceId: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearWorkspaceError(state) { state.error = null; },
    clearCurrentWorkspace(state) { state.currentWorkspace = null; state.currentProjects = []; state.stats = null; },
    setSelectedWorkspaceId(state, action) { state.selectedWorkspaceId = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false; state.workspaces = action.payload;
        if (!state.selectedWorkspaceId && action.payload.length > 0) state.selectedWorkspaceId = action.payload[0]._id;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(fetchWorkspaceDetails.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkspaceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload.workspace;
        state.currentProjects = action.payload.projects;
        const s = action.payload.stats;
        state.stats = s.stats;
        state.taskTrendsData = s.taskTrendsData || [];
        state.projectStatusData = s.projectStatusData || [];
        state.taskPriorityData = s.taskPriorityData || [];
        state.workspaceProductivityData = s.workspaceProductivityData || [];
        state.upcomingTasks = s.upcomingTasks || [];
        state.recentProjects = s.recentProjects || [];
      })
      .addCase(fetchWorkspaceDetails.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder.addCase(fetchWorkspaceDetailsOnly.fulfilled, (state, action) => { state.currentWorkspace = action.payload; });

    builder
      .addCase(createWorkspace.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading = false; state.workspaces.push(action.payload);
        if (!state.selectedWorkspaceId) state.selectedWorkspaceId = action.payload._id;
      })
      .addCase(createWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(updateWorkspace.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
        const idx = state.workspaces.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.workspaces[idx] = action.payload;
      })
      .addCase(updateWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(deleteWorkspace.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
        if (state.selectedWorkspaceId === action.payload) {
          state.selectedWorkspaceId = state.workspaces[0]?._id || null;
        }
        state.currentWorkspace = null;
        state.currentProjects = [];
      })
      .addCase(deleteWorkspace.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(transferWorkspaceOwnership.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(transferWorkspaceOwnership.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
        const idx = state.workspaces.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.workspaces[idx] = action.payload;
      })
      .addCase(transferWorkspaceOwnership.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(inviteMember.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(inviteMember.fulfilled, (state) => { state.loading = false; })
      .addCase(inviteMember.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearWorkspaceError, clearCurrentWorkspace, setSelectedWorkspaceId } = workspaceSlice.actions;
export default workspaceSlice.reducer;
