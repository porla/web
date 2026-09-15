import { type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type PrioritizeTorrentFileModalProps = {
  info_hash: InfoHash;
  session_id: number;
  file_index: number;
  file_priority: number;
};

export default function PrioritizeTorrentFileModal({
  info_hash,
  session_id,
  file_index,
  file_priority,
  close,
}: PrioritizeTorrentFileModalProps & ModalProps<boolean>) {
  const prioritize = useInvoker("torrents.files.prioritize");

  const form = useAppForm({
    defaultValues: {
      file_priority,
    },
    onSubmit: async ({ value }) => {
      await prioritize.mutateAsync({
        info_hash,
        session_id,
        priorities: [{ index: file_index, priority: value.file_priority }],
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
      <h3 className="font-bold text-lg">Prioritize torrent file</h3>

      <p>
        Priority is a number between 0 and 7 (inclusive). 0 means do not
        download, 7 is max priority.
      </p>

      <form.AppField
        name="file_priority"
        children={(field) => <field.NumberField label="Priority (0-7)" />}
      />

      <div className="modal-action">
        <button className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Set priority" />
        </form.AppForm>
      </div>
    </form>
  );
}
