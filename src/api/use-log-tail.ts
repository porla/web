import { useQuery } from "@tanstack/react-query";
import { jsonrpc } from "./client";
import { POLL_MS } from "./polling";
import type { LogFilters, LogsList } from "./types/logs";

export const LOG_TAIL_MAX = 2000;

export function useLogTail(filters: LogFilters) {
  return useQuery({
    queryKey: ["logs.list", "tail", filters],
    queryFn: async ({ client, queryKey, signal }): Promise<LogsList> => {
      const prev = client.getQueryData<LogsList>(queryKey);

      if (!prev) {
        return jsonrpc("logs.list", { filters }, signal);
      }

      const page = await jsonrpc(
        "logs.list",
        { filters, after: prev.cursor },
        signal,
      );

      // A new run_id is a restarted Porla, where the old cursor means nothing.
      if (page.run_id !== prev.run_id) {
        return jsonrpc("logs.list", { filters }, signal);
      }

      return {
        ...page,
        entries: [...prev.entries, ...page.entries].slice(-LOG_TAIL_MAX),
      };
    },
    refetchInterval: POLL_MS.details,
  });
}
