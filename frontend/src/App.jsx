import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "./store/slices/authSlice.js";

import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

import Home from "./pages/auth/Home.jsx";
import SignIn from "./pages/auth/SignIn.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";

import Dashboard from "./pages/dashboard/Dashboard.jsx";
import MyTasks from "./pages/dashboard/MyTasks.jsx";
import Members from "./pages/dashboard/Members.jsx";
import Achieved from "./pages/dashboard/Achieved.jsx";
import Settings from "./pages/dashboard/Settings.jsx";

import Workspaces from "./pages/workspace/Workspaces.jsx";
import WorkspaceDetails from "./pages/workspace/WorkspaceDetails.jsx";
import WorkspaceInvite from "./pages/workspace/WorkspaceInvite.jsx";

import ProjectDetails from "./pages/project/ProjectDetails.jsx";
import TaskDetails from "./pages/task/TaskDetails.jsx";
import Profile from "./pages/user/Profile.jsx";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/sign-in" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  useEffect(() => { if (token) dispatch(fetchProfile()); }, [token, dispatch]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
        <Route path="/sign-in" element={<GuestRoute><SignIn /></GuestRoute>} />
        <Route path="/sign-up" element={<GuestRoute><SignUp /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      <Route path="/workspace-invite/:workspaceId" element={<ProtectedRoute><WorkspaceInvite /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspaceDetails />} />
        <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<TaskDetails />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/members" element={<Members />} />
        <Route path="/achieved" element={<Achieved />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/user/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
