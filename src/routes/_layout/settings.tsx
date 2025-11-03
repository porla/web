import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  useRPC,
  type PluginsList,
  type PresetsList,
  type SessionsList,
} from "../../jsonrpc";
import { StarIcon } from "@heroicons/react/20/solid";

export const Route = createFileRoute("/_layout/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const pluginsList = useRPC<PluginsList>("plugins.list");
  const presetsList = useRPC<PresetsList>("presets.list");
  const sessionsList = useRPC<SessionsList>("sessions.list");

  return (
    <div className="h-full">
      <div className="h-full grid grid-cols-[300px_1fr] flex-1">
        <div className="bg-gray-800">
          <div className="bg-gray-600 text-lg p-3">
            <div>Settings</div>
          </div>
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
                  <span
                    className="size-3 rounded"
                    style={{
                      backgroundColor: s.metadata["color"]
                        ? String(s.metadata["color"])
                        : "#ccc",
                    }}
                  ></span>
                  {s.name}
                  {s.is_default && <StarIcon className="size-4" />}
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
                  <span
                    className="size-3 rounded"
                    style={{
                      backgroundColor: p.metadata["color"]
                        ? String(p.metadata["color"])
                        : "#ccc",
                    }}
                  ></span>
                  {p.name}
                  {p.is_default && <StarIcon className="size-4" />}
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
        <div className="p-5 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
