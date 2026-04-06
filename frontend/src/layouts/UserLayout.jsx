import { Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-8 md:py-16 px-4">
        <Outlet />
      </div>
    </div>
  );
}
