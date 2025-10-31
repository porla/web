import { useAppForm } from "@/hooks/form";
import { useInvoker } from "@/jsonrpc";
import { readFile } from "@/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_layout/settings/plugins/add")({
  component: RouteComponent,
});

type PluginsAddType =
  | { type: "path"; data: string | null }
  | { type: "archive"; data: FileList | null };

type PluginsAdd = {
  id: number;
}

function RouteComponent() {
  const navigate = useNavigate();

  const pluginsAdd = useInvoker<PluginsAdd>("plugins.add", {
    onSuccess(_data, _variables, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ["plugins.list"]
      })
    },
  });

  const form = useAppForm({
    defaultValues: {
      type: "path",
      data: null
    } as PluginsAddType,
    onSubmit: async ({ value }) => {
      const { id } = await pluginsAdd.mutateAsync({
        type: value.type,
        data: value.type == "archive" && value.data != null
          ? await readFile(value.data[0])
          : value.data
      });

      await navigate({ to: "/settings/plugins/$id", params: { id } });
    }
  });

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
          <h1 className="font-medium">Add plugin</h1>

          <div className="inline-flex rounded-md shadow-xs dark:shadow-none">
            <button
              type="submit"
              className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
              disabled={form.state.isSubmitting}
            >
              Save
            </button>
          </div>
        </div>
        <div className="px-4 py-5 space-y-5">
          <Suspense fallback={<p>Loading fields</p>}>
            <form.AppField
              name="type"
              children={(field) => <field.RadioGroupField
                label="Type"
                values={[
                  { id: "path", title: "Path" },
                  { id: "archive", title: "Archive" }
                ]}
              />
              }
            />

            <form.Subscribe
              selector={(state) => [state.values.type]}
              children={([type]) => (
                <Suspense>
                  {type == "archive" && (
                    <form.AppField
                      name="data"
                      children={(field) => <field.FileListField label="Archive" />}
                    />
                  )}

                  {type == "path" && (
                    <form.AppField
                      name="data"
                      children={(field) => <field.TextField label="Path" />}
                    />
                  )}
                </Suspense>
              )}
            />

          </Suspense>
        </div>
      </div>
    </form>
  );
}
