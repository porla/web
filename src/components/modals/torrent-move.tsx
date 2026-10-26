import { type InfoHash, useInvoker, useRPC } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type MoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

// Save paths must be absolute
const moveSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, { error: "Enter a path", abort: true })
    .regex(/^(\/|[A-Za-z]:[\\/])/, "Use an absolute path, like /downloads"),
});

export default function MoveTorrentModal({
  info_hash,
  session_id,
  close,
}: MoveTorrentModalProps & ModalProps<boolean>) {
  const move = useInvoker("torrents.move", { meta: { silent: true } });

  const torrent = useRPC("torrents.get", {
    info_hash,
    session_id,
  });

  const form = useAppForm({
    defaultValues: {
      path: torrent.data?.torrent.save_path ?? "",
    },
    validators: {
      onChange: moveSchema,
    },
    onSubmit: async ({ value }) => {
      await move.mutateAsync({
        info_hash,
        session_id,
        path: moveSchema.parse(value).path,
      });

      close(true);
    },
  });

  if (torrent.isLoading) {
    return <>loading</>;
  }

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Move torrent</h3>

        <form.AppField
          name="path"
          children={(field) => <field.TextField label="Path" />}
        />

        <form.SaveError error={move.error} />
        <form.ModalActions submitLabel="Move" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
