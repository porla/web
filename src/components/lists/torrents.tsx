import { infoHashKey, type Torrent } from "@/api";
import { torrentStatus, type Tone } from "@/torrent-status";
import { Link, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { filesize } from "filesize";
import Dash from "../dash";

// The sidebar's status colors (its icons use the same shades), so a row reads
// like the filter it's in.
const bars: Record<Tone, string> = {
  downloading: "bg-green-600 dark:bg-green-300",
  seeding: "bg-blue-600 dark:bg-blue-300",
  finished: "bg-purple-600 dark:bg-purple-300",
  paused: "bg-orange-600 dark:bg-orange-300",
  error: "bg-red-600 dark:bg-red-300",
  other: "bg-base-content/40",
};

export const TorrentListColumns = () => {
  const torrentSearch = useSearch({
    from: "/_status/_main/",
    shouldThrow: false,
  });

  return {
    queue_position: {
      default: true,
      headerClassNames: "text-right w-4",
      columnClassNames: "text-base-content/60",
      title: "#",
      data: (t: Torrent) => (
        <>{t.queue_position < 0 ? <Dash /> : t.queue_position + 1}</>
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
          {t.name.length > 0 ? t.name : infoHashKey(t.info_hash)}
        </Link>
      ),
    },
    size: {
      default: true,
      headerClassNames: "w-32",
      columnClassNames: "text-base-content/60",
      title: "Size",
      // A magnet has no size until its metadata arrives.
      data: (t: Torrent) =>
        t.state === "downloading_metadata" ? (
          <Dash />
        ) : (
          <>{filesize(t.total)}</>
        ),
    },
    status: {
      default: true,
      headerClassNames: "w-40",
      columnClassNames: "",
      title: "Status",
      data: (t: Torrent) => {
        const { label, tone } = torrentStatus(t);

        // Without metadata there's nothing to show progress of.
        if (t.state === "downloading_metadata") {
          return (
            <span className="text-xs opacity-70" title={label}>
              {label}
            </span>
          );
        }

        // While checking, progress is how much of the data was checked.
        const percent = `${Math.floor(t.progress * 100)}%`;

        return (
          <span className="flex items-center gap-2" title={label}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-content/10">
              <span
                className={clsx("block h-full rounded-full", bars[tone])}
                style={{ width: `${t.progress * 100}%` }}
              />
            </span>
            <span className="min-w-10 text-right text-xs tabular-nums opacity-70">
              {label === "Checking" ? `Checking ${percent}` : percent}
            </span>
          </span>
        );
      },
    },
    download_payload_rate: {
      default: true,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "DL",
      data: (t: Torrent) =>
        t.download_payload_rate > 0 ? (
          `${filesize(t.download_payload_rate)}/s`
        ) : (
          <Dash />
        ),
    },
    upload_payload_rate: {
      default: true,
      headerClassNames: "w-32 text-right",
      columnClassNames: "text-right",
      title: "UL",
      data: (t: Torrent) =>
        t.upload_payload_rate > 0 ? (
          `${filesize(t.upload_payload_rate)}/s`
        ) : (
          <Dash />
        ),
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
      data: (t: Torrent) => <>{t.$userdata?.category}</>,
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
