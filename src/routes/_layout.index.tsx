import Button from '@/components/button';
import AddTorrentModal from '@/components/modals/add-torrent';
import { useRPC } from '@/jsonrpc';
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';

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

type TorrentsList = {

};

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
      <h3>Welcome Home!</h3>
    </div>
  )
}