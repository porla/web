import type { ApiKeysList } from "./types/auth";
import type { PluginsGet, PluginsList } from "./types/plugins";
import type { PresetFields, PresetsGet, PresetsList } from "./types/presets";
import type {
  SessionTimers,
  SessionsGet,
  SessionsList,
  SessionsSettingsGet,
} from "./types/sessions";
import type { MmdbEntry, SysStatus, SysVersions } from "./types/sys";
import type {
  InfoHashPair,
  SortDir,
  TorrentFlag,
  TorrentRef,
  TorrentSortField,
  TorrentState,
  TorrentStatusFilter,
  TorrentsCount,
  TorrentsFilesList,
  TorrentsFilesPriorities,
  TorrentsFilesProgress,
  TorrentsGet,
  TorrentsList,
  TorrentsPeersList,
  TorrentsPiecesGet,
  TorrentsPropertiesGet,
  TorrentsTrackersList,
} from "./types/torrents";

export type NoParams = Record<string, never>;

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
    result: { info_hash: InfoHashPair; session_id: number };
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
        state?: TorrentState[] | null;
        status?: TorrentStatusFilter[] | null;
        tags?: string[] | null;
      } | null;
      page?: number | null; // 0-based
      page_size?: number | null; // 1–1000, default 50
      order_by?: TorrentSortField | null; // default queue_position
      order_by_dir?: SortDir | null;
    };
    result: TorrentsList;
  };
  "torrents.migrate": {
    params: TorrentRef & { target_session_id: number };
    result: { info_hash: InfoHashPair; session_id: number };
  };
  "torrents.move": {
    params: TorrentRef & {
      path: string;
      flags?: "always_replace_files" | "dont_replace" | "fail_if_exist" | null;
    };
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
