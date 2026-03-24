import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
