import { useMutation } from "@tanstack/react-query";
import { jsonrpc } from "./client";
import { useRPC } from "./query";
import { useRpcCache } from "./use-rpc-cache";

export function useKv(key: string) {
  const cache = useRpcCache();
  const query = useRPC("kv.get", { keys: [key] });

  const set = useMutation({
    mutationFn: (value: unknown) =>
      jsonrpc("kv.set", { values: { [key]: value } }),
    mutationKey: ["kv.set"],
    networkMode: "always",
    // Not toasted: show set.error where the value is saved.
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("kv.get"),
  });

  return { value: query.data?.values[key], query, set };
}
