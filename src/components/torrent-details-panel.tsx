import { RpcError, useRPC, type InfoHash } from "@/api";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { X } from "lucide-react";
import GeneralTab from "./general-tab";
import FilesTab from "./files-tab";
import PeersTab from "./peers-tab";
import TrackersTab from "./trackers-tab";
import { useEffect } from "react";
import { toast } from "@/toast";
import clsx from "clsx";

type TorrentDetailsPanelProps = {
  info_hash: InfoHash;
  session_id: number;
};

const tabs = [
  {
    id: "general",
    name: "General",
  },
  {
    id: "files",
    name: "Files",
  },
  {
    id: "peers",
    name: "Peers",
  },
  {
    id: "trackers",
    name: "Trackers",
  },
] as const;

export default function TorrentDetailsPanel({
  info_hash,
  session_id,
}: TorrentDetailsPanelProps) {
  const torrentSearch = useSearch({
    from: "/_status/_main/",
    shouldThrow: false,
  });

  const navigate = useNavigate();
  const selectedTab = torrentSearch?.selected_tab_id ?? "general";

  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { refetchInterval: 2000, meta: { silent: true } },
  );

  // Removed or migrated elsewhere, or its session was removed or unloaded:
  // close the panel, saying why, instead of polling and showing stale data.
  const gone =
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

  return (
    <div className="h-90 shrink-0 flex flex-col">
      <div className="flex justify-between items-center p-1">
        <div role="tablist" className="tabs tabs-box tabs-sm">
          {tabs.map((t) => (
            <Link
              key={t.id}
              to="/"
              role="tab"
              className={clsx("tab", t.id === selectedTab && "tab-active")}
              search={{
                ...torrentSearch,
                selected_tab_id: t.id,
              }}
            >
              {t.name}
            </Link>
          ))}
        </div>
        <div>
          <Link
            to="/"
            search={{
              ...torrentSearch,
              selected_info_hash: undefined,
              selected_session_id: undefined,
              selected_tab_id: undefined,
            }}
            className="btn btn-square btn-xs"
          >
            <X />
          </Link>
        </div>
      </div>

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
    </div>
  );
}
