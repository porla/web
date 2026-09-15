import { type TorrentsGet, useRPC, type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type RemoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function RemoveTorrentModal({
  info_hash,
  session_id,
  close,
}: RemoveTorrentModalProps & ModalProps<boolean>) {
  const remove = useInvoker("torrents.remove");

  const torrent = useRPC<TorrentsGet>("torrents.get", {
    info_hash,
    session_id,
  });

  const form = useAppForm({
    defaultValues: {
      remove_data: false,
    },
    onSubmit: async ({ value }) => {
      await remove.mutateAsync({
        info_hash,
        session_id,
        remove_data: value.remove_data,
      });

      close(true);
    },
  });

  if (torrent.isLoading) {
    return <>Loading</>;
  }

  if (!torrent.data) {
    return <>Not found</>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <h3 className="font-bold text-lg">Remove torrent</h3>
      <p>{torrent.data.torrent.name}</p>

      <form.AppField
        name="remove_data"
        children={(field) => <field.CheckboxField label="Remove data" />}
      />

      <div className="modal-action">
        <button className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Remove" />
        </form.AppForm>
      </div>
    </form>
  );
}
