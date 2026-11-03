import { infoHashKey, type Torrent } from "@/api";
import { RowMenu } from "@/components/ui/row-menu";
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
  return (
    <RowMenu
      id={infoHashKey(t.info_hash)}
      label={`Actions for ${t.name}`}
      pinned={selected}
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
    </RowMenu>
  );
}
