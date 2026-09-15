import { type PluginsGet, useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/_layout/plugins/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { id } = Route.useParams();

  const queryClient = useQueryClient();

  const reload = useInvoker("plugins.reload");
  const remove = useInvoker("plugins.remove", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["plugins.list"] }),
  });
  const update = useInvoker("plugins.update");

  const plugin = useRPC<PluginsGet>("plugins.get", {
    id: parseInt(id, 10),
  });

  const form = useAppForm({
    defaultValues: {
      path: plugin.data?.plugin.path ?? "",
      config: plugin.data?.plugin.config,
      metadata: plugin.data?.plugin.metadata,
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: parseInt(id, 10),
        path: value.path,
        config: value.config,
        metadata: value.metadata,
      });
    },
  });

  if (plugin.isLoading) {
    return <>loading plugin</>;
  }

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
          name="path"
          children={(field) => <field.TextField label="Path" />}
        />

        <form.Field
          name="config"
          children={(field) => (
            <div className="mb-3">
              <textarea
                className="w-lg h-96 font-mono textarea"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Plugin configuration"
                value={field.state.value ?? ""}
              ></textarea>
            </div>
          )}
        />

        <form.AppForm>
          <form.SubmitButton label="Update" />
        </form.AppForm>
      </form>

      <div className="mt-10 flex space-x-4">
        <button
          disabled={reload.isPending}
          className="btn btn-primary"
          onClick={async () => {
            await reload.mutateAsync({
              id: parseInt(id),
            });
          }}
        >
          Reload
        </button>

        <button
          disabled={remove.isPending}
          className="btn btn-warning"
          onClick={async () => {
            await remove.mutateAsync({
              id: parseInt(id),
            });

            await navigate({ to: "/settings" });
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
