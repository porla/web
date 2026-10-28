import {
  useRPC,
  type InfoHash,
  type Torrent,
  useInvoker,
  infoHashKey,
  RpcError,
} from "@/api";
import { TorrentListColumns } from "@/components/lists/torrents";
import { useModal } from "@/components/modal";
import MigrateTorrentModal from "@/components/modals/torrent-migrate";
import MoveTorrentModal from "@/components/modals/torrent-move";
import TorrentPropertiesModal from "@/components/modals/torrent-properties";
import RemoveTorrentModal from "@/components/modals/torrent-remove";
import TorrentDetailsPanel from "@/components/torrent-details-panel";
import { useForm } from "@tanstack/react-form";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import {
  Inbox,
  Menu,
  SearchIcon,
  SearchX,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import z from "zod";

const statuses = [
  "downloading",
  "downloading_queued",
  "finished",
  "seeding",
  "seeding_queued",
  "paused",
  "error",
] as const;

export type TorrentFilterStatus = (typeof statuses)[number];

type TorrentSearch = {
  page?: number;
  query?: string;
  session_id?: number;
  category?: string;
  tag?: string;
  status?: TorrentFilterStatus[];
  selected_info_hash?: InfoHash;
  selected_session_id?: number;
  selected_tab_id?: "general" | "files" | "peers" | "trackers";
};

// Hand-edited or stale URLs: a value that doesn't fit is dropped instead of
// reaching the backend (a bare ?status=paused used to fail to deserialize).
const id = z.coerce.number().int().min(1).optional().catch(undefined);
const text = z.string().min(1).optional().catch(undefined);
const searchSchema = z.object({
  page: id,
  query: text,
  session_id: id,
  category: text,
  tag: text,
  status: z
    .preprocess(
      (v) => (typeof v === "string" ? [v] : v),
      z.array(z.enum(statuses)).optional(),
    )
    .catch(undefined),
  selected_info_hash: z
    .union([
      z.tuple([z.string().nullable(), z.string().nullable()]),
      z.string(),
    ])
    .optional()
    .catch(undefined),
  selected_session_id: id,
  selected_tab_id: z
    .enum(["general", "files", "peers", "trackers"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_status/_main/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): TorrentSearch =>
    searchSchema.parse(search),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const pageSize = 50;

  const searchForm = useForm({
    defaultValues: {
      query: search.query ?? "",
    },
    onSubmit: async ({ value }) => {
      await navigate({
        to: "/",
        search: {
          session_id: search.session_id,
          query: value.query.trim() || undefined,
          selected_info_hash: search.selected_info_hash,
          selected_session_id: search.selected_session_id,
          selected_tab_id: search.selected_tab_id,
        },
      });
    },
  });

  // The box follows the URL, e.g. when a sidebar filter clears the query.
  useEffect(() => {
    searchForm.reset({ query: search.query ?? "" });
  }, [search.query, searchForm]);

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
      page: search.page ? search.page - 1 : 0,
      page_size: pageSize,
    },
    {
      meta: { silent: true },
      refetchInterval: (q) => (q.state.error ? false : 1000),
      placeholderData: keepPreviousData,
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
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {(field.state.value || search.query) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label="Clear the search"
                    onClick={() =>
                      navigate({
                        to: "/",
                        search: {
                          ...search,
                          query: undefined,
                          page: undefined,
                        },
                      })
                    }
                  >
                    <X className="size-4" />
                  </button>
                )}
              </label>
            )}
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-3 bg-base-300">
        {torrents.error ? (
          <ListError error={torrents.error} query={search.query} />
        ) : torrents.data?.torrents.length === 0 ? (
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
          <TorrentsTable torrents={torrents.data?.torrents ?? []} />
        )}
      </div>

      <div className="bg-base-300 p-3 flex justify-between">
        <div></div>

        {!torrents.error && !!torrents.data?.torrents.length && (
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

// Takes the place of the table (headers too) when there's nothing to list.
function ListState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-box border border-base-300 bg-base-200 px-6 py-5 text-center">
        <Icon className="mx-auto mb-2 size-6 opacity-50" />
        <div className="font-semibold">{title}</div>
        {children && <div className="mt-1 text-sm opacity-80">{children}</div>}
      </div>
    </div>
  );
}

// A PQL error points at the part of the query porla couldn't read (it sends
// its span as data.start/end); anything else is shown as it came.
function ListError({ error, query }: { error: Error; query?: string }) {
  const span =
    error instanceof RpcError && error.code === -1000 && query
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

// What's left of the table on narrow screens; every column is a fixed width
// except the name, which would otherwise be squeezed to nothing.
const narrowCols = new Set(["queue_position", "name", "status"]);

type TorrentsTableProps = {
  torrents: Torrent[];
};

function TorrentsTable({ torrents }: TorrentsTableProps) {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const queryClient = useQueryClient();

  const refresh = {
    onSuccess: () =>
      queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("torrents."),
      }),
  };

  const pause = useInvoker("torrents.pause", refresh);
  const resume = useInvoker("torrents.resume", refresh);
  const recheck = useInvoker("torrents.recheck", refresh);
  const queueTop = useInvoker("torrents.queue.top", refresh);
  const queueUp = useInvoker("torrents.queue.up", refresh);
  const queueDown = useInvoker("torrents.queue.down", refresh);
  const queueBottom = useInvoker("torrents.queue.bottom", refresh);

  const modal = useModal();

  const userColumns = useRPC("kv.get", {
    keys: ["webui.lists.torrents.cols"],
  });

  const torrentsColumns = TorrentListColumns();

  // Closes the details panel if it shows this torrent, which just left the
  // session (removed or migrated).
  const deselect = async (t: Torrent) => {
    if (
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
  };

  if (userColumns.isLoading) {
    return <>loading</>;
  }

  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  const knownCols = new Set(Object.keys(torrentsColumns));
  const raw = userColumns.data?.values["webui.lists.torrents.cols"];

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
            <th
              key={col}
              className={clsx(
                torrentsColumns[col].headerClassNames,
                !narrowCols.has(col) && "max-md:hidden",
              )}
            >
              {torrentsColumns[col].title}
            </th>
          ))}
          <th className="w-16"></th>
        </tr>
      </thead>
      <tbody>
        {torrents.map((t) => (
          <tr key={`${infoHashKey(t.info_hash)}`}>
            {selectedCols.map((col) => (
              <td
                key={`td_${col}`}
                className={clsx(
                  torrentsColumns[col].columnClassNames,
                  !narrowCols.has(col) && "max-md:hidden",
                )}
              >
                {torrentsColumns[col].data(t)}
              </td>
            ))}

            <td className="text-right">
              <button
                className="btn btn-xs btn-square"
                popoverTarget={`popover_${infoHashKey(t.info_hash)}`}
                style={{ anchorName: `--anchor-${infoHashKey(t.info_hash)}` }}
              >
                <Menu className="size-4" />
              </button>

              <ul
                className="dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm"
                popover="auto"
                id={`popover_${infoHashKey(t.info_hash)}`}
                style={{
                  positionAnchor: `--anchor-${infoHashKey(t.info_hash)}`,
                }}
              >
                {t.flags.includes("paused") ? (
                  <li>
                    <button
                      onClick={() =>
                        resume.mutate({
                          session_id: search.session_id!,
                          info_hash: t.info_hash,
                        })
                      }
                    >
                      Resume
                    </button>
                  </li>
                ) : (
                  <li>
                    <button
                      onClick={() =>
                        pause.mutate({
                          session_id: search.session_id!,
                          info_hash: t.info_hash,
                        })
                      }
                    >
                      Pause
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() =>
                      recheck.mutate({
                        session_id: search.session_id!,
                        info_hash: t.info_hash,
                      })
                    }
                  >
                    Recheck
                  </button>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      const didMigrate = await modal.show(MigrateTorrentModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id,
                      });

                      if (didMigrate) {
                        await deselect(t);
                      }
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
                {t.queue_position >= 0 && (
                  <li>
                    <details>
                      <summary>Queuing</summary>
                      <ul>
                        <li>
                          <button
                            onClick={() =>
                              queueTop.mutate({
                                info_hash: t.info_hash,
                                session_id: search.session_id!,
                              })
                            }
                          >
                            Top
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() =>
                              queueUp.mutate({
                                info_hash: t.info_hash,
                                session_id: search.session_id!,
                              })
                            }
                          >
                            Up
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() =>
                              queueDown.mutate({
                                info_hash: t.info_hash,
                                session_id: search.session_id!,
                              })
                            }
                          >
                            Down
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() =>
                              queueBottom.mutate({
                                info_hash: t.info_hash,
                                session_id: search.session_id!,
                              })
                            }
                          >
                            Bottom
                          </button>
                        </li>
                      </ul>
                    </details>
                  </li>
                )}
                <li>
                  <button
                    onClick={async () => {
                      const didRemove = await modal.show(RemoveTorrentModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id!,
                      });

                      if (didRemove) {
                        await deselect(t);
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      await modal.show(TorrentPropertiesModal, {
                        info_hash: t.info_hash,
                        session_id: search.session_id!,
                      });
                    }}
                  >
                    Properties
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
