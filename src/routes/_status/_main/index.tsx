import {
  useRPC,
  type InfoHash,
  type Torrent,
  useInvoker,
  infoHashKey,
  RpcError,
} from "@/api";
import BulkActions from "@/components/bulk-actions";
import DockBar from "@/components/dock-bar";
import ListState from "@/components/list-state";
import {
  NAME_MIN_WIDTH,
  TorrentListColumns,
} from "@/components/lists/torrents";
import { useModal } from "@/components/modal";
import MigrateTorrentModal from "@/components/modals/torrent-migrate";
import MoveTorrentModal from "@/components/modals/torrent-move";
import TorrentPropertiesModal from "@/components/modals/torrent-properties";
import RemoveTorrentModal from "@/components/modals/torrent-remove";
import Pager from "@/components/pager";
import TorrentDetailsPanel from "@/components/torrent-details-panel";
import { useChecked, type Checked } from "@/hooks/use-checked";
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
import { useEffect, type CSSProperties } from "react";
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
  selected_tab_id?: "general" | "files" | "pieces" | "peers" | "trackers";
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
    .enum(["general", "files", "pieces", "peers", "trackers"])
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

  // Checked for a bulk action: within this view of the list only.
  const checked = useChecked(
    torrents.data?.torrents ?? [],
    JSON.stringify([
      search.session_id,
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
              size === 50 ? undefined : (size as TorrentSearch["page_size"]),
          },
        })
      }
    />
  );

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <form
          className="min-w-48 flex-1"
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
                    ? {
                        ...prev,
                        selected_info_hash: undefined,
                        selected_session_id: undefined,
                        selected_tab_id: undefined,
                      }
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
  checked: Checked;
};

function TorrentsTable({ torrents, checked }: TorrentsTableProps) {
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

  // up/down move the selection through this page, esc clears the checked
  // torrents and then closes the details, ctrl/cmd+a checks the page; not
  // while typing, or with a dialog or a menu open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Typing, not a focused checkbox (just clicked to check a row).
      if (
        target.closest(
          "input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]",
        )
      ) {
        return;
      }

      if (document.querySelector("dialog[open], :popover-open")) return;

      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "a"
      ) {
        e.preventDefault();
        checked.setAll(true);
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      if (e.key === "Escape" && checked.count > 0) {
        e.preventDefault();
        checked.setAll(false);
        return;
      }

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

  // Fixed columns plus a floor for the name and the row menu: past that the
  // list scrolls sideways instead of squeezing the name to nothing. Phones
  // only show the narrow columns, so it applies from md up.
  const minWidth =
    selectedCols.reduce(
      (sum, col) => sum + (torrentsColumns[col].width ?? 0),
      0,
    ) +
    (selectedCols.includes("name") ? NAME_MIN_WIDTH : 0) +
    5;

  return (
    <table
      className="group/table table table-sm table-fixed table-pin-rows md:min-w-(--table-min-width)"
      style={{ "--table-min-width": `${minWidth}rem` } as CSSProperties}
    >
      <thead>
        <tr>
          {selectedCols.map((col) => (
            <th
              key={col}
              title={torrentsColumns[col].description}
              style={
                torrentsColumns[col].width
                  ? ({
                      "--w": `${torrentsColumns[col].width}rem`,
                      "--w-narrow": `${torrentsColumns[col].narrowWidth ?? torrentsColumns[col].width}rem`,
                    } as CSSProperties)
                  : undefined
              }
              className={clsx(
                torrentsColumns[col].width && "w-(--w-narrow) md:w-(--w)",
                torrentsColumns[col].headerClassNames,
                !narrowCols.has(col) && "max-md:hidden",
              )}
            >
              {torrentsColumns[col].title}
            </th>
          ))}
          <th className="w-20 text-right">
            <input
              type="checkbox"
              className={clsx(
                "checkbox checkbox-sm checkbox-info mr-9 align-middle focus-visible:opacity-100 group-hover/table:opacity-100",
                checked.count === 0 && "[@media(hover:hover)]:opacity-0",
              )}
              aria-label="Select all on this page"
              title="Select all on this page (Ctrl+A)"
              checked={checked.allChecked}
              ref={(el) => {
                if (el)
                  el.indeterminate = checked.count > 0 && !checked.allChecked;
              }}
              onChange={() => checked.setAll(!checked.allChecked)}
            />
          </th>
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
                : checked.has(t)
                  ? "bg-info/12 hover:bg-info/18 dark:bg-info/15 dark:hover:bg-info/20"
                  : "hover:bg-base-200/70",
            )}
            // Shift-click would select text, and ctrl/cmd-click a table
            // cell (Firefox outlines it).
            onMouseDown={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey) e.preventDefault();
            }}
            // A click opens the details; ctrl/cmd-click checks the row and
            // shift-click a range. The name link, the checkbox and the row
            // menu do their own thing.
            onClick={(e) => {
              if (
                (e.target as HTMLElement).closest("a, button, input, [popover]")
              ) {
                return;
              }
              if (e.ctrlKey || e.metaKey || e.shiftKey) {
                checked.toggle(t, e.shiftKey);
              } else {
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
              <input
                type="checkbox"
                className={clsx(
                  "checkbox checkbox-sm checkbox-info mr-3 align-middle focus-visible:opacity-100 group-hover:opacity-100",
                  checked.count === 0 && "[@media(hover:hover)]:opacity-0",
                )}
                aria-label={`Select ${t.name}`}
                checked={checked.has(t)}
                // React fires this on the click, so shift is known.
                onChange={(e) =>
                  checked.toggle(t, (e.nativeEvent as MouseEvent).shiftKey)
                }
              />

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
