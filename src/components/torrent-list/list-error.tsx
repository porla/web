import { RpcCode, isRpcError } from "@/api";
import { ListState } from "@/components/ui/list-state";
import { TriangleAlert } from "lucide-react";

// A PQL error points at the part of the query porla couldn't read (it sends
// its span as data.start/end); anything else is shown as it came.
export function ListError({ error, query }: { error: Error; query?: string }) {
  const span =
    isRpcError(error, RpcCode.InvalidQuery) && query
      ? (error.data as { start?: number; end?: number } | null)
      : null;

  if (!span || !query) {
    return (
      <ListState icon={TriangleAlert} title="Couldn't load the torrents">
        {error.message}
      </ListState>
    );
  }

  const start = span.start ?? 0;
  const end = Math.max(span.end ?? 0, start + 1);

  return (
    <ListState icon={TriangleAlert} title="Failed to parse PQL">
      <pre
        role="alert"
        className="mt-3 rounded bg-base-300 px-3 py-2 text-left font-mono text-sm whitespace-pre-wrap"
      >
        {query.slice(0, start)}
        <span className="rounded-sm bg-error/20 underline decoration-error/80 decoration-wavy underline-offset-4">
          {query.slice(start, end) || " "}
        </span>
        {query.slice(end)}
      </pre>
      <div className="mt-2 font-mono text-left text-xs opacity-70">
        {error.message}
      </div>
    </ListState>
  );
}
