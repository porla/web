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

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const RpcCode = {
  // Any method that takes a session_id or an info_hash.
  SessionNotFound: -1,
  SessionNotLoaded: -2,
  TorrentNotFound: -3,
  TorrentNotValid: -4,
  MissingSavePath: -6, // torrents.add
  InvalidQuery: -1000, // torrents.list
  MmdbNotLoaded: -1, // mmdb.lookup
  Unauthorized: 1001,
  InternalError: -32603,
} as const;

export function isRpcError(
  error: unknown,
  ...codes: number[]
): error is RpcError {
  return error instanceof RpcError && codes.includes(error.code);
}
