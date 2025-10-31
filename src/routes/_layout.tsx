import { useEffect, useState } from "react";
import {
  createFileRoute,
  Navigate,
  Outlet,
} from "@tanstack/react-router";

import { AuthError, useRPC } from "@/jsonrpc";
import { prefixPath } from "@/base";
import Sidebar from "@/components/sidebar";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

type SysVersions = {
  boost: {
    version: string;
  };
};

type SysStatus = {
  status: "setup" | string;
};

function RouteComponent() {
  const [status, setStatus] = useState<SysStatus | undefined>();

  useEffect(() => {
    fetch(prefixPath("/api/v1/system"))
      .then((r) => r.json())
      .then((j) => setStatus(j as SysStatus));
  }, []);

  if (!status) {
    return <div>Loading...</div>;
  }

  if (status.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <App />;
}

function App() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.error instanceof AuthError) {
    return <Navigate to="/login" />;
  }

  if (!versions.data) {
    return <div>loading</div>;
  }

  return <AuthApp versions={versions.data} />;
}

type AuthAppProps = {
  versions: SysVersions;
};

function AuthApp({ }: AuthAppProps) {
  return (
    <div className="text-white h-dvh grid grid-cols-[300px_1fr]">
      <Sidebar />
      <Outlet />
    </div>
  );
}
