import { useInvoker, type InfoHash } from "@/api";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import z from "zod";

type PrioritizeTorrentFileModalProps = {
  info_hash: InfoHash;
  session_id: number;
  file_index: number;
  file_priority: number;
};

// libtorrent's download priorities. The backend reads the priority as a byte,
// so -1 would wrap to 255 (clamped to 7) and 256 to 0 (don't download).
const prioritySchema = z.object({
  file_priority: z
    .number({ error: "Enter a priority from 0 to 7" })
    .int("Enter a priority from 0 to 7")
    .min(0, "Enter a priority from 0 to 7")
    .max(7, "Enter a priority from 0 to 7"),
});

export function PrioritizeTorrentFileModal({
  info_hash,
  session_id,
  file_index,
  file_priority,
  close,
}: PrioritizeTorrentFileModalProps & ModalProps<boolean>) {
  const prioritize = useInvoker("torrents.files.prioritize", {
    meta: { errorToast: false },
  });

  const form = useAppForm({
    defaultValues: {
      file_priority: file_priority as number | null,
    },
    validators: {
      onChange: prioritySchema,
    },
    onSubmit: async ({ value }) => {
      await prioritize.mutateAsync({
        info_hash,
        session_id,
        priorities: [
          {
            index: file_index,
            priority: prioritySchema.parse(value).file_priority,
          },
        ],
      });

      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm
        title="Prioritize torrent file"
        submitLabel="Set priority"
        error={prioritize.error}
      >
        <p>
          Priority is a number between 0 and 7 (inclusive). 0 means do not
          download, 7 is max priority.
        </p>

        <form.AppField
          name="file_priority"
          children={(field) => (
            <field.NumberField label="Priority (0-7)" autoFocus />
          )}
        />
      </form.ModalForm>
    </form.AppForm>
  );
}
