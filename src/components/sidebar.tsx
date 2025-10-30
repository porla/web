import Isotype from "@/assets/isotype.svg?react";
import { TorrentFlags, useRPC, type SessionsList, type TorrentsOverview } from "@/jsonrpc";
import { ArrowDownTrayIcon, ArrowsRightLeftIcon, ArrowUpTrayIcon, CheckIcon, CogIcon, ExclamationTriangleIcon, PauseIcon } from "@heroicons/react/20/solid";
import { useSearch, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export default function Sidebar() {
  const torrentSearch = useSearch({ from: "/_layout/", shouldThrow: false });
  const navigate = useNavigate();

  const sessions = useRPC<SessionsList>("sessions.list", null, {
    refetchInterval: 5000
  });

  const overview = useRPC<TorrentsOverview>("torrents.overview", null, {
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (torrentSearch === undefined) {
      return;
    }

    if (sessions.data && torrentSearch.session_id === undefined) {
      navigate({
        to: "/", search: {
          ...torrentSearch,
          session_id: sessions.data.sessions[0].id
        }
      })
    }
  }, [torrentSearch, sessions]);

  const torrentsAll = (to: TorrentsOverview) =>
    to.sessions
      .filter(s => torrentSearch?.session_id === undefined || s.session_id == torrentSearch.session_id)
      .map(s => s.torrents_total)
      .reduce((prev, curr) => prev + curr);

  const torrentsPaused = (to: TorrentsOverview) =>
    to.sessions
      .filter(s => torrentSearch?.session_id === undefined || s.session_id == torrentSearch.session_id)
      .map(s => s.torrents_per_flags
        .filter(f => (f[0] & TorrentFlags.Paused) === TorrentFlags.Paused)
        .map(f => f[1] ?? 0)
        .reduce((p, c) => p + c, 0)
      )
      .reduce((prev, curr) => prev + curr, 0);

  const torrentsState = (state: string, to: TorrentsOverview) =>
    to.sessions
      .filter(s => torrentSearch?.session_id === undefined || s.session_id == torrentSearch.session_id)
      .map(s => s.torrents_per_state[state] ?? 0)
      .reduce((prev, curr) => prev + curr);

  const torrentsError = (to: TorrentsOverview) =>
    to.sessions
      .filter(s => torrentSearch?.session_id === undefined || s.session_id == torrentSearch.session_id)
      .map(s => s.torrents_errors)
      .reduce((prev, curr) => prev + curr);

  return (
    <div className="bg-[#313244] border-r border-r-gray-500 h-dvh flex flex-col shadow-md">
      <div className="m-2 space-x-2">
        <Isotype className="w-8" />
      </div>

      <div className="flex-1 mx-2 mt-3">
        <ul className="space-y-3">
          <li>
            <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
              Sessions
            </div>
            {sessions.isLoading && (
              <p>loading sessions</p>
            )}
            <ul>
              {sessions.data && sessions.data?.sessions.map(s => (
                <li key={s.id} className="text-sm">
                  <Link
                    to="/"
                    search={{
                      ...torrentSearch,
                      session_id: s.id
                    }}
                    activeProps={{
                      className: "bg-gray-600"
                    }}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-700 rounded"
                  >
                    <span
                      className="size-3 rounded"
                      style={{
                        backgroundColor: s.metadata["color"] ? String(s.metadata["color"]) : "#ccc"
                      }}
                    ></span>
                    <span>{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
              Torrents
            </div>
            <ul className="text-sm">
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: undefined
                  }}
                  activeOptions={{ exact: true }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >
                  <div className="flex space-x-2 items-center">
                    <ArrowsRightLeftIcon className="size-4" />
                    <span>All</span>
                  </div>
                  <span>{overview.data && torrentsAll(overview.data)}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: "downloading"
                  }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >
                  <div className="flex space-x-2 items-center">
                    <ArrowDownTrayIcon className="size-4 text-green-600" />
                    <span>Downloading</span>
                  </div>
                  <span>{overview.data && torrentsState("downloading", overview.data)}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: "seeding"
                  }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >
                  <div className="flex space-x-2 items-center">
                    <ArrowUpTrayIcon className="size-4 text-blue-600" />
                    <span>Seeding</span>
                  </div>
                  <span>{overview.data && torrentsState("seeding", overview.data)}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: "finished"
                  }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >
                  <div className="flex space-x-2 items-center">
                    <CheckIcon className="size-4 text-purple-600" />
                    <span>Finished</span>
                  </div>
                  <span>{overview.data && torrentsState("finished", overview.data)}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: "paused"
                  }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >
                  <div className="flex space-x-2 items-center">
                    <PauseIcon className="size-4 text-orange-600" />
                    <span>Paused</span>
                  </div>
                  <span>{overview.data && torrentsPaused(overview.data)}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={{
                    ...torrentSearch,
                    state: "error"
                  }}
                  activeProps={{ className: "bg-gray-600 rounded" }}
                  className="flex justify-between p-1"
                >

                  <div className="flex space-x-2 items-center">
                    <ExclamationTriangleIcon className="size-4 text-red-600" />
                    <span>Error</span>
                  </div>
                  <span>{overview.data && torrentsError(overview.data)}</span>
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="p-1 text-sm">
        <Link
          to="/settings"
          activeProps={{ className: "bg-gray-600 rounded active" }}
          className="p-1 flex space-x-2 items-center group"
        >
          <CogIcon className="size-4 text-gray-600 group-[.active]:text-white" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  )
}