import {
  type TorrentsPeersList,
  useRPC,
  type InfoHash,
  type TorrentsList,
  useInvoker,
  type TorrentsTrackersList,
  type TorrentsFilesList,
  type TorrentsFilesProgress,
  type Torrent,
  isBitSet,
} from "@/jsonrpc";
import { createFileRoute, Link } from "@tanstack/react-router";
import { filesize } from "filesize";
import clsx from "clsx";

type TorrentFilterStatus =
  | "downloading"
  | "downloading_queued"
  | "finished"
  | "seeding"
  | "seeding_queued"
  | "paused"
  | "error";

type TorrentSearch = {
  session_id?: number;
  status?: TorrentFilterStatus[];
  selected_info_hash?: InfoHash;
  selected_session_id?: number;
  selected_tab_id?: string;
};

export const Route = createFileRoute("/_layout/")({
  component: Index,
  validateSearch: (search: Record<string, unknown>): TorrentSearch => {
    return {
      session_id: search.session_id ? Number(search.session_id) : undefined,
      status:
        typeof search.status === "undefined"
          ? undefined
          : (search.status as TorrentFilterStatus[]),
    };
  },
});

function Index() {
  const search = Route.useSearch();

  const torrents = useRPC<TorrentsList>(
    "torrents.list",
    {
      filters: {
        session_id: search.session_id,
        status: search.status,
      },
    },
    {
      refetchInterval: 1000,
    }
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-full flex-1 overflow-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-gray-900 text-gray-500 sticky top-0">
              <th className="w-8 border-b-gray-700 border-b text-center">
                <input type="checkbox" />
              </th>
              <th className="w-8 border-b-gray-700 border-b text-right">#</th>
              <th className="w-[600px] py-2 pl-3 border-b-gray-700 border-b text-left">
                Name
              </th>
              <th className="w-24 py-2 border-b-gray-700 border-b text-right">
                Size
              </th>
              <th className="w-32 py-2 border-b-gray-700 border-b text-center">
                Progress
              </th>
              <th className="w-16 text-left border-b-gray-700 border-b">
                State
              </th>
              <th className="w-28 text-right border-b-gray-700 border-b">DL</th>
              <th className="w-28 text-right border-b-gray-700 border-b pr-3">
                UL
              </th>
              <th className="w-40 text-left border-b-gray-700 border-b pr-3">
                Added
              </th>
              <th className="w-40 text-left border-b-gray-700 border-b pr-3">
                Completed
              </th>
            </tr>
          </thead>
          <tbody>
            {torrents.data?.torrents.map((t) => (
              <tr key={t.info_hash[0]} className="hover:bg-gray-700">
                <td className="text-center">
                  <input type="checkbox" />
                </td>
                <td className="text-right text-gray-500">
                  {t.queue_position < 0 ? "-" : t.queue_position}
                </td>
                <td className="pl-3 py-1 font-medium overflow-hidden text-ellipsis text-nowrap">
                  <Link
                    to="/"
                    search={{
                      ...search,
                      selected_info_hash:
                        t.info_hash[1] || t.info_hash[0] || t.info_hash,
                      selected_session_id: search.session_id,
                      selected_tab_id: search.selected_tab_id || "general",
                    }}
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="text-right">
                  {filesize(t.total + t.total_done, { base: 2 })}
                </td>
                <td className="py-2 px-3 flex items-center justify-center">
                  <progress
                    className="w-full rounded-sm border border-blue-400"
                    value={t.progress}
                    max={1}
                  />
                </td>
                <td>
                  <TorrentStateBadge torrent={t} />
                </td>
                <td className="text-right">
                  {t.download_payload_rate < 1024 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <>{filesize(t.download_payload_rate)}/s</>
                  )}
                </td>
                <td className="text-right pr-3">
                  {t.upload_payload_rate < 1024 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <>{filesize(t.upload_payload_rate)}/s</>
                  )}
                </td>
                <td>
                  {new Date(t.added_time * 1000).toLocaleString("sv-SE", {
                    timeZone: "Europe/Stockholm",
                  })}
                </td>
                <td>
                  {t.completed_time === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    new Date(t.completed_time * 1000).toLocaleString("sv-SE", {
                      timeZone: "Europe/Stockholm",
                    })
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {torrents.data && (
        <div className="bg-gray-800 text-white text-sm p-2">
          Showing{" "}
          {Math.min(
            (torrents.data.page + 1) * torrents.data.page_size,
            torrents.data.torrents.length
          )}{" "}
          of {torrents.data.torrents_total} torrent(s)
        </div>
      )}

      {search.selected_info_hash && (
        <TorrentDetails
          info_hash={search.selected_info_hash}
          session_id={search.selected_session_id}
        />
      )}
    </div>
  );
}

function TorrentStateBadge({ torrent }: { torrent: Torrent }) {
  if (
    torrent.state == TorrentState.seeding &&
    isBitSet(torrent.flags, 4) &&
    !isBitSet(torrent.flags, 5)
  ) {
    return (
      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 inset-ring inset-ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/30">
        Finished
      </span>
    );
  }

  if (
    torrent.state == TorrentState.downloading &&
    isBitSet(torrent.flags, 4) &&
    !isBitSet(torrent.flags, 5)
  ) {
    // torrent is paused forever
    return (
      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20">
        Paused
      </span>
    );
  }

  if (torrent.state === TorrentState.downloading) {
    return (
      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20">
        Downloading
      </span>
    );
  }

  //
  if (torrent.state === TorrentState.seeding) {
    if (isBitSet(torrent.flags, 4) && isBitSet(torrent.flags, 5)) {
      return (
        <span className="text-nowrap inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20">
          Seeding (queued)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 inset-ring inset-ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30">
        Seeding
      </span>
    );
  }
}

type TorrentDetailsProps = {
  info_hash: InfoHash;
  session_id?: number;
};

const tabs = [
  { name: "General", tab_id: "general" },
  { name: "Files", tab_id: "files" },
  { name: "Peers", tab_id: "peers" },
  { name: "Trackers", tab_id: "trackers" },
];

function TorrentDetails(props: TorrentDetailsProps) {
  const search = Route.useSearch();

  return (
    <div className="h-[400px] border-t border-t-gray-400 pt-1 bg-gray-800 flex flex-col">
      <div className="flex justify-between">
        <div>
          <div className="grid grid-cols-1 sm:hidden">
            {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
            <select
              defaultValue={
                tabs.find((tab) => tab.tab_id == search.selected_tab_id)?.name
              }
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-gray-100 dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500"
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 dark:fill-gray-400"
            />
          </div>
          <div className="hidden sm:block">
            <nav aria-label="Tabs" className="flex space-x-4">
              {tabs.map((tab) => (
                <Link
                  key={tab.tab_id}
                  to="/"
                  search={{
                    ...search,
                    selected_tab_id: tab.tab_id,
                  }}
                  activeProps={{
                    className:
                      "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
                  }}
                  className={clsx(
                    "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                    "rounded-md px-3 py-2 text-sm font-medium"
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <Link
          to="/"
          search={{
            ...search,
            selected_info_hash: undefined,
            selected_session_id: undefined,
            selected_tab_id: undefined,
          }}
        >
          Close
        </Link>
      </div>
      <div className="overflow-auto flex-1">
        {search.selected_tab_id === "files" && (
          <TorrentFileDetails {...props} />
        )}

        {search.selected_tab_id === "peers" && (
          <TorrentPeerDetails {...props} />
        )}

        {search.selected_tab_id === "trackers" && (
          <TorrentTrackerDetails {...props} />
        )}
      </div>
    </div>
  );
}

function TorrentPeerDetails(props: TorrentDetailsProps) {
  const peers = useRPC<TorrentsPeersList>(
    "torrents.peers.list",
    { ...props },
    {
      refetchInterval: 1000,
    }
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-900">
          <th className="text-left w-48 py-1 pr-2">Endpoint</th>
          <th className="text-left">Client</th>
        </tr>
      </thead>
      <tbody>
        {peers.data?.peers.map((p) => (
          <tr key={`${p.ip[0]}_${p.ip[1]}`}>
            <td>
              {p.ip[0]}:{p.ip[1]}
            </td>
            <td>{p.client}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TorrentFileDetails(props: TorrentDetailsProps) {
  const files = useRPC<TorrentsFilesList>(
    "torrents.files.list",
    { ...props },
    {
      refetchInterval: 1000,
    }
  );

  const progress = useRPC<TorrentsFilesProgress>(
    "torrents.files.progress",
    { ...props },
    {
      refetchInterval: 1000,
    }
  );

  const fileProgress = (idx: number) => {
    if (!progress.data?.progress.length) {
      return 0;
    }

    return progress.data.progress[idx];
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-900">
          <th className="text-left py-1 pl-2 w-1/2">Name</th>
          <th className="text-right w-32">Size</th>
          <th className="pl-2 w-48">Progress</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {files.data?.files.map((f, idx) => (
          <tr key={f.name}>
            <td className="py-2 pl-2">{f.name}</td>
            <td className="text-right py-2">{filesize(f.size)}</td>
            <td className="py-2 px-3 flex items-center justify-center">
              <progress
                value={fileProgress(idx)}
                max={f.size}
                className="w-full rounded-sm border border-blue-400"
              />
            </td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TorrentTrackerDetails(props: TorrentDetailsProps) {
  const trackers = useRPC<TorrentsTrackersList>(
    "torrents.trackers.list",
    { ...props },
    {
      refetchInterval: 1000,
    }
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-900">
          <th className="text-left py-1 pr-2">URL</th>
          <th className="text-left"></th>
        </tr>
      </thead>
      <tbody>
        {trackers.data?.trackers.map((t) => (
          <tr key={t.url}>
            <td>{t.url}</td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bars3Icon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { TorrentState } from "@/types";

type TorrentMenuProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function TorrentMenu(props: TorrentMenuProps) {
  const remove = useInvoker("torrents.remove");

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton className="cursor-pointer rounded-sm bg-indigo-600 p-1 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
        <Bars3Icon aria-hidden="true" className="size-3" />
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
      >
        <div className="py-1">
          <MenuItem>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
            >
              Account settings
            </a>
          </MenuItem>
          <MenuItem>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
            >
              Support
            </a>
          </MenuItem>
          <MenuItem>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
            >
              License
            </a>
          </MenuItem>
          <form action="#" method="POST">
            <MenuItem>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                onClick={async () => {
                  await remove.mutateAsync({
                    info_hashes: [props.info_hash],
                    session_id: props.session_id,
                    remove_data: true,
                  });
                }}
              >
                Remove
              </button>
            </MenuItem>
          </form>
        </div>
      </MenuItems>
    </Menu>
  );
}
