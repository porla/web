import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  useRPC,
  type PluginsList,
  type PresetsList,
  type SessionsList,
} from "@/jsonrpc";
import { GlobeAltIcon, PlusCircleIcon, StarIcon } from "@heroicons/react/20/solid";
import { Suspense } from "react";

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
          <div className="bg-gray-600 p-2">
            <div>Settings</div>
          </div>
          <ul className="menu w-full p-2">
            <li>
              <div className="text-sm/6 flex items-center justify-between">
                <span className="font-bold text-gray-400 dark:text-gray-500 ">Sessions</span>
                <span>
                  <Link to="/settings/sessions/add">
                    <PlusCircleIcon className="size-4" />
                  </Link>
                </span>
              </div>

              <ul className="text-sm">
                {sessionsList.data?.sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/settings/sessions/$id"
                      params={{ id: s.id }}
                      activeProps={{ className: "bg-gray-600" }}
                      className="flex items-center justify-between p-1 rounded"
                    >
                      <div className="flex items-center space-x-1">
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
                      {s.is_default && <StarIcon className="size-4" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="menu-title">
              <div className="text-sm/6 flex items-center justify-between">
                <span className="font-bold text-gray-400 dark:text-gray-500 ">Presets</span>
                <span>
                  <Link to="/settings/presets/add">
                    <PlusCircleIcon className="size-4" />
                  </Link>
                </span>
              </div>

              <ul className="text-sm">
                {presetsList.data?.presets.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/settings/presets/$id"
                      params={{ id: p.id }}
                      activeProps={{ className: "bg-gray-600" }}
                      className="flex items-center justify-between p-1 rounded"
                    >
                      <div className="flex items-center space-x-1">
                        <span
                          className="size-3 rounded"
                          style={{
                            backgroundColor: p.metadata["color"]
                              ? String(p.metadata["color"])
                              : "#ccc",
                          }}
                        ></span>
                        <span>{p.name}</span>
                      </div>
                      {p.is_default && <StarIcon className="size-4" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>


            <li className="menu-title">
              <div className="text-sm/6 flex items-center justify-between">
                <span className="font-bold text-gray-400 dark:text-gray-500 ">Plugins</span>
                <div className="flex space-x-2">
                  <Link to="/settings/plugins/discover">
                    <GlobeAltIcon className="size-4" />
                  </Link>
                  <Link to="/settings/plugins/add">
                    <PlusCircleIcon className="size-4" />
                  </Link>
                </div>
              </div>

              <ul>
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
            </li>
          </ul>
        </div>
        <div className="p-5 overflow-y-auto">
          <Suspense fallback={<p>Loading</p>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
