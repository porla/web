import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router'
import Isotyope from '../assets/isotype.svg?react'
import { AuthError, useRPC } from '../jsonrpc'
import { useEffect, useState } from 'react'
import { prefixPath } from '../base'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

type SysVersions = {
  boost: {
    version: string;
  }
}

type SysStatus = {
  status: "setup" | string;
}

function RouteComponent() {
  const [status, setStatus] = useState<SysStatus | undefined>();

  useEffect(() => {
    fetch(prefixPath("/api/v1/system"))
      .then(r => r.json())
      .then(j => setStatus(j as SysStatus))
  }, []);

  if (!status) {
    return <div>Loading...</div>
  }

  if (status.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <App />
}

function App() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.error instanceof AuthError) {
    return <Navigate to="/login" />
  }

  if (!versions.data) {
    return <div>loading</div>
  }

  return <AuthApp versions={versions.data} />
}

type AuthAppProps = {
  versions: SysVersions;
}

type TorrentsOverviewSession = {
  torrents_per_category: Record<string, number>;
  torrents_per_state: Record<string, number>;
  torrents_per_tag: Record<string, number>;
  torrents_per_tracker: Record<string, number>;
  torrents_total: number;
}

type TorrentsOverview = {
  sessions: Record<string, TorrentsOverviewSession>;
}

function AuthApp({ versions }: AuthAppProps) {
  const overview = useRPC<TorrentsOverview>("torrents.overview", null, {
    refreshInterval: 1000
  });

  const torrentsAll = (to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map(k => to.sessions[k].torrents_total)
      .reduce((prev, curr) => prev + curr);

  if (!overview.data) {
    return <div>loading</div>
  }

  return (
    <div className="text-white h-dvh grid grid-cols-[300px_1fr]">
      <div className="bg-gray-700 border-r border-r-gray-500 h-dvh flex flex-col shadow-md">
        <div className="m-2 space-x-2">
          <Isotyope className="w-8" />
          {versions.boost.version}
          <div className="mt-3">
            <input type="text" placeholder="Search torrents..." className="w-full border border-gray-500 p-2 rounded bg-gray-600" />
          </div>
        </div>
        <div className="flex-1">
          <ul>
            <li>
              Torrents
              <ul>
                <li>
                  <Link to="/" search={{}} activeOptions={{ exact: true }} activeProps={{ className: "font-bold" }}>
                    All {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "downloading" }} activeProps={{ className: "font-bold" }}>
                    Downloading {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "finished" }} activeProps={{ className: "font-bold" }}>
                    Finished {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "seeding" }} activeProps={{ className: "font-bold" }}>
                    Seeding {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "paused" }} activeProps={{ className: "font-bold" }}>
                    Paused {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "error" }} activeProps={{ className: "font-bold" }}>
                    Error {torrentsAll(overview.data)}
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="p-2">
          <Link to="/settings" activeProps={{ className: "font-medium bg-gray-800 text-white" }}>Settings</Link>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
