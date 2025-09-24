import { createFileRoute } from '@tanstack/react-router'
import { useInvoker, useRPC } from '../../jsonrpc';
import { useSWRConfig } from 'swr';

export const Route = createFileRoute('/_layout/settings/sessions/$id')({
  component: RouteComponent,
});

type SessionsSettingsList = {
  settings: SessionSettings;
}

type SessionSettings = {
  active_checking: number;
  active_dht_limit: number;
}

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();

  const sessionsRemove = useInvoker("sessions.remove");
  const settings = useRPC<SessionsSettingsList>("sessions.settings.list", { name: id });
  const { mutate } = useSWRConfig();

  if (settings.isLoading) {
    return <>Loading settings</>
  }

  if (settings.error) {
    return <>failed to load session settings</>
  }

  if (!settings.data) {
    return <>no data</>
  }

  return (
    <div className="m-5 border border-gray-600 rounded shadow bg-gray-800">
      <div className="p-3 bg-gray-600 flex items-center justify-between">
        <span>Session settings</span>

        {id !== "default" && (
          <button
            className="text-xs border rounded p-1"
            onClick={async () => {
              await sessionsRemove({ name: id });
              mutate("sessions.list");
              await navigate({ to: "/settings" });
            }}
          >
            Remove
          </button>
        )}
      </div>

      <ul className="p-3 space-y-3">
        {(Object.keys(settings.data.settings || []) as (keyof SessionSettings)[]).map(k => (
          <li className="grid grid-cols-[1fr_2fr]">
            <div>{k}</div>
            <div>{settings.data?.settings[k]}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

type SessionSettingsFormProps = {
  settings: SessionSettings;
}

function SessionSettingsForm(props: SessionSettingsFormProps) {
}
