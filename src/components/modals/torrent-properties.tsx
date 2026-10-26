import { type InfoHash, useInvoker, useRPC } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";

type TorrentPropertiesModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

// The backend's rules (utils/limits.hpp). An empty field sends null, which
// leaves the value unchanged.
const rateLimit = z
  .number()
  .int("Enter a whole number")
  .min(-1, "Use -1 for unlimited")
  .nullable();

const peerLimit = z
  .number()
  .int("Enter a whole number")
  .refine((n) => n === -1 || n === 0 || n >= 2, "Use -1 for unlimited, or 2+")
  .nullable();

const propertiesSchema = z.object({
  category: z.string(),
  download_limit: rateLimit,
  max_connections: peerLimit,
  max_uploads: peerLimit,
  tags: z.string(),
  upload_limit: rateLimit,
});

export default function TorrentPropertiesModal({
  info_hash,
  session_id,
  close,
}: TorrentPropertiesModalProps & ModalProps<boolean>) {
  const properties = useRPC("torrents.properties.get", {
    info_hash,
    session_id,
  });

  const torrent = useRPC("torrents.get", {
    info_hash,
    session_id,
  });

  const set = useInvoker("torrents.properties.set", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      category: torrent.data?.torrent.$userdata.category ?? "",
      download_limit: properties.data?.download_limit ?? null,
      max_connections: properties.data?.max_connections ?? null,
      max_uploads: properties.data?.max_uploads ?? null,
      tags: torrent.data?.torrent.$userdata.tags.join(", ") ?? "",
      upload_limit: properties.data?.upload_limit ?? null,
    },
    validators: {
      onChange: propertiesSchema,
    },
    onSubmit: async ({ value }) => {
      const { category, tags, ...limits } = propertiesSchema.parse(value);

      await set.mutateAsync({
        info_hash,
        session_id,
        ...limits,
        category: category.length > 0 ? category : null,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      close(true);
    },
  });

  if (properties.isLoading || torrent.isLoading) {
    return <>loading</>;
  }

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Properties</h3>

        <form.AppField
          name="download_limit"
          children={(field) => <field.NumberField label="Download limit" />}
        />

        <form.AppField
          name="upload_limit"
          children={(field) => <field.NumberField label="Upload limit" />}
        />

        <form.AppField
          name="max_connections"
          children={(field) => <field.NumberField label="Max connections" />}
        />

        <form.AppField
          name="max_uploads"
          children={(field) => <field.NumberField label="Max uploads" />}
        />

        <form.AppField
          name="category"
          children={(field) => <field.TextField label="Category" />}
        />

        <form.AppField
          name="tags"
          children={(field) => (
            <field.TextField
              label="Tags"
              description="A comma (,) separated list of tags"
            />
          )}
        />

        <form.SaveError error={set.error} />
        <form.ModalActions submitLabel="Save" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
