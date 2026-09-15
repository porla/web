import {
  type TorrentsList,
  useRPC,
  type InfoHash,
  type Torrent,
  useInvoker,
} from "@/api";
import { TorrentListColumns } from "@/components/lists/torrents";
import { useModal } from "@/components/modal";
import MigrateTorrentModal from "@/components/modals/torrent-migrate";
import MoveTorrentModal from "@/components/modals/torrent-move";
import RemoveTorrentModal from "@/components/modals/torrent-remove";
import TorrentDetailsPanel from "@/components/torrent-details-panel";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Menu, SearchIcon } from "lucide-react";

type TorrentFilterStatus =
  | "downloading"
  | "downloading_queued"
  | "finished"
  | "seeding"
  | "seeding_queued"
  | "paused"
  | "error";

type TorrentSearch = {
  page?: number;
  query?: string;
  session_id?: number;
  status?: TorrentFilterStatus[];
  selected_info_hash?: InfoHash;
  selected_session_id?: number;
  selected_tab_id?: string;
};

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): TorrentSearch => {
    return {
      page: search.page ? Number(search.page) : undefined,
      session_id: search.session_id ? Number(search.session_id) : undefined,
      status:
        typeof search.status === "undefined"
          ? undefined
          : (search.status as TorrentFilterStatus[]),
    };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const pageSize = 50;

  const searchForm = useForm({
    defaultValues: {
      query: search.query,
    },
    onSubmit: async ({ value }) => {
      await navigate({
        to: "/",
        search: {
          ...search,
          query: !value.query?.length ? undefined : value.query,
        },
      });
    },
  });

  const torrents = useRPC<TorrentsList>(
    "torrents.list",
    {
      filters: {
        query: search.query,
        session_id: search.session_id,
        status: search.status,
      },
      page: search.page ? search.page - 1 : 0,
      pageSize,
    },
    {
      refetchInterval: 1000,
    },
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-base-300 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            searchForm.handleSubmit();
          }}
        >
          <searchForm.Field
            name="query"
            children={(field) => (
              <label className="input w-full">
                <SearchIcon className="h-[1em] opacity-50" />
                <input
                  className="grow font-mono"
                  placeholder="Search"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </label>
            )}
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-3 bg-base-300">
        <TorrentsTable torrents={torrents.data?.torrents ?? []} />
      </div>

      <div className="bg-base-300 p-3 flex justify-between">
        <div></div>

        {torrents.data && (
          <Pager
            currentPage={search.page ?? 1}
            onPageChange={(page) =>
              navigate({ to: "/", search: { ...search, page } })
            }
            pageSize={pageSize}
            totalItems={torrents.data.torrents_total}
          />
        )}
      </div>

      {search.selected_info_hash && search.selected_session_id && (
        <TorrentDetailsPanel
          info_hash={search.selected_info_hash}
          session_id={search.selected_session_id}
        />
      )}
    </div>
  );
}

type PagerProps = {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

function Pager({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: PagerProps) {
  const pageCount = Math.ceil(totalItems / pageSize);

  return (
    <div className="join">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={`join-item btn ${page === currentPage ? "btn-active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

type TorrentsTableProps = {
  torrents: Torrent[];
};

function TorrentsTable({ torrents }: TorrentsTableProps) {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const queueBottom = useInvoker("torrents.queue.bottom");
  const queueDown = useInvoker("torrents.queue.down");

  const modal = useModal();

  const userColumns = useRPC<any>("kv.get", {
    keys: ["webui.lists.torrents.cols"],
  });

  const torrentsColumns = TorrentListColumns();

  if (userColumns.isLoading || !userColumns.data) {
    return <>loading</>;
  }

  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  const knownCols = new Set(Object.keys(torrentsColumns));
  const raw = userColumns.data.values["webui.lists.torrents.cols"];

  const selectedCols: (keyof typeof torrentsColumns)[] =
    isStringArray(raw) && raw.length
      ? (raw.filter((c) =>
          knownCols.has(c),
        ) as (keyof typeof torrentsColumns)[])
      : (
          Object.keys(torrentsColumns) as (keyof typeof torrentsColumns)[]
        ).filter((c) => torrentsColumns[c].default);

  return (
    <table className="table table-zebra table-fixed">
      <thead>
        <tr>
          {selectedCols.map((col) => (
            <th key={col} className={torrentsColumns[col].headerClassNames}>
              {torrentsColumns[col].title}
            </th>
          ))}
          <th className="w-4"></th>
        </tr>
      </thead>
      <tbody>
        {torrents.map((t) => (
          <tr key={`${t.info_hash[0]}`}>
            {selectedCols.map((col) => (
              <td
                key={`td_${col}`}
                className={torrentsColumns[col].columnClassNames}
              >
                {torrentsColumns[col].data(t)}
              </td>
            ))}

            <td className="text-right">
              <button
                className="btn btn-xs btn-square"
                popoverTarget={`popover_${t.info_hash[0]}`}
                style={{ anchorName: `--anchor-${t.info_hash[0]}` }}
              >
                <Menu className="size-4" />
              </button>

              <ul
                className="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
                popover="auto"
                id={`popover_${t.info_hash[0]}`}
                style={{ positionAnchor: `--anchor-${t.info_hash[0]}` }}
              >
                <li>
                  <button
                    onClick={async () => {
                      await modal.show(MigrateTorrentModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id!,
                      });
                    }}
                  >
                    Migrate
                  </button>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      await modal.show(MoveTorrentModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id!,
                      });
                    }}
                  >
                    Move
                  </button>
                </li>
                <li>
                  <details>
                    <summary>Queuing</summary>
                    <ul>
                      <li>
                        <button
                          onClick={() =>
                            queueBottom.mutateAsync({
                              info_hash: t.info_hash,
                              session_id: search.session_id!,
                            })
                          }
                        >
                          Bottom
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            queueDown.mutateAsync({
                              info_hash: t.info_hash,
                              session_id: search.session_id!,
                            })
                          }
                        >
                          Down
                        </button>
                      </li>
                    </ul>
                  </details>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      const didRemove = await modal.show(RemoveTorrentModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id!,
                      });

                      if (
                        didRemove &&
                        search.selected_info_hash &&
                        search.selected_session_id &&
                        search.selected_info_hash[0] == t.info_hash[0] &&
                        search.selected_info_hash[1] == t.info_hash[1] &&
                        search.selected_session_id == search.session_id
                      ) {
                        await navigate({
                          to: "/",
                          search: {
                            ...search,
                            selected_info_hash: undefined,
                            selected_session_id: undefined,
                            selected_tab_id: undefined,
                          },
                        });
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
