import Button from "@/components/button";
import AddTorrentModal from "@/components/modals/add-torrent";
import {
  type TorrentsPeersList,
  useRPC,
  type InfoHash,
  type TorrentsList,
  useInvoker,
  type TorrentsTrackersList,
  type TorrentsFilesList,
  type TorrentsFilesProgress,
} from "@/jsonrpc";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { filesize } from "filesize";
import clsx from "clsx";

type TorrentSearch = {
  session_id?: number;
  state?: "downloading" | "finished" | "seeding" | "paused" | "error";
  selected_info_hash?: InfoHash;
  selected_session_id?: number;
  selected_tab_id?: string;
};

const isValidState = (value: unknown): value is TorrentSearch['state'] => {
  return typeof value === 'string' &&
    ['downloading', 'finished', 'seeding', 'paused', 'error'].includes(value);
};

export const Route = createFileRoute("/_layout/")({
  component: Index,
  validateSearch: (search: Record<string, unknown>): TorrentSearch => {
    return {
      session_id: search.session_id ? Number(search.session_id) : undefined,
      state: isValidState(search.state) ? search.state : undefined,
    };
  },
});

function buildFilter(state: TorrentSearch['state']) {
  if (state == "downloading") {
    return { state: "downloading" }
  }

  if (state === "error") {
    return { errc: true }
  }

  if (state === "finished") {
    return { state: "finished" }
  }

  if (state === "paused") {
    return { flags: 16 }
  }

  if (state === "seeding") {
    return { state: "seeding" }
  }
}

function Index() {
  const search = Route.useSearch();
  const [addOpen, setAddOpen] = useState(false);

  const torrents = useRPC<TorrentsList>("torrents.list", {
    filters: {
      session_id: search.session_id,
      ...buildFilter(search.state)
    }
  }, {
    refetchInterval: 1000,
  });

  return (
    <div className="h-full flex flex-col">
      <AddTorrentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="flex items-center justify-between p-2 text-sm bg-gray-800">
        <h1>Torrents</h1>
        <Button text="Add torrent" onClick={() => setAddOpen(true)} />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-500">
              <th className="w-min border-b-gray-700 border-b">
                <input type="checkbox" />
              </th>
              <th className="w-min border-b-gray-700 border-b">
                #
              </th>
              <th className="py-2 pl-2 border-b-gray-700 border-b text-left">
                Name
              </th>
              <th className="py-2 border-b-gray-700 border-b text-right  w-28">
                Size
              </th>
              <th className="py-2 border-b-gray-700 border-b text-center w-32">
                Progress
              </th>
              <th className="text-left border-b-gray-700 border-b">State</th>
              <th className="text-right border-b-gray-700 border-b w-28">DL</th>
              <th className="text-right border-b-gray-700 border-b w-28">UL</th>
              <th className="border-b-gray-700 border-b w-min"></th>
            </tr>
          </thead>
          <tbody>
            {torrents.data?.torrents.map((t) => (
              <tr key={t.info_hash[0]} className="hover:bg-gray-700">
                <td className="text-center">
                  <input type="checkbox" />
                </td>
                <td className="text-center text-gray-500">
                  {t.queue_position < 0 ? "-" : t.queue_position}
                </td>
                <td className="pl-2 py-1 font-medium">
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
                <td className="text-right">{filesize(t.total)}</td>
                <td className="py-2 px-3 flex items-center justify-center">
                  <progress
                    className="w-full rounded-sm border border-blue-400"
                    value={t.progress}
                    max={1}
                  />
                </td>
                <td>{t.state}</td>
                <td className="text-right">{filesize(t.download_payload_rate)}/s</td>
                <td className="text-right">{filesize(t.upload_payload_rate)}/s</td>
                <td className="flex justify-center items-center">
                  {search.session_id && (
                    <TorrentMenu
                      info_hash={t.info_hash}
                      session_id={search.session_id}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {torrents.data && (
        <div className="bg-gray-800 text-white text-sm p-2">
          Showing {Math.min((torrents.data.page + 1) * torrents.data.page_size, torrents.data.torrents.length)} of {torrents.data.torrents_total} torrent(s)
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
