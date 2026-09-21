import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useRPC, type SysStatus } from "@/api";

export const Route = createFileRoute("/_status")({
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

  return <Outlet />;
}
