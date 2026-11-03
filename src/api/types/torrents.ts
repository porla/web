export type TorrentFlag =
  | "seed_mode"
  | "upload_mode"
  | "share_mode"
  | "apply_ip_filter"
  | "paused"
  | "auto_managed"
  | "duplicate_is_error"
  | "update_subscribe"
  | "super_seeding"
  | "sequential_download"
  | "stop_when_ready"
  | "need_save_resume"
  | "disable_dht"
  | "disable_lsd"
  | "disable_pex"
  | "no_verify_files"
  | "default_dont_download"
  | "i2p_torrent"
  | "disable_v1_hashes";

export type ErrC = {
  message: string;
  value: number;
};

export type TorrentsList = {
  order_by: TorrentSortField;
  order_by_dir: string;
  page: number;
  page_size: number;
  torrents: Torrent[];
  torrents_total: number;
  torrents_total_unfiltered: number;
};

export const torrentSortFields = [
  "download_rate",
  "eta",
  "list_peers",
  "list_seeds",
  "name",
  "num_peers",
  "num_seeds",
  "progress",
  "queue_position",
  "ratio",
  "save_path",
  "total",
  "total_done",
  "upload_rate",
] as const;

export type TorrentSortField = (typeof torrentSortFields)[number];

export type SortDir = "asc" | "desc";

export type TorrentStatusFilter =
  | "downloading"
  | "downloading_queued"
  | "error"
  | "finished"
  | "paused"
  | "seeding"
  | "seeding_queued";

export type TorrentsGet = {
  torrent: Torrent;
};

export type TorrentsPropertiesGet = {
  download_limit: number | null;
  flags: TorrentFlag[];
  max_connections: number | null;
  max_uploads: number | null;
  upload_limit: number | null;
};

// what Porla sends: [v1, v2], hex, either half null (v1-only or v2-only).
export type InfoHashPair = [string | null, string | null];

// What Porla accepts: the pair, or a v1 (40) or v2 (64) hex string.
export type InfoHash = InfoHashPair | string;

// The resume data categories that need saving (libtorrent 2.1).
export type ResumeDataFlag =
  | "flush_disk_cache"
  | "save_info_dict"
  | "if_counters_changed"
  | "if_download_progress"
  | "if_config_changed"
  | "if_state_changed"
  | "if_metadata_changed";

export type Bitfield = [number, string];

export type Torrent = {
  $userdata: {
    category: string | null;
    completed_at: number | null; // unix time, null until complete
    metadata: Record<string, unknown>;
    tags: string[];
  } | null;

  active_duration: number;
  added_time: number;
  all_time_download: number;
  all_time_upload: number;
  announcing_to_dht: boolean;
  announcing_to_lsd: boolean;
  announcing_to_trackers: boolean;
  block_size: number;
  completed_time: number; // unix time, 0 = not complete
  connect_candidates: number;
  connections_limit: number;
  current_tracker: string;
  distributed_copies: number; // availability, -1 when not known
  down_bandwidth_queue: number;
  download_payload_rate: number;
  download_rate: number;
  errc: ErrC | null;
  finished_duration: number;
  flags: TorrentFlag[];
  has_incoming: boolean;
  has_metadata: boolean;
  info_hash: InfoHashPair;
  is_finished: boolean;
  is_seeding: boolean;
  last_download: number; // seconds ago, -1 = never
  last_seen_complete: number;
  last_upload: number; // seconds ago, -1 = never
  list_peers: number;
  list_seeds: number;
  moving_storage: boolean;
  name: string;
  need_save_resume_data: ResumeDataFlag[];
  next_announce: number; // seconds from now
  num_complete: number; // seeds in the swarm per the tracker, -1 if unknown
  num_connections: number;
  num_incomplete: number; // peers in the swarm per the tracker, -1 if unknown
  num_peers: number;
  num_pieces: number;
  num_seeds: number;
  num_uploads: number;
  progress: number;
  queue_position: number;
  ratio: number;
  ratio_real: number;
  save_path: string;
  seed_rank: number;
  seeding_duration: number;
  state: TorrentState;
  storage_mode: "allocate" | "sparse";
  total: number;
  total_done: number;
  total_download: number;
  total_failed_bytes: number;
  total_payload_download: number; // this session
  total_payload_upload: number; // this session
  total_redundant_bytes: number;
  total_upload: number;
  total_wanted: number;
  total_wanted_done: number;
  up_bandwidth_queue: number;
  upload_payload_rate: number;
  upload_rate: number;
  uploads_limit: number;
};

export type TorrentState =
  | "checking_files"
  | "downloading_metadata"
  | "downloading"
  | "finished"
  | "seeding"
  | "checking_resume_data";

export type FileFlag = "pad_file" | "hidden" | "executable" | "symlink";

export type TorrentFile = {
  absolute_path: boolean;
  flags: FileFlag[];
  index: number;
  offset: number;
  path: string;
  size: number;
  symlink: string;
};

export type TorrentsFilesList = {
  files: TorrentFile[];
};

export type TorrentsFilesPriorities = {
  priorities: number[];
};

export type TorrentsFilesProgress = {
  progress: number[];
};

export type PeerFlag =
  | "interesting"
  | "choked"
  | "remote_interested"
  | "remote_choked"
  | "supports_extensions"
  | "outgoing_connection"
  | "handshake"
  | "connecting"
  | "on_parole"
  | "seed"
  | "optimistic_unchoke"
  | "snubbed"
  | "upload_only"
  | "endgame_mode"
  | "holepunched"
  | "i2p_socket"
  | "utp_socket"
  | "ssl_socket"
  | "rc4_encrypted"
  | "plaintext_encrypted";

export type PeerSource =
  "tracker" | "dht" | "pex" | "lsd" | "resume_data" | "incoming";

export type Peer = {
  busy_requests: number;
  client: string;
  connection_type: "standard_bittorrent" | "web_seed" | "http_seed";
  down_speed: number; // bytes/s
  download_queue_length: number; // block requests outstanding
  download_queue_time: number; // s
  flags: PeerFlag[];
  last_active: number; // s ago
  last_request: number; // s ago
  local_endpoint: [string, number];
  progress: number; // 0..1
  remote_endpoint: [string, number];
  rtt: number; // ms
  source: PeerSource[];
  total_download: number; // from this peer, this connection
  total_upload: number;
  up_speed: number;
};

export type TorrentsPeersList = {
  peers: Peer[];
};

export type TorrentsPiecesGet = {
  pieces: Bitfield;
  verified_pieces: Bitfield;
};

export type AnnounceInfohash = {
  complete_sent: boolean;
  fails: number;
  last_error: null | ErrC;
  message: string; // the tracker's warning or failure text
  min_announce: number; // unix time, -2147483648 = not set
  next_announce: number; // unix time, -2147483648 = not set
  scrape_complete: number;
  scrape_downloaded: number;
  scrape_incomplete: number;
  start_sent: boolean;
  updating: boolean;
};

export type AnnounceEndpoint = {
  enabled: boolean;
  info_hashes: [AnnounceInfohash, AnnounceInfohash];
  local_endpoint: [string, number];
};

export type AnnounceEntry = {
  endpoints: AnnounceEndpoint[];
  fail_limit: number;
  source: ("torrent" | "client" | "magnet_link" | "tex")[];
  tier: number;
  trackerid: string;
  url: string;
  verified: boolean;
};

export type TorrentsTrackersList = {
  trackers: AnnounceEntry[];
};

export type TorrentsCount = {
  categories: Record<string, number>;
  downloading: number;
  downloading_queued: number;
  error: number;
  finished: number;
  paused: number;
  seeding: number;
  seeding_queued: number;
  total: number;
  tags: Record<string, number>;
  trackers: Record<string, number>;
};

export type TorrentRef = {
  info_hash: InfoHash;
  session_id?: number;
};
