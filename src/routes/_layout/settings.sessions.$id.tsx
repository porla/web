import { createFileRoute } from "@tanstack/react-router";
import { useInvoker, useRPC } from "@/jsonrpc";
import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";

export const Route = createFileRoute("/_layout/settings/sessions/$id")({
  component: RouteComponent,
  params: {
    parse: (p) => { return { id: Number(p.id) } }
  }
});

type SessionsSettingsList = {
  settings: SessionSettings;
};

type SessionSettings = {
  active_checking: number;
  active_dht_limit: number;
  allow_i2p_mixed: boolean;
  dht_bootstrap_nodes: string;
};

function RouteComponent() {
  const { id } = Route.useParams();
  const settings = useRPC<SessionsSettingsList>("sessions.settings.list", { id });

  if (settings.isLoading) {
    return <>Loading settings</>;
  }

  if (settings.error) {
    return <>failed to load session settings</>;
  }

  if (!settings.data) {
    return <>no data</>;
  }

  return (
    <SessionSettingsForm session_name={"dd"} settings={settings.data.settings} />
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
      await updateSettings({
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
                          onChange={(e) =>
                            field.handleChange(e.target.checked)
                          }
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
