import {
  type TorrentsGet,
  useRPC,
  type InfoHash,
  type SessionsList,
  useInvoker,
} from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type MigrateTorrentModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function MigrateTorrentModal({
  info_hash,
  session_id,
  close,
}: MigrateTorrentModalProps & ModalProps<boolean>) {
  const migrate = useInvoker("torrents.migrate");
  const sessions = useRPC<SessionsList>("sessions.list");
  const torrent = useRPC<TorrentsGet>("torrents.get", {
    info_hash,
    session_id,
  });

  const form = useAppForm({
    defaultValues: {
      session_id: null as Number | null,
    },
    onSubmit: async ({ value }) => {
      await migrate.mutateAsync({
        info_hash,
        session_id,
        target_session_id: value.session_id,
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
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
          />
        )}
      />

      <div className="modal-action">
        <button className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Migrate" />
        </form.AppForm>
      </div>
    </form>
  );
}
