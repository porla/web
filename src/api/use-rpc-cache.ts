import { useQueryClient } from "@tanstack/react-query";
import type { Method, Params } from "./methods";

export function useRpcCache() {
  const queryClient = useQueryClient();

  return {
    invalidate: (...methods: Method[]) =>
      Promise.all(
        methods.map((method) =>
          queryClient.invalidateQueries({ queryKey: [method] }),
        ),
      ),

    invalidateTorrents: () =>
      queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("torrents."),
      }),

    clear: () => queryClient.clear(),

    remove: <M extends Method>(method: M, params: Partial<Params<M>>) =>
      queryClient.removeQueries({ queryKey: [method, params] }),
  };
}
