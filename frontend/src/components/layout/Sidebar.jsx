import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  LogOut, X, Zap, ChevronsLeft, ChevronsRight,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { logout } from "../../store/slices/authSlice.js";
import { cn } from "../../lib/utils.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/select.jsx";
import { Button } from "../ui/button.jsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workspaces", icon: FolderKanban, label: "Workspaces" },
  { to: "/my-tasks", icon: CheckSquare, label: "My Tasks" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { dispatch(logout()); navigate("/sign-in"); };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">SyncSpace</span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="hidden md:flex h-7 w-7"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
            <button onClick={onClose} className="md:hidden p-1 rounded-md hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} onClick={onClose}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="text-xs">{user?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
