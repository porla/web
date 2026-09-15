import {
  useRPC,
  type PluginsList,
  type PresetsList,
  type SessionsList,
} from "@/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full h-full flex">
      <div className="w-64">
        <ul className="menu w-full">
          <li>
            <Link to="/settings/mmdb">MMDB</Link>
            <Link to="/settings/views">Views</Link>
            <Link to="/settings/webui">Web UI</Link>
          </li>
        </ul>
        <SessionsMenu />
        <PresetsMenu />
        <PluginsMenu />
      </div>

      <div className="p-5 flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

function SessionsMenu() {
  const sessions = useRPC<SessionsList>("sessions.list");

  return (
    <ul className="menu w-full">
      <li className="menu-title">Sessions</li>
      {sessions.data?.sessions.map((s) => (
        <li key={s.id}>
          <Link
            to="/settings/sessions/$id"
            params={{ id: String(s.id) }}
            activeProps={{
              className: "bg-base-300",
            }}
          >
            <div className="flex items-center space-x-2">
              <span
                className="size-3 rounded"
                style={{
                  backgroundColor: s.metadata["color"]
                    ? String(s.metadata["color"])
                    : "#ccc",
                }}
              ></span>
              <span>{s.name}</span>
            </div>
          </Link>
        </li>
      ))}
      <li>
        <Link to="/settings/sessions/add" className="btn btn-xs">
          Add session
        </Link>
      </li>
    </ul>
  );
}

function PresetsMenu() {
  const presets = useRPC<PresetsList>("presets.list");

  return (
    <ul className="menu w-full">
      <li className="menu-title">Presets</li>
      {presets.data?.presets.map((s) => (
        <li key={s.id}>
          <Link
            to="/settings/presets/$id"
            params={{ id: String(s.id) }}
            activeProps={{
              className: "bg-base-300",
            }}
          >
            <span>{s.name}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link to="/settings/presets/add" className="btn btn-xs">
          Add preset
        </Link>
      </li>
    </ul>
  );
}

function PluginsMenu() {
  const plugins = useRPC<PluginsList>("plugins.list");

  return (
    <ul className="menu w-full">
      <li className="menu-title">Plugins</li>
      {plugins.data?.plugins.map((s) => (
        <li key={s.id}>
          <Link
            to="/settings/plugins/$id"
            params={{ id: String(s.id) }}
            activeProps={{
              className: "bg-base-300",
            }}
          >
            <span>{s.name}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link to="/settings/plugins/install" className="btn btn-xs">
          Install plugin
        </Link>
      </li>
    </ul>
  );
}
