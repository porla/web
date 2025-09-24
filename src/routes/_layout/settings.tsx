import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useInvoker, useRPC } from '../../jsonrpc';
import { useSWRConfig } from 'swr';

export const Route = createFileRoute('/_layout/settings')({
  component: RouteComponent,
})

type SessionsList = {
  sessions: SessionsListItem[];
}

type SessionsListItem = {
  name: string;
}

function RouteComponent() {
  const presetsList = useRPC<any>("presets.list");

  const sessionsAdd = useInvoker("sessions.add");
  const sessionsList = useRPC<SessionsList>("sessions.list");

  const { mutate } = useSWRConfig();

  return (
    <div className="h-full">
      <div className="bg-gray-600 text-lg p-3">
        <div>Settings</div>
      </div>

      <div className="grid grid-cols-[300px_1fr] h-dvh">
        <div className="bg-gray-800 p-3">
          <ul className="space-y-5">
            <li>Plugins</li>
            <li>
              Presets
              <ul>
                {Object.keys(presetsList.data || {}).map(p => (
                  <li>{p}</li>
                ))}
              </ul>
            </li>
            <li>
              <div className="flex justify-between">
                <span>Sessions</span>
                <button
                  className="text-sm cursor-pointer"
                  onClick={async () => {
                    await sessionsAdd({ name: "sess-" + new Date().getSeconds() });
                    mutate("sessions.list");
                  }}
                >
                  Add
                </button>
              </div>
              <ul>
                {sessionsList.data?.sessions.map(s => (
                  <li key={s.name}><Link to="/settings/sessions/$id" params={{ id: s.name }}>{s.name}</Link></li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
        <div className="overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
