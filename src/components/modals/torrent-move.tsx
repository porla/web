import { type InfoHash, type TorrentsGet, useInvoker, useRPC } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type MoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function MoveTorrentModal({
  info_hash,
  session_id,
  close,
}: MoveTorrentModalProps & ModalProps<boolean>) {
  const move = useInvoker("torrents.move");

  const torrent = useRPC<TorrentsGet>("torrents.get", {
    info_hash,
    session_id,
  });

  const form = useAppForm({
    defaultValues: {
      path: torrent.data?.torrent.save_path,
    },
    onSubmit: async ({ value }) => {
      await move.mutateAsync({
        info_hash,
        session_id,
        path: value.path,
      });

      close(true);
    },
  });

  if (torrent.isLoading) {
    return <>loading</>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <h3 className="font-bold text-lg">Move torrent</h3>

      <form.AppField
        name="path"
        children={(field) => <field.TextField label="Path" />}
      />

      <div className="modal-action">
        <button className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Move" />
        </form.AppForm>
      </div>
    </form>
  );
}
