import { type PresetsList, type SessionsList, useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { readFile } from "@/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/add")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const add = useInvoker("torrents.add");
  const presets = useRPC<PresetsList>("presets.list");
  const sessions = useRPC<SessionsList>("sessions.list");

  const form = useAppForm({
    defaultValues: {
      file: null as File | null,
      download_limit: null as number | null,
      upload_limit: null as number | null,
      http_seeds: null as string[] | null,
      max_connections: null as number | null,
      max_uploads: null as number | null,
      save_path: "",
      trackers: null as string[] | null,
      url_seeds: null as string[] | null,
      preset_id: null as number | null,
      session_id: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.file) {
        return;
      }

      await add.mutateAsync({
        ti: await readFile(value.file),
        download_limit: value.download_limit,
        upload_limit: value.upload_limit,
        http_seeds: value.http_seeds,
        max_connections: value.max_connections,
        max_uploads: value.max_uploads,
        save_path: value.save_path,
        trackers: value.trackers,
        url_seeds: value.url_seeds,
        preset_id: value.preset_id,
        session_id: value.session_id,
      });

      await navigate({ to: "/" });
    },
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField
          name="file"
          children={(field) => <field.FileInputField label="Torrent file" />}
        />

        <form.AppField
          name="preset_id"
          children={(field) => (
            <field.SelectField
              label="Preset"
              items={
                presets.data?.presets.map((p) => {
                  return {
                    value: p.id,
                    label: p.name,
                  };
                }) ?? []
              }
            />
          )}
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
          name="save_path"
          children={(field) => <field.TextField label="Save path" />}
        />

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

        <form.AppForm>
          <form.SubmitButton label="Add torrent" />
        </form.AppForm>
      </form>
    </div>
  );
}
