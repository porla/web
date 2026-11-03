import clsx from "clsx";
import type { Key, ReactNode } from "react";

export type DetailsColumn<R> = {
  key: string;
  label: string;
  title?: string;
  numeric?: boolean;
  // Hidden below a panel width (a container query: the panel is the viewport
  // less the sidebar).
  hide?: string;
  className?: string;
  cell: (row: R) => ReactNode;
};

export function DetailsTable<R>({
  columns,
  rows,
  rowKey,
  actions,
}: {
  columns: DetailsColumn<R>[];
  rows: R[];
  rowKey: (row: R) => Key;
  actions?: (row: R) => ReactNode;
}) {
  return (
    <div className="@container">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-2 text-xs",
                  c.numeric && "text-right",
                  c.hide,
                )}
                title={c.title}
              >
                {c.label}
              </th>
            ))}
            {actions && <th className="px-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="group hover:bg-base-200/60">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-2",
                    c.className,
                    c.numeric && "text-right tabular-nums whitespace-nowrap",
                    c.hide,
                  )}
                >
                  {c.cell(r)}
                </td>
              ))}
              {actions && (
                <td className="px-2 py-0 text-right">{actions(r)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
