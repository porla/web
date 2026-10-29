import { useInvoker, useRPC, type Preset, type TorrentFlag } from "@/api";
import { useModal } from "@/components/modal";
import ConfirmModal from "@/components/modals/confirm";
import { useAppForm } from "@/hooks/form";
import { peerLimit, rateLimit } from "@/limits";
import { presetFlags } from "@/torrent-flags";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/presets/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const preset = useRPC(
    "presets.get",
    { id: parseInt(id, 10) },
    { meta: { silent: true } },
  );

  if (preset.isLoading) {
    return <>loading</>;
  }

  if (preset.error) {
    return <>{preset.error.message}</>;
  }

  if (!preset.data?.preset) {
    return <>no preset data?</>;
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-sm w-full">
        <div className="card-body">
          <Suspense fallback={"Loading"}>
            <PresetForm preset={preset.data.preset} />
          </Suspense>
        </div>
      </div>
    </div>
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
      tags: z.string().transform((t) =>
        t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
      flags: z.object({
        flags: z.array(z.custom<TorrentFlag>()),
        mask: z.array(z.custom<TorrentFlag>()),
      }),
    })
    // Only flags in the mask mean anything.
    .transform(({ flags, ...v }) => ({
      ...v,
      flags: flags.flags.filter((f) => flags.mask.includes(f)),
      flags_mask: flags.mask,
    }));

function PresetForm({ preset }: PresetFormProps) {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const modal = useModal();

  const sessions = useRPC("sessions.list");
  const presets = useRPC("presets.list");

  const taken = (presets.data?.presets ?? [])
    .filter((p) => p.id !== preset.id)
    .map((p) => p.name);

  const remove = useInvoker("presets.remove", { meta: { silent: true } });

  const update = useInvoker("presets.update", {
    meta: { silent: true },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
        queryClient.invalidateQueries({ queryKey: ["presets.get"] }),
      ]),
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
                items={
                  sessions.data.sessions.map((s) => {
                    return {
                      value: s.id,
                      label: s.name,
                    };
                  }) ?? []
                }
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
              queryClient.removeQueries({
                queryKey: ["presets.get", { id: preset.id }],
              });

              await queryClient.invalidateQueries({
                queryKey: ["presets.list"],
              });
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
