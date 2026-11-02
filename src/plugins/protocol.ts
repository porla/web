// The plugin UI protocol, version 1: what the host and a plugin's frames send
// each other. Every frame (the hidden control frame, each modal and the
// settings page) gets its own MessagePort in plugin:init. Frames are untrusted: these types say what a
// well-behaved plugin sends, not what arrives, so handlers still check fields.

import { rpcCall, type InfoHash, type Plugin, type RpcResponse } from "@/api";
import { prefixPath } from "@/base";
import { getCurrentVersion } from "@/features";
import { useLayoutEffect, useRef, type SyntheticEvent } from "react";

export const PROTOCOL = 1;

// Plugin pages run with an opaque origin: no cookies, storage or same-origin
// access to porla. Everything goes through the port.
export const SANDBOX = "allow-scripts";

export type Role = "control" | "modal" | "settings";

export type Theme = { name: "light" | "dark" };

export type Init = {
  type: "plugin:init";
  protocol: typeof PROTOCOL;
  role: Role;
  porla_version: string | null;
  theme: Theme;
  context?: unknown;
};

// Every role: an RPC call, answered with jsonrpc.result. A frame may call its
// plugin's own x.<slug>.* methods and the core methods in its manifest's ui.rpc;
// anything else is refused with PERMISSION_DENIED.
export type JsonRpcCall = {
  type: "jsonrpc.call";
  id: number | string;
  method: string;
  params?: unknown;
};

export type JsonRpcResult = {
  type: "jsonrpc.result";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

// Frame -> host, besides jsonrpc.call (the channel answers those itself).
export type FrameMessage = {
  control:
    | { type: "menu.add"; id: string; label: string }
    | { type: "modal.open"; entry: string; title: string; context?: unknown };
  modal: { type: "resize"; height: number } | { type: "close" };
  settings: { type: "resize"; height: number };
};

export type MenuContext = {
  torrents: { info_hash: InfoHash; session_id?: number }[];
};

// Host -> frame.
export type HostMessage = {
  control:
    | { type: "menu.invoke"; id: string; context: MenuContext }
    | JsonRpcResult;
  modal: JsonRpcResult;
  settings: JsonRpcResult;
};

const PERMISSION_DENIED = -32000;

function mayCall(plugin: Plugin, method: string) {
  return (
    (!!plugin.slug && method.startsWith(`x.${plugin.slug}.`)) ||
    (plugin.manifest?.ui?.rpc ?? []).includes(method)
  );
}

async function call(plugin: Plugin, msg: JsonRpcCall): Promise<RpcResponse> {
  if (typeof msg.method !== "string" || !mayCall(plugin, msg.method)) {
    return {
      error: {
        code: PERMISSION_DENIED,
        message: `permission_denied: ${String(msg.method)} is neither x.${plugin.slug}.* nor in the plugin's ui.rpc`,
      },
    };
  }

  return rpcCall(msg.method, msg.params);
}

function currentTheme(): Theme {
  return {
    name: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  };
}

export function pluginPageUrl(plugin: Plugin, page: string | null | undefined) {
  const segments = page?.split("/") ?? [];

  if (
    !plugin.slug ||
    !segments.length ||
    !segments.every((s) => /^[\w-][\w.-]*$/.test(s))
  ) {
    return null;
  }

  // porla serves ui/ with Cache-Control: no-cache, so no cache-busting needed.
  return prefixPath(`/x/${encodeURIComponent(plugin.slug)}/ui/${page}`);
}

export function useFrameChannel<R extends Role>(
  role: R,
  plugin: Plugin,
  onMessage: (
    msg: FrameMessage[R],
    send: (msg: HostMessage[R]) => void,
  ) => void,
  context?: unknown,
) {
  const port = useRef<MessagePort | null>(null);
  const handler = useRef(onMessage);

  useLayoutEffect(() => {
    handler.current = onMessage;
  });

  return (e: SyntheticEvent<HTMLIFrameElement>) => {
    const target = e.currentTarget.contentWindow;

    if (!target) {
      console.error("no content window");
      return;
    }

    port.current?.close();

    const { port1, port2 } = new MessageChannel();
    const send = (msg: HostMessage[R]) => port1.postMessage(msg);

    port1.onmessage = ({ data }) => {
      if (data?.type === "jsonrpc.call") {
        call(plugin, data).then((result) =>
          port1.postMessage({
            type: "jsonrpc.result",
            id: data.id,
            ...result,
          } satisfies JsonRpcResult),
        );
      } else {
        handler.current(data, send);
      }
    };

    port.current = port1;

    target.postMessage(
      {
        type: "plugin:init",
        protocol: PROTOCOL,
        role,
        porla_version: getCurrentVersion()?.toString() ?? null,
        theme: currentTheme(),
        context,
      } satisfies Init,
      "*",
      [port2],
    );
  };
}
