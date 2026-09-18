import {
  useRPC,
  type PluginsList,
  type PresetsList,
  type SessionsList,
} from "@/api";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/settings/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const plugins = useRPC<PluginsList>("plugins.list");
  const presets = useRPC<PresetsList>("presets.list");
  const sessions = useRPC<SessionsList>("sessions.list");

  return (
    <div className="w-6xl max-w-full mx-auto pt-9 px-6 pb-14">
      <header>
        <Link to="/" className="btn btn-ghost btn-sm -ml-2.5">
          <ChevronLeft className="size-4" />
          Back to Porla
        </Link>

        <h1 className="mt-2.5 text-[1.75rem] leading-tight font-semibold tracking-[-.02em]">
          Settings
        </h1>
      </header>

      <ul className="menu menu-horizontal space-x-2 border-b border-b-gray-600 w-full">
        <li>
          <Link to="/settings" className="tab" activeOptions={{ exact: true }}>
            Overview
          </Link>
        </li>
        <li>
          <Link to="/settings/sessions" className="tab">
            Sessions
            <span className="badge badge-xs badge-info">
              {sessions.isLoading ? "-" : (sessions.data?.sessions.length ?? 0)}
            </span>
          </Link>
        </li>
        <li>
          <Link to="/settings/presets" className="tab">
            Presets
            <span className="badge badge-xs badge-info">
              {presets.isLoading ? "-" : (presets.data?.presets.length ?? 0)}
            </span>
          </Link>
        </li>
        <li>
          <Link to="/settings/plugins" className="tab">
            Plugins
            <span className="badge badge-xs badge-info">
              {plugins.isLoading ? "-" : (plugins.data?.plugins.length ?? 0)}
            </span>
          </Link>
        </li>
      </ul>

      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  );
}
