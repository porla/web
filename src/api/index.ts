// The JSON-RPC client: typed methods (methods.ts), the hooks components use,
// errors and the response types. Import from "@/api".

export { rpcCall } from "./client";
export type { RpcResponse } from "./client";
export { AuthError, HttpError, RpcCode, RpcError, isRpcError } from "./errors";
export type { Method, Methods, Params, Result } from "./methods";
export { POLL_MS } from "./polling";
export { useInvoker, useRPC } from "./query";
export * from "./types/auth";
export * from "./types/logs";
export * from "./types/plugins";
export * from "./types/presets";
export * from "./types/sessions";
export * from "./types/sys";
export * from "./types/torrents";
export { useKv } from "./use-kv";
export { LOG_TAIL_MAX, useLogTail } from "./use-log-tail";
export { useRpcCache } from "./use-rpc-cache";
export { infoHashKey } from "@/lib/torrent/info-hash";
