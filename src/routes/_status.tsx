import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useRPC, type SysStatus, type SysVersions } from "@/api";
import { initializeFeatures } from "@/features";

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

  return <VersionedComponent />;
}

function VersionedComponent() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.isLoading) {
    return <>loading versions</>;
  }

  const version = versions.data?.porla.version ?? null;

  initializeFeatures(version);

  return <Outlet />;
}
