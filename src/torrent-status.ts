import type { Torrent } from "@/api";

// Which sidebar filter lists the torrent (porla's torrents.list status
// rules), so it can be colored the same everywhere; "other" has no filter.
export type Tone =
  | "downloading"
  | "seeding"
  | "finished"
  | "paused"
  | "error"
  | "other";

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
