import type { SortDir, TorrentSortField } from "@/api";
import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { TorrentListColumn } from "./torrent-list-columns";

export function SortableTitle({
  column,
  active,
  dir,
  onSort,
}: {
  column: TorrentListColumn;
  active: boolean;
  dir: SortDir;
  onSort: (field: TorrentSortField, first: SortDir) => void;
}) {
  const field = column.sort;

  if (!field) return <>{column.title}</>;

  const shown = active ? dir : (column.sortFirst ?? "desc");
  const Arrow = shown === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      className={clsx(
        "group/sort inline-flex max-w-full cursor-pointer items-center gap-1 hover:text-base-content",
        // Right-aligned titles keep their text flush with the numbers.
        column.headerClassNames?.includes("text-right") && "flex-row-reverse",
        active && "text-base-content",
      )}
      title={`Sort by ${(column.name ?? column.title).toLowerCase()}`}
      onClick={() => onSort(field, column.sortFirst ?? "desc")}
    >
      <span className="truncate">{column.title}</span>
      <Arrow
        aria-hidden
        className={clsx(
          "size-3 shrink-0",
          !active && "opacity-0 group-hover/sort:opacity-40",
        )}
      />
    </button>
  );
}
