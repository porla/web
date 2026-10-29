import {
  RpcError,
  useRPC,
  type FileFlag,
  type InfoHash,
  type TorrentFile,
} from "@/api";
import { FolderTree, Menu, TriangleAlert } from "lucide-react";
import { useModal } from "./modal";
import RenameTorrentFileModal from "./modals/torrent-file-rename";
import PrioritizeTorrentFileModal from "./modals/torrent-file-prioritize";
import ListState from "./list-state";
import clsx from "clsx";
import Dash from "./dash";
import { bytes } from "@/format";

const fraction = (done: number, size: number) => (size > 0 ? done / size : 1);

// libtorrent's named priorities; the ones between are shown as numbers.
const priorityNames: Record<number, string> = {
  0: "Skip",
  1: "Low",
  4: "Normal",
  7: "High",
};

// Dropped below a panel width, like the Peers and Trackers columns.
const tiers = {
  flags: "@max-[37rem]:hidden",
};

// The flags anyone cares about (pad files aren't listed), in a fixed order:
// porla sends them as a set.
const flagNames: FileFlag[] = ["executable", "hidden", "symlink"];
const flags = (f: TorrentFile) => flagNames.filter((n) => f.flags.includes(n));

type FilesTabProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function FilesTab({ info_hash, session_id }: FilesTabProps) {
  const modal = useModal();

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
      refetchInterval: (query) => (query.state.error ? 2000 : false),
      meta: { silent: true },
    },
  );

  const priorities = useRPC(
    "torrents.files.priorities",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  const progress = useRPC(
    "torrents.files.progress",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  const visibleFiles =
    files.data?.files.filter((f) => !f.flags.includes("pad_file")) ?? [];

  if (files.isLoading) {
    return <span className="loading loading-spinner m-3" />;
  }

  if (files.error) {
    return files.error instanceof RpcError && files.error.code === -4 ? (
      <ListState icon={FolderTree} title="No file list yet">
        The torrent has no metadata yet. Its files show once that's downloaded.
      </ListState>
    ) : (
      <ListState icon={TriangleAlert} title="Couldn't load the files">
        {files.error.message}
      </ListState>
    );
  }

  return (
    <div className="@container">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            <th className="px-2 text-xs">Path</th>
            <th className="px-2 text-right text-xs">Size</th>
            <th className="px-2 text-right text-xs">Progress</th>
            <th className="px-2 text-xs" title="Download priority">
              Priority
            </th>
            <th className={clsx("px-2 text-xs", tiers.flags)}>Flags</th>
            <th className="px-2" />
          </tr>
        </thead>
        <tbody>
          {visibleFiles.map((f) => {
            const done = progress.data?.progress[f.index];
            const priority = priorities.data?.priorities[f.index];
            const slash = f.path.lastIndexOf("/") + 1;
            return (
              <tr
                key={`file_${f.index}`}
                className="group hover:bg-base-200/60"
              >
                {/* Takes what the others leave; the folders are muted. */}
                <td className="w-full max-w-0 px-2">
                  <span className="block truncate" title={f.path}>
                    <span className="opacity-60">{f.path.slice(0, slash)}</span>
                    {f.path.slice(slash)}
                  </span>
                </td>
                <td className="px-2 text-right tabular-nums whitespace-nowrap">
                  {bytes(f.size)}
                </td>
                <td className="px-2 text-right tabular-nums whitespace-nowrap">
                  {done !== undefined && (
                    <span className="inline-flex items-center gap-2">
                      <progress
                        className={clsx(
                          "progress h-1.5 w-8",
                          fraction(done, f.size) >= 1
                            ? "progress-success"
                            : "progress-primary",
                        )}
                        value={fraction(done, f.size)}
                        max={1}
                        aria-label="File progress"
                      />
                      <span className="w-12">
                        {(fraction(done, f.size) * 100).toFixed(1)}%
                      </span>
                    </span>
                  )}
                </td>
                <td
                  className={clsx(
                    "px-2 whitespace-nowrap",
                    priority === 0 && "opacity-60",
                  )}
                >
                  {priority !== undefined &&
                    (priorityNames[priority] ?? priority)}
                </td>
                <td className={clsx("px-2 text-xs opacity-70", tiers.flags)}>
                  {flags(f).join(", ") || <Dash />}
                </td>
                <td className="px-2 py-0 text-right">
                  <button
                    className="btn btn-ghost btn-xs btn-square focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
                    aria-label={`Actions for ${f.path}`}
                    popoverTarget={`popover_file_${f.index}`}
                    style={{ anchorName: `--anchor-file-${f.index}` }}
                  >
                    <Menu className="size-4" />
                  </button>

                  <ul
                    className="dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm"
                    popover="auto"
                    id={`popover_file_${f.index}`}
                    style={{ positionAnchor: `--anchor-file-${f.index}` }}
                  >
                    <li>
                      <button
                        onClick={async () => {
                          await modal.show(RenameTorrentFileModal, {
                            info_hash,
                            session_id,
                            file_index: f.index,
                            file_path: f.path,
                          });

                          files.refetch();
                        }}
                      >
                        Rename
                      </button>
                    </li>

                    {priority !== undefined && (
                      <li>
                        <button
                          onClick={async () => {
                            await modal.show(PrioritizeTorrentFileModal, {
                              info_hash,
                              session_id,
                              file_index: f.index,
                              file_priority: priority,
                            });

                            priorities.refetch();
                          }}
                        >
                          Set priority
                        </button>
                      </li>
                    )}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
