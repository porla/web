// The JSON-RPC client: typed methods (methods.ts), the hooks components use,
// errors and the response types. Import from "@/api".

export { rpcCall } from "./client";
export type { RpcResponse } from "./client";
export { AuthError, HttpError, RpcCode, RpcError, isRpcError } from "./errors";
export type { Method, Methods, Params, Result } from "./methods";
export { POLL_MS } from "./polling";
export { useInvoker, useRPC } from "./query";
export type { ApiKey, ApiKeysList } from "./types/auth";
export type {
  Plugin,
  PluginManifest,
  PluginsGet,
  PluginsList,
} from "./types/plugins";
export type { Preset, PresetsGet, PresetsList } from "./types/presets";
export type {
  Session,
  SessionSettings,
  SessionsGet,
  SessionsList,
  SessionsSettingsGet,
} from "./types/sessions";
export type { MmdbEntry, SysStatus, SysVersions } from "./types/sys";
export { torrentSortFields } from "./types/torrents";
export { useKv } from "./use-kv";
export { useRpcCache } from "./use-rpc-cache";
export type {
  AnnounceEndpoint,
  AnnounceEntry,
  AnnounceInfohash,
  Bitfield,
  ErrC,
  FileFlag,
  InfoHash,
  InfoHashPair,
  Peer,
  PeerFlag,
  PeerSource,
  ResumeDataFlag,
  SortDir,
  Torrent,
  TorrentFile,
  TorrentFlag,
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
export { infoHashKey } from "@/lib/torrent/info-hash";
