import { type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type RenameTorrentFileModalProps = {
  info_hash: InfoHash;
  session_id: number;
  file_index: number;
  file_path: string;
};

const renameSchema = z.object({
  file_path: z.string().trim().min(1, "Enter a file name"),
});

export default function RenameTorrentFileModal({
  info_hash,
  session_id,
  file_index,
  file_path,
  close,
}: RenameTorrentFileModalProps & ModalProps<boolean>) {
  const rename = useInvoker("torrents.files.rename", {
    meta: { silent: true },
  });

  const form = useAppForm({
    defaultValues: {
      file_path,
    },
    validators: {
      onChange: renameSchema,
    },
    onSubmit: async ({ value }) => {
      await rename.mutateAsync({
        info_hash,
        session_id,
        file_index,
        file_path: renameSchema.parse(value).file_path,
      });

      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Rename torrent file</h3>

        <form.AppField
          name="file_path"
          children={(field) => <field.TextField label="File name" />}
        />

        <form.SaveError error={rename.error} />
        <form.ModalActions submitLabel="Rename" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
