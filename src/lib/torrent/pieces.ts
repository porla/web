import type { Bitfield } from "@/api";

// Porla's bitfields: [piece count, base64 bytes], most significant bit first.
export function decodeBitfield(input?: Bitfield) {
  const size = input ? input[0] | 0 : 0;

  let bytes = new Uint8Array(0);
  if (input?.[1]) {
    try {
      bytes = Uint8Array.from(atob(input[1]), (c) => c.charCodeAt(0));
    } catch {
      // not base64: nothing had
    }
  }

  const get = (i: number) =>
    i >> 3 < bytes.length && ((bytes[i >> 3] >> (7 - (i & 7))) & 1) === 1;

  return { size, get };
}

// A run of pieces and how many of them are had and verified.
export type PieceGroup = {
  start: number;
  end: number; // exclusive
  have: number;
  verified: number;
};

// The pieces in at most `count` groups of (nearly) equal length; one piece
// per group when there are fewer.
export function groupPieces(
  pieces: Bitfield,
  verified: Bitfield | undefined,
  count: number,
): PieceGroup[] {
  const have = decodeBitfield(pieces);
  const ver = decodeBitfield(verified);
  const n = have.size;
  const groups = Math.min(n, count);

  const out: PieceGroup[] = Array.from({ length: groups }, (_, g) => ({
    start: Math.floor((g * n) / groups),
    end: Math.floor(((g + 1) * n) / groups),
    have: 0,
    verified: 0,
  }));

  let g = 0;
  for (let i = 0; i < n; i++) {
    while (i >= out[g].end) g++;
    if (have.get(i)) out[g].have++;
    if (ver.get(i)) out[g].verified++;
  }

  return out;
}

// libtorrent piece sizes are powers of two; only the last piece is shorter.
export function pieceSize(total: number, count: number) {
  if (count === 0 || total === 0) return 0;
  return 2 ** Math.ceil(Math.log2(total / count));
}
