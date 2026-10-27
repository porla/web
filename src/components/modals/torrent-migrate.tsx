import { useRPC, type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type MigrateTorrentModalProps = {
  info_hash: InfoHash;
  session_id?: number;
};

const migrateSchema = z.object({
  session_id: z.number({ error: "Choose a target session" }),
});

export default function MigrateTorrentModal({
  info_hash,
  session_id,
  close,
}: MigrateTorrentModalProps & ModalProps<boolean>) {
  const migrate = useInvoker("torrents.migrate", { meta: { silent: true } });
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

  if (sessions.isLoading || torrent.isLoading) {
    return <>Loading</>;
  }

  if (!sessions.data || !torrent.data) {
    return <>Not found</>;
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
      <div>
        <h3 className="font-bold text-lg">Migrate torrent</h3>
        <p>{torrent.data.torrent.name}</p>
        <p className="mt-3">There is no other loaded session to migrate to.</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Migrate torrent</h3>
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

        <form.SaveError error={migrate.error} />
        <form.ModalActions
          submitLabel="Migrate"
          onCancel={() => close(false)}
        />
      </form.Form>
    </form.AppForm>
  );
}
