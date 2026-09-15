import {
  useRPC,
  type InfoHash,
  type TorrentsGet,
  type TorrentsPiecesGet,
} from "@/api";
import PieceProgress from "./pieces-progress";

type GeneralTabProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function GeneralTab({ info_hash, session_id }: GeneralTabProps) {
  const details = useRPC<TorrentsGet>(
    "torrents.get",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  const pieces = useRPC<TorrentsPiecesGet>(
    "torrents.pieces.get",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  if (
    details.isLoading ||
    !details.data?.torrent ||
    pieces.isLoading ||
    !pieces.data
  ) {
    return <>loading</>;
  }

  return (
    <div>
      <PieceProgress
        pieces={pieces.data.pieces}
        verified={pieces.data.verified_pieces}
      />
    </div>
  );
}
