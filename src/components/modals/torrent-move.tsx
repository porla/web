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
  const torrent = useRPC(
    "torrents.get",
    {
      info_hash,
      session_id,
    },
    { meta: { silent: true } },
  );

  if (torrent.isLoading) {
    return <span className="loading loading-spinner"></span>;
  }

  // Removed or migrated while the menu was open: there's nothing to move.
  if (!torrent.data) {
    return (
      <>
        <h3 className="font-bold text-lg">Move torrent</h3>
        <p className="py-2">{torrent.error?.message ?? "Torrent not found"}</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <MoveForm
      info_hash={info_hash}
      session_id={session_id}
      save_path={torrent.data.torrent.save_path}
      close={close}
    />
  );
}

function MoveForm({
  info_hash,
  session_id,
  save_path,
  close,
}: MoveTorrentModalProps & { save_path: string } & ModalProps<boolean>) {
  const move = useInvoker("torrents.move", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      path: save_path,
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

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Move torrent</h3>

        <form.AppField
          name="path"
          children={(field) => <field.TextField label="Path" autoFocus />}
        />

        <form.SaveError error={move.error} />
        <form.ModalActions submitLabel="Move" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
