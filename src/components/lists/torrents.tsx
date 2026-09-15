import type { Torrent } from "@/api";
import { Link, useSearch } from "@tanstack/react-router";
import { filesize } from "filesize";

export const TorrentListColumns = () => {
  const torrentSearch = useSearch({ from: "/_layout/", shouldThrow: false });

  return {
    queue_position: {
      default: true,
      headerClassNames: "text-right w-4",
      columnClassNames: "text-gray-300",
      title: "#",
      data: (t: Torrent) => (
        <>{t.queue_position < 0 ? "-" : t.queue_position + 1}</>
      ),
    },
    name: {
      default: true,
      headerClassNames: "",
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Name",
      data: (t: Torrent) => (
        <Link
          to="/"
          search={{
            ...torrentSearch,
            selected_info_hash: t.info_hash,
            selected_session_id: torrentSearch?.session_id,
            selected_tab_id: torrentSearch?.selected_tab_id || "general",
          }}
          className="hover:underline"
        >
          {t.name}
        </Link>
      ),
    },
    size: {
      default: true,
      headerClassNames: "w-32",
      columnClassNames: "text-gray-300",
      title: "Size",
      data: (t: Torrent) => <>{filesize(t.total)}</>,
    },
    status: {
      default: true,
      headerClassNames: "w-32",
      columnClassNames: "",
      title: "Status",
      data: (t: Torrent) => (
        <progress
          className="progress w-full"
          value={t.progress}
          max={1}
        ></progress>
      ),
    },
    download_payload_rate: {
      default: true,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "DL",
      data: (t: Torrent) =>
        t.download_payload_rate > 0
          ? `${filesize(t.download_payload_rate)}/s`
          : "-",
    },
    upload_payload_rate: {
      default: true,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "UL",
      data: (t: Torrent) =>
        t.upload_payload_rate > 0
          ? `${filesize(t.upload_payload_rate)}/s`
          : "-",
    },
    peers: {
      default: false,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "Peers",
      data: (t: Torrent) => (
        <>
          {t.num_peers - t.num_seeds} ({t.list_peers - t.list_seeds})
        </>
      ),
    },
    seeds: {
      default: false,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "Seeds",
      data: (t: Torrent) => (
        <>
          {t.num_seeds} ({t.list_seeds})
        </>
      ),
    },
    tracker: {
      default: false,
      headerClassNames: "w-64",
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Tracker",
      data: (t: Torrent) => <>{t.current_tracker}</>,
    },
    category: {
      default: false,
      headerClassNames: "w-32",
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Category",
      data: (t: Torrent) => <>{t.$userdata.category}</>,
    },
    ratio: {
      default: false,
      headerClassNames: "w-32",
      columnClassNames: "",
      title: "Ratio",
      data: (t: Torrent) => <>{t.ratio}</>,
    },
    ratio_real: {
      default: false,
      headerClassNames: "w-32",
      columnClassNames: "",
      title: "Ratio",
      data: (t: Torrent) => <>{t.ratio_real}</>,
    },
  };
};
