import { createFileRoute } from "@tanstack/react-router";
import { useInvoker, useRPC } from "@/jsonrpc";
import { Suspense, useMemo, useState } from "react";
import { useAppForm } from "@/hooks/form";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";
import Button from "@/components/button";

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
  peer_fingerprint: string;
  user_agent: string;
};

function RouteComponent() {
  const { id } = Route.useParams();
  return <SessionPage key={id} id={id} />;
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
    <div className="space-y-5">
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

      <SessionSettingsCard settings={session.data.session.settings} />
    </div>
  );
}

type SessionSettingsCardProps = {
  settings: SessionSettings;
};

type ReadonlySettings = {
  [K in keyof SessionSettings]?: true;
};

const readonlyMapper: ReadonlySettings = {
  peer_fingerprint: true,
  user_agent: true,
};

function SessionSettingsCard(props: SessionSettingsCardProps) {
  const { settings } = props;
  const [selectedSetting, setSelectedSetting] = useState<
    keyof SessionSettings | undefined
  >();

  const { t } = useTranslation("settings");

  const settingNames = useMemo(() => {
    return Object.keys(settings || {}) as (keyof SessionSettings)[];
  }, [settings]);

  return (
    <>
      {selectedSetting && (
        <UpdateSettingModal
          setting={selectedSetting}
          settings={settings}
          onClose={() => setSelectedSetting(undefined)}
        />
      )}

      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-3 py-3 flex items-center justify-between">
          <h1 className="font-medium">Settings</h1>
        </div>
        <div>
          <ul className="divide-y divide-white/10">
            {settingNames.map((name) => (
              <li key={name} className="p-3 hover:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>

                  {!readonlyMapper[name] && (
                    <button
                      className="cursor-pointer inline-flex items-center rounded-md bg-white p-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
                      onClick={() => setSelectedSetting(name)}
                    >
                      <AdjustmentsHorizontalIcon className="size-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-3">{t(name)}</p>
                <span className="font-mono p-2 bg-gray-900 rounded text-sm">
                  {typeof settings[name] === "boolean" && (
                    <>
                      {settings[name] && (
                        <span className="text-green-600">Enabled</span>
                      )}
                      {!settings[name] && (
                        <span className="text-red-700">Disabled</span>
                      )}
                    </>
                  )}

                  {typeof settings[name] !== "boolean" && <>{settings[name]}</>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

type UpdateSettingModalProps = {
  setting: keyof SessionSettings;
  settings: SessionSettings;
  onClose: () => void;
};

function UpdateSettingModal(props: UpdateSettingModalProps) {
  const { id } = Route.useParams();

  const { t } = useTranslation("settings");

  const update = useInvoker("sessions.update", {
    onSuccess(_data, _variables, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ["sessions.get", { id }],
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      value: props.settings[props.setting],
    },
    onSubmit: async ({ value }) => {
      const settingsObject: { [K in keyof SessionSettings]?: unknown } = {};
      settingsObject[props.setting] = value.value;

      await update.mutateAsync({
        id,
        settings: settingsObject,
      });

      props.onClose();
    },
  });

  if (!props.setting) {
    return;
  }

  return (
    <Dialog
      key={props.setting}
      open={!!props.setting}
      onClose={() => props.onClose()}
      className="relative z-10"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/75"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <Suspense fallback={<p className="h-36">Loading form</p>}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 flex-1 text-center sm:mt-0 sm:text-left">
                      <DialogTitle
                        as="h3"
                        className="text-base font-semibold text-gray-900 dark:text-white"
                      >
                        {props.setting}
                      </DialogTitle>
                      <div className="mt-3">
                        <p className="my-3 text-sm text-gray-400">
                          {t(props.setting)}
                        </p>
                        <form.AppField
                          name="value"
                          children={(field) => (
                            <>
                              {typeof field.state.value === "boolean" && (
                                <field.CheckboxField />
                              )}

                              {typeof field.state.value === "number" && (
                                <field.NumberField />
                              )}

                              {typeof field.state.value === "string" && (
                                <field.TextField />
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/25">
                  <Button text="Save" type="submit" />
                </div>
              </form>
            </Suspense>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
