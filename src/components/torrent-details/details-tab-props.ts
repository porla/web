import type { InfoHash, Torrent } from "@/api";

export type DetailsTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};
