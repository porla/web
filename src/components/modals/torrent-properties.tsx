import {
  type InfoHash,
  type Params,
  type Torrent,
  type TorrentFlag,
  type TorrentsPropertiesGet,
  useInvoker,
  useRPC,
} from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import { peerLimit, rateLimit } from "@/limits";
import { runtimeFlags } from "@/torrent-flags";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";
import Accordion from "@/components/accordion";

type TorrentPropertiesModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

const propertiesSchema = z.object({
  category: z.string().trim(),
  download_limit: rateLimit,
  flags: z.object({
    flags: z.array(z.custom<TorrentFlag>()),
    mask: z.array(z.custom<TorrentFlag>()),
  }),
  max_connections: peerLimit,
  max_uploads: peerLimit,
  tags: z.string(),
  upload_limit: rateLimit,
});

const LIMITS = [
  "download_limit",
  "upload_limit",
  "max_connections",
  "max_uploads",
] as const;

const splitTags = (tags: string) =>
  tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function TorrentPropertiesModal({
  info_hash,
  session_id,
  close,
}: TorrentPropertiesModalProps & ModalProps<boolean>) {
  const properties = useRPC(
    "torrents.properties.get",
    { info_hash, session_id },
    { meta: { silent: true } },
  );

  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { meta: { silent: true } },
  );

  if (!properties.isFetchedAfterMount || !torrent.isFetchedAfterMount) {
    return <span className="loading loading-spinner"></span>;
  }

  const error = properties.error ?? torrent.error;

  if (error || !properties.data || !torrent.data) {
    return (
      <>
        <h3 className="font-bold text-lg">Properties</h3>
        <p className="py-2">{error?.message ?? "Torrent not found"}</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => close(false)}>
            Close
          </button>
        </div>
      </>
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
}: TorrentPropertiesModalProps & {
  limits: TorrentsPropertiesGet;
  userdata: Torrent["$userdata"];
} & ModalProps<boolean>) {
  const queryClient = useQueryClient();

  const set = useInvoker("torrents.properties.set", {
    meta: { silent: true },
    onSuccess: () =>
      Promise.all(
        [
          "torrents.properties.get",
          "torrents.get",
          "torrents.list",
          "torrents.count",
        ].map((method) =>
          queryClient.invalidateQueries({ queryKey: [method] }),
        ),
      ),
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

      for (const key of LIMITS) {
        if (next[key] !== initial[key]) {
          changes[key] = next[key];
        }
      }

      if (next.category !== initial.category.trim()) {
        changes.category = next.category || null;
      }

      const tags = splitTags(next.tags);

      // porla keeps tags as a set, in no particular order.
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
      <form.Form>
        <h3 className="font-bold text-lg">Properties</h3>

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

        <form.SaveError error={set.error} />
        <form.ModalActions submitLabel="Save" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
