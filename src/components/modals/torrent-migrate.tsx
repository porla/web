import { useRPC, type InfoHash, useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type MigrateTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
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
              items={
                sessions.data.sessions
                  .filter((s) => s.id !== session_id)
                  .map((s) => {
                    return {
                      value: s.id,
                      label: s.name,
                    };
                  }) ?? []
              }
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
