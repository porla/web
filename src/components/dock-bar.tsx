import type { PointerEvent, ReactNode } from "react";
// The bar between the torrent list and the details below it: the list's
// footer (paging) and, with a torrent selected, the panel's header. Its top
// edge resizes the panel when there is one.
export default function DockBar({
  children,
  onResize,
}: {
  children: ReactNode;
  onResize?: (dy: number, done: boolean) => void;
}) {
  const start = (e: PointerEvent<HTMLDivElement>) => {
    if (!onResize) return;
    const y = e.clientY;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (m: globalThis.PointerEvent) => onResize(y - m.clientY, false);
    const up = (u: globalThis.PointerEvent) => {
      onResize(y - u.clientY, true);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  return (
    <div className="relative flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1">
      {onResize && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the details"
          className="absolute inset-x-0 -top-1.5 z-10 h-3 cursor-row-resize touch-none hover:bg-primary/20"
          onPointerDown={start}
        />
      )}
      {children}
    </div>
  );
}
