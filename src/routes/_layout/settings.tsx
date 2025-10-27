import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  useInvoker,
  useRPC,
  type PluginsList,
  type PresetsList,
  type SessionsList,
} from "../../jsonrpc";
import { useSWRConfig } from "swr";

export const Route = createFileRoute("/_layout/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const pluginsList = useRPC<PluginsList>("plugins.list");
  const presetsList = useRPC<PresetsList>("presets.list");
  const sessionsList = useRPC<SessionsList>("sessions.list");

  const sessionsAdd = useInvoker("sessions.add");

  const { mutate } = useSWRConfig();

  return (
    <div className="h-full">
      <div className="bg-gray-600 text-lg p-3">
        <div>Settings</div>
      </div>

      <div className="grid grid-cols-[300px_1fr] h-dvh">
        <div className="bg-gray-800">
          <ul className="menu w-full">
            <li className="menu-title">Sessions</li>

            {sessionsList.isLoading && (
              <li className="p-5 flex items-center">
                <span className="loading loading-spinner loading-sm"></span>
              </li>
            )}

            {sessionsList.data?.sessions.map((s) => (
              <li key={s.id}>
                <Link
                  to="/settings/sessions/$id"
                  params={{ id: s.id }}
                  activeProps={{ className: "menu-active" }}
                >
                  <span className="size-3 bg-red-400 rounded"></span>
                  {s.name}
                </Link>
              </li>
            ))}

            <li className="menu-title">Presets</li>

            {presetsList.isLoading && (
              <li className="p-5 flex items-center">
                <span className="loading loading-spinner loading-sm"></span>
              </li>
            )}

            {presetsList.data?.presets.map((p) => (
              <li key={p.id}>
                <Link to="/settings/presets/$id" params={{ id: p.id }}>
                  {p.name}
                </Link>
              </li>
            ))}

            <li className="menu-title">Plugins</li>

            {pluginsList.isLoading && (
              <li className="p-5 flex items-center">
                <span className="loading loading-spinner loading-sm"></span>
              </li>
            )}

            {pluginsList.data?.plugins.map((p) => (
              <li key={p.id}>
                <Link
                  to="/settings/plugins/$id"
                  activeProps={{ className: "menu-active" }}
                  params={{ id: p.id }}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
