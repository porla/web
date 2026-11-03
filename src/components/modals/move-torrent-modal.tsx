import { useInvoker, useRPC, type InfoHash } from "@/api";
import { ModalNotice } from "@/components/modal/modal-notice";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import { moveSchema } from "./move-schema";

type MoveTorrentModalProps = {
  info_hash: InfoHash;
  session_id?: number;
};

export function MoveTorrentModal({
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
    { meta: { errorToast: false } },
  );

  // Removed or migrated while the menu was open: there's nothing to move.
  if (!torrent.data) {
    return (
      <ModalNotice title="Move torrent" loading={torrent.isLoading}>
        {torrent.error?.message ?? "Torrent not found"}
      </ModalNotice>
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
  const move = useInvoker("torrents.move", { meta: { errorToast: false } });

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
      <form.ModalForm
        title="Move torrent"
        submitLabel="Move"
        error={move.error}
      >
        <form.AppField
          name="path"
          children={(field) => <field.TextField label="Path" autoFocus />}
        />
      </form.ModalForm>
    </form.AppForm>
  );
}
