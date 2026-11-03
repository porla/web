import { infoHashKey, type Torrent } from "@/api";
import { useEffect, useEffectEvent } from "react";
import type { Checked } from "./use-checked";

// up/down move the selection through this page, esc clears the checked
// torrents and then closes the details, ctrl/cmd+a checks the page; not
// while typing, or with a dialog or a menu open.
export function useTorrentListKeyboard({
  torrents,
  checked,
  isSelected,
  hasSelection,
  select,
  clearSelection,
}: {
  torrents: Torrent[];
  checked: Checked;
  isSelected: (t: Torrent) => boolean;
  hasSelection: boolean;
  select: (t: Torrent) => void;
  clearSelection: () => void;
}) {
  const onKey = useEffectEvent((e: KeyboardEvent) => {
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

    if (e.key === "Escape" && hasSelection) {
      e.preventDefault();
      clearSelection();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const i = torrents.findIndex(isSelected);
    const next =
      e.key === "ArrowDown" ? i + 1 : i < 0 ? torrents.length - 1 : i - 1;
    const t = torrents[next];
    if (!t) return;
    e.preventDefault();
    select(t);
    document
      .querySelector(`[data-row="${infoHashKey(t.info_hash)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}
