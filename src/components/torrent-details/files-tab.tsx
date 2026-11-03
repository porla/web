import {
  POLL_MS,
  RpcCode,
  isRpcError,
  useRPC,
  type FileFlag,
  type TorrentFile,
} from "@/api";
import { FolderTree } from "lucide-react";
import { ListState } from "@/components/ui/list-state";
import clsx from "clsx";
import { Dash } from "@/components/ui/dash";
import { bytes } from "@/lib/format";
import { DetailsTable, type DetailsColumn } from "./details-table";
import { FileRowMenu } from "./file-row-menu";
import { ProgressCell } from "./progress-cell";
import { QueryNotice } from "@/components/ui/query-notice";
import type { DetailsTabProps } from "./details-tab-props";

const fraction = (done: number, size: number) => (size > 0 ? done / size : 1);

// libtorrent's named priorities; the ones between are shown as numbers.
const priorityNames: Record<number, string> = {
  0: "Skip",
  1: "Low",
  4: "Normal",
  7: "High",
};

// The flags anyone cares about (pad files aren't listed), in a fixed order:
// Porla sends them as a set.
const flagNames: FileFlag[] = ["executable", "hidden", "symlink"];
const flags = (f: TorrentFile) => flagNames.filter((n) => f.flags.includes(n));

type Row = { f: TorrentFile; done?: number; priority?: number };

const columns: DetailsColumn<Row>[] = [
  {
    key: "path",
    label: "Path",
    // Takes what the others leave; the folders are muted.
    className: "w-full max-w-0",
    cell: ({ f }) => {
      const slash = f.path.lastIndexOf("/") + 1;
      return (
        <span className="block truncate" title={f.path}>
          <span className="opacity-60">{f.path.slice(0, slash)}</span>
          {f.path.slice(slash)}
        </span>
      );
    },
  },
  {
    key: "size",
    label: "Size",
    numeric: true,
    cell: ({ f }) => bytes(f.size),
  },
  {
    key: "progress",
    label: "Progress",
    numeric: true,
    cell: ({ f, done }) => {
      if (done === undefined) return null;
      const value = fraction(done, f.size);
      return (
        <ProgressCell
          value={value}
          complete={value >= 1}
          label="File progress"
          textClassName="w-12"
        >
          {(value * 100).toFixed(1)}%
        </ProgressCell>
      );
    },
  },
  {
    key: "priority",
    label: "Priority",
    title: "Download priority",
    className: "whitespace-nowrap",
    cell: ({ priority }) =>
      priority !== undefined && (
        <span className={clsx(priority === 0 && "opacity-60")}>
          {priorityNames[priority] ?? priority}
        </span>
      ),
  },
  {
    key: "flags",
    label: "Flags",
    // Dropped below a panel width, like the Peers and Trackers columns.
    hide: "@max-[37rem]:hidden",
    className: "text-xs opacity-70",
    cell: ({ f }) => flags(f).join(", ") || <Dash />,
  },
];

export function FilesTab({ info_hash, session_id }: DetailsTabProps) {
  const files = useRPC(
    "torrents.files.list",
    {
      info_hash,
      session_id,
    },
    {
      // The list only changes when metadata arrives or a file is renamed (which
      // refetches it), so it's polled only while it fails, e.g. on a magnet
      // without metadata yet. That error is shown below, not as a toast.
      refetchInterval: (query) => (query.state.error ? POLL_MS.details : false),
      meta: { errorToast: false },
    },
  );

  const priorities = useRPC(
    "torrents.files.priorities",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: POLL_MS.details,
    },
  );

  const progress = useRPC(
    "torrents.files.progress",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: POLL_MS.details,
    },
  );

  if (isRpcError(files.error, RpcCode.TorrentNotValid)) {
    return (
      <ListState icon={FolderTree} title="No file list yet">
        The torrent has no metadata yet. Its files show once that's downloaded.
      </ListState>
    );
  }

  if (files.isLoading || files.error) {
    return <QueryNotice query={files} what="files" />;
  }

  const rows: Row[] = (files.data?.files ?? [])
    .filter((f) => !f.flags.includes("pad_file"))
    .map((f) => ({
      f,
      done: progress.data?.progress[f.index],
      priority: priorities.data?.priorities[f.index],
    }));

  return (
    <DetailsTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.f.index}
      actions={({ f, priority }) => (
        <FileRowMenu
          info_hash={info_hash}
          session_id={session_id}
          file={f}
          priority={priority}
        />
      )}
    />
  );
}
