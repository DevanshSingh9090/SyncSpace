import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

export const fetchTaskById = createAsyncThunk("task/fetchById", async (taskId, { rejectWithValue }) => {
  try { const res = await api.get(`/tasks/${taskId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch task"); }
});
export const createTask = createAsyncThunk("task/create", async ({ projectId, taskData }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/projects/${projectId}`, taskData); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create task"); }
});
export const updateTaskTitle = createAsyncThunk("task/updateTitle", async ({ taskId, title }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/title`, { title }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateTaskDescription = createAsyncThunk("task/updateDescription", async ({ taskId, description }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/description`, { description }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateTaskStatus = createAsyncThunk("task/updateStatus", async ({ taskId, status }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/status`, { status }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateTaskPriority = createAsyncThunk("task/updatePriority", async ({ taskId, priority }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/priority`, { priority }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateTaskAssignees = createAsyncThunk("task/updateAssignees", async ({ taskId, assignees }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/assignees`, { assignees }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const archiveTask = createAsyncThunk("task/archive", async (taskId, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/archive`); return res.data.task; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const deleteTask = createAsyncThunk("task/delete", async (taskId, { rejectWithValue }) => {
  try { await api.delete(`/tasks/${taskId}`); return taskId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const addSubTask = createAsyncThunk("task/addSubTask", async ({ taskId, title }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/${taskId}/subtasks`, { title }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateSubTask = createAsyncThunk("task/updateSubTask", async ({ taskId, subTaskId, completed }, { rejectWithValue }) => {
  try { const res = await api.patch(`/tasks/${taskId}/subtasks/${subTaskId}`, { completed }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const fetchComments = createAsyncThunk("task/fetchComments", async (taskId, { rejectWithValue }) => {
  try { const res = await api.get(`/tasks/${taskId}/comments`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const addComment = createAsyncThunk("task/addComment", async ({ taskId, text }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/${taskId}/comments`, { text }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const toggleCommentReaction = createAsyncThunk("task/toggleReaction", async ({ commentId, emoji }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/comments/${commentId}/reactions`, { emoji }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const fetchActivity = createAsyncThunk("task/fetchActivity", async (resourceId, { rejectWithValue }) => {
  try { const res = await api.get(`/tasks/${resourceId}/activity`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const watchTask = createAsyncThunk("task/watch", async (taskId, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/${taskId}/watch`); return res.data.task; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const fetchMyTasks = createAsyncThunk("task/fetchMyTasks", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/tasks/my-tasks"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const addTaskAttachment = createAsyncThunk("task/addAttachment", async ({ taskId, data }, { rejectWithValue }) => {
  try { const res = await api.post(`/tasks/${taskId}/attachments`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to add attachment"); }
});
export const deleteTaskAttachment = createAsyncThunk("task/deleteAttachment", async ({ taskId, attachmentId }, { rejectWithValue }) => {
  try { const res = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const taskSlice = createSlice({
  name: "task",
  initialState: { currentTask: null, currentProject: null, comments: [], activity: [], myTasks: [], loading: false, commentLoading: false, activityLoading: false, error: null },
  reducers: {
    clearTaskError(state) { state.error = null; },
    clearCurrentTask(state) { state.currentTask = null; state.currentProject = null; state.comments = []; state.activity = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskById.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTaskById.fulfilled, (s, a) => { s.loading = false; s.currentTask = a.payload.task; s.currentProject = a.payload.project; })
      .addCase(fetchTaskById.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    [updateTaskTitle, updateTaskDescription, updateTaskStatus, updateTaskPriority, updateTaskAssignees, addSubTask, updateSubTask, archiveTask, addTaskAttachment, deleteTaskAttachment].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (s) => { s.loading = true; })
        .addCase(thunk.fulfilled, (s, a) => { s.loading = false; s.currentTask = a.payload; })
        .addCase(thunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    });

    builder
      .addCase(deleteTask.pending, (s) => { s.loading = true; })
      .addCase(deleteTask.fulfilled, (s) => { s.loading = false; s.currentTask = null; })
      .addCase(deleteTask.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    builder
      .addCase(fetchComments.pending, (s) => { s.commentLoading = true; })
      .addCase(fetchComments.fulfilled, (s, a) => { s.commentLoading = false; s.comments = a.payload; })
      .addCase(fetchComments.rejected, (s, a) => { s.commentLoading = false; s.error = a.payload; });

    builder
      .addCase(addComment.pending, (s) => { s.commentLoading = true; })
      .addCase(addComment.fulfilled, (s, a) => { s.commentLoading = false; s.comments = [a.payload, ...s.comments]; })
      .addCase(addComment.rejected, (s, a) => { s.commentLoading = false; s.error = a.payload; });

    builder.addCase(toggleCommentReaction.fulfilled, (s, a) => {
      const idx = s.comments.findIndex((c) => c._id === a.payload._id);
      if (idx !== -1) s.comments[idx] = a.payload;
    });

    builder
      .addCase(fetchActivity.pending, (s) => { s.activityLoading = true; })
      .addCase(fetchActivity.fulfilled, (s, a) => { s.activityLoading = false; s.activity = a.payload; })
      .addCase(fetchActivity.rejected, (s, a) => { s.activityLoading = false; s.error = a.payload; });

    builder.addCase(watchTask.fulfilled, (s, a) => { s.currentTask = a.payload; });

    builder
      .addCase(fetchMyTasks.pending, (s) => { s.loading = true; })
      .addCase(fetchMyTasks.fulfilled, (s, a) => { s.loading = false; s.myTasks = a.payload; })
      .addCase(fetchMyTasks.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    builder
      .addCase(createTask.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createTask.fulfilled, (s) => { s.loading = false; })
      .addCase(createTask.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { clearTaskError, clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
