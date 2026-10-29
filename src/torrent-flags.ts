import type { TorrentFlag } from "@/api";

export const torrentFlags: Record<
  TorrentFlag,
  { label: string; description: string }
> = {
  seed_mode: {
    label: "Seed mode",
    description:
      "Skip the initial hash check and verify pieces lazily as peers request them. Can only be cleared at runtime, which triggers a full recheck.",
  },
  upload_mode: {
    label: "Upload only",
    description:
      "Send no piece requests, only serve uploads. libtorrent enters this on disk errors; auto-managed torrents leave it on optimistic_disk_retry.",
  },
  share_mode: {
    label: "Share mode",
    description:
      "Download only to keep up with what's uploaded (share_mode_target). Don't change file or piece priorities while it's on.",
  },
  apply_ip_filter: {
    label: "Apply IP filter",
    description: "Apply the session's ip_filter to this torrent's peers.",
  },
  paused: {
    label: "Paused",
    description:
      "Disconnect all peers and stop announcing. Auto-managed torrents can be resumed by the queue.",
  },
  auto_managed: {
    label: "Auto-managed",
    description:
      "Let the libtorrent queue (active_downloads, active_seeds, active_limit) start, stop and seed the torrent.",
  },
  duplicate_is_error: {
    label: "Fail on duplicate",
    description:
      "Fail add_torrent with duplicate_torrent if the info-hash is already in the session.",
  },
  update_subscribe: {
    label: "Status updates",
    description:
      "Include the torrent in post_torrent_updates (state_update_alert). porla always sets it.",
  },
  super_seeding: {
    label: "Super seeding",
    description:
      "BEP 16 super-seeding (initial seeding). No effect unless the torrent is a seed.",
  },
  sequential_download: {
    label: "Sequential download",
    description: "Pick pieces in index order instead of rarest-first.",
  },
  stop_when_ready: {
    label: "Stop when ready",
    description:
      "Force-stop (pause, clear auto_managed) on the transition into a downloading or seeding state. Edge-triggered; clears itself after firing.",
  },
  need_save_resume: {
    label: "Resume data unsaved",
    description:
      "Resume data is dirty (if_metadata_changed); cleared by a successful save_resume_data.",
  },
  disable_dht: {
    label: "Disable DHT",
    description: "Don't announce to or get peers from the DHT (BEP 5).",
  },
  disable_lsd: {
    label: "Disable local discovery",
    description: "Disable Local Service Discovery (BEP 14).",
  },
  disable_pex: {
    label: "Disable peer exchange",
    description: "Disable peer exchange (BEP 11, ut_pex).",
  },
  no_verify_files: {
    label: "Don't verify files",
    description:
      "Trust the resume data and don't check the files on disk when adding.",
  },
  default_dont_download: {
    label: "Files off by default",
    description:
      "Files not covered by file_priorities get priority 0 (dont_download) instead of 4.",
  },
  i2p_torrent: {
    label: "I2P torrent",
    description:
      "Treat as an I2P torrent for allow_i2p_mixed. Set automatically when a tracker is an .i2p host.",
  },
  disable_v1_hashes: {
    label: "Skip v1 hashes",
    description:
      "For hybrid torrents, verify only the SHA-256 (v2, BEP 52) piece hashes and skip SHA-1.",
  },
};

// Every flag, for presets (applied when a torrent is added).
export const presetFlags: TorrentFlag[] = [
  "paused",
  "auto_managed",
  "sequential_download",
  "super_seeding",
  "upload_mode",
  "share_mode",
  "seed_mode",
  "stop_when_ready",
  "apply_ip_filter",
  "disable_dht",
  "disable_lsd",
  "disable_pex",
  "no_verify_files",
  "default_dont_download",
  "duplicate_is_error",
  "i2p_torrent",
  "disable_v1_hashes",
  "update_subscribe",
  "need_save_resume",
];

// Every flag libtorrent's set_flags changes on a running torrent. The
// others only apply when a torrent is added, and set_flags ignores them.
export const runtimeFlags: TorrentFlag[] = [
  "paused",
  "auto_managed",
  "sequential_download",
  "super_seeding",
  "upload_mode",
  "share_mode",
  "seed_mode",
  "stop_when_ready",
  "apply_ip_filter",
  "disable_dht",
  "disable_lsd",
  "disable_pex",
  "i2p_torrent",
];

// Flags the General tab points out when they're not in their usual state.
export const notableFlags: {
  flag: TorrentFlag;
  when: "on" | "off";
  label: string;
}[] = [
  ...(
    [
      "sequential_download",
      "super_seeding",
      "upload_mode",
      "share_mode",
    ] as const
  ).map((flag) => ({
    flag,
    when: "on" as const,
    label: torrentFlags[flag].label,
  })),
  { flag: "auto_managed", when: "off", label: "Not auto-managed" },
];

// Where peers come from besides trackers, each turned off by its flag.
export const peerSources: { flag: TorrentFlag; name: string }[] = [
  { flag: "disable_dht", name: "DHT" },
  { flag: "disable_pex", name: "peer exchange" },
  { flag: "disable_lsd", name: "local discovery" },
];
