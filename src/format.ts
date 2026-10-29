import { filesize } from "filesize";
import { DateTime } from "luxon";

// Porla caps a ratio at 9999 (uploaded without downloading anything).
export const ratio = (r: number) => (r >= 9999 ? "∞" : r.toFixed(2));

export const bytes = (n: number) => filesize(n);

// For sizes that are powers of two, e.g. pieces: "16 KiB", not "16.38 kB".
export const binaryBytes = (n: number) =>
  filesize(n, { base: 2, standard: "iec" });

export const rate = (bytesPerSecond: number) => `${filesize(bytesPerSecond)}/s`;

// "45s", "3m 20s", "2h 5m", "4d 6h"
export function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

// A Unix timestamp as "2026-10-27 14:05"; 0 means it never happened.
export function date(unixSeconds: number) {
  return unixSeconds > 0
    ? DateTime.fromSeconds(unixSeconds).toFormat("yyyy-MM-dd HH:mm")
    : "never";
}
