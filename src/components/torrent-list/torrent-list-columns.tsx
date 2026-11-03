import {
  infoHashKey,
  useKv,
  type SortDir,
  type Torrent,
  type TorrentSortField,
} from "@/api";
import { toneBar, torrentStatus } from "@/lib/torrent/status";
import { Link, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { bytes, rate } from "@/lib/format";
import { Dash } from "@/components/ui/dash";
import type { ReactNode } from "react";
import { Ratio } from "@/components/ui/ratio";

export type TorrentListColumn = {
  default: boolean;
  // rem; none for the name, which takes what's left
  width?: number;
  // rem below md, where only #, Name and Status are shown
  narrowWidth?: number;
  headerClassNames?: string;
  columnClassNames?: string;
  title: string;
  // For settings, where the title is an abbreviation.
  name?: string;
  description?: string;
  sort?: TorrentSortField;
  sortFirst?: SortDir;
  data: (t: Torrent) => ReactNode;
};

export const useTorrentListColumns = () => {
  const torrentSearch = useSearch({
    from: "/_app/_shell/",
    shouldThrow: false,
  });

  const columns = {
    queue_position: {
      default: true,
      width: 3,
      headerClassNames: "text-right",
      columnClassNames: "text-right text-base-content/60",
      title: "#",
      name: "Queue position",
      sort: "queue_position",
      sortFirst: "asc",
      data: (t) => (
        <>{t.queue_position < 0 ? <Dash /> : t.queue_position + 1}</>
      ),
    },
    name: {
      default: true,
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Name",
      sort: "name",
      sortFirst: "asc",
      data: (t) => (
        <Link
          to="/"
          search={{
            ...torrentSearch,
            selected_info_hash: t.info_hash,
            selected_session_id: torrentSearch?.session_id,
            selected_tab_id: torrentSearch?.selected_tab_id ?? "general",
          }}
          className="hover:underline"
        >
          {t.name.length > 0 ? t.name : infoHashKey(t.info_hash)}
        </Link>
      ),
    },
    size: {
      default: true,
      width: 8,
      columnClassNames: "text-base-content/60",
      title: "Size",
      sort: "total",
      // A magnet has no size until its metadata arrives.
      data: (t) =>
        t.state === "downloading_metadata" ? <Dash /> : bytes(t.total),
    },
    status: {
      default: true,
      width: 10,
      narrowWidth: 5,
      title: "Status",
      sort: "progress",
      data: (t) => {
        const { label, tone } = torrentStatus(t);

        // Without metadata there's nothing to show progress of.
        if (t.state === "downloading_metadata") {
          return (
            <span className="block truncate text-xs opacity-70" title={label}>
              {label}
            </span>
          );
        }

        // While checking, progress is how much of the data was checked.
        const percent = `${Math.floor(t.progress * 100)}%`;

        return (
          <span
            className="flex items-center gap-2 max-md:flex-col max-md:items-stretch max-md:gap-1"
            title={label}
          >
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-content/10 max-md:flex-none">
              <span
                className={clsx("block h-full rounded-full", toneBar[tone])}
                style={{ width: `${t.progress * 100}%` }}
              />
            </span>
            <span className="min-w-10 text-right text-xs tabular-nums opacity-70 max-md:min-w-0 max-md:text-left max-md:leading-none">
              {label === "Checking" ? `Checking ${percent}` : percent}
            </span>
          </span>
        );
      },
    },
    download_payload_rate: {
      default: true,
      width: 8,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "DL",
      name: "Download rate",
      // download_rate counts protocol overhead too; there is no payload rate
      // to sort by yet
      sort: "download_rate",
      data: (t) =>
        t.download_payload_rate > 0 ? rate(t.download_payload_rate) : <Dash />,
    },
    upload_payload_rate: {
      default: true,
      width: 8,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "UL",
      name: "Upload rate",
      sort: "upload_rate",
      data: (t) =>
        t.upload_payload_rate > 0 ? rate(t.upload_payload_rate) : <Dash />,
    },
    peers: {
      default: false,
      width: 8,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "Peers",
      sort: "num_peers",
      data: (t) => (
        <>
          {t.num_peers - t.num_seeds} ({t.list_peers - t.list_seeds})
        </>
      ),
    },
    seeds: {
      default: false,
      width: 8,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "Seeds",
      sort: "num_seeds",
      data: (t) => (
        <>
          {t.num_seeds} ({t.list_seeds})
        </>
      ),
    },
    tracker: {
      default: false,
      width: 16,
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Tracker",
      data: (t) => <>{t.current_tracker}</>,
    },
    category: {
      default: false,
      width: 8,
      columnClassNames: "overflow-hidden text-ellipsis whitespace-nowrap",
      title: "Category",
      data: (t) => <>{t.$userdata?.category}</>,
    },
    ratio: {
      default: false,
      width: 6,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "Ratio",
      sort: "ratio",
      data: (t) => <Ratio value={t.ratio} />,
    },
    ratio_real: {
      default: false,
      width: 7,
      headerClassNames: "text-right",
      columnClassNames: "text-right",
      title: "Own ratio",
      description: "Counting only what this client downloaded",
      data: (t) => <Ratio value={t.ratio_real} />,
    },
  } satisfies Record<string, TorrentListColumn>;

  return columns as Record<keyof typeof columns, TorrentListColumn>;
};

export const NAME_MIN_WIDTH = 16;

export type ColumnKey = keyof ReturnType<typeof useTorrentListColumns>;

export const COLUMNS_KV_KEY = "webui.lists.torrents.cols";

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

export function useShownColumns() {
  const columns = useTorrentListColumns();
  const saved = useKv(COLUMNS_KV_KEY);
  const raw = saved.value;

  const shown =
    isStringArray(raw) && raw.length
      ? raw.filter((c): c is ColumnKey => c in columns)
      : (Object.keys(columns) as ColumnKey[]).filter((c) => columns[c].default);

  return { columns, shown, saved };
}
