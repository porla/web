import { useInvoker, useRPC, useRpcCache, type Preset } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useAppForm } from "@/components/form/app-form";
import { peerLimit, rateLimit } from "@/lib/limits";
import { flagsSchema, presetFlags } from "@/lib/torrent/flags";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { SettingsNotFound } from "@/components/settings/settings-not-found";
import { idParam } from "@/lib/route-params";
import { SettingsNotice } from "@/components/settings/settings-notice";
import { SettingsCard } from "@/components/settings/settings-card";
import { splitTags } from "@/lib/torrent/tags";

export const Route = createFileRoute("/_app/settings/presets/$id")({
  component: RouteComponent,
  notFoundComponent: SettingsNotFound,
  params: idParam,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const preset = useRPC("presets.get", { id }, { meta: { errorToast: false } });

  if (!preset.data) {
    return (
      <SettingsNotice
        query={preset}
        notFound="Preset not found"
        back={{ to: "/settings/presets", label: "Back to presets" }}
      />
    );
  }

  return (
    <SettingsCard>
      <PresetForm key={preset.data.preset.id} preset={preset.data.preset} />
    </SettingsCard>
  );
}

type PresetFormProps = {
  preset: Preset;
};

// An empty field is "not set" (null), so the default preset's value applies;
// an empty string would override it with "".
const orNull = (s: string) => s.trim() || null;

const presetSchema = (taken: string[]) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Enter a name")
        .refine((n) => !taken.includes(n), "Preset name taken"),
      is_default: z.boolean(),
      category: z.string().transform(orNull),
      save_path: z.string().transform(orNull),
      session_id: z.number().nullable(),
      download_limit: rateLimit,
      upload_limit: rateLimit,
      max_connections: peerLimit,
      max_uploads: peerLimit,
      tags: z.string().transform(splitTags),
      flags: flagsSchema,
    })
    // Only flags in the mask mean anything.
    .transform(({ flags, ...v }) => ({
      ...v,
      flags: flags.flags.filter((f) => flags.mask.includes(f)),
      flags_mask: flags.mask,
    }));

function PresetForm({ preset }: PresetFormProps) {
  const cache = useRpcCache();
  const navigate = Route.useNavigate();
  const modal = useModal();

  const sessions = useRPC("sessions.list");
  const presets = useRPC("presets.list");

  const taken = (presets.data?.presets ?? [])
    .filter((p) => p.id !== preset.id)
    .map((p) => p.name);

  const remove = useInvoker("presets.remove", { meta: { errorToast: false } });

  const update = useInvoker("presets.update", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("presets.list", "presets.get"),
  });

  const form = useAppForm({
    defaultValues: {
      name: preset.name,
      is_default: preset.is_default,
      category: preset.category ?? "",
      save_path: preset.save_path ?? "",
      session_id: preset.session_id,
      download_limit: preset.download_limit,
      upload_limit: preset.upload_limit,
      max_connections: preset.max_connections,
      max_uploads: preset.max_uploads,
      tags: preset.tags.join(", "),
      flags: { flags: preset.flags ?? [], mask: preset.flags_mask ?? [] },
    },
    validators: {
      onChange: presetSchema(taken),
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        ...presetSchema(taken).parse(value),
        id: preset.id,
        metadata: preset.metadata,
        storage_mode: preset.storage_mode,
      });
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField
          name="name"
          children={(field) => <field.TextField label="Name" />}
        />

        <form.AppField
          name="is_default"
          children={(field) => <field.CheckboxField label="Is default" />}
        />

        <form.AppField
          name="category"
          children={(field) => <field.TextField label="Category" />}
        />

        <form.AppField
          name="download_limit"
          children={(field) => <field.NumberField label="Download limit" />}
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
          name="save_path"
          children={(field) => <field.TextField label="Save path" />}
        />

        {sessions.data && sessions.data.sessions.length > 1 && (
          <form.AppField
            name="session_id"
            children={(field) => (
              <field.SelectField
                label="Session"
                items={sessions.data.sessions.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            )}
          />
        )}

        <form.AppField
          name="tags"
          children={(field) => (
            <field.TextField
              label="Tags"
              description="A comma (,) separated list of tags"
            />
          )}
        />

        <form.AppField
          name="upload_limit"
          children={(field) => <field.NumberField label="Upload limit" />}
        />

        <form.AppField
          name="flags"
          children={(field) => (
            <field.TorrentFlagsField
              label="Flags"
              mode="preset"
              flags={presetFlags}
            />
          )}
        />

        <form.SaveError error={update.error} />
        <form.SubmitButton label="Update" />

        <button
          type="button"
          disabled={preset.is_default}
          title={
            preset.is_default ? "Cannot remove the default preset" : undefined
          }
          className="btn btn-warning ml-3"
          onClick={async () => {
            const removed = await modal.show(ConfirmModal, {
              title: "Remove preset",
              message: `Remove the preset "${preset.name}"?`,
              confirmLabel: "Remove",
              action: () => remove.mutateAsync({ id: preset.id }),
            });

            if (removed) {
              cache.remove("presets.get", { id: preset.id });
              await cache.invalidate("presets.list");
              await navigate({ to: "/settings/presets" });
            }
          }}
        >
          Remove
        </button>
      </form.Form>
    </form.AppForm>
  );
}
