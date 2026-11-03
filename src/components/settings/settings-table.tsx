import { ListState } from "@/components/ui/list-state";
import { QueryNotice } from "@/components/ui/query-notice";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsTable<T>({
  query,
  rows,
  what,
  emptyIcon,
  emptyHint,
  head,
  children,
}: {
  query: { error: Error | null };
  rows: T[] | undefined;
  what: string;
  emptyIcon: LucideIcon;
  emptyHint?: ReactNode;
  head: ReactNode;
  children: (row: T) => ReactNode;
}) {
  if (!rows) {
    return <QueryNotice query={query} what={what} />;
  }

  if (rows.length === 0) {
    return (
      <ListState icon={emptyIcon} title={`No ${what} yet`}>
        {emptyHint}
      </ListState>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200">
      <table className="table">
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{rows.map(children)}</tbody>
      </table>
    </div>
  );
}
