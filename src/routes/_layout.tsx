import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
} from "@tanstack/react-router";

import Isotyope from "@/assets/isotype.svg?react";
import { AuthError, useRPC, type TorrentsOverview } from "@/jsonrpc";
import { prefixPath } from "@/base";

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

function AuthApp({ versions }: AuthAppProps) {
  const overview = useRPC<TorrentsOverview>("torrents.overview", null, {
    refreshInterval: 1000,
  });

  const torrentsAll = (to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map((k) => to.sessions[k].torrents_total)
      .reduce((prev, curr) => prev + curr);

  const torrentsState = (state: string, to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map((k) => to.sessions[k].torrents_per_state[state] ?? 0)
      .reduce((prev, curr) => prev + curr);

  const torrentsError = (to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map((k) => to.sessions[k].torrents_errors)
      .reduce((prev, curr) => prev + curr);

  return (
    <div className="text-white h-dvh grid grid-cols-[300px_1fr]">
      <div className="bg-[#313244] border-r border-r-gray-500 h-dvh flex flex-col shadow-md">
        <div className="m-2 space-x-2">
          <Isotyope className="w-8" />
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search torrents..."
              className="w-full border border-gray-500 p-2 rounded bg-gray-600"
            />
          </div>
        </div>
        <div className="flex-1 mx-2">
          <ul>
            <li>
              <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
                Torrents
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/"
                    search={{}}
                    activeOptions={{ exact: true }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    All
                    <span>{overview.data && torrentsAll(overview.data)}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ state: "downloading" }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    <span>Downloading</span>
                    <span>{overview.data && torrentsState("downloading", overview.data)}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ state: "finished" }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    Finished
                    <span>{overview.data && torrentsState("finished", overview.data)}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ state: "seeding" }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    Seeding
                    <span>{overview.data && torrentsState("seeding", overview.data)}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ state: "paused" }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    Paused
                    <span>{overview.data && torrentsAll(overview.data)}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ state: "error" }}
                    activeProps={{ className: "bg-gray-600 rounded" }}
                    className="flex justify-between p-1 text-sm"
                  >
                    Error
                    <span>{overview.data && torrentsError(overview.data)}</span>
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="p-2">
          <Link
            to="/settings"
            activeProps={{ className: "font-medium bg-gray-800 text-white" }}
          >
            Settings
          </Link>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
