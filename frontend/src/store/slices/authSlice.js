import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/auth/register", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Registration failed"); }
});

export const loginUser = createAsyncThunk("auth/login", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/auth/login", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Login failed"); }
});

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try { const res = await api.post("/auth/verify-email", { token }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Verification failed"); }
});

export const resendVerification = createAsyncThunk("auth/resendVerification", async (email, { rejectWithValue }) => {
  try { const res = await api.post("/auth/resend-verification", { email }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to resend email"); }
});

export const resend2FA = createAsyncThunk("auth/resend2FA", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/auth/2fa/resend", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to resend code"); }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try { const res = await api.post("/auth/forgot-password", { email }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to send email"); }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/auth/reset-password", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Reset failed"); }
});

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/users/profile"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch profile"); }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data, { rejectWithValue }) => {
  try { const res = await api.patch("/users/profile", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Update failed"); }
});

export const uploadAvatar = createAsyncThunk("auth/uploadAvatar", async (base64Image, { rejectWithValue }) => {
  try { const res = await api.post("/users/avatar", { base64Image }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Avatar upload failed"); }
});

export const changePassword = createAsyncThunk("auth/changePassword", async (data, { rejectWithValue }) => {
  try { const res = await api.patch("/users/change-password", data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Password change failed"); }
});

// ─── 2FA ─────────────────────────────────────────────────────────────────────
export const enable2FA = createAsyncThunk("auth/enable2FA", async (_, { rejectWithValue }) => {
  try { const res = await api.post("/auth/2fa/enable"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to enable 2FA"); }
});

export const verify2FA = createAsyncThunk("auth/verify2FA", async (otp, { rejectWithValue }) => {
  try { const res = await api.post("/auth/2fa/verify", { otp }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Invalid code"); }
});

export const disable2FA = createAsyncThunk("auth/disable2FA", async (_, { rejectWithValue }) => {
  try { const res = await api.post("/auth/2fa/disable"); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to disable 2FA"); }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
const token = localStorage.getItem("token");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: token || null,
    loading: false,
    twoFALoading: false,
    resendLoading: false,
    requires2FA: false,
    pendingEmail: null,
    pendingPassword: null,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.requires2FA = false;
      state.pendingEmail = null;
      state.pendingPassword = null;
      localStorage.removeItem("token");
    },
    clearError(state) { state.error = null; },
    clearRequires2FA(state) {
      state.requires2FA = false;
      state.pendingEmail = null;
      state.pendingPassword = null;
    },
    setPendingCredentials(state, action) {
      state.pendingEmail = action.payload.email;
      state.pendingPassword = action.payload.password;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; state.requires2FA = false; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requires2FA) {
          state.requires2FA = true;
          state.pendingEmail = action.meta.arg.email;
          state.pendingPassword = action.meta.arg.password;
        } else {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.pendingPassword = null;
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Resend verification
    builder
      .addCase(resendVerification.pending, (state) => { state.resendLoading = true; state.error = null; })
      .addCase(resendVerification.fulfilled, (state) => { state.resendLoading = false; })
      .addCase(resendVerification.rejected, (state, action) => { state.resendLoading = false; state.error = action.payload; });

    // Resend 2FA OTP
    builder
      .addCase(resend2FA.pending, (state) => { state.resendLoading = true; state.error = null; })
      .addCase(resend2FA.fulfilled, (state) => { state.resendLoading = false; })
      .addCase(resend2FA.rejected, (state, action) => { state.resendLoading = false; state.error = action.payload; });

    // Fetch Profile
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload === "Unauthorized") { state.token = null; localStorage.removeItem("token"); }
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; })
      .addCase(updateProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(uploadAvatar.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadAvatar.fulfilled, (state, action) => { state.loading = false; if (action.payload.user) state.user = action.payload.user; })
      .addCase(uploadAvatar.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(changePassword.fulfilled, (state) => { state.loading = false; })
      .addCase(changePassword.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // 2FA
    builder
      .addCase(enable2FA.pending, (state) => { state.twoFALoading = true; state.error = null; })
      .addCase(enable2FA.fulfilled, (state) => { state.twoFALoading = false; })
      .addCase(enable2FA.rejected, (state, action) => { state.twoFALoading = false; state.error = action.payload; });

    builder
      .addCase(verify2FA.pending, (state) => { state.twoFALoading = true; state.error = null; })
      .addCase(verify2FA.fulfilled, (state, action) => {
        state.twoFALoading = false;
        if (state.user) state.user = { ...state.user, is2FAEnabled: action.payload.is2FAEnabled };
      })
      .addCase(verify2FA.rejected, (state, action) => { state.twoFALoading = false; state.error = action.payload; });

    builder
      .addCase(disable2FA.pending, (state) => { state.twoFALoading = true; state.error = null; })
      .addCase(disable2FA.fulfilled, (state, action) => {
        state.twoFALoading = false;
        if (state.user) state.user = { ...state.user, is2FAEnabled: action.payload.is2FAEnabled };
      })
      .addCase(disable2FA.rejected, (state, action) => { state.twoFALoading = false; state.error = action.payload; });

    // Verify / forgot / reset
    builder
      .addMatcher(
        (action) => ["auth/verifyEmail", "auth/forgotPassword", "auth/resetPassword"]
          .some((t) => action.type.startsWith(t)),
        (state, action) => {
          if (action.type.endsWith("/pending")) { state.loading = true; state.error = null; }
          if (action.type.endsWith("/fulfilled")) { state.loading = false; }
          if (action.type.endsWith("/rejected")) { state.loading = false; state.error = action.payload; }
        }
      );
  },
});

export const { logout, clearError, clearRequires2FA, setPendingCredentials } = authSlice.actions;
export default authSlice.reducer;
