import { RpcError, useRPC, type InfoHash } from "@/api";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  Info,
  LayoutGrid,
  RadioTower,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import GeneralTab from "./general-tab";
import FilesTab from "./files-tab";
import PeersTab from "./peers-tab";
import TrackersTab from "./trackers-tab";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "@/toast";
import clsx from "clsx";
import DockBar from "./dock-bar";
import PiecesTab from "./pieces-tab";

type TorrentDetailsPanelProps = {
  info_hash: InfoHash;
  session_id: number;
  pager?: ReactNode;
};

const tabs: {
  id: "general" | "files" | "pieces" | "peers" | "trackers";
  name: string;
  icon: LucideIcon;
}[] = [
  { id: "general", name: "General", icon: Info },
  { id: "files", name: "Files", icon: FolderTree },
  { id: "pieces", name: "Pieces", icon: LayoutGrid },
  { id: "peers", name: "Peers", icon: Users },
  { id: "trackers", name: "Trackers", icon: RadioTower },
];

// The panel's height and whether it's folded down to its bar, kept per
// browser. Storage can be unavailable (private windows); then it's just not
// remembered.
const stored = (key: string, fallback: number) => {
  try {
    const v = Number(localStorage.getItem(key));
    return v > 0 ? v : fallback;
  } catch {
    return fallback;
  }
};

const store = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // not remembered
  }
};

const MIN_HEIGHT = 160;

export default function TorrentDetailsPanel({
  info_hash,
  session_id,
  pager,
}: TorrentDetailsPanelProps) {
  const torrentSearch = useSearch({
    from: "/_status/_main/",
    shouldThrow: false,
  });

  const navigate = useNavigate();
  const selectedTab = torrentSearch?.selected_tab_id ?? "general";

  const [height, setHeight] = useState(() =>
    stored("porla.details.height", 360),
  );

  const dragFrom = useRef<number | null>(null);

  const [collapsed, setCollapsed] = useState(
    () => stored("porla.details.collapsed", 0) === 1,
  );

  const fold = (on: boolean) => {
    setCollapsed(on);
    store("porla.details.collapsed", on ? 1 : 0);
  };

  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { refetchInterval: 2000, meta: { silent: true } },
  );

  // Removed or migrated elsewhere, or its session was removed or unloaded:
  // close the panel, saying why, instead of polling and showing stale data.
  // Not while fetching: a remounted panel first sees the error cached from
  // the last time this torrent left (it may have come back since).
  const gone =
    !torrent.isFetching &&
    torrent.error instanceof RpcError &&
    [-1, -2, -3].includes(torrent.error.code)
      ? torrent.error.message
      : null;

  useEffect(() => {
    if (gone) {
      toast(gone);
      navigate({
        to: "/",
        search: (prev) => ({
          ...prev,
          selected_info_hash: undefined,
          selected_session_id: undefined,
          selected_tab_id: undefined,
        }),
      });
    }
  }, [gone, navigate]);

  const t = torrent.data?.torrent;

  const clear = {
    ...torrentSearch,
    selected_info_hash: undefined,
    selected_session_id: undefined,
    selected_tab_id: undefined,
  };

  return (
    <div
      className="flex shrink-0 flex-col"
      style={collapsed ? undefined : { height }}
    >
      <DockBar
        onResize={(dy, done) => {
          if (collapsed) return;
          // dy is from where the drag started, so from the height then.
          dragFrom.current ??= height;
          const max = window.innerHeight * 0.75;
          const h = Math.round(
            Math.min(max, Math.max(MIN_HEIGHT, dragFrom.current + dy)),
          );
          setHeight(h);
          if (done) {
            store("porla.details.height", h);
            dragFrom.current = null;
          }
        }}
      >
        <span
          className="max-w-64 min-w-0 truncate text-sm font-semibold"
          title={t?.name}
        >
          {t?.name}
        </span>
        <div role="tablist" className="tabs tabs-border tabs-sm flex-nowrap">
          {tabs.map(({ id, name, icon: Icon }) => (
            <Link
              key={id}
              to="/"
              role="tab"
              aria-selected={id === selectedTab}
              className={clsx(
                "tab gap-1.5",
                id === selectedTab && "tab-active",
              )}
              search={{ ...torrentSearch, selected_tab_id: id }}
              onClick={() => fold(false)}
            >
              <Icon className="size-3.5" />
              {name}
            </Link>
          ))}
        </div>
        {/* On narrow screens the paging gets the bar's first row, above
            the torrent's name. */}
        {pager && (
          <div className="max-md:order-first max-md:flex max-md:w-full max-md:justify-end md:ml-auto">
            {pager}
          </div>
        )}
        <div className="flex items-center gap-1 max-md:ml-auto">
          <button
            className="btn btn-ghost btn-xs btn-square"
            onClick={() => fold(!collapsed)}
            aria-label={collapsed ? "Show the details" : "Fold the details"}
            title={collapsed ? "Show the details" : "Fold the details"}
          >
            {collapsed ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          <Link
            to="/"
            search={clear}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Close the details"
            title="Close the details"
          >
            <X className="size-4" />
          </Link>
        </div>
      </DockBar>

      {!collapsed && (
        <div className="flex-1 min-h-0 min-w-0 overflow-auto">
          {selectedTab === "general" && (
            <GeneralTab
              info_hash={info_hash}
              session_id={session_id}
              torrent={torrent.data?.torrent}
            />
          )}

          {selectedTab === "files" && (
            <FilesTab info_hash={info_hash} session_id={session_id} />
          )}

          {selectedTab === "pieces" && (
            <PiecesTab
              info_hash={info_hash}
              session_id={session_id}
              torrent={torrent.data?.torrent}
            />
          )}

          {selectedTab === "peers" && (
            <PeersTab
              info_hash={info_hash}
              session_id={session_id}
              torrent={torrent.data?.torrent}
            />
          )}

          {selectedTab === "trackers" && (
            <TrackersTab
              info_hash={info_hash}
              session_id={session_id}
              torrent={torrent.data?.torrent}
            />
          )}
        </div>
      )}
    </div>
  );
}
