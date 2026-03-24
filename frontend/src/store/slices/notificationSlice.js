import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

export const fetchNotifications = createAsyncThunk("notification/fetchAll", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/notifications"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch notifications"); }
});

export const markNotificationRead = createAsyncThunk("notification/markRead", async (notificationId, { rejectWithValue }) => {
  try { const res = await api.patch(`/notifications/${notificationId}/read`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const markAllNotificationsRead = createAsyncThunk("notification/markAllRead", async (_, { rejectWithValue }) => {
  try { await api.patch("/notifications/mark-all-read"); return true; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const deleteNotification = createAsyncThunk("notification/delete", async (notificationId, { rejectWithValue }) => {
  try { await api.delete(`/notifications/${notificationId}`); return notificationId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const notificationSlice = createSlice({
  name: "notification",
  initialState: { notifications: [], unreadCount: 0, loading: false, error: null },
  reducers: {
    clearNotificationError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.notifications = a.payload.notifications;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    builder.addCase(markNotificationRead.fulfilled, (s, a) => {
      const idx = s.notifications.findIndex((n) => n._id === a.payload._id);
      if (idx !== -1) { s.notifications[idx] = a.payload; }
      s.unreadCount = Math.max(0, s.unreadCount - 1);
    });

    builder.addCase(markAllNotificationsRead.fulfilled, (s) => {
      s.notifications = s.notifications.map((n) => ({ ...n, isRead: true }));
      s.unreadCount = 0;
    });

    builder.addCase(deleteNotification.fulfilled, (s, a) => {
      const wasUnread = s.notifications.find((n) => n._id === a.payload && !n.isRead);
      s.notifications = s.notifications.filter((n) => n._id !== a.payload);
      if (wasUnread) s.unreadCount = Math.max(0, s.unreadCount - 1);
    });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
