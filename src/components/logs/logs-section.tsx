import {
  LOG_LEVELS,
  LOG_TAIL_MAX,
  useLogTail,
  useRPC,
  type LogEntry,
  type LogFilters,
  type LogLevel,
} from "@/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { CopyButton } from "@/components/ui/copy-button";
import { QueryNotice } from "@/components/ui/query-notice";
import { pluginInfo } from "@/plugins/plugin-info";
import clsx from "clsx";
import { SearchIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { logfmt } from "./logfmt";

// Porla only filters on an exact name; components seen in the log are added.
const COMPONENTS = [
  "auth",
  "config",
  "db",
  "http",
  "http_client",
  "main",
  "mmdb",
  "plugin",
  "plugins",
  "rpc",
  "session",
  "timer",
  "torrents",
  "zip",
];

const LEVEL_STATUS: Record<LogLevel, string> = {
  trace: "",
  debug: "",
  info: "status-info",
  warning: "status-warning",
  error: "status-error",
  fatal: "status-error",
};

export function LogsSection() {
  const [filters, setFilters] = useState<LogFilters>({});
  const [search, setSearch] = useState("");

  const logs = useLogTail(filters);
  const plugins = useRPC("plugins.list", undefined, {
    meta: { errorToast: false },
  });

  const entries = logs.data?.entries;
  const needle = search.trim().toLowerCase();
  const shown = needle
    ? entries?.filter((e) => searchText(e).includes(needle))
    : entries;

  const components = [
    ...new Set([
      ...COMPONENTS,
      ...(entries ?? []).flatMap((e) => e.component ?? []),
      ...(filters.component ? [filters.component] : []),
    ]),
  ].sort();

  return (
    <SettingsSection title="Logs">
      <div className="rounded-box bg-base-200 shadow">
        <div className="flex flex-wrap items-center gap-1 border-b border-base-content/5 p-2">
          <label className="input input-ghost input-sm min-w-48 flex-1">
            <SearchIcon className="h-[1em] opacity-50" />
            <input
              type="search"
              className="grow"
              placeholder="Search"
              aria-label="Search logs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <select
            className="select select-ghost select-sm w-auto"
            aria-label="Level"
            value={filters.min_level ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                min_level: (e.target.value || undefined) as
                  LogLevel | undefined,
              })
            }
          >
            <option value="">All levels</option>
            {LOG_LEVELS.slice(1).map((level) => (
              <option key={level} value={level}>
                {capitalize(level)}
              </option>
            ))}
          </select>

          <select
            className="select select-ghost select-sm w-auto"
            aria-label="Component"
            value={filters.component ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, component: e.target.value || undefined })
            }
          >
            <option value="">All components</option>
            {components.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="select select-ghost select-sm w-auto"
            aria-label="Plugin"
            value={filters.plugin_id ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                plugin_id: e.target.value === "" ? undefined : +e.target.value,
              })
            }
          >
            <option value="">All plugins</option>
            <option value="0">Porla core</option>
            {plugins.data?.plugins.map((p) => (
              <option key={p.id} value={p.id}>
                {pluginInfo(p).name}
              </option>
            ))}
          </select>

          <CopyButton
            text={logfmt(shown ?? [])}
            label="the shown entries as logfmt"
          />
        </div>

        {!entries || !shown ? (
          <QueryNotice query={logs} what="logs" />
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm opacity-60">
            {entries.length
              ? `None of the ${entries.length} loaded entries contain "${search.trim()}".`
              : "No log entries. Porla keeps entries at or above its --log-level."}
          </p>
        ) : (
          <div className="max-h-112 overflow-y-auto">
            <table className="table table-sm">
              <tbody>
                {shown.toReversed().map((e) => (
                  <LogRow key={e.seq} entry={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {shown && shown.length > 0 && (
          <div className="border-t border-base-content/5 px-4 py-2 text-xs opacity-60">
            {shown.length === entries?.length
              ? `${shown.length} entries`
              : `${shown.length} of ${entries?.length} entries`}
            {entries?.length === LOG_TAIL_MAX && ", the oldest dropped"}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const ts = DateTime.fromMillis(entry.ts);
  const properties = Object.entries(entry.properties);

  return (
    <tr className="align-baseline">
      <td
        className="w-0 whitespace-nowrap font-mono text-xs opacity-60"
        title={ts.toFormat("yyyy-MM-dd HH:mm:ss.SSS ZZZZ")}
      >
        {ts.toFormat("HH:mm:ss.SSS")}
      </td>
      <td className="w-0 whitespace-nowrap">
        <span className="inline-flex items-center gap-2 text-xs">
          <span className={clsx("status", LEVEL_STATUS[entry.level])} />
          <span
            className={clsx(
              "max-sm:sr-only",
              !LEVEL_STATUS[entry.level] && "opacity-60",
            )}
          >
            {entry.level}
          </span>
        </span>
      </td>
      <td className="wrap-anywhere">
        {entry.component && (
          <span className="mr-2 text-xs opacity-60">{entry.component}</span>
        )}
        <span className="whitespace-pre-wrap">{entry.message}</span>
        {properties.map(([k, v]) => (
          <span key={k} className="ml-3 font-mono text-xs opacity-50">
            {k}={v === null ? "" : String(v)}
          </span>
        ))}
      </td>
    </tr>
  );
}

function searchText(e: LogEntry) {
  return [e.message, e.component, ...Object.entries(e.properties).flat()]
    .join(" ")
    .toLowerCase();
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);
