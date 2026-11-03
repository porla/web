import clsx from "clsx";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

export function RowMenu({
  id,
  label,
  pinned,
  children,
}: {
  id: string;
  label: string;
  pinned?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <button
        className={clsx(
          "btn btn-ghost btn-xs btn-square focus-visible:opacity-100 group-hover:opacity-100",
          !pinned && "[@media(hover:hover)]:opacity-0",
        )}
        aria-label={label}
        popoverTarget={`popover_${id}`}
        style={{ anchorName: `--anchor-${id}` }}
      >
        <Menu className="size-4" />
      </button>

      <ul
        className="dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm"
        popover="auto"
        id={`popover_${id}`}
        // A click inside a popover doesn't dismiss it: close the menu once an
        // action (or a dialog's opener) is clicked.
        onClick={(e) => {
          if ((e.target as Element).closest("button")) {
            e.currentTarget.hidePopover();
          }
        }}
        style={{ positionAnchor: `--anchor-${id}` }}
      >
        {children}
      </ul>
    </>
  );
}
