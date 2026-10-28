import {
  useMutation,
  useQuery,
  type DefinedInitialDataOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { prefixPath } from "@/base";

// One string per torrent for React keys and DOM ids: the v1 hash, or the v2
// hash for v2-only torrents (where the v1 half is null).
export function infoHashKey(ih: InfoHash) {
  return typeof ih === "string" ? ih : (ih[0] ?? ih[1] ?? "");
}

export function isBitSet(num: number, bit: number) {
  return (num & (1 << bit)) !== 0;
}

export const AllTorrentFlags = [
  "seed_mode",
  "upload_mode",
  "share_mode",
  "apply_ip_filter",
  "paused",
  "auto_managed",
  "duplicate_is_error",
  "update_subscribe",
  "super_seeding",
  "sequential_download",
  "stop_when_ready",
  "need_save_resume",
  "disable_dht",
  "disable_lsd",
  "disable_pex",
  "no_verify_files",
  "default_dont_download",
  "i2p_torrent",
  "disable_v1_hashes",
] as TorrentFlag[];

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
  page: number;
  page_size: number;
  torrents: Torrent[];
  torrents_total: number;
};

export type SessionsGet = {
  session: Session;
};

export type Session = {
  id: number;
  name: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  state: null | {
    is_listening: boolean;
    is_paused: boolean;
    torrents_total: number;
  };
};

export type SessionSettings = {
  active_limit: number;
};

export type TorrentsGet = {
  torrent: Torrent;
};

export type TorrentsPropertiesGet = {
  download_limit: number;
  max_connections: number;
  max_uploads: number;
  upload_limit: number;
};

export type ApiKey = {
  id: string;
  name: string;
  created_at: number;
  expires_at: number | null;
};

export type ApiKeysList = {
  keys: ApiKey[];
};

export type InfoHash = [string | null, string | null] | string;

export type Bitfield = [number, string];

export type Torrent = {
  $userdata: {
    category: string | null;
    metadata: Record<string, unknown>;
    tags: string[];
  };

  active_duration: number;
  added_time: number;
  all_time_download: number;
  all_time_upload: number;
  completed_time: number;
  connections_limit: number;
  current_tracker: string;
  distributed_copies: number; // availability, -1 when not known
  download_payload_rate: number;
  download_rate: number;
  errc: ErrC | null;
  finished_duration: number;
  flags: TorrentFlag[];
  has_metadata: boolean;
  info_hash: InfoHash;
  last_download: number; // seconds ago, -1 = never
  last_seen_complete: number;
  last_upload: number; // seconds ago, -1 = never
  list_peers: number;
  list_seeds: number;
  moving_storage: boolean;
  name: string;
  next_announce: number; // seconds from now
  num_complete: number; // seeds in the swarm per the tracker, -1 if unknown
  num_connections: number;
  num_incomplete: number; // peers in the swarm per the tracker, -1 if unknown
  num_peers: number;
  num_seeds: number;
  progress: number;
  queue_position: number;
  ratio: number;
  ratio_real: number;
  save_path: string;
  seeding_duration: number;
  state: TorrentState;
  storage_mode: "allocate" | "sparse";
  tags: string[];
  total: number;
  total_done: number;
  total_failed_bytes: number;
  total_payload_download: number; // this session
  total_payload_upload: number; // this session
  total_redundant_bytes: number;
  total_wanted: number;
  total_wanted_done: number;
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

export type PluginsGet = {
  plugin: {
    id: number;
    path: string;
    name: string | null;
    version: string | null;
    config: string | null;
    metadata: Record<string, unknown>;
    is_loaded: boolean;
  };
};

export type PluginsList = {
  plugins: PluginsListItem[];
};

export type PresetsGet = {
  preset: Preset;
};

export type PresetsList = {
  presets: Pick<Preset, "id" | "name" | "is_default" | "metadata">[];
};

export type PluginsListItem = {
  id: number;
  path: string;
  name: string | null;
  version: string | null;
  is_loaded: boolean;
};

export type SessionsList = {
  sessions: Session[];
};

export type SessionsSettingsGet = {
  settings: SessionSettings;
};

export type Plugin = {
  id: number;
  name: string | null;
  config: string | null;
  metadata: Record<string, unknown> | null;
  type: "path" | "archive";
  version: string | null;
};

export type Preset = {
  id: number;
  name: string;
  is_default: boolean;
  category: string | null;
  download_limit: number | null;
  flags: TorrentFlag[] | null;
  flags_mask: TorrentFlag[] | null;
  max_connections: number | null;
  max_uploads: number | null;
  metadata: Record<string, unknown>;
  session_id: number | null;
  save_path: string | null;
  storage_mode: "allocate" | "sparse" | null;
  tags: string[];
  upload_limit: number | null;
};

export type TorrentFile = {
  absolute_path: boolean;
  flags: string[];
  index: number;
  path: string;
  size: number;
  symlink: boolean;
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

export type Peer = {
  busy_requests: number;
  client: string;
  connection_type: "standard_bittorrent" | "web_seed" | "http_seed";
  down_speed: number; // bytes/s
  download_queue_length: number; // block requests outstanding
  download_queue_time: number; // s
  flags: string[];
  last_active: number; // s ago
  last_request: number; // s ago
  local_endpoint: [string, number];
  progress: number; // 0..1
  remote_endpoint: [string, number];
  rtt: number; // ms
  source: string[];
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
  min_announce: number;
  next_announce: number;
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
  source: string[];
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

export type SysStatus = {
  status: "ok" | "setup";
};

export type SysVersions = {
  porla: {
    version: string;
  };
};

export class RpcError extends Error {
  code: number;
  message: string;
  data: unknown;

  constructor(code: number, message: string, data: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.message = message;
    this.data = data;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}

type TorrentRef = {
  info_hash: InfoHash;
  session_id?: number;
};

type NoParams = Record<string, never>;

export type MmdbEntry = {
  country?: { iso_code?: string; names?: Record<string, string> };
};

// Optional backend fields accept both an absent key and null.
type PresetFields = {
  category?: string | null;
  download_limit?: number | null;
  flags?: TorrentFlag[] | null;
  flags_mask?: TorrentFlag[] | null;
  max_connections?: number | null;
  max_uploads?: number | null;
  save_path?: string | null;
  session_id?: number | null;
  storage_mode?: "allocate" | "sparse" | null;
  upload_limit?: number | null;
};

type SessionTimers = {
  timer_dht_stats?: number | null;
  timer_save_state?: number | null;
  timer_session_stats?: number | null;
  timer_torrent_updates?: number | null;
};

// Params and result of every JSON-RPC method the UI calls, from the request
// structs in porla's src/rpc/methods/*.cpp. Methods returning void reply null.
export type Methods = {
  "auth.init": {
    params: { username: string; password: string };
    result: null;
  };
  "auth.keys.create": {
    params: { name: string; expires_at?: number | null };
    result: { id: string; key: string };
  };
  "auth.keys.list": {
    params: NoParams;
    result: ApiKeysList;
  };
  "auth.keys.remove": {
    params: { id: string };
    result: null;
  };
  "auth.login": {
    params: { username: string; password: string };
    result: { token: string };
  };
  "auth.logout": {
    params: NoParams;
    result: null;
  };
  "kv.get": {
    params: { keys: string[] };
    result: { values: Record<string, unknown> };
  };
  "kv.set": {
    params: { values: Record<string, unknown> };
    result: null;
  };
  "mmdb.lookup": {
    params: { values: string[] };
    result: { results: Record<string, MmdbEntry | null> };
  };
  "plugins.add": {
    params: { path: string; config?: string | null };
    result: { id: number };
  };
  "plugins.get": {
    params: { id: number };
    result: PluginsGet;
  };
  "plugins.install": {
    params: {
      owner: string;
      repository: string;
      version: string;
      config?: string | null;
    };
    result: { id: number };
  };
  "plugins.list": {
    params: NoParams;
    result: PluginsList;
  };
  "plugins.reload": {
    params: { id: number };
    result: null;
  };
  "plugins.remove": {
    params: { id: number };
    result: null;
  };
  "plugins.update": {
    params: { id: number; path: string; config?: string | null };
    result: null;
  };
  "presets.add": {
    params: { name: string };
    result: { id: number };
  };
  "presets.get": { params: { id: number }; result: PresetsGet };
  "presets.list": { params: NoParams; result: PresetsList };
  "presets.remove": { params: { id: number }; result: null };
  "presets.update": {
    params: PresetFields & {
      id: number;
      name: string;
      is_default?: boolean | null;
      metadata?: Record<string, unknown> | null;
      tags: string[];
    };
    result: null;
  };
  "sessions.add": {
    params: SessionTimers & {
      name: string;
      metadata?: Record<string, unknown> | null;
      settings_base?: string | null;
      settings?: Record<string, unknown> | null;
    };
    result: { id: number };
  };
  "sessions.get": { params: { id: number }; result: SessionsGet };
  "sessions.list": { params: NoParams; result: SessionsList };
  "sessions.remove": { params: { id: number }; result: null };
  "sessions.settings.get": {
    params: { id: number };
    result: SessionsSettingsGet;
  };
  "sessions.settings.set": {
    params: { id: number; settings: Record<string, string | number | boolean> };
    result: null;
  };
  "sessions.update": {
    params: SessionTimers & {
      id: number;
      name: string;
      is_default: boolean;
      metadata: Record<string, unknown>;
    };
    result: null;
  };
  "sys.status": { params: NoParams; result: SysStatus };
  "sys.versions": { params: NoParams; result: SysVersions };
  "torrents.add": {
    params: Omit<PresetFields, "flags_mask" | "storage_mode"> & {
      magnet_uri?: string | null;
      metadata?: Record<string, unknown> | null;
      name?: string | null;
      preset?: string | null;
      preset_id?: number | null;
      tags?: string[] | null;
      ti?: string | null;
      trackers?: string[] | null;
      url_seeds?: string[] | null;
    };
    result: { info_hash: InfoHash; session_id: number };
  };
  "torrents.count": {
    params: { session_id?: number };
    result: TorrentsCount;
  };
  "torrents.files.list": { params: TorrentRef; result: TorrentsFilesList };
  "torrents.files.prioritize": {
    params: TorrentRef & {
      priorities: { index: number; priority: number }[];
    };
    result: null;
  };
  "torrents.files.priorities": {
    params: TorrentRef;
    result: TorrentsFilesPriorities;
  };
  "torrents.files.progress": {
    params: TorrentRef;
    result: TorrentsFilesProgress;
  };
  "torrents.files.rename": {
    params: TorrentRef & { file_index: number; file_path: string };
    result: null;
  };
  "torrents.get": { params: TorrentRef; result: TorrentsGet };
  "torrents.list": {
    params: {
      filters?: {
        category?: string | null;
        errc?: boolean | null;
        flags?: TorrentFlag[] | null;
        query?: string | null;
        session_id?: number | null;
        save_path?: string | null;
        state?: string[] | null;
        status?: string[] | null;
        tags?: string[] | null;
      } | null;
      page?: number | null;
      page_size?: number | null;
      order_by?: string | null;
      order_by_dir?: "asc" | "desc" | null;
    };
    result: TorrentsList;
  };
  "torrents.migrate": {
    params: TorrentRef & { target_session_id: number };
    result: { info_hash: InfoHash; session_id: number };
  };
  "torrents.move": {
    params: TorrentRef & { path: string; flags?: string | null };
    result: null;
  };
  "torrents.pause": { params: TorrentRef; result: null };
  "torrents.peers.list": { params: TorrentRef; result: TorrentsPeersList };
  "torrents.pieces.get": { params: TorrentRef; result: TorrentsPiecesGet };
  "torrents.properties.get": {
    params: TorrentRef;
    result: TorrentsPropertiesGet;
  };
  "torrents.properties.set": {
    params: TorrentRef &
      Pick<
        PresetFields,
        | "category"
        | "download_limit"
        | "flags"
        | "flags_mask"
        | "max_connections"
        | "max_uploads"
        | "upload_limit"
      > & { tags?: string[] | null };
    result: null;
  };
  "torrents.queue.bottom": { params: TorrentRef; result: null };
  "torrents.queue.down": { params: TorrentRef; result: null };
  "torrents.queue.top": { params: TorrentRef; result: null };
  "torrents.queue.up": { params: TorrentRef; result: null };
  "torrents.recheck": { params: TorrentRef; result: null };
  "torrents.remove": {
    params: TorrentRef & { remove_data?: boolean | null };
    result: null;
  };
  "torrents.resume": { params: TorrentRef; result: null };
  "torrents.trackers.list": {
    params: TorrentRef;
    result: TorrentsTrackersList;
  };
  "webui.install": { params: { version: string }; result: NoParams };
};

export type Method = keyof Methods;
export type Params<M extends Method> = Methods[M]["params"];
export type Result<M extends Method> = Methods[M]["result"];

type QueryConfig<M extends Method> = Partial<
  DefinedInitialDataOptions<Result<M>, Error, Result<M>, readonly unknown[]>
>;

// Methods whose params are all optional can be called without them.
type RpcArgs<M extends Method> =
  NoParams extends Params<M>
    ? [params?: Params<M> | null, config?: QueryConfig<M>]
    : [params: Params<M>, config?: QueryConfig<M>];

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

async function post(method: string, params: unknown, signal?: AbortSignal) {
  const res = await fetch(prefixPath("/api/v1/jsonrpc"), {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      id: Date.now(),
      params,
    }),
    credentials: "include",
    method: "POST",
    signal,
  });

  if (!res.ok) {
    const text = (await res.text()).trim().slice(0, 200);
    throw new HttpError(
      res.status,
      text || res.statusText || `HTTP ${res.status}`,
    );
  }

  return res.json();
}

// check if a 1001 means logged out or not authed
async function isLoggedOut(signal?: AbortSignal) {
  const data = await post("sys.versions", {}, signal);
  return data.error?.code === 1001;
}

async function jsonrpc<M extends Method>(
  method: M,
  params?: Params<M> | null,
  signal?: AbortSignal,
) {
  const data = await post(method, params || {}, signal);

  if (data.error) {
    const { code, message } = data.error;

    if (
      code === 1001 &&
      (method === "sys.versions" || (await isLoggedOut(signal)))
    ) {
      throw new AuthError(message);
    }

    throw new RpcError(code, message, data.error.data);
  }

  return data.result as Result<M>;
}

export function useInvoker<M extends Method>(
  method: M,
  options?: Partial<UseMutationOptions<Result<M>, Error, Params<M>, unknown>>,
) {
  return useMutation({
    mutationFn: (params: Params<M>) => jsonrpc(method, params),
    mutationKey: [method],
    networkMode: "always",
    ...options,
  });
}

export function useRPC<M extends Method>(method: M, ...args: RpcArgs<M>) {
  const [params, config] = args;
  return useQuery<Result<M>>({
    queryFn: ({ signal }) => jsonrpc(method, params, signal),
    queryKey: [method, params],
    ...config,
  });
}
