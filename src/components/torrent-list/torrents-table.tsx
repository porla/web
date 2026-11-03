import {
  infoHashKey,
  type SortDir,
  type Torrent,
  type TorrentSortField,
} from "@/api";
import { Spinner } from "@/components/ui/spinner";
import type { Checked } from "@/hooks/use-checked";
import { useTorrentListKeyboard } from "@/hooks/use-torrent-list-keyboard";
import { getRouteApi } from "@tanstack/react-router";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { isSelected as isSelectedIn, withoutSelection } from "./search";
import { SortableTitle } from "./sortable-title";
import { NAME_MIN_WIDTH, useShownColumns } from "./torrent-list-columns";
import { TorrentRowMenu } from "./torrent-row-menu";
import { useTorrentRowActions } from "./use-torrent-row-actions";

const route = getRouteApi("/_app/_shell/");

// What's left of the table on narrow screens; every column is a fixed width
// except the name, which would otherwise be squeezed to nothing.
const narrowCols = new Set(["queue_position", "name", "status"]);

export function TorrentsTable({
  torrents,
  checked,
}: {
  torrents: Torrent[];
  checked: Checked;
}) {
  const navigate = route.useNavigate();
  const search = route.useSearch();
  const { columns, shown: selectedCols, saved } = useShownColumns();

  const orderBy = search.order_by ?? "queue_position";
  const orderDir = search.order_by_dir ?? "asc";

  const sortBy = (field: TorrentSortField, first: SortDir) => {
    const dir =
      field === orderBy ? (orderDir === "asc" ? "desc" : "asc") : first;
    const isDefault = field === "queue_position" && dir === "asc";

    void navigate({
      to: "/",
      search: {
        ...search,
        page: undefined,
        order_by: isDefault ? undefined : field,
        order_by_dir: isDefault ? undefined : dir,
      },
    });
  };

  const isSelected = (t: Torrent) => isSelectedIn(search, t);

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

  const clearSelection = () =>
    navigate({ to: "/", search: withoutSelection(search) });

  const actions = useTorrentRowActions(search.session_id, async (t) => {
    if (isSelected(t)) await clearSelection();
  });

  useTorrentListKeyboard({
    torrents,
    checked,
    isSelected,
    hasSelection: !!search.selected_info_hash,
    select: (t) => void select(t, true),
    clearSelection: () => void clearSelection(),
  });

  if (saved.query.isLoading) {
    return <Spinner className="m-3" />;
  }

  // Fixed columns plus a floor for the name and the row menu: past that the
  // list scrolls sideways instead of squeezing the name to nothing. Phones
  // only show the narrow columns, so it applies from md up.
  const minWidth =
    selectedCols.reduce((sum, col) => sum + (columns[col].width ?? 0), 0) +
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
              title={columns[col].description}
              aria-sort={
                columns[col].sort === orderBy
                  ? orderDir === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
              style={
                columns[col].width
                  ? ({
                      "--w": `${columns[col].width}rem`,
                      "--w-narrow": `${columns[col].narrowWidth ?? columns[col].width}rem`,
                    } as CSSProperties)
                  : undefined
              }
              className={clsx(
                columns[col].width && "w-(--w-narrow) md:w-(--w)",
                columns[col].headerClassNames,
                !narrowCols.has(col) && "max-md:hidden",
              )}
            >
              <SortableTitle
                column={columns[col]}
                active={columns[col].sort === orderBy}
                dir={orderDir}
                onSort={sortBy}
              />
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
                  columns[col].columnClassNames,
                  !narrowCols.has(col) && "max-md:hidden",
                )}
              >
                {columns[col].data(t)}
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

              <TorrentRowMenu
                torrent={t}
                actions={actions}
                selected={isSelected(t)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
