import { useRPC, type Params, type Torrent, type TorrentFlag } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import z from "zod";
import { moveSchema } from "./move-schema";
import { rateLimit, peerLimit } from "@/limits";
import { runtimeFlags } from "@/torrent-flags";
import Accordion from "../accordion";

// The dialogs for an action on several checked torrents. They only ask; the
// list's bulk bar sends the requests and shows how it went.

const SHOWN = 5;

const plural = (n: number) => `${n} torrent${n === 1 ? "" : "s"}`;

function Names({ torrents }: { torrents: Torrent[] }) {
  return (
    <ul className="my-2 space-y-0.5 text-sm">
      {torrents.slice(0, SHOWN).map((t) => (
        <li key={t.info_hash.join()} className="truncate">
          {t.name || t.info_hash[0] || t.info_hash[1]}
        </li>
      ))}
      {torrents.length > SHOWN && (
        <li className="text-base-content/60">
          and {torrents.length - SHOWN} more
        </li>
      )}
    </ul>
  );
}

export function BulkRemoveModal({
  torrents,
  close,
}: { torrents: Torrent[] } & ModalProps<{ remove_data: boolean } | undefined>) {
  const form = useAppForm({
    defaultValues: { remove_data: false },
    onSubmit: ({ value }) => close(value),
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Remove {plural(torrents.length)}</h3>
        <Names torrents={torrents} />

        <form.AppField
          name="remove_data"
          children={(field) => <field.CheckboxField label="Remove data" />}
        />

        <form.ModalActions
          submitLabel={`Remove ${torrents.length}`}
          onCancel={() => close(undefined)}
        />
      </form.Form>
    </form.AppForm>
  );
}

export function BulkMoveModal({
  torrents,
  close,
}: { torrents: Torrent[] } & ModalProps<string | undefined>) {
  // Their shared save path, if they have one.
  const paths = new Set(torrents.map((t) => t.save_path));

  const form = useAppForm({
    defaultValues: { path: paths.size === 1 ? [...paths][0] : "" },
    validators: { onChange: moveSchema },
    onSubmit: ({ value }) => close(moveSchema.parse(value).path),
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Move {plural(torrents.length)}</h3>
        <Names torrents={torrents} />

        <form.AppField
          name="path"
          children={(field) => <field.TextField label="Path" autoFocus />}
        />

        <form.ModalActions
          submitLabel={`Move ${torrents.length}`}
          onCancel={() => close(undefined)}
        />
      </form.Form>
    </form.AppForm>
  );
}

const migrateSchema = z.object({
  session_id: z.number({ error: "Choose a target session" }),
});

export function BulkMigrateModal({
  torrents,
  session_id,
  close,
}: { torrents: Torrent[]; session_id: number } & ModalProps<
  number | undefined
>) {
  const sessions = useRPC("sessions.list");

  const form = useAppForm({
    defaultValues: { session_id: null as number | null },
    validators: { onChange: migrateSchema },
    onSubmit: ({ value }) => close(migrateSchema.parse(value).session_id),
  });

  if (!sessions.data) {
    return <span className="loading loading-spinner" />;
  }

  // porla refuses the torrents' own session and sessions that aren't loaded.
  const targets = sessions.data.sessions.filter(
    (s) => s.state !== null && s.id !== session_id,
  );

  if (targets.length === 0) {
    return (
      <div>
        <h3 className="font-bold text-lg">Migrate {plural(torrents.length)}</h3>
        <p className="mt-3">There is no other loaded session to migrate to.</p>
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={() => close(undefined)}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">Migrate {plural(torrents.length)}</h3>
        <Names torrents={torrents} />

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

        <form.ModalActions
          submitLabel={`Migrate ${torrents.length}`}
          onCancel={() => close(undefined)}
        />
      </form.Form>
    </form.AppForm>
  );
}

// What to change on every torrent: only the fields that were edited, and
// tags to add and remove (the rest of each torrent's tags stay).
export type BulkProperties = {
  common: Partial<
    Pick<
      Params<"torrents.properties.set">,
      | "download_limit"
      | "upload_limit"
      | "max_connections"
      | "max_uploads"
      | "category"
      | "flags"
      | "flags_mask"
    >
  >;
  addTags: string[];
  removeTags: string[];
};

const splitTags = (tags: string) =>
  tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const LIMITS = [
  ["download_limit", "Download limit (bytes/s)"],
  ["upload_limit", "Upload limit (bytes/s)"],
  ["max_connections", "Max connections"],
  ["max_uploads", "Max uploads"],
] as const;

const bulkPropertiesSchema = z
  .object({
    download_limit: rateLimit,
    upload_limit: rateLimit,
    max_connections: peerLimit,
    max_uploads: peerLimit,
    category: z.string().trim(),
    addTags: z.string(),
    removeTags: z.string(),
    flags: z.object({
      flags: z.array(z.custom<TorrentFlag>()),
      mask: z.array(z.custom<TorrentFlag>()),
    }),
  })
  // A tag both added and removed is a mistake either way: say so.
  .superRefine((v, ctx) => {
    const added = new Set(splitTags(v.addTags));
    const both = splitTags(v.removeTags).filter((t) => added.has(t));
    if (both.length) {
      ctx.addIssue({
        code: "custom",
        path: ["removeTags"],
        message: `Also in Add tags: ${both.join(", ")}`,
      });
    }
  });

export function BulkPropertiesModal({
  torrents,
  close,
}: { torrents: Torrent[] } & ModalProps<BulkProperties | undefined>) {
  // Their shared category, if they have one.
  const categories = new Set(torrents.map((t) => t.$userdata?.category ?? ""));
  const category = categories.size === 1 ? [...categories][0] : "";

  const form = useAppForm({
    defaultValues: {
      download_limit: null as number | null,
      upload_limit: null as number | null,
      max_connections: null as number | null,
      max_uploads: null as number | null,
      category,
      addTags: "",
      removeTags: "",
      flags: { flags: [] as TorrentFlag[], mask: [] as TorrentFlag[] },
    },
    validators: { onChange: bulkPropertiesSchema },
    onSubmit: ({ value, formApi }) => {
      const v = bulkPropertiesSchema.parse(value);
      // An untouched field keeps each torrent's own value; a limit emptied
      // after editing is unlimited (null), an emptied category clears it.
      const edited = (name: keyof typeof value) =>
        !!formApi.getFieldMeta(name)?.isDirty;
      const common: BulkProperties["common"] = {};

      for (const [key] of LIMITS) {
        if (edited(key)) common[key] = v[key];
      }

      if (edited("category")) common.category = v.category || null;

      if (v.flags.mask.length > 0) {
        common.flags = v.flags.flags.filter((f) => v.flags.mask.includes(f));
        common.flags_mask = v.flags.mask;
      }

      const changes = {
        common,
        addTags: splitTags(v.addTags),
        removeTags: splitTags(v.removeTags),
      };
      const nothing =
        Object.keys(common).length === 0 &&
        changes.addTags.length === 0 &&
        changes.removeTags.length === 0;

      close(nothing ? undefined : changes);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <h3 className="font-bold text-lg">
          Properties of {plural(torrents.length)}
        </h3>
        <Names torrents={torrents} />
        <p className="text-sm text-base-content/70">
          Only what you change is applied; the rest stays as each torrent has
          it.
        </p>

        {LIMITS.map(([name, label]) => (
          <form.AppField
            key={name}
            name={name}
            children={(field) => (
              <field.NumberField
                label={label}
                placeholder={
                  field.state.meta.isDirty ? "Unlimited" : "Keep current"
                }
              />
            )}
          />
        ))}

        <form.AppField
          name="category"
          children={(field) => (
            <field.TextField
              label="Category"
              placeholder={
                field.state.meta.isDirty
                  ? "No category"
                  : categories.size > 1
                    ? "Mixed — keep current"
                    : "Keep current"
              }
            />
          )}
        />

        <form.AppField
          name="addTags"
          children={(field) => (
            <field.TextField
              label="Add tags"
              description="A comma (,) separated list of tags"
            />
          )}
        />

        <form.AppField
          name="removeTags"
          children={(field) => <field.TextField label="Remove tags" />}
        />

        <Accordion title="Flags" className="mt-4 bg-base-200">
          <form.AppField
            name="flags"
            children={(field) => (
              <field.TorrentFlagsField
                mode="preset"
                flags={runtimeFlags}
                unsetLabel="Keep"
              />
            )}
          />
        </Accordion>

        <form.ModalActions
          submitLabel={`Apply to ${torrents.length}`}
          onCancel={() => close(undefined)}
        />
      </form.Form>
    </form.AppForm>
  );
}
