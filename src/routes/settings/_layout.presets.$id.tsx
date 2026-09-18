import {
  AllTorrentFlags,
  useInvoker,
  useRPC,
  type Preset,
  type PresetsGet,
  type SessionsList,
  type TorrentFlag,
} from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/settings/_layout/presets/$id")({
  component: RouteComponent,
});

type FlagState = "on" | "off" | "unchanged";

const flagState = (
  f: TorrentFlag,
  flags: TorrentFlag[],
  mask: TorrentFlag[],
): FlagState =>
  !mask.includes(f) ? "unchanged" : flags.includes(f) ? "on" : "off";

const OPTIONS = ["on", "off", "unchanged"] as const;

function RouteComponent() {
  const { id } = Route.useParams();

  const preset = useRPC<PresetsGet>("presets.get", { id: parseInt(id, 10) });

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
    <div>
      <Suspense fallback={"Loading"}>
        <PresetForm preset={preset.data.preset} />
      </Suspense>
    </div>
  );
}

type PresetFormProps = {
  preset: Preset;
};

function PresetForm({ preset }: PresetFormProps) {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();

  const sessions = useRPC<SessionsList>("sessions.list");

  const remove = useInvoker("presets.remove", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
  });

  const update = useInvoker("presets.update", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      ...preset,
      flags: (preset.flags ?? []).filter((f) =>
        (preset.flags_mask ?? []).includes(f),
      ),
      flags_mask: preset.flags_mask ?? [],
      tags: preset.tags.join(", "),
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        ...value,
        flags: value.flags.filter((f) => value.flags_mask.includes(f)),
        id: preset.id,
        tags: value.tags
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
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

      <div className="flex">
        <form.AppField
          name="flags"
          children={(flagsField) => (
            <form.AppField
              name="flags_mask"
              children={(maskField) => {
                const flags = flagsField.state.value ?? [];
                const mask = maskField.state.value ?? [];

                const set = (f: TorrentFlag, next: FlagState) => {
                  const nextFlags = flags.filter((x) => x !== f);
                  const nextMask = mask.filter((x) => x !== f);

                  if (next === "on") {
                    nextFlags.push(f);
                    nextMask.push(f);
                  }

                  if (next === "off") {
                    nextMask.push(f);
                  }

                  flagsField.handleChange(nextFlags);
                  maskField.handleChange(nextMask);
                };

                return (
                  <div className="fieldset">
                    <label className="label">Flags</label>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Flag</th>
                          <th>Set</th>
                          <th>Unset</th>
                          <th>Leave</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AllTorrentFlags.map((f) => {
                          const current = flagState(f, flags, mask);

                          return (
                            <tr key={f}>
                              <td>{f}</td>
                              {OPTIONS.map((opt) => (
                                <td key={opt}>
                                  <input
                                    type="radio"
                                    className="radio"
                                    name={`flags-${f}`}
                                    value={opt}
                                    checked={current === opt}
                                    onChange={() => set(f, opt)}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }}
            />
          )}
        />
      </div>

      <form.AppForm>
        <form.SubmitButton label="Update" />
      </form.AppForm>

      <button
        type="button"
        disabled={preset.is_default}
        className="btn btn-warning ml-3"
        onClick={async () => {
          await remove.mutateAsync({ id: preset.id });
          await navigate({ to: "/settings" });
        }}
      >
        Remove
      </button>
    </form>
  );
}
