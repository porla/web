import {
  useRPC,
  type InfoHash,
  type Torrent,
  useInvoker,
  infoHashKey,
  RpcError,
} from "@/api";
import DockBar from "@/components/dock-bar";
import ListState from "@/components/list-state";
import { TorrentListColumns } from "@/components/lists/torrents";
import { useModal } from "@/components/modal";
import MigrateTorrentModal from "@/components/modals/torrent-migrate";
import MoveTorrentModal from "@/components/modals/torrent-move";
import TorrentPropertiesModal from "@/components/modals/torrent-properties";
import RemoveTorrentModal from "@/components/modals/torrent-remove";
import Pager from "@/components/pager";
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
} from "lucide-react";
import { useEffect } from "react";
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

const pageSizes = [25, 50, 100, 200] as const;

export type PageSize = (typeof pageSizes)[number];

type TorrentSearch = {
  page?: number;
  page_size?: PageSize;
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
  page_size: z.coerce
    .number()
    .pipe(z.union(pageSizes.map((n) => z.literal(n))))
    .optional()
    .catch(undefined),
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

  const pageSize = search.page_size ?? 50;

  const searchForm = useForm({
    defaultValues: {
      query: search.query ?? "",
    },
    onSubmit: async ({ value }) => {
      await navigate({
        to: "/",
        search: {
          session_id: search.session_id,
          page_size: search.page_size,
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
      // An RpcError (a bad PQL query) would only repeat; anything else, like
      // porla restarting or the network dropping, polls on until it's back.
      refetchInterval: (q) =>
        q.state.error instanceof RpcError ? false : 1000,
      placeholderData: keepPreviousData,
    },
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
              size === 50 ? undefined : (size as TorrentSearch["page_size"]),
          },
        })
      }
    />
  );

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="p-3">
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
                    onClick={() => {
                      // also reset search form for any unsubmitted query
                      searchForm.reset({ query: "" });

                      navigate({
                        to: "/",
                        search: {
                          ...search,
                          query: undefined,
                          page: undefined,
                        },
                      });
                    }}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </label>
            )}
          />
        </form>
      </div>

      <div className="mx-3 min-h-0 flex-1 overflow-y-auto rounded-box border border-base-300 bg-base-100">
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
          <TorrentsTable torrents={torrents.data?.torrents ?? []} />
        )}
      </div>

      {search.selected_info_hash && search.selected_session_id ? (
        <TorrentDetailsPanel
          info_hash={search.selected_info_hash}
          session_id={search.selected_session_id}
          pager={pager}
        />
      ) : (
        <DockBar>
          <span></span>
          {pager && <div className="ml-auto">{pager}</div>}
        </DockBar>
      )}
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

  const isSelected = (t: Torrent) =>
    !!search.selected_info_hash &&
    infoHashKey(search.selected_info_hash) === infoHashKey(t.info_hash) &&
    search.selected_session_id === search.session_id;

  // Selecting a row opens its details; stepping with the arrow keys replaces
  // the history entry rather than adding one per step.
  const select = (t: Torrent, replace = false) =>
    navigate({
      to: "/",
      replace,
      search: {
        ...search,
        selected_info_hash: t.info_hash,
        selected_session_id: search.session_id,
        selected_tab_id: search.selected_tab_id ?? "general",
      },
    });

  // up/down move the selection through this page, esc closes the details; not
  // while typing, or with a dialog or a row menu open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (document.querySelector("dialog[open], :popover-open")) return;

      if (e.key === "Escape" && search.selected_info_hash) {
        e.preventDefault();
        void navigate({
          to: "/",
          search: {
            ...search,
            selected_info_hash: undefined,
            selected_session_id: undefined,
            selected_tab_id: undefined,
          },
        });
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const i = torrents.findIndex(isSelected);
      const next =
        e.key === "ArrowDown" ? i + 1 : i < 0 ? torrents.length - 1 : i - 1;
      const t = torrents[next];
      if (!t) return;
      e.preventDefault();
      void select(t, true);
      document
        .querySelector(`[data-row="${infoHashKey(t.info_hash)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

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
    <table className="table table-sm table-fixed">
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
          <tr
            key={`${infoHashKey(t.info_hash)}`}
            data-row={infoHashKey(t.info_hash)}
            className={clsx(
              // table-sm's padding with the normal text size
              "group cursor-pointer text-sm",
              isSelected(t)
                ? "bg-primary/15 shadow-[inset_3px_0_0_var(--color-primary)]"
                : "hover:bg-base-200/70",
            )}
            // The name link and the row menu do their own thing.
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("a, button, [popover]")) {
                void select(t);
              }
            }}
          >
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

            <td className="py-0 text-right">
              <button
                className={clsx(
                  "btn btn-ghost btn-xs btn-square focus-visible:opacity-100 group-hover:opacity-100",
                  !isSelected(t) && "[@media(hover:hover)]:opacity-0",
                )}
                aria-label={`Actions for ${t.name}`}
                popoverTarget={`popover_${infoHashKey(t.info_hash)}`}
                style={{ anchorName: `--anchor-${infoHashKey(t.info_hash)}` }}
              >
                <Menu className="size-4" />
              </button>

              <ul
                className="dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm"
                popover="auto"
                id={`popover_${infoHashKey(t.info_hash)}`}
                // A click inside a popover doesn't dismiss it: close the menu
                // once an action (or a dialog's opener) is clicked.
                onClick={(e) => {
                  if ((e.target as Element).closest("button")) {
                    e.currentTarget.hidePopover();
                  }
                }}
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
