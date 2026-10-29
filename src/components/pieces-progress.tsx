import type { Bitfield } from "@/api";
import { groupPieces } from "@/pieces";
import { toneBar, type Tone } from "@/torrent-status";
import clsx from "clsx";
import { useMemo } from "react";

// Enough columns for a smooth bar; a 100k-piece torrent stays a few hundred
// elements, and neighbours with the same fill share one.
const BUCKETS = 300;

// Which pieces the torrent has, as a bar in its status color (the list's Status
// bar, taller). Each part is as opaque as the share of its pieces that are had.
export default function PieceProgress({
  pieces,
  tone,
}: {
  pieces: Bitfield;
  tone: Tone;
}) {
  const { runs, have, total } = useMemo(() => {
    const groups = groupPieces(pieces, undefined, BUCKETS);
    const runs: { len: number; fill: number }[] = [];
    let have = 0;

    for (const g of groups) {
      const len = g.end - g.start;
      // In tenths, so near-equal neighbours merge.
      const fill = Math.round((g.have / len) * 10) / 10;
      const last = runs.at(-1);
      have += g.have;

      if (last && last.fill === fill) last.len += len;
      else runs.push({ len, fill });
    }

    return { runs, have, total: pieces[0] };
  }, [pieces]);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-base-content/60 tabular-nums">
        <span>
          {have.toLocaleString()} / {total.toLocaleString()} pieces
        </span>
        <span>{total ? ((have / total) * 100).toFixed(1) : "0.0"}%</span>
      </div>

      <div
        role="img"
        aria-label={`${have} of ${total} pieces`}
        className="flex h-2 overflow-hidden rounded-full bg-base-content/10"
      >
        {runs.map((r, i) => (
          <span
            key={i}
            className={clsx(r.fill > 0 && toneBar[tone])}
            style={{ flexGrow: r.len, opacity: r.fill || undefined }}
          />
        ))}
      </div>
    </div>
  );
}
