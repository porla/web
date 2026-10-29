import { useRPC, type InfoHash, type Torrent } from "@/api";
import { binaryBytes } from "@/format";
import { groupPieces, pieceSize } from "@/pieces";
import { toneBar, toneRing, torrentStatus } from "@/torrent-status";
import clsx from "clsx";
import { LayoutGrid, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import ListState from "./list-state";

type PiecesTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};

// One cell per piece up to this many; past it each cell is a run of pieces.
const MAX_CELLS = 2000;

const range = (start: number, end: number) =>
  end - start === 1 ? `Piece ${start}` : `Pieces ${start}–${end - 1}`;

// A map of the pieces, one cell each (or one per run on large torrents):
// filled in the torrent's status color as far as its pieces are had. In seed
// mode the fill is the verified pieces, and pieces had but not verified yet
// draw an outline instead, so the two can't be mistaken for each other.
export default function PiecesTab({
  info_hash,
  session_id,
  torrent: t,
}: PiecesTabProps) {
  const pieces = useRPC(
    "torrents.pieces.get",
    { info_hash, session_id },
    { refetchInterval: 2000, meta: { silent: true } },
  );

  const seedMode = !!t?.flags.includes("seed_mode");

  const groups = useMemo(
    () =>
      pieces.data
        ? groupPieces(
            pieces.data.pieces,
            seedMode ? pieces.data.verified_pieces : undefined,
            MAX_CELLS,
          )
        : [],
    [pieces.data, seedMode],
  );

  if (pieces.error) {
    return (
      <ListState icon={TriangleAlert} title="Couldn't load the pieces">
        {pieces.error.message}
      </ListState>
    );
  }

  if (!t || !pieces.data) {
    return <span className="loading loading-spinner m-3" />;
  }

  if (!t.has_metadata) {
    return (
      <ListState icon={LayoutGrid} title="No pieces yet">
        The torrent's metadata hasn't arrived, so its pieces aren't known.
      </ListState>
    );
  }

  const total = pieces.data.pieces[0];
  const have = groups.reduce((n, g) => n + g.have, 0);
  const perCell = Math.ceil(total / Math.max(groups.length, 1));
  const tone = torrentStatus(t).tone;
  const bar = toneBar[tone];
  const ring = toneRing[tone];
  // Bigger boxes when there are few, like a defragmenter's map.
  const cell =
    groups.length <= 200
      ? "size-4.5 rounded-[3px]"
      : groups.length <= 1000
        ? "size-3.5 rounded-[2px]"
        : "size-2.5 rounded-[2px]";

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/70">
        <span className="tabular-nums">
          {have.toLocaleString()} of {total.toLocaleString()} pieces ×{" "}
          {binaryBytes(pieceSize(t.total, total))}
          {perCell > 1 && ` · up to ${perCell} pieces per cell`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={clsx("size-2.5 rounded-xs", bar)} />
          {seedMode ? "Verified" : "Have"}
        </span>
        {seedMode && (
          <span className="flex items-center gap-1.5">
            <span
              className={clsx("size-2.5 rounded-xs ring-2 ring-inset", ring)}
            />
            Not verified yet
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-base-content/10" />
          Missing
        </span>
      </div>

      <div
        aria-label="Piece map"
        className={clsx(
          "flex flex-wrap",
          groups.length <= 200 ? "gap-1" : "gap-0.5",
        )}
      >
        {groups.map((g) => {
          const len = g.end - g.start;
          // In seed mode only verified pieces fill; the rest are outlined.
          const done = (seedMode ? g.verified : g.have) / len;
          const unverified = seedMode && g.have > g.verified;

          return (
            <span
              key={g.start}
              title={`${range(g.start, g.end)}: ${
                len === 1
                  ? g.have
                    ? "have"
                    : "missing"
                  : `${g.have} of ${len} had`
              }${
                seedMode && g.have > g.verified
                  ? len === 1
                    ? ", not verified yet"
                    : ", not all verified"
                  : ""
              }`}
              className={clsx(
                cell,
                "relative bg-base-content/10",
                // Lifted above its neighbours on hover; the tooltip has the rest.
                "hover:z-10 hover:scale-[1.35] hover:ring-1 hover:ring-base-content/70 motion-safe:transition-transform motion-safe:duration-100",
              )}
            >
              {done > 0 && (
                <span
                  className={clsx("block size-full rounded-[inherit]", bar)}
                  // Partly had runs stay visible next to empty ones.
                  style={{ opacity: done < 1 ? 0.25 + 0.75 * done : undefined }}
                />
              )}
              {unverified && (
                <span
                  className={clsx(
                    "absolute inset-0 rounded-[inherit] ring-2 ring-inset",
                    ring,
                  )}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
