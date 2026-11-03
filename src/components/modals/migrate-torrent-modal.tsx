import { useRPC, useInvoker, type InfoHash } from "@/api";
import { ModalNotice } from "@/components/modal/modal-notice";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import z from "zod";

type MigrateTorrentModalProps = {
  info_hash: InfoHash;
  session_id?: number;
};

const migrateSchema = z.object({
  session_id: z.number({ error: "Choose a target session" }),
});

export function MigrateTorrentModal({
  info_hash,
  session_id,
  close,
}: MigrateTorrentModalProps & ModalProps<boolean>) {
  const migrate = useInvoker("torrents.migrate", {
    meta: { errorToast: false },
  });

  const sessions = useRPC("sessions.list");
  const torrent = useRPC("torrents.get", {
    info_hash,
    session_id,
  });

  const form = useAppForm({
    defaultValues: {
      session_id: null as number | null,
    },
    validators: {
      onChange: migrateSchema,
    },
    onSubmit: async ({ value }) => {
      await migrate.mutateAsync({
        info_hash,
        session_id,
        target_session_id: migrateSchema.parse(value).session_id,
      });

      close(true);
    },
  });

  if (!sessions.data || !torrent.data) {
    return (
      <ModalNotice
        title="Migrate torrent"
        loading={sessions.isLoading || torrent.isLoading}
      >
        {(sessions.error ?? torrent.error)?.message ?? "Torrent not found"}
      </ModalNotice>
    );
  }

  // No session_id means the default session (Sessions::Resolve). The backend
  // refuses the torrent's own session and sessions that aren't loaded.
  const sourceSessionId =
    session_id ?? sessions.data.sessions.find((s) => s.is_default)?.id;
  const targets = sessions.data.sessions.filter(
    (s) => s.state !== null && s.id !== sourceSessionId,
  );

  if (targets.length === 0) {
    return (
      <ModalNotice title="Migrate torrent">
        <p>There is no other loaded session to migrate to.</p>
      </ModalNotice>
    );
  }

  return (
    <form.AppForm>
      <form.ModalForm
        title="Migrate torrent"
        submitLabel="Migrate"
        error={migrate.error}
      >
        <p>{torrent.data.torrent.name}</p>
        <form.AppField
          name="session_id"
          children={(field) => (
            <field.SelectField
              label="Target session"
              items={targets.map((s) => ({ value: s.id, label: s.name }))}
              autoFocus
            />
          )}
        />
      </form.ModalForm>
    </form.AppForm>
  );
}
