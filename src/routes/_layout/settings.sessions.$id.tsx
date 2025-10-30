import { createFileRoute } from "@tanstack/react-router";
import { useInvoker, useRPC } from "@/jsonrpc";
import { useForm } from "@tanstack/react-form";
import { Suspense, useCallback, useMemo } from "react";
import { useAppForm } from "@/hooks/form";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export const Route = createFileRoute("/_layout/settings/sessions/$id")({
  component: RouteComponent,
  params: {
    parse: (p) => {
      return { id: Number(p.id) };
    },
  },
});

type Session = {
  id: number;
  name: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  settings: SessionSettings;
};

type SessionsGet = {
  session: Session;
};

type SessionSettings = {
  active_checking: number;
  active_dht_limit: number;
  allow_i2p_mixed: boolean;
  dht_bootstrap_nodes: string;
};

function RouteComponent() {
  const { id } = Route.useParams();
  return <SessionPage key={id} id={id} />
}

function SessionPage({ id }: { id: number }) {
  const session = useRPC<SessionsGet>("sessions.get", { id });
  const update = useInvoker("sessions.update");

  const form = useAppForm({
    defaultValues: {
      name: session.data?.session.name,
      color: String(session.data?.session.metadata["color"] || "#000000"),
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync(
        {
          id,
          name: value.name,
          metadata: {
            ...session.data?.session.metadata,
            color: value.color,
          },
        },
        {
          onSuccess(_data, _variables, _onMutateResult, context) {
            context.client.invalidateQueries({
              queryKey: ["sessions.get", { id }],
            });
            context.client.invalidateQueries({
              queryKey: ["sessions.list"],
            });
          },
        }
      );
    },
  });

  if (session.isLoading) {
    return <>Loading settings</>;
  }

  if (session.error) {
    return <>failed to load session settings</>;
  }

  if (!session.data) {
    return <>no data</>;
  }

  return (
    <>
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
            <h1 className="font-medium">{session.data.session.name}</h1>

            <div className="inline-flex rounded-md shadow-xs dark:shadow-none">
              <button
                type="submit"
                className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
                disabled={form.state.isSubmitting}
              >
                Save
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
                        disabled={session.data.session.is_default}
                      >
                        Make default
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
                name="name"
                children={(field) => <field.TextField label="Name" />}
              />

              <form.AppField
                name="color"
                children={(field) => <field.ColorField label="Color" />}
              />
            </Suspense>
          </div>
        </div>
      </form>
    </>
  );
}

type SessionSettingsFormProps = {
  session_name: string;
  settings: SessionSettings;
};

function SessionSettingsForm(props: SessionSettingsFormProps) {
  const { session_name, settings } = props;

  const settingNames = useMemo(() => {
    return Object.keys(settings || {}) as (keyof SessionSettings)[];
  }, [settings]);

  const updateSettings = useInvoker("sessions.settings.set");

  const form = useForm({
    defaultValues: settings,
    onSubmit: async ({ value }) => {
      await updateSettings.mutateAsync({
        name: session_name,
        settings: value,
      });
    },
    validators: undefined,
  });

  const formSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <form onSubmit={formSubmit}>
      <div className="m-5 border border-gray-600 rounded shadow bg-gray-800">
        <div className="p-3 bg-gray-600 flex items-center justify-between">
          <span>Session settings</span>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="text-xs border p-1 rounded cursor-pointer"
              >
                {isSubmitting ? "..." : "Submit"}
              </button>
            )}
          />
        </div>

        <ul className="p-3 space-y-3">
          {settingNames.map((k) => (
            <li key={k} className="grid grid-cols-[1fr_2fr] items-center">
              <form.Field
                name={k}
                children={(field) => (
                  <>
                    <div>{k}</div>
                    <div>
                      {typeof field.state.value === "boolean" && (
                        <input
                          className="border p-2 w-full"
                          type="checkbox"
                          id={field.name}
                          name={field.name}
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                        />
                      )}

                      {typeof field.state.value === "number" && (
                        <input
                          className="border p-2 w-full"
                          type={
                            typeof field.state.value === "number"
                              ? "number"
                              : "text"
                          }
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                        />
                      )}

                      {typeof field.state.value === "string" && (
                        <input
                          className="border p-2 w-full"
                          type={
                            typeof field.state.value === "number"
                              ? "number"
                              : "text"
                          }
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </div>
                  </>
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
