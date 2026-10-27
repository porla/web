import { RpcError, useRPC, type InfoHash } from "@/api";
import { filesize } from "filesize";
import { Menu } from "lucide-react";
import { useModal } from "./modal";
import RenameTorrentFileModal from "./modals/torrent-file-rename";
import PrioritizeTorrentFileModal from "./modals/torrent-file-prioritize";

// file_progress reports bytes, not a fraction.
function percent(done: number, size: number) {
  return size > 0 ? `${((done / size) * 100).toFixed(1)}%` : "100.0%";
}

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

  // libtorrent's alignment padding, not files anyone downloads
  const visibleFiles = files.data?.files.filter(
    (f) => !f.flags.includes("pad_file"),
  );

  if (files.error) {
    return (
      <p className="p-3 text-sm opacity-70">
        {files.error instanceof RpcError && files.error.code === -4
          ? "Torrent has no metadata. The file list appears once it has been downloaded."
          : files.error.message}
      </p>
    );
  }

  return (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>Path</th>
          <th>Size</th>
          <th>Symlink</th>
          <th>Flags</th>
          <th>Progress</th>
          <th>Priority</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {visibleFiles?.map((f) => (
          <tr key={`file_${f.index}`}>
            <td>{f.path}</td>
            <td>{filesize(f.size)}</td>
            <td>{f.symlink ? "symlink" : "-"}</td>
            <td>{f.flags.join(",")}</td>
            <td>
              {progress.data && progress.data.progress.length > f.index && (
                <>{percent(progress.data.progress[f.index], f.size)}</>
              )}
            </td>
            <td>
              {priorities.data &&
                priorities.data.priorities.length > f.index && (
                  <>{priorities.data.priorities[f.index]}</>
                )}
            </td>
            <td>
              <button
                className="btn btn-xs btn-square"
                popoverTarget={`popover_file_${f.index}`}
                style={{ anchorName: `--anchor-file-${f.index}` }}
              >
                <Menu className="size-4" />
              </button>

              <ul
                className="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
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
                {priorities.data &&
                  priorities.data.priorities.length > f.index && (
                    <li>
                      <button
                        onClick={async () => {
                          await modal.show(PrioritizeTorrentFileModal, {
                            info_hash,
                            session_id,
                            file_index: f.index,
                            file_priority: priorities.data.priorities[f.index],
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
        ))}
      </tbody>
    </table>
  );
}
