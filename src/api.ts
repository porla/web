import {
  useMutation,
  useQuery,
  type DefinedInitialDataOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { prefixPath } from "@/base";

export function isBitSet(num: number, bit: number) {
  return (num & (1 << bit)) !== 0;
}

// These numbers represent *bits*
export const TorrentFlags = {
  Paused: 4,
  AutoManaged: 5,
};

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
  current_tracker: string;
  download_payload_rate: number;
  download_rate: number;
  errc: ErrC | null;
  finished_duration: number;
  flags: number;
  info_hash: InfoHash;
  last_download: number;
  last_upload: number;
  list_peers: number;
  list_seeds: number;
  moving_storage: boolean;
  name: string;
  num_peers: number;
  num_seeds: number;
  progress: number;
  queue_position: number;
  ratio: number;
  ratio_real: number;
  save_path: string;
  seeding_duration: number;
  state: number;
  tags: string[];
  total: number;
  total_done: number;
  total_wanted: number;
  total_wanted_done: number;
  upload_payload_rate: number;
  upload_rate: number;
};

export type PluginsGet = {
  plugin: {
    id: number;
    path: string;
    config: string | null;
    metadata: Record<string, unknown>;
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
  name: string;
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
  client: string;
  connection_type: string;
  flags: string[];
  remote_endpoint: [string, number];
  source: string[];
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
  min_announce: number;
  next_announce: number;
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

export type SysVersions = {};

export class RpcError extends Error {
  data: any;
  code: number;

  constructor(code: number, message: string, data: any) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}

async function jsonrpc<T>(method: string, params?: any) {
  const res = await fetch(prefixPath("/api/v1/jsonrpc"), {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      id: Date.now(),
      params: params || {},
    }),
    credentials: "include",
    method: "POST",
  });

  if (res.status === 401) {
    throw new AuthError(res.statusText);
  }

  if (res.status !== 200) {
    throw new Error(res.statusText);
  }

  const data = await res.json();

  if (data.error) {
    if (data.error.code === 1000 || data.error.code === 1001) {
      throw new AuthError(data.error.message);
    }

    throw new RpcError(data.error.code, data.error.message, data.error.data);
  }

  return data.result as T;
}

export function useInvoker<T>(
  method: string,
  options?: Partial<UseMutationOptions<T, Error, any, unknown>>,
) {
  return useMutation({
    mutationFn: (params: any) => jsonrpc<T>(method, params),
    mutationKey: [method],
    networkMode: "always",
    ...options,
  });
}

export function useRPC<T>(
  method: string,
  params?: any,
  config?: Partial<DefinedInitialDataOptions<T, Error, T, readonly unknown[]>>,
) {
  return useQuery<T>({
    queryFn: () => jsonrpc<T>(method, params),
    queryKey: [method, params],
    ...config,
  });
}
