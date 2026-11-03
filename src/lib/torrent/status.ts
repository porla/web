import type { Torrent } from "@/api";

// Which sidebar filter lists the torrent (Porla's torrents.list status
// rules), so it can be colored the same everywhere; "other" has no filter.
export type Tone =
  "downloading" | "seeding" | "finished" | "paused" | "error" | "other";

// A torrent is colored like the sidebar filter it's in (the status-* colors in
// index.css). Class names are spelled out so Tailwind finds them.
export const toneText: Record<Tone, string> = {
  downloading: "text-status-downloading",
  seeding: "text-status-seeding",
  finished: "text-status-finished",
  paused: "text-status-paused",
  error: "text-status-error",
  other: "text-base-content/40",
};

export const toneBar: Record<Tone, string> = {
  downloading: "bg-status-downloading",
  seeding: "bg-status-seeding",
  finished: "bg-status-finished",
  paused: "bg-status-paused",
  error: "bg-status-error",
  other: "bg-base-content/40",
};

// Outlines: piece map pieces that are had but not verified yet.
export const toneRing: Record<Tone, string> = {
  downloading: "ring-status-downloading",
  seeding: "ring-status-seeding",
  finished: "ring-status-finished",
  paused: "ring-status-paused",
  error: "ring-status-error",
  other: "ring-base-content/40",
};

// Badges stay light in both themes, with dark text, so they read the same.
export const toneBadge: Record<Tone, string> = {
  downloading: "bg-green-300 border-green-300 text-green-950",
  seeding: "bg-blue-300 border-blue-300 text-blue-950",
  finished: "bg-purple-300 border-purple-300 text-purple-950",
  paused: "bg-orange-300 border-orange-300 text-orange-950",
  error: "bg-red-300 border-red-300 text-red-950",
  other: "badge-ghost",
};

// What a user would call the torrent's state (an error's message is added
// where it's shown). libtorrent keeps "downloading" or "seeding" while
// paused; paused + auto-managed is waiting in the queue.
export function torrentStatus(t: Torrent): { label: string; tone: Tone } {
  const paused = t.flags.includes("paused");
  const queued = paused && t.flags.includes("auto_managed");
  if (t.errc) return { label: "Error", tone: "error" };
  if (t.moving_storage) return { label: "Moving files", tone: "other" };

  switch (t.state) {
    case "checking_files":
    case "checking_resume_data":
      return {
        label: queued ? "Queued" : paused ? "Paused" : "Checking",
        tone: "other",
      };
    case "downloading_metadata":
    case "downloading":
      if (queued) return { label: "Queued", tone: "downloading" };
      if (paused) return { label: "Paused", tone: "paused" };
      return t.state === "downloading"
        ? { label: "Downloading", tone: "downloading" }
        : { label: "Fetching metadata", tone: "downloading" };
    // "finished" is complete except for skipped files; both still upload.
    case "finished":
    case "seeding":
      if (queued) return { label: "Queued", tone: "seeding" };
      if (paused) return { label: "Finished", tone: "finished" };
      return { label: "Seeding", tone: "seeding" };
  }
}
