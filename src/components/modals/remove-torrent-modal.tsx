import { useRPC, useInvoker, type InfoHash } from "@/api";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import z from "zod";
import { ModalNotice } from "@/components/modal/modal-notice";

type RemoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id?: number;
};

const removeSchema = z.object({
  remove_data: z.boolean(),
});

export function RemoveTorrentModal({
  info_hash,
  session_id,
  close,
}: RemoveTorrentModalProps & ModalProps<boolean>) {
  const remove = useInvoker("torrents.remove", { meta: { errorToast: false } });

  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { meta: { errorToast: false } },
  );

  const form = useAppForm({
    defaultValues: {
      remove_data: false,
    },
    validators: {
      onChange: removeSchema,
    },
    onSubmit: async ({ value }) => {
      await remove.mutateAsync({
        info_hash,
        session_id,
        remove_data: removeSchema.parse(value).remove_data,
      });

      close(true);
    },
  });

  if (!torrent.data) {
    return (
      <ModalNotice title="Remove torrent" loading={torrent.isLoading}>
        {torrent.error?.message ?? "Torrent not found"}
      </ModalNotice>
    );
  }

  return (
    <form.AppForm>
      <form.ModalForm
        title="Remove torrent"
        submitLabel="Remove"
        error={remove.error}
      >
        <p>{torrent.data.torrent.name}</p>

        <form.AppField
          name="remove_data"
          children={(field) => <field.CheckboxField label="Remove data" />}
        />
      </form.ModalForm>
    </form.AppForm>
  );
}
