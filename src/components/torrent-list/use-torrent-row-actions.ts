import { useInvoker, useRpcCache, type Torrent } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { MigrateTorrentModal } from "@/components/modals/migrate-torrent-modal";
import { MoveTorrentModal } from "@/components/modals/move-torrent-modal";
import { RemoveTorrentModal } from "@/components/modals/remove-torrent-modal";
import { SetTorrentPropertiesModal } from "@/components/modals/set-torrent-properties-modal";
import { usePlugins } from "@/plugins/plugin-context";

export function useTorrentRowActions(
  sessionId: number | undefined,
  onLeft: (t: Torrent) => Promise<void>,
) {
  const cache = useRpcCache();
  const modal = useModal();
  const { menuItems } = usePlugins();

  const refresh = { onSuccess: cache.invalidateTorrents };

  const pause = useInvoker("torrents.pause", refresh);
  const resume = useInvoker("torrents.resume", refresh);
  const recheck = useInvoker("torrents.recheck", refresh);
  const queueTop = useInvoker("torrents.queue.top", refresh);
  const queueUp = useInvoker("torrents.queue.up", refresh);
  const queueDown = useInvoker("torrents.queue.down", refresh);
  const queueBottom = useInvoker("torrents.queue.bottom", refresh);

  const ref = (t: Torrent) => ({
    info_hash: t.info_hash,
    session_id: sessionId,
  });

  return {
    pause: (t: Torrent) => pause.mutate(ref(t)),
    resume: (t: Torrent) => resume.mutate(ref(t)),
    recheck: (t: Torrent) => recheck.mutate(ref(t)),
    queueTop: (t: Torrent) => queueTop.mutate(ref(t)),
    queueUp: (t: Torrent) => queueUp.mutate(ref(t)),
    queueDown: (t: Torrent) => queueDown.mutate(ref(t)),
    queueBottom: (t: Torrent) => queueBottom.mutate(ref(t)),
    migrate: async (t: Torrent) => {
      if (await modal.show(MigrateTorrentModal, ref(t))) await onLeft(t);
    },
    move: (t: Torrent) => modal.show(MoveTorrentModal, ref(t)),
    remove: async (t: Torrent) => {
      if (await modal.show(RemoveTorrentModal, ref(t))) await onLeft(t);
    },
    properties: (t: Torrent) => modal.show(SetTorrentPropertiesModal, ref(t)),
    plugins: menuItems.map((item) => ({
      id: item.id,
      label: item.label,
      run: (t: Torrent) => item.onClick({ torrents: [ref(t)] }),
    })),
  };
}

export type TorrentRowActions = ReturnType<typeof useTorrentRowActions>;
