import { createFileRoute } from '@tanstack/react-router'
import { useInvoker, useRPC, type Preset, type SessionsList } from '../../jsonrpc';
import { useForm } from '@tanstack/react-form';
import { useSWRConfig } from 'swr';

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

  return <PresetForm preset={preset.data} />
}

type PresetFormProps = {
  preset: Preset;
}

function PresetForm(props: PresetFormProps) {
  const { preset } = props;

  const sessions = useRPC<SessionsList>("sessions.list");
  const update = useInvoker("presets.update");
  const { mutate } = useSWRConfig();

  const form = useForm({
    defaultValues: preset,
    onSubmit: async ({ value }) => {
      await update(value);
      mutate(["presets.get", { id: preset.id }]);
      mutate("presets.list");
    }
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }}>
      <div className="m-5 border border-gray-600 rounded shadow bg-gray-800">
        <div className="p-3 bg-gray-600 flex items-center justify-between">
          <span>Edit preset {preset.name}</span>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="text-xs border p-1 rounded cursor-pointer"
              >
                {isSubmitting ? "..." : "Save changes"}
              </button>
            )}
          />
        </div>
        {/*

  metadata: unknown | null;
  storage_mode: "allocate" | "sparse" | null;
  tags: string[];
   */}
        <div className="grid grid-cols-[300px_1fr] p-3 space-y-3">
          <form.Field
            name="name"
            children={(field) => (
              <>
                <div>Name</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="category"
            children={(field) => (
              <>
                <div>Category</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || undefined}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="download_limit"
            children={(field) => (
              <>
                <div>Download limit</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || undefined}
                    onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="upload_limit"
            children={(field) => (
              <>
                <div>Upload limit</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || undefined}
                    onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="max_connections"
            children={(field) => (
              <>
                <div>Max connections</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || undefined}
                    onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="max_uploads"
            children={(field) => (
              <>
                <div>Max uploads</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || undefined}
                    onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="save_path"
            children={(field) => (
              <>
                <div>Save path</div>
                <div>
                  <input
                    className="border p-2 w-full"
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              </>
            )}
          />

          <form.Field
            name="session"
            children={(field) => (
              <>
                <div>Session</div>
                <div>
                  {sessions.data && (
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value || undefined}
                      onChange={(e) => field.handleChange(e.target.value)}
                    >
                      <option value={""}>Not set</option>
                      {
                        sessions.data.sessions.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))
                      }
                    </select>
                  )}
                </div>
              </>
            )}
          />
        </div>
      </div>
    </form>
  );
}
