import { infoHashKey, type Torrent } from "@/api";
import { useRef, useState } from "react";

// The torrents checked for a bulk action, apart from the one the details panel
// shows. It belongs to one view of the list (`scope`: session, page, filters):
// another view starts empty. Torrents that leave the list (removed, migrated,
// filtered out) drop out of it.
export function useChecked(torrents: Torrent[], scope: string) {
  const [state, setState] = useState<{ scope: string; keys: Set<string> }>({
    scope,
    keys: new Set(),
  });
  // Where a Shift-click range starts: the last torrent clicked.
  const anchor = useRef<string | null>(null);

  const listed = torrents.map((t) => infoHashKey(t.info_hash));
  const stored = state.scope === scope ? state.keys : new Set<string>();
  const keys = new Set(listed.filter((k) => stored.has(k)));

  const save = (next: Set<string>) => setState({ scope, keys: next });

  const has = (t: Torrent) => keys.has(infoHashKey(t.info_hash));

  return {
    has,
    count: keys.size,
    // In list order.
    torrents: torrents.filter(has),
    allChecked: listed.length > 0 && keys.size === listed.length,

    // With `range`, everything from the last clicked torrent to this one gets
    // the state this one is switched to.
    toggle(t: Torrent, range = false) {
      const key = infoHashKey(t.info_hash);
      const on = !keys.has(key);
      const next = new Set(keys);
      const from =
        range && anchor.current ? listed.indexOf(anchor.current) : -1;
      const to = listed.indexOf(key);

      for (const k of from >= 0
        ? listed.slice(Math.min(from, to), Math.max(from, to) + 1)
        : [key]) {
        if (on) next.add(k);
        else next.delete(k);
      }

      anchor.current = key;
      save(next);
    },
    setAll(on: boolean) {
      anchor.current = null;
      save(on ? new Set(listed) : new Set());
    },
    // Narrows the set, e.g. to the torrents an action failed on.
    keep(torrentsToKeep: Torrent[]) {
      save(new Set(torrentsToKeep.map((t) => infoHashKey(t.info_hash))));
    },
  };
}

export type Checked = ReturnType<typeof useChecked>;
