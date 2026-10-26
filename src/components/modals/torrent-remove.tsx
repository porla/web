import { useRPC, type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type RemoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

const removeSchema = z.object({
  remove_data: z.boolean(),
});

export default function RemoveTorrentModal({
  info_hash,
  session_id,
  close,
}: RemoveTorrentModalProps & ModalProps<boolean>) {
  const remove = useInvoker("torrents.remove", { meta: { silent: true } });

  const torrent = useRPC("torrents.get", {
    info_hash,
    session_id,
  });

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

  if (torrent.isLoading) {
    return <>Loading</>;
  }

  if (!torrent.data) {
    return <>Not found</>;
  }

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Remove torrent</h3>
        <p>{torrent.data.torrent.name}</p>

        <form.AppField
          name="remove_data"
          children={(field) => <field.CheckboxField label="Remove data" />}
        />

        <form.SaveError error={remove.error} />
        <form.ModalActions submitLabel="Remove" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
