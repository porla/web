import Button from '@/components/button';
import AddTorrentModal from '@/components/modals/add-torrent';
import { useRPC, type TorrentsList } from '@/jsonrpc';
import { createFileRoute } from '@tanstack/react-router'
import { Fragment, useState } from 'react';

type TorrentSearch = {
  state?: "downloading" | "finished" | "seeding" | "paused" | "error"
};

export const Route = createFileRoute('/_layout/')({
  component: Index,
  validateSearch: (search: Record<string, unknown>): TorrentSearch => {
    return {
      state: search.state === "downloading"
        ? "downloading"
        : undefined
    }
  }
})

function Index() {
  const [addOpen, setAddOpen] = useState(false);

  const torrents = useRPC<TorrentsList>("torrents.list", null, {
    refreshInterval: 1000
  });

  return (
    <div>
      <AddTorrentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <div className="flex items-center justify-between p-3 bg-gray-800">
        <h1>torrents</h1>

        <Button
          text="Add torrent"
          onClick={() => setAddOpen(true)}
        />
      </div>

      <div className="m-2">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-right">Size</th>
              <th className="w-24">Progress</th>
              <th>State</th>
              <th>DL</th>
              <th>UL</th>
              <th className="w-min"></th>
            </tr>
          </thead>
          <tbody>
            {torrents.data?.torrents.map(t => (
              <tr key={t.info_hash[0]}>
                <td>{t.name}</td>
                <td className="text-right">{t.size}</td>
                <td>
                  <progress
                    className="w-full"
                    value={t.progress}
                    max={1} />
                </td>
                <td>{t.state}</td>
                <td>{t.download_rate}</td>
                <td>{t.upload_rate}</td>
                <td><TorrentMenu /></td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  )
}

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/20/solid'

export default function TorrentMenu() {
  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton className="flex items-center rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:outline-indigo-500">
        <span className="sr-only">Open options</span>
        <Bars3Icon aria-hidden="true" className="size-5" />
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
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
              >
                Sign out
              </button>
            </MenuItem>
          </form>
        </div>
      </MenuItems>
    </Menu>
  )
}
