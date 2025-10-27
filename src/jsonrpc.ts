import useSWR from "swr";
import { prefixPath } from "@/base";

export type ErrC = {

};

export type TorrentsList = {
  torrents: TorrentsListItem[];
};

export type TorrentsListItem = {
  active_duration: number;
  all_time_download: number;
  all_time_upload: number;
  category: string | null;
  download_rate: number;
  error: ErrC | null;
  eta: number;
  finished_duration: number;
  flags: string[];
  info_hash: [string | null, string | null];
  last_download: number;
  last_upload: number;
  list_peers: number;
  list_seeds: number;
  metadata: Record<string, unknown>;
  moving_storage: boolean;
  name: string;
  num_peers: number;
  num_seeds: number;
  progress: number;
  queue_position: number;
  ratio: number;
  save_path: string;
  seeding_duration: number;
  session_id: number;
  session_name: string;
  size: number;
  state: number;
  tags: string[];
  total: number;
  total_done: number;
  upload_rate: number;
}

export type PluginsList = {
  plugins: PluginsListItem[];
}

export type PresetsList = {
  presets: PresetsListItem[];
}

export type PluginsListItem = {
  id: number;
  name: string;
}

export type PresetsListItem = {
  id: number;
  name: string;
}

export type SessionsList = {
  sessions: SessionsListItem[];
}

export type SessionsListItem = {
  id: number;
  name: string;
}

export type Plugin = {
  id: number;
  name: string;
}

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
}

export type TorrentsOverviewSession = {
  torrents_errors: number;
  torrents_per_category: Record<string, number>;
  torrents_per_state: Record<string, number>;
  torrents_per_tag: Record<string, number>;
  torrents_per_tracker: Record<string, number>;
  torrents_total: number;
}

export type TorrentsOverview = {
  sessions: Record<string, TorrentsOverviewSession>;
}

const fetcher = function <T>(method: string, params: any) {
  return async () => {
    return await jsonrpc<T>(method, params);
  };
}

export class RpcError extends Error {
  data: any;
  code: number;

  constructor(code: number, message: string, data: any) {
    super(message)
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
  const res = await fetch(prefixPath('/api/v1/jsonrpc'), {
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      id: Date.now(),
      params: params || {}
    }),
    method: 'POST'
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

export function useInvoker<T>(method: string) {
  return (params?: any) => jsonrpc<T>(method, params);
}

export function useRPC<T>(method: string, params?: any, config?: any) {
  return useSWR(params ? [method, params] : method, fetcher<T>(method, params), config);
}
