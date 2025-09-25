import useSWR from "swr";
import { prefixPath } from "./base";


export type PresetsList = {
  presets: PresetsListItem[];
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
