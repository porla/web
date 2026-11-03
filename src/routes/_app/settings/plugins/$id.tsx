import { useInvoker, useRPC, useRpcCache, type PluginsGet } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { PluginSettings } from "@/plugins/plugin-settings";
import { useAppForm } from "@/components/form/app-form";
import { pluginInfo } from "@/plugins/plugin-info";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { idParam } from "@/lib/route-params";
import { SettingsNotFound } from "@/components/settings/settings-not-found";
import { SettingsNotice } from "@/components/settings/settings-notice";
import { absolutePath } from "@/lib/paths";

export const Route = createFileRoute("/_app/settings/plugins/$id")({
  component: RouteComponent,
  notFoundComponent: SettingsNotFound,
  params: idParam,
});

const pluginSchema = z.object({
  path: absolutePath(),
  config: z.string(),
});

function RouteComponent() {
  const { id } = Route.useParams();

  const plugin = useRPC("plugins.get", { id }, { meta: { errorToast: false } });

  if (!plugin.data) {
    return (
      <SettingsNotice
        query={plugin}
        notFound="Plugin not found"
        back={{ to: "/settings/plugins", label: "Back to plugins" }}
      />
    );
  }

  return <PluginForm key={plugin.data.plugin.id} plugin={plugin.data.plugin} />;
}

function PluginForm({ plugin }: { plugin: PluginsGet["plugin"] }) {
  const navigate = Route.useNavigate();
  const cache = useRpcCache();
  const modal = useModal();

  const refresh = () => cache.invalidate("plugins.get", "plugins.list");

  const reload = useInvoker("plugins.reload", {
    meta: { errorToast: false },
    onSettled: refresh,
  });

  const remove = useInvoker("plugins.remove", { meta: { errorToast: false } });

  const update = useInvoker("plugins.update", {
    meta: { errorToast: false },
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

  const info = pluginInfo(plugin);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{info.name}</h2>
        {info.version && (
          <span className="badge badge-ghost">{info.version}</span>
        )}
        {info.loaded ? (
          <span className="badge badge-success badge-soft">Loaded</span>
        ) : (
          <span
            className="badge badge-error badge-soft"
            title={
              info.error ??
              "The plugin or its configuration failed to load; Porla's log says why"
            }
          >
            Not loaded
          </span>
        )}
      </div>

      <PluginSettings
        key={`${info.version}:${plugin.manifest?.ui?.settings}`}
        plugin={plugin}
      />

      <form.AppForm>
        <form.Form>
          <form.AppField
            name="path"
            children={(field) => <field.TextField label="Path" />}
          />

          <form.AppField
            name="config"
            children={(field) => (
              <field.TextareaField label="Plugin configuration (Lua)" />
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
                  message: `Remove the plugin "${info.name}"?`,
                  confirmLabel: "Remove",
                  action: () => remove.mutateAsync({ id: plugin.id }),
                });

                if (removed) {
                  cache.remove("plugins.get", { id: plugin.id });
                  await cache.invalidate("plugins.list");
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
