import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { type SysVersions, useRPC, type SysStatus } from "@/api";
import Sidebar from "@/components/sidebar";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const status = useRPC<SysStatus>("sys.status");

  if (status.isLoading) {
    return <>Loading</>;
  }

  if (status.data && status.data.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <SysVersionsLayout />;
}

function SysVersionsLayout() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.isLoading) {
    return <>loading versions</>;
  }

  return (
    <div className="flex h-full">
      <div className="bg-base-300 w-64 shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
