import {
  type TorrentsFilesList,
  useRPC,
  type InfoHash,
  type TorrentsFilesPriorities,
  type TorrentsFilesProgress,
} from "@/api";
import { filesize } from "filesize";
import { Menu } from "lucide-react";
import { useModal } from "./modal";
import RenameTorrentFileModal from "./modals/torrent-file-rename";
import PrioritizeTorrentFileModal from "./modals/torrent-file-prioritize";

type FilesTabProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function FilesTab({ info_hash, session_id }: FilesTabProps) {
  const modal = useModal();

  const files = useRPC<TorrentsFilesList>(
    "torrents.files.list",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  const priorities = useRPC<TorrentsFilesPriorities>(
    "torrents.files.priorities",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  const progress = useRPC<TorrentsFilesProgress>(
    "torrents.files.progress",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  return (
    <table className="table table-sm">
      <tbody>
        {files.data?.files.map((f) => (
          <tr key={`file_${f.path}`}>
            <td>{f.path}</td>
            <td>{filesize(f.size)}</td>
            <td>{f.symlink ? "symlink" : "-"}</td>
            <td>{f.flags.join(",")}</td>
            <td>
              {progress.data && progress.data.progress.length >= f.index && (
                <>{progress.data.progress[f.index]}</>
              )}
            </td>
            <td>
              {priorities.data &&
                priorities.data.priorities.length >= f.index && (
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
                  priorities.data.priorities.length >= f.index && (
                    <li>
                      <button
                        onClick={async () => {
                          await modal.show(PrioritizeTorrentFileModal, {
                            info_hash,
                            session_id,
                            file_index: f.index,
                            file_priority: priorities.data.priorities[f.index],
                          });

                          files.refetch();
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
