import { ChevronLeft, ChevronRight } from "lucide-react";

// Which torrents are shown ("51–100 of 237") and how many at a time; the
// arrows step a page without opening the list.
export default function Pager({
  page,
  size,
  sizes,
  total,
  onChange,
}: {
  page: number;
  size: number;
  sizes: readonly number[];
  total: number;
  onChange: (page: number, size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const range = (p: number) =>
    `${((p - 1) * size + 1).toLocaleString()}–${Math.min(p * size, total).toLocaleString()}`;

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        className="btn btn-ghost btn-xs btn-square"
        disabled={page <= 1}
        onClick={() => onChange(page - 1, size)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      <select
        className="select select-ghost select-xs w-auto font-medium tabular-nums"
        value={Math.min(page, pages)}
        onChange={(e) => onChange(Number(e.target.value), size)}
        aria-label="Torrents shown"
      >
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <option key={p} value={p}>
            {range(p)}
          </option>
        ))}
      </select>
      <span className="whitespace-nowrap opacity-60 tabular-nums">
        of {total.toLocaleString()}
      </span>
      <button
        className="btn btn-ghost btn-xs btn-square"
        disabled={page >= pages}
        onClick={() => onChange(page + 1, size)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
      <select
        className="select select-ghost select-xs ml-1 w-auto"
        value={size}
        // The first torrent shown stays in view.
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(Math.floor(((page - 1) * size) / next) + 1, next);
        }}
        aria-label="Torrents per page"
      >
        {sizes.map((s) => (
          <option key={s} value={s}>
            {s} per page
          </option>
        ))}
      </select>
    </div>
  );
}
