import { type SessionsList, type TorrentsCount, useRPC } from "@/api";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeftRight,
  Check,
  Cog,
  Download,
  Pause,
  Tag,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useEffect } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const torrentSearch = useSearch({
    from: "/_status/_main/",
    shouldThrow: false,
  });

  const sessions = useRPC<SessionsList>("sessions.list", null, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!torrentSearch) {
      return;
    }

    if (sessions.data && !torrentSearch.session_id) {
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
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Link to="/add" className="btn btn-block">
          Add torrent
        </Link>
      </div>

      <div className="flex-1">
        <ul className="menu w-full">
          <li className="menu-title">Sessions</li>
          {sessions.isLoading && (
            <li>
              <span className="loading loading-spinner loading-md"></span>
            </li>
          )}

          {sessions.data?.sessions.map((s) => (
            <li key={`session_${s.id}`}>
              <Link
                to="/"
                search={{
                  ...torrentSearch,
                  session_id: s.id,
                }}
                className="flex justify-between w-full"
                activeProps={{
                  className: "bg-base-100",
                }}
              >
                <div className="flex items-center space-x-2">
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
                <span>{s.state?.torrents_total}</span>
              </Link>
            </li>
          ))}
        </ul>

        <TorrentsList session_id={torrentSearch?.session_id} />
      </div>

      <ul className="menu w-full">
        <li>
          <Link
            to="/settings"
            activeProps={{
              className: "bg-base-100",
            }}
          >
            <div className="flex space-x-2 items-center">
              <Cog className="size-4 text-gray-300" />
              <span>Settings</span>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function TorrentsList({ session_id }: { session_id?: number }) {
  const torrentSearch = useSearch({
    from: "/_status/_main/",
    shouldThrow: false,
  });

  const count = useRPC<TorrentsCount>(
    "torrents.count",
    { session_id },
    {
      enabled: !!session_id,
      refetchInterval: 1000,
    },
  );

  const categories = Object.entries(count.data?.categories ?? {}).filter(
    ([, n]) => n > 0,
  );

  const tags = Object.entries(count.data?.tags ?? {}).filter(([, n]) => n > 0);

  return (
    <>
      <ul className="menu w-full">
        <li className="menu-title">Torrents</li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              category: undefined,
              query: undefined,
              status: undefined,
              tag: undefined,
            }}
            activeOptions={{
              exact: true,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <ArrowLeftRight className="size-4 text-gray-300" />
              <span>All</span>
            </div>
            <span>{count.data?.total}</span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              category: undefined,
              query: undefined,
              status: ["downloading", "downloading_queued"],
              tag: undefined,
            }}
            activeOptions={{
              exact: true,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <Download className="size-4 text-green-300" />
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
              category: undefined,
              query: undefined,
              status: ["seeding", "seeding_queued"],
              tag: undefined,
            }}
            activeOptions={{
              exact: true,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <Upload className="size-4 text-blue-300" />
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
              category: undefined,
              query: undefined,
              status: ["finished"],
              tag: undefined,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <Check className="size-4 text-purple-300" />
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
              category: undefined,
              query: undefined,
              status: ["paused"],
              tag: undefined,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <Pause className="size-4 text-orange-300" />
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
              category: undefined,
              query: undefined,
              status: ["error"],
              tag: undefined,
            }}
            activeProps={{
              className: "bg-base-100",
            }}
            className="flex justify-between w-full"
          >
            <div className="flex space-x-2 items-center">
              <TriangleAlert className="size-4 text-red-300" />
              <span>Error</span>
            </div>
            <span>{count.data && count.data.error}</span>
          </Link>
        </li>
      </ul>

      {categories.length > 0 && (
        <ul className="menu w-full">
          <li className="menu-title">Categories</li>
          {categories.map(([c, n]) => (
            <li key={`category_${c}`}>
              <Link
                to="/"
                activeOptions={{
                  exact: true,
                }}
                activeProps={{
                  className: "bg-base-100",
                }}
                className="flex justify-between w-full"
                search={{
                  session_id,
                  category: c,
                }}
              >
                <div className="flex space-x-2 items-center">
                  <Archive className="size-4 text-neutral-content" />
                  <span>{c}</span>
                </div>
                <span>{n}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <ul className="menu w-full">
          <li className="menu-title">Tags</li>
          {tags.map(([t, n]) => (
            <li key={`tag_${t}`}>
              <Link
                to="/"
                activeOptions={{
                  exact: true,
                }}
                activeProps={{
                  className: "bg-base-100",
                }}
                className="flex justify-between w-full"
                search={{
                  session_id,
                  tag: t,
                }}
              >
                <div className="flex space-x-2 items-center">
                  <Tag className="size-4 text-neutral-content" />
                  <span>{t}</span>
                </div>
                <span>{n}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
