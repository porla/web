import { useRPC, type TorrentsCount } from "@/api";
import { Link, useMatch, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AppWindow,
  ArrowLeftRight,
  Check,
  Cog,
  Download,
  Folder,
  Pause,
  Plus,
  Server,
  Tag,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type {
  PageSize,
  TorrentFilterStatus,
} from "@/routes/_status/_main/index";
import clsx from "clsx";
import { getCurrentVersion } from "@/features";
import { useWebVersion } from "@/version";
import { prefixPath } from "@/base";

type Filter = {
  status?: TorrentFilterStatus[];
  category?: string;
  tag?: string;
};

// The sidebar's filters, with the porla statuses each one covers. Icon
// colors match the status badges (general-tab.tsx).
const statuses: {
  label: string;
  icon: LucideIcon;
  color: string;
  status: TorrentFilterStatus[];
  count: (c: TorrentsCount) => number;
}[] = [
  {
    label: "Downloading",
    icon: Download,
    color: "text-green-600 dark:text-green-300",
    status: ["downloading", "downloading_queued"],
    count: (c) => c.downloading + c.downloading_queued,
  },
  {
    label: "Seeding",
    icon: Upload,
    color: "text-blue-600 dark:text-blue-300",
    status: ["seeding", "seeding_queued"],
    count: (c) => c.seeding + c.seeding_queued,
  },
  {
    label: "Finished",
    icon: Check,
    color: "text-purple-600 dark:text-purple-300",
    status: ["finished"],
    count: (c) => c.finished,
  },
  {
    label: "Paused",
    icon: Pause,
    color: "text-orange-600 dark:text-orange-300",
    status: ["paused"],
    count: (c) => c.paused,
  },
  {
    label: "Error",
    icon: TriangleAlert,
    color: "text-red-600 dark:text-red-300",
    status: ["error"],
    count: (c) => c.error,
  },
];

const sameStatus = (a?: string[], b?: string[]) =>
  (a ?? []).join() === (b ?? []).join();

function Item({
  search,
  active,
  icon,
  label,
  count,
  alert,
  onNavigate,
}: {
  search: Filter & { session_id?: number; page_size?: PageSize };
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: ReactNode;
  alert?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        to="/"
        search={search}
        // Active is decided here; Link's own check would also match "/" for
        // every filter, so it's limited to exact matches.
        activeOptions={{ exact: true }}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "justify-between",
          active && "bg-base-content/10 font-semibold",
        )}
        onClick={onNavigate}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <span
          className={clsx(
            "text-xs tabular-nums",
            alert ? "font-semibold text-error" : "opacity-60",
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  // The list's search, or what the add page carries (its session).
  const search = useSearch({ strict: false });
  const onList = !!useMatch({ from: "/_status/_main/", shouldThrow: false });

  const sessions = useRPC("sessions.list", null, { refetchInterval: 5000 });
  const list = sessions.data?.sessions;
  const current = list?.find((s) => s.id === search.session_id);

  useEffect(() => {
    if (!onList || !list?.length || current) {
      return;
    }

    const fallback = list.find((s) => s.is_default) ?? list[0];

    navigate({
      to: "/",
      replace: true,
      search: { ...search, session_id: fallback.id, page: undefined },
    });
  }, [onList, list, current, search, navigate]);

  const session_id = current?.id;
  const count = useRPC(
    "torrents.count",
    { session_id },
    { enabled: !!session_id, refetchInterval: 1000 },
  ).data;

  // A filter replaces the others, the search and the page; the session, the
  // page size and an open details panel stay.
  const filterSearch = (filter: Filter) => ({
    session_id,
    page_size: search.page_size,
    selected_info_hash: search.selected_info_hash,
    selected_session_id: search.selected_session_id,
    selected_tab_id: search.selected_tab_id,
    ...filter,
  });

  const isActive = (filter: Filter) =>
    onList &&
    !search.query &&
    sameStatus(search.status, filter.status) &&
    search.category === filter.category &&
    search.tag === filter.tag;

  const categories = Object.entries(count?.categories ?? {}).filter(
    ([, n]) => n > 0,
  );

  const tags = Object.entries(count?.tags ?? {}).filter(([, n]) => n > 0);
  const version = getCurrentVersion()?.toString();
  const webVersion = useWebVersion();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <img src={prefixPath("/porla.svg")} alt="" className="size-7" />
        <span className="text-lg font-semibold tracking-tight">Porla</span>
        {/* Icons in one column, versions in the other, so both line up. */}
        <div className="ml-auto grid grid-cols-[auto_auto] items-center gap-x-1 text-xs leading-tight tabular-nums">
          {version && (
            <>
              <Server className="size-3 opacity-60" aria-label="Porla" />
              <span className="font-semibold" title="Porla version">
                {version}
              </span>
            </>
          )}
          {webVersion && (
            <>
              <AppWindow className="size-3 opacity-50" aria-label="Web UI" />
              <span className="opacity-50" title="Web UI version">
                {webVersion}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="px-3 pb-2">
        <Link
          to="/add"
          search={{ session_id }}
          className="btn btn-primary btn-sm btn-block"
          onClick={onNavigate}
        >
          <Plus className="size-4" />
          Add torrents
        </Link>
      </div>

      {/* Sessions and statuses stay put; categories and tags, which can be
          many, scroll on their own. */}
      <div className="shrink-0">
        {list && list.length > 1 && (
          <ul className="menu w-full space-y-1">
            <li className="menu-title">Sessions</li>
            {list.map((s) => (
              <Item
                key={s.id}
                search={{
                  session_id: s.id,
                  status: search.status,
                  page_size: search.page_size,
                }}
                active={s.id === session_id}
                icon={
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: String(s.metadata.color ?? "#9ca3af"),
                    }}
                  />
                }
                label={s.name}
                count={s.state ? s.state.torrents_total : "not loaded"}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}

        <ul className="menu w-full space-y-1">
          <li className="menu-title">Torrents</li>
          <Item
            search={filterSearch({})}
            active={isActive({})}
            icon={<ArrowLeftRight className="size-4 opacity-60" />}
            label="All"
            count={count?.total}
            onNavigate={onNavigate}
          />
          {statuses.map(({ label, icon: Icon, color, status, count: n }) => (
            <Item
              key={label}
              search={filterSearch({ status })}
              active={isActive({ status })}
              icon={<Icon className={clsx("size-4", color)} />}
              label={label}
              count={count && n(count)}
              alert={label === "Error" && !!count && n(count) > 0}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>

      <div
        className={clsx(
          "min-h-0 flex-1 overflow-y-auto",
          (categories.length > 0 || tags.length > 0) &&
            "border-t border-base-300",
        )}
      >
        {categories.length > 0 && (
          <ul className="menu w-full space-y-1">
            <li className="menu-title">Categories</li>
            {categories.map(([category, n]) => (
              <Item
                key={category}
                search={filterSearch({ category })}
                active={isActive({ category })}
                icon={<Folder className="size-4 opacity-60" />}
                label={category}
                count={n}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}

        {tags.length > 0 && (
          <ul className="menu w-full space-y-1">
            <li className="menu-title">Tags</li>
            {tags.map(([tag, n]) => (
              <Item
                key={tag}
                search={filterSearch({ tag })}
                active={isActive({ tag })}
                icon={<Tag className="size-4 opacity-60" />}
                label={tag}
                count={n}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </div>

      <ul className="menu w-full border-t border-base-300">
        <li>
          <Link
            to="/settings"
            activeProps={{
              "aria-current": "page",
              className: "bg-base-content/10 font-semibold",
            }}
            onClick={onNavigate}
          >
            <Cog className="size-4 opacity-60" />
            Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}
