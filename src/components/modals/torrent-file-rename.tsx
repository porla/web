import { type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type RenameTorrentFileModalProps = {
  info_hash: InfoHash;
  session_id: number;
  file_index: number;
  file_path: string;
};

export default function RenameTorrentFileModal({
  info_hash,
  session_id,
  file_index,
  file_path,
  close,
}: RenameTorrentFileModalProps & ModalProps<boolean>) {
  const rename = useInvoker("torrents.files.rename");

  const form = useAppForm({
    defaultValues: {
      file_path,
    },
    onSubmit: async ({ value }) => {
      await rename.mutateAsync({
        info_hash,
        session_id,
        file_index,
        file_path: value.file_path,
      });

      close(true);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <h3 className="font-bold text-lg">Rename torrent file</h3>

      <form.AppField
        name="file_path"
        children={(field) => <field.TextField label="File name" />}
      />

      <div className="modal-action">
        <button className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Rename" />
        </form.AppForm>
      </div>
    </form>
  );
}
