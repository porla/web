import type { InfoHash, TorrentFile } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { PrioritizeTorrentFileModal } from "@/components/modals/prioritize-torrent-file-modal";
import { RenameTorrentFileModal } from "@/components/modals/rename-torrent-file-modal";
import { RowMenu } from "@/components/ui/row-menu";

export function FileRowMenu({
  info_hash,
  session_id,
  file: f,
  priority,
  onRenamed,
  onPrioritized,
}: {
  info_hash: InfoHash;
  session_id: number;
  file: TorrentFile;
  priority: number | undefined;
  onRenamed: () => void;
  onPrioritized: () => void;
}) {
  const modal = useModal();

  return (
    <RowMenu id={`file_${f.index}`} label={`Actions for ${f.path}`}>
      <li>
        <button
          onClick={async () => {
            await modal.show(RenameTorrentFileModal, {
              info_hash,
              session_id,
              file_index: f.index,
              file_path: f.path,
            });

            onRenamed();
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

              onPrioritized();
            }}
          >
            Set priority
          </button>
        </li>
      )}
    </RowMenu>
  );
}
