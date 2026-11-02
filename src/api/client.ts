import { prefixPath } from "@/lib/base-path";
import { AuthError, HttpError, RpcError } from "./errors";
import type { Method, Params, Result } from "./methods";

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

export async function jsonrpc<M extends Method>(
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

export type RpcResponse = {
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export async function rpcCall(
  method: string,
  params: unknown,
): Promise<RpcResponse> {
  try {
    const data = await post(method, params ?? {});
    return data.error ? { error: data.error } : { result: data.result };
  } catch (e) {
    return {
      error: {
        code: -32603,
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}
