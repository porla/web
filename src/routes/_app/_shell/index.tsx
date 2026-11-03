import { infoHashKey, RpcError, useRPC } from "@/api";
import { ListError } from "@/components/torrent-list/list-error";
import { SearchBox } from "@/components/torrent-list/search-box";
import {
  DEFAULT_PAGE_SIZE,
  pageSizes,
  searchSchema,
  withoutSelection,
  type TorrentSearch,
} from "@/components/torrent-list/search";
import { BulkActions } from "@/components/torrent-list/bulk-actions";
import { TorrentsTable } from "@/components/torrent-list/torrents-table";
import { TorrentDetailsPanel } from "@/components/torrent-details/torrent-details-panel";
import { DockBar } from "@/components/ui/dock-bar";
import { ListState } from "@/components/ui/list-state";
import { Pager } from "@/components/ui/pager";
import { useChecked } from "@/hooks/use-checked";
import { keepPreviousData } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, SearchX } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/_shell/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): TorrentSearch =>
    searchSchema.parse(search),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const pageSize = search.page_size ?? DEFAULT_PAGE_SIZE;

  const filtered = !!(search.status || search.category || search.tag);

  const torrents = useRPC(
    "torrents.list",
    {
      filters: {
        category: search.category,
        query: search.query,
        session_id: search.session_id,
        status: search.status,
        tags: search.tag ? [search.tag] : undefined,
      },
      order_by: search.order_by,
      order_by_dir: search.order_by_dir,
      page: search.page ? search.page - 1 : 0,
      page_size: pageSize,
    },
    {
      meta: { silent: true },
      // An RpcError (a bad PQL query) would only repeat; anything else, like
      // porla restarting or the network dropping, polls on until it's back.
      refetchInterval: (q) =>
        q.state.error instanceof RpcError ? false : 1000,
      placeholderData: keepPreviousData,
    },
  );

  // Checked for a bulk action: within this view of the list only.
  const checked = useChecked(
    torrents.data?.torrents ?? [],
    JSON.stringify([
      search.session_id,
      search.order_by,
      search.order_by_dir,
      search.page,
      search.page_size,
      search.query,
      search.status,
      search.category,
      search.tag,
    ]),
  );

  // Past the last page (its last torrent removed, a filtered list shrank):
  // the backend answers an empty page, so go to the last one.
  const total = torrents.data?.torrents_total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (torrents.isPlaceholderData || total === 0) return;
    if ((search.page ?? 1) <= lastPage) return;

    navigate({
      to: "/",
      replace: true,
      search: (prev) => ({
        ...prev,
        page: lastPage > 1 ? lastPage : undefined,
      }),
    });
  }, [torrents.isPlaceholderData, total, lastPage, search.page, navigate]);

  const pager = !torrents.error && !!torrents.data?.torrents_total && (
    <Pager
      page={search.page ?? 1}
      size={pageSize}
      sizes={pageSizes}
      total={torrents.data.torrents_total}
      onChange={(page, size) =>
        navigate({
          to: "/",
          search: {
            ...search,
            page: page > 1 ? page : undefined,
            page_size:
              size === DEFAULT_PAGE_SIZE
                ? undefined
                : (size as TorrentSearch["page_size"]),
          },
        })
      }
    />
  );

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <SearchBox />

        {search.session_id !== undefined && (
          <BulkActions
            checked={checked}
            session_id={search.session_id}
            onLeft={(gone) => {
              const left = new Set(gone.map((t) => infoHashKey(t.info_hash)));
              void navigate({
                to: "/",
                replace: true,
                search: (prev) =>
                  prev.selected_info_hash &&
                  left.has(infoHashKey(prev.selected_info_hash))
                    ? withoutSelection(prev)
                    : prev,
              });
            }}
          />
        )}
      </div>

      <div className="mx-3 min-h-0 flex-1 overflow-auto rounded-box border border-base-300 bg-base-100">
        {torrents.error ? (
          <ListError error={torrents.error} query={search.query} />
        ) : torrents.data?.torrents_total === 0 ? (
          search.query || filtered ? (
            <ListState icon={SearchX} title="No torrents match">
              {search.query ? (
                <button
                  className="btn btn-sm mt-3"
                  onClick={() =>
                    navigate({
                      to: "/",
                      search: { ...search, query: undefined, page: undefined },
                    })
                  }
                >
                  Clear the search
                </button>
              ) : (
                "Nothing in this session matches the filter."
              )}
            </ListState>
          ) : (
            <ListState icon={Inbox} title="No torrents yet">
              <Link
                to="/add"
                search={{ session_id: search.session_id }}
                className="btn btn-sm btn-primary mt-3"
              >
                Add torrents
              </Link>
            </ListState>
          )
        ) : (
          <TorrentsTable
            torrents={torrents.data?.torrents ?? []}
            checked={checked}
          />
        )}
      </div>

      {search.selected_info_hash && search.selected_session_id ? (
        <TorrentDetailsPanel
          info_hash={search.selected_info_hash}
          session_id={search.selected_session_id}
          pager={pager}
        />
      ) : (
        <DockBar>{pager && <div className="ml-auto">{pager}</div>}</DockBar>
      )}
    </div>
  );
}
