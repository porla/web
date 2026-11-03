import {
  useInvoker,
  useRPC,
  type InfoHash,
  type Params,
  type Torrent,
  type TorrentFlag,
  type TorrentsPropertiesGet,
} from "@/api";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import { LIMIT_KEYS, peerLimit, rateLimit } from "@/lib/limits";
import { flagsSchema, runtimeFlags } from "@/lib/torrent/flags";
import z from "zod";
import { Accordion } from "@/components/ui/accordion";
import { ModalNotice } from "@/components/modal/modal-notice";
import { splitTags } from "@/lib/torrent/tags";

type SetTorrentPropertiesModalProps = {
  info_hash: InfoHash;
  session_id?: number;
};

const propertiesSchema = z.object({
  category: z.string().trim(),
  download_limit: rateLimit,
  flags: flagsSchema,
  max_connections: peerLimit,
  max_uploads: peerLimit,
  tags: z.string(),
  upload_limit: rateLimit,
});

export function SetTorrentPropertiesModal({
  info_hash,
  session_id,
  close,
}: SetTorrentPropertiesModalProps & ModalProps<boolean>) {
  const properties = useRPC(
    "torrents.properties.get",
    { info_hash, session_id },
    { meta: { errorToast: false } },
  );

  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { meta: { errorToast: false } },
  );

  const loading =
    !properties.isFetchedAfterMount || !torrent.isFetchedAfterMount;

  const error = properties.error ?? torrent.error;

  if (loading || error || !properties.data || !torrent.data) {
    return (
      <ModalNotice title="Properties" loading={loading}>
        {error?.message ?? "Torrent not found"}
      </ModalNotice>
    );
  }

  return (
    <PropertiesForm
      info_hash={info_hash}
      session_id={session_id}
      limits={properties.data}
      userdata={torrent.data.torrent.$userdata}
      close={close}
    />
  );
}

function PropertiesForm({
  info_hash,
  session_id,
  limits,
  userdata,
  close,
}: SetTorrentPropertiesModalProps & {
  limits: TorrentsPropertiesGet;
  userdata: Torrent["$userdata"];
} & ModalProps<boolean>) {
  const set = useInvoker("torrents.properties.set", {
    meta: { errorToast: false },
  });

  const initial = {
    category: userdata?.category ?? "",
    download_limit: limits.download_limit,
    flags: { flags: limits.flags, mask: [] as TorrentFlag[] },
    max_connections: limits.max_connections,
    max_uploads: limits.max_uploads,
    tags: userdata?.tags.join(", ") ?? "",
    upload_limit: limits.upload_limit,
  };

  const form = useAppForm({
    defaultValues: initial,
    validators: {
      onChange: propertiesSchema,
    },
    onSubmit: async ({ value }) => {
      const next = propertiesSchema.parse(value);
      const changes: Partial<Params<"torrents.properties.set">> = {};

      for (const key of LIMIT_KEYS) {
        if (next[key] !== initial[key]) {
          changes[key] = next[key];
        }
      }

      if (next.category !== initial.category.trim()) {
        changes.category = next.category || null;
      }

      const tags = splitTags(next.tags);

      // Porla keeps tags as a set, in no particular order.
      if (
        tags.toSorted().join() !== splitTags(initial.tags).toSorted().join()
      ) {
        changes.tags = tags;
      }

      // The mask holds only the flags that were toggled.
      if (next.flags.mask.length > 0) {
        changes.flags = next.flags.flags.filter((f) =>
          next.flags.mask.includes(f),
        );
        changes.flags_mask = next.flags.mask;
      }

      if (Object.keys(changes).length > 0) {
        await set.mutateAsync({ info_hash, session_id, ...changes });
      }

      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm title="Properties" submitLabel="Save" error={set.error}>
        <form.AppField
          name="download_limit"
          children={(field) => (
            <field.NumberField
              label="Download limit (bytes/s)"
              placeholder="Unlimited"
              autoFocus
            />
          )}
        />

        <form.AppField
          name="upload_limit"
          children={(field) => (
            <field.NumberField
              label="Upload limit (bytes/s)"
              placeholder="Unlimited"
            />
          )}
        />

        <form.AppField
          name="max_connections"
          children={(field) => (
            <field.NumberField
              label="Max connections"
              placeholder="Unlimited"
            />
          )}
        />

        <form.AppField
          name="max_uploads"
          children={(field) => (
            <field.NumberField label="Max uploads" placeholder="Unlimited" />
          )}
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

        <Accordion title="Flags" className="mt-4 bg-base-200">
          <form.AppField
            name="flags"
            children={(field) => (
              <field.TorrentFlagsField mode="torrent" flags={runtimeFlags} />
            )}
          />
        </Accordion>
      </form.ModalForm>
    </form.AppForm>
  );
}
