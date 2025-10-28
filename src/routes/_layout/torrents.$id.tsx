import { createFileRoute } from "@tanstack/react-router";
import { type InfoHash } from "@/jsonrpc";

type TorrentsByIdSearch = {
  session_id: number;
}

export const Route = createFileRoute("/_layout/torrents/$id")({
  component: RouteComponent,
  params: {
    parse: (p) => {
      return { id: ["", null] as InfoHash };
    },
  },
  validateSearch(p: Record<string, unknown>): TorrentsByIdSearch {
    return {
      session_id: Number(p.session_id)
    }
  }
});

function RouteComponent() {
  return <div>Hello "/_layout/torrents/$id"!</div>;
}
