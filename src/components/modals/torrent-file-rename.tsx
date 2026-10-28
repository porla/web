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

const name = z
  .string()
  .trim()
  .min(1, { error: "Enter a file name", abort: true })
  .refine((n) => !/[\\/]/.test(n), "A name can't contain / or \\")
  .refine((n) => n !== "." && n !== "..", "Not a valid file name");

// The full path is passed to libtorrent as is: relative to the save path, or
// absolute to put the file somewhere else.
const path = z.string().trim().min(1, "Enter a path");

// Only the field in use is checked.
const renameSchema = z.discriminatedUnion("full", [
  z.object({ full: z.literal(false), name, path: z.string() }),
  z.object({ full: z.literal(true), name: z.string(), path }),
]);

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

  const cut =
    Math.max(file_path.lastIndexOf("/"), file_path.lastIndexOf("\\")) + 1;
  const folder = file_path.slice(0, cut);

  const form = useAppForm({
    defaultValues: {
      full: false as boolean,
      name: file_path.slice(cut),
      path: file_path,
    },
    validators: {
      onChange: renameSchema,
    },
    onSubmit: async ({ value }) => {
      const v = renameSchema.parse(value);

      await rename.mutateAsync({
        info_hash,
        session_id,
        file_index,
        file_path: v.full ? v.path : folder + v.name,
      });

      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Rename torrent file</h3>

        <form.Subscribe selector={(s) => s.values.full}>
          {(full) =>
            full ? (
              <form.AppField
                name="path"
                children={(field) => (
                  <field.TextField
                    label="Path"
                    description="Relative to the save path, or absolute to put the file elsewhere"
                    autoFocus
                  />
                )}
              />
            ) : (
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField
                    label="File name"
                    description={folder ? `In ${folder}` : undefined}
                    autoFocus
                  />
                )}
              />
            )
          }
        </form.Subscribe>

        <form.AppField
          name="full"
          listeners={{
            // Start the path from the name as typed so far.
            onChange: ({ value }) => {
              if (value) {
                form.setFieldValue(
                  "path",
                  folder + form.getFieldValue("name").trim(),
                );
              }
            },
          }}
          children={(field) => <field.CheckboxField label="Set full path" />}
        />

        <form.SaveError error={rename.error} />
        <form.ModalActions submitLabel="Rename" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
