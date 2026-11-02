import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useRPC } from "@/api";
import { initializeFeatures } from "@/lib/features";
import { PluginHost } from "@/plugins/plugin-host";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  const status = useRPC("sys.status");

  if (status.isLoading) {
    return <>Loading</>;
  }

  if (status.data && status.data.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <VersionedComponent />;
}

function VersionedComponent() {
  const versions = useRPC("sys.versions", null, { meta: { silent: true } });

  if (versions.isLoading) {
    return <>loading versions</>;
  }

  const version = versions.data?.porla.version ?? null;

  initializeFeatures(version, versions.error);

  return (
    <PluginHost>
      <Outlet />
    </PluginHost>
  );
}
