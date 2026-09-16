import {
  type InfoHash,
  type TorrentsGet,
  type TorrentsPropertiesGet,
  useInvoker,
  useRPC,
} from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";

type TorrentPropertiesModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function TorrentPropertiesModal({
  info_hash,
  session_id,
  close,
}: TorrentPropertiesModalProps & ModalProps<boolean>) {
  const properties = useRPC<TorrentsPropertiesGet>("torrents.properties.get", {
    info_hash,
    session_id,
  });

  const torrent = useRPC<TorrentsGet>("torrents.get", {
    info_hash,
    session_id,
  });

  const set = useInvoker("torrents.properties.set");

  const form = useAppForm({
    defaultValues: {
      category: torrent.data?.torrent.$userdata.category,
      download_limit: properties.data?.download_limit,
      max_connections: properties.data?.max_connections,
      max_uploads: properties.data?.max_uploads,
      tags: torrent.data?.torrent.$userdata.tags.join(", "),
      upload_limit: properties.data?.upload_limit,
    },
    onSubmit: async ({ value }) => {
      await set.mutateAsync({
        info_hash,
        session_id,
        ...value,
        category:
          value.category && value.category.length > 0 ? value.category : null,
        tags: value.tags
          ?.split(",")
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
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

      <div className="modal-action">
        <button type="button" className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Save" />
        </form.AppForm>
      </div>
    </form>
  );
}
