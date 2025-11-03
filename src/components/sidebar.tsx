import Isotype from "@/assets/isotype.svg?react";
import { useRPC, type SessionsList, type TorrentsCount } from "@/jsonrpc";
import {
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  CogIcon,
  ExclamationTriangleIcon,
  PauseIcon,
} from "@heroicons/react/20/solid";
import { useSearch, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export default function Sidebar() {
  const torrentSearch = useSearch({ from: "/_layout/", shouldThrow: false });
  const navigate = useNavigate();

  const sessions = useRPC<SessionsList>("sessions.list", null, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (torrentSearch === undefined) {
      return;
    }

    if (sessions.data && torrentSearch.session_id === undefined) {
      navigate({
        to: "/",
        search: {
          ...torrentSearch,
          session_id: sessions.data.sessions[0].id,
        },
      });
    }
  }, [torrentSearch, sessions]);

  return (
    <div className="bg-[#313244] border-r border-r-gray-500 h-dvh flex flex-col shadow-md">
      <div className="m-2 space-x-2 flex items-center justify-between">
        <div className="flex-1">
          <Isotype className="w-8" />
        </div>
        <Link
          to="/add"
          className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          Add torrent
        </Link>
      </div>

      <div className="flex-1 mx-2 mt-3">
        <ul className="space-y-3">
          <li>
            <div className="text-sm/6 font-bold text-gray-400 dark:text-gray-500">
              Sessions
            </div>

            <ul>
              {sessions.data &&
                sessions.data?.sessions.map((s) => (
                  <li key={s.id} className="text-sm">
                    <Link
                      to="/"
                      search={{
                        ...torrentSearch,
                        session_id: s.id,
                      }}
                      activeProps={{
                        className: "bg-gray-600",
                      }}
                      className="flex items-center justify-between space-x-2 p-1 hover:bg-gray-700 rounded"
                    >
                      <div className="flex space-x-2 items-center">
                        <span
                          className="size-3 rounded"
                          style={{
                            backgroundColor: s.metadata["color"]
                              ? String(s.metadata["color"])
                              : "#ccc",
                          }}
                        ></span>
                        <span>{s.name}</span>
                      </div>
                      <span>{s.torrents_total}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </li>
          <li>
            <TorrentsList session_id={torrentSearch?.session_id} />
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
  );
}

function TorrentsList({ session_id }: { session_id?: number }) {
  const torrentSearch = useSearch({ from: "/_layout/", shouldThrow: false });

  const count = useRPC<TorrentsCount>(
    "torrents.count",
    { session_id },
    {
      enabled: session_id !== undefined,
      refetchInterval: 1000,
    }
  );

  return (
    <>
      <div className="text-sm/6 font-bold text-gray-400 dark:text-gray-500">
        Torrents
      </div>
      <ul className="text-sm">
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: undefined,
            }}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <ArrowsRightLeftIcon className="size-4" />
              <span>All</span>
            </div>
            {count.data && <span>{count.data.total}</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: ["downloading", "downloading_queued"],
            }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <ArrowDownTrayIcon className="size-4 text-green-600" />
              <span>Downloading</span>
            </div>
            <span>
              {count.data &&
                count.data.downloading + count.data.downloading_queued}
            </span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: ["seeding", "seeding_queued"],
            }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <ArrowUpTrayIcon className="size-4 text-blue-600" />
              <span>Seeding</span>
            </div>
            <span>
              {count.data && count.data.seeding + count.data.seeding_queued}
            </span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: ["finished"],
            }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <CheckIcon className="size-4 text-purple-600" />
              <span>Finished</span>
            </div>
            <span>{count.data && count.data.finished}</span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: ["paused"],
            }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <PauseIcon className="size-4 text-orange-600" />
              <span>Paused</span>
            </div>
            <span>{count.data && count.data.paused}</span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              status: ["error"],
            }}
            activeProps={{ className: "bg-gray-600 rounded" }}
            className="flex justify-between p-1"
          >
            <div className="flex space-x-2 items-center">
              <ExclamationTriangleIcon className="size-4 text-red-600" />
              <span>Error</span>
            </div>
            <span>{count.data && count.data.error}</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
