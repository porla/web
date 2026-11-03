import { infoHashKey, type Torrent } from "@/api";
import clsx from "clsx";
import { Menu } from "lucide-react";
import type { TorrentRowActions } from "./use-torrent-row-actions";

export function TorrentRowMenu({
  torrent: t,
  actions,
  selected,
}: {
  torrent: Torrent;
  actions: TorrentRowActions;
  selected: boolean;
}) {
  const key = infoHashKey(t.info_hash);

  return (
    <>
      <button
        className={clsx(
          "btn btn-ghost btn-xs btn-square focus-visible:opacity-100 group-hover:opacity-100",
          !selected && "[@media(hover:hover)]:opacity-0",
        )}
        aria-label={`Actions for ${t.name}`}
        popoverTarget={`popover_${key}`}
        style={{ anchorName: `--anchor-${key}` }}
      >
        <Menu className="size-4" />
      </button>

      <ul
        className="dropdown dropdown-end menu w-52 rounded-box bg-base-100 shadow-sm"
        popover="auto"
        id={`popover_${key}`}
        // A click inside a popover doesn't dismiss it: close the menu once an
        // action (or a dialog's opener) is clicked.
        onClick={(e) => {
          if ((e.target as Element).closest("button")) {
            e.currentTarget.hidePopover();
          }
        }}
        style={{ positionAnchor: `--anchor-${key}` }}
      >
        <li>
          {t.flags.includes("paused") ? (
            <button onClick={() => actions.resume(t)}>Resume</button>
          ) : (
            <button onClick={() => actions.pause(t)}>Pause</button>
          )}
        </li>
        <li>
          <button onClick={() => actions.recheck(t)}>Recheck</button>
        </li>
        <li>
          <button onClick={() => actions.migrate(t)}>Migrate</button>
        </li>
        <li>
          <button onClick={() => actions.move(t)}>Move</button>
        </li>
        {t.queue_position >= 0 && (
          <li>
            <details>
              <summary>Queuing</summary>
              <ul>
                <li>
                  <button onClick={() => actions.queueTop(t)}>Top</button>
                </li>
                <li>
                  <button onClick={() => actions.queueUp(t)}>Up</button>
                </li>
                <li>
                  <button onClick={() => actions.queueDown(t)}>Down</button>
                </li>
                <li>
                  <button onClick={() => actions.queueBottom(t)}>Bottom</button>
                </li>
              </ul>
            </details>
          </li>
        )}
        <li>
          <button onClick={() => actions.remove(t)}>Remove</button>
        </li>
        <li>
          <button onClick={() => actions.properties(t)}>Properties</button>
        </li>
        {actions.plugins.map((item) => (
          <li key={item.id}>
            <button onClick={() => item.run(t)}>{item.label}</button>
          </li>
        ))}
      </ul>
    </>
  );
}
