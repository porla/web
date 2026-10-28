import { useInvoker, useRPC, type PluginsGet } from "@/api";
import { useModal } from "@/components/modal";
import ConfirmModal from "@/components/modals/confirm";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/plugins/$id",
)({
  component: RouteComponent,
});

const pluginSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, { error: "Enter a path", abort: true })
    .regex(/^(\/|[A-Za-z]:[\\/])/, "Use an absolute path"),
  config: z.string(),
});

function RouteComponent() {
  const { id } = Route.useParams();

  const plugin = useRPC(
    "plugins.get",
    { id: parseInt(id, 10) },
    { meta: { silent: true } },
  );

  if (plugin.isLoading) {
    return <span className="loading loading-spinner loading-xl"></span>;
  }

  if (plugin.error || !plugin.data) {
    return (
      <div className="space-y-3">
        <p>{plugin.error?.message ?? "Plugin not found"}</p>
        <Link to="/settings/plugins" className="btn btn-sm">
          Back to plugins
        </Link>
      </div>
    );
  }

  return <PluginForm key={plugin.data.plugin.id} plugin={plugin.data.plugin} />;
}

function PluginForm({ plugin }: { plugin: PluginsGet["plugin"] }) {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const modal = useModal();

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["plugins.get", { id: plugin.id }],
      }),
      queryClient.invalidateQueries({ queryKey: ["plugins.list"] }),
    ]);

  const reload = useInvoker("plugins.reload", {
    meta: { silent: true },
    onSettled: refresh,
  });

  const remove = useInvoker("plugins.remove", { meta: { silent: true } });

  const update = useInvoker("plugins.update", {
    meta: { silent: true },
    onSuccess: refresh,
  });

  const form = useAppForm({
    defaultValues: {
      path: plugin.path,
      config: plugin.config ?? "",
    },
    validators: {
      onChange: pluginSchema,
    },
    onSubmit: async ({ value }) => {
      const { path, config } = pluginSchema.parse(value);

      await update.mutateAsync({
        id: plugin.id,
        path,
        config: config.trim() ? config : null,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          {plugin.name ?? plugin.path.split(/[\\/]/).pop()}
        </h2>
        {plugin.version && (
          <span className="badge badge-ghost">{plugin.version}</span>
        )}
        {plugin.is_loaded ? (
          <span className="badge badge-success badge-soft">Loaded</span>
        ) : (
          <span
            className="badge badge-error badge-soft"
            title="The plugin or its configuration failed to load; porla's log says why"
          >
            Not loaded
          </span>
        )}
      </div>

      <form.AppForm>
        <form.Form>
          <form.AppField
            name="path"
            children={(field) => <field.TextField label="Path" />}
          />

          <form.Field
            name="config"
            children={(field) => (
              <div className="my-3">
                <textarea
                  className="w-lg max-w-full h-96 font-mono textarea"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Plugin configuration (Lua)"
                  value={field.state.value}
                ></textarea>
              </div>
            )}
          />

          <form.SaveError error={update.error ?? reload.error} />

          <div className="flex flex-wrap gap-3">
            <form.SubmitButton label="Update" />

            <button
              type="button"
              disabled={reload.isPending}
              className="btn"
              onClick={() => reload.mutate({ id: plugin.id })}
            >
              Reload
            </button>

            <button
              type="button"
              className="btn btn-warning"
              onClick={async () => {
                const removed = await modal.show(ConfirmModal, {
                  title: "Remove plugin",
                  message: `Remove the plugin "${plugin.name ?? plugin.path}"?`,
                  confirmLabel: "Remove",
                  action: () => remove.mutateAsync({ id: plugin.id }),
                });

                if (removed) {
                  queryClient.removeQueries({
                    queryKey: ["plugins.get", { id: plugin.id }],
                  });

                  await queryClient.invalidateQueries({
                    queryKey: ["plugins.list"],
                  });

                  await navigate({ to: "/settings/plugins" });
                }
              }}
            >
              Remove
            </button>
          </div>
        </form.Form>
      </form.AppForm>
    </div>
  );
}
