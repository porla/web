import {
  useMutation,
  useQuery,
  type DefinedInitialDataOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { prefixPath } from "@/base";

export const TorrentFlags = {
  Paused: 16,
};

export type ErrC = {};

export type TorrentsList = {
  page: number;
  page_size: number;
  torrents: Torrent[];
  torrents_total: number;
};

export type InfoHash = [string | null, string | null] | string;

export type Torrent = {
  $userdata: {
    category: string | null;
    metadata: Record<string, unknown>;
    tags: string[];
  };

  active_duration: number;
  all_time_download: number;
  all_time_upload: number;
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
  save_path: string;
  seeding_duration: number;
  state: number;
  tags: string[];
  total: number;
  total_done: number;
  upload_payload_rate: number;
  upload_rate: number;
};

export type PluginsList = {
  plugins: PluginsListItem[];
};

export type PresetsList = {
  presets: PresetsListItem[];
};

export type PluginsListItem = {
  id: number;
  name: string;
};

export type PresetsListItem = {
  id: number;
  name: string;
};

export type SessionsList = {
  sessions: SessionsListItem[];
};

export type SessionsListItem = {
  id: number;
  name: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  torrents_total: number;
};

export type Plugin = {
  id: number;
  name: string;
};

export type Preset = {
  id: number;
  name: string;
  category: string | null;
  download_limit: number | null;
  max_connections: number | null;
  max_uploads: number | null;
  metadata: unknown | null;
  session: string | null;
  save_path: string | null;
  storage_mode: "allocate" | "sparse" | null;
  tags: string[];
  upload_limit: number | null;
};

export type TorrentFile = {
  name: string;
  size: number;
};

export type TorrentsFilesList = {
  files: TorrentFile[];
};

export type TorrentsFilesProgress = {
  progress: number[];
};

export type Peer = {
  ip: [string, number];
  client: string;
};

export type TorrentsPeersList = {
  peers: Peer[];
};

export type AnnounceEntry = {
  url: string;
};

export type TorrentsTrackersList = {
  trackers: AnnounceEntry[];
};

export type TorrentsOverviewSession = {
  session_id: number;
  session_name: string;
  torrents_errors: number;
  torrents_per_category: Record<string, number>;
  torrents_per_flags: [[number, number]];
  torrents_per_state: Record<string, number>;
  torrents_per_tag: Record<string, number>;
  torrents_per_tracker: Record<string, number>;
  torrents_total: number;
};

export type TorrentsOverview = {
  sessions: TorrentsOverviewSession[];
};

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
    throw new RpcError(data.error.code, data.error.message, data.error.data);
  }

  return data.result as T;
}

export function useInvoker<T>(
  method: string,
  options?: Partial<UseMutationOptions<T, Error, any, unknown>>
) {
  return useMutation({
    mutationFn: (params: any) => jsonrpc<T>(method, params),
    mutationKey: [method],
    ...options,
  });
}

export function useRPC<T>(
  method: string,
  params?: any,
  config?: Partial<DefinedInitialDataOptions<T, Error, T, readonly unknown[]>>
) {
  return useQuery<T>({
    queryFn: () => jsonrpc<T>(method, params),
    queryKey: [method, params],
    ...config,
  });
}
