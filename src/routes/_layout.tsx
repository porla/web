import { useEffect, useState } from 'react'
import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router'

import Isotyope from '@/assets/isotype.svg?react'
import { AuthError, useRPC, type TorrentsOverview } from '@/jsonrpc'
import { prefixPath } from '@/base'

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

function AuthApp({ versions }: AuthAppProps) {
  const overview = useRPC<TorrentsOverview>("torrents.overview", null, {
    refreshInterval: 1000
  });

  const torrentsAll = (to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map(k => to.sessions[k].torrents_total)
      .reduce((prev, curr) => prev + curr);

  const torrentsState = (state: string, to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map(k => to.sessions[k].torrents_per_state[state] ?? 0)
      .reduce((prev, curr) => prev + curr);

  const torrentsError = (to: TorrentsOverview) =>
    Object.keys(to.sessions)
      .map(k => to.sessions[k].torrents_errors)
      .reduce((prev, curr) => prev + curr);

  if (!overview.data) {
    return <div>loading</div>
  }

  return (
    <div className="text-white h-dvh grid grid-cols-[300px_1fr]">
      <div className="bg-[#313244] border-r border-r-gray-500 h-dvh flex flex-col shadow-md">
        <div className="m-2 space-x-2">
          <Isotyope className="w-8" />
          <div className="mt-3">
            <input type="text" placeholder="Search torrents..." className="w-full border border-gray-500 p-2 rounded bg-gray-600" />
          </div>
        </div>
        <div className="flex-1 mx-2">
          <ul>
            <li>
              <span className="text-sm font-bold text-gray-500">Torrents</span>
              <ul>
                <li>
                  <Link to="/" search={{}} activeOptions={{ exact: true }} activeProps={{ className: "font-bold" }}>
                    All {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "downloading" }} activeProps={{ className: "font-bold" }}>
                    Downloading {torrentsState("downloading", overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "finished" }} activeProps={{ className: "font-bold" }}>
                    Finished {torrentsState("finished", overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "seeding" }} activeProps={{ className: "font-bold" }}>
                    Seeding {torrentsState("seeding", overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "paused" }} activeProps={{ className: "font-bold" }}>
                    Paused {torrentsAll(overview.data)}
                  </Link>
                </li>
                <li>
                  <Link to="/" search={{ state: "error" }} activeProps={{ className: "font-bold" }}>
                    Error {torrentsError(overview.data)}
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
