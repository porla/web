import { useAppForm } from "@/hooks/form";
import { useInvoker, useRPC, type Plugin } from "@/jsonrpc";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_layout/settings/plugins/$id")({
  component: RouteComponent,
  params: {
    parse: (p) => {
      return { id: Number(p.id) };
    },
  },
});

function RouteComponent() {
  const { id } = Route.useParams();

  const plugin = useRPC<Plugin>("plugins.get", { id });

  if (plugin.isLoading) {
    return <>loading plugin</>;
  }

  if (!plugin.data) {
    return <>plugin not found</>;
  }

  return <PluginCard plugin={plugin.data} />
}

type PluginCardProps = {
  plugin: Plugin;
}

type UpdatePluginProps =
  | {
    type: "path";
    config: string | null;
    metadata: Record<string, unknown> | null;
    data: string | null;
  }
  | {
    type: "archive";
    config: string | null;
    metadata: Record<string, unknown> | null;
    data: FileList | null;
  }

function PluginCard({ plugin }: PluginCardProps) {
  const navigate = useNavigate();

  const reload = useInvoker("plugins.reload");
  const update = useInvoker("plugins.update");

  const remove = useInvoker("plugins.remove", {
    onSuccess(_data, _variables, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ["plugins.list"]
      })
    },
  });

  const form = useAppForm({
    defaultValues: {
      type: plugin.type,
      config: plugin.config,
      data: null,
      metadata: plugin.metadata
    } as UpdatePluginProps,
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: plugin.id,
        config: value.config
      });
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col space-y-3"
    >
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-3 py-3 flex items-center justify-between">
          <h1 className="font-medium">{plugin.name}</h1>

          <div className="inline-flex rounded-md shadow-xs dark:shadow-none">
            <button
              type="submit"
              className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
              disabled={form.state.isSubmitting}
            >
              Update
            </button>
            <Menu as="div" className="relative -ml-px block">
              <MenuButton className="relative inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:inset-ring-gray-700 dark:hover:bg-white/20">
                <span className="sr-only">Open options</span>
                <ChevronDownIcon aria-hidden="true" className="size-5" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 -mr-1 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
              >
                <div className="py-1">
                  <MenuItem>
                    <button
                      className="w-full disabled:cursor-not-allowed disabled:text-gray-500 text-left block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                      onClick={async () => await reload.mutateAsync({ id: plugin.id })}
                    >
                      Reload
                    </button>
                  </MenuItem>

                  <MenuItem>
                    <button
                      className="w-full disabled:cursor-not-allowed disabled:text-gray-500 text-left block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                      onClick={async () => {
                        await remove.mutateAsync({ id: plugin.id });
                        await navigate({ to: "/settings" });
                      }}
                    >
                      Remove
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
        <div className="px-4 py-5 space-y-5">
          <Suspense fallback={<p>Loading fields</p>}>
            <form.AppField
              name="config"
              children={(field) => <field.TextareaField className="font-mono" label="Configuration" placeholder="Plugin configuration goes here" />}
            />
          </Suspense>
        </div>
      </div>
    </form>
  );
}