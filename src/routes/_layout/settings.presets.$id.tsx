import { createFileRoute } from '@tanstack/react-router'
import { useInvoker, useRPC, type Preset, type SessionsList } from '@/jsonrpc';
import { useAppForm } from '@/hooks/form';
import { Suspense } from 'react';

export const Route = createFileRoute('/_layout/settings/presets/$id')({
  component: RouteComponent,
  params: {
    parse: (p) => { return { id: Number(p.id) } }
  }
})

function RouteComponent() {
  const { id } = Route.useParams();

  const preset = useRPC<Preset>("presets.get", { id });

  if (preset.isLoading) {
    return <>loading preset</>
  }

  if (!preset.data) {
    return <>preset not found</>
  }

  return <PresetForm key={id} preset={preset.data} />
}

type PresetFormProps = {
  preset: Preset;
}

function PresetForm(props: PresetFormProps) {
  const { preset } = props;

  const sessions = useRPC<SessionsList>("sessions.list");
  const update = useInvoker("presets.update");

  const form = useAppForm({
    defaultValues: preset,
    onSubmit: async ({ value }) => {
      await update.mutateAsync(value);
    }
  });

  if (!sessions.data) {
    return <>loading sessions</>
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-3 py-3 flex items-center justify-between">
          <h1 className="font-bold">{preset.name}</h1>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                className="relative inline-flex disabled:text-gray-300 disabled:cursor-not-allowed items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
                disabled={!canSubmit || isSubmitting}
              >
                Save
              </button>
            )}
          />
        </div>
        <div className="px-4 py-3 space-y-5">
          <Suspense fallback={<p>Loading form</p>}>
            <form.AppField
              name="name"
              children={(field) => <field.TextField label="Name" />}
            />

            <form.AppField
              name="is_default"
              children={(field) => <field.CheckboxField label="Is default" />}
            />

            <form.AppField
              name="metadata.color"
              children={(field) => <field.ColorField label="Color" />}
            />

            <form.AppField
              name="session_id"
              children={
                (field) => <field.SelectField
                  label="Session"
                  description="The session to use for this preset."
                  items={sessions.data?.sessions.map(s => { return { id: s.id, name: s.name } })}
                />
              }
            />

            <form.AppField
              name="save_path"
              children={(field) => <field.TextField label="Save path" />}
            />

            <form.AppField
              name="category"
              children={(field) => <field.TextField label="Category" />}
            />

            <form.AppField
              name="download_limit"
              children={(field) => <field.NumberField label="Download rate limit" />}
            />

            <form.AppField
              name="upload_limit"
              children={(field) => <field.NumberField label="Upload rate limit" />}
            />

            <form.AppField
              name="max_connections"
              children={(field) => <field.NumberField label="Max connections" />}
            />

            <form.AppField
              name="max_uploads"
              children={(field) => <field.NumberField label="Max uploads" />}
            />

            {/*

  metadata: unknown | null;
  storage_mode: "allocate" | "sparse" | null;
  tags: string[];
   */}
          </Suspense>
        </div>
      </div>
    </form>
  );
}
