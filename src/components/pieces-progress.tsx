import type { Bitfield } from "@/api";
import { useMemo } from "react";

export interface PieceProgressProps {
  pieces: Bitfield;
  verified?: Bitfield;
  height?: number;
  showStats?: boolean;
  showLegend?: boolean;
  className?: string;
}

type Decoded = { size: number; get: (i: number) => 0 | 1 };
type Segment = { start: number; len: number; state: 1 | 2 };

function decodeBitfield(input?: Bitfield): Decoded {
  const size = input ? input[0] | 0 : 0;
  const b64 = input && typeof input[1] === "string" ? input[1] : "";

  let bytes = new Uint8Array(0);
  if (b64 && typeof atob !== "undefined") {
    try {
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch {
      bytes = new Uint8Array(0);
    }
  }

  const get = (i: number): 0 | 1 => {
    const byte = i >> 3;
    if (byte >= bytes.length) return 0;
    return ((bytes[byte] >> (7 - (i & 7))) & 1) as 0 | 1;
  };

  return { size, get };
}

export function PieceProgress({
  pieces,
  verified,
  height = 14,
  showStats = true,
  showLegend = false,
  className = "",
}: PieceProgressProps) {
  const { size, segments, haveCount, verifiedCount } = useMemo(() => {
    const have = decodeBitfield(pieces);
    const ver = decodeBitfield(verified);
    const n = Math.max(have.size, ver.size);

    const segs: Segment[] = [];
    let start = 0;
    let cur: -1 | 0 | 1 | 2 = -1;
    let haveCount = 0;
    let verifiedCount = 0;

    for (let i = 0; i < n; i++) {
      const v = ver.get(i);
      const h = have.get(i);
      const s: 0 | 1 | 2 = v ? 2 : h ? 1 : 0;

      if (v) verifiedCount++;
      if (h || v) haveCount++;

      if (s !== cur) {
        if (cur === 1 || cur === 2)
          segs.push({ start, len: i - start, state: cur });
        cur = s;
        start = i;
      }
    }
    if (cur === 1 || cur === 2)
      segs.push({ start, len: n - start, state: cur });

    return { size: n, segments: segs, haveCount, verifiedCount };
  }, [pieces, verified]);

  const pct = size ? (haveCount / size) * 100 : 0;
  const vpct = size ? (verifiedCount / size) * 100 : 0;

  return (
    <div className={className}>
      {showStats && (
        <div className="mb-1.5 flex justify-between font-mono text-[11px] leading-none text-base-content/60">
          <span>
            {haveCount.toLocaleString()} / {size.toLocaleString()} pieces
          </span>
          <span>
            {pct.toFixed(1)}%
            {verifiedCount > 0 && (
              <span className="text-success">
                {" "}
                · {vpct.toFixed(1)}% verified
              </span>
            )}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-md bg-base-300 ring-1 ring-base-content/5">
        <svg
          viewBox={`0 0 ${Math.max(size, 1)} 1`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          role="img"
          aria-label={`Download progress: ${pct.toFixed(0)}% of ${size} pieces`}
          className="block"
        >
          {segments.map((s, i) => (
            <rect
              key={i}
              x={s.start}
              y={0}
              width={s.len}
              height={1}
              shapeRendering="crispEdges"
              className={s.state === 2 ? "fill-success" : "fill-primary"}
            >
              <title>
                {s.len === 1
                  ? `Piece ${s.start}`
                  : `Pieces ${s.start}\u2013${s.start + s.len - 1}`}
                {" \u00b7 "}
                {s.state === 2 ? "verified" : "downloaded"}
              </title>
            </rect>
          ))}
        </svg>
      </div>

      {showLegend && (
        <div className="mt-2 flex gap-4 text-xs text-base-content/70">
          <LegendDot className="bg-success" label="Verified" />
          <LegendDot className="bg-primary" label="Downloaded" />
          <LegendDot
            className="bg-base-300 ring-1 ring-base-content/10"
            label="Missing"
          />
        </div>
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] ${className}`} />
      {label}
    </span>
  );
}

export default PieceProgress;
