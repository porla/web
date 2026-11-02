import type { InfoHash } from "@/api/types/torrents";

// One string per torrent for React keys and DOM ids: the v1 hash, or the v2
// hash for v2-only torrents (where the v1 half is null).
export function infoHashKey(ih: InfoHash) {
  return typeof ih === "string" ? ih : (ih[0] ?? ih[1] ?? "");
}
