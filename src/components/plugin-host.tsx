import { useRPC, type Plugin } from "@/api";
import { feature } from "@/features";
import { useState, type ReactNode } from "react";
import {
  PluginContext,
  useControlFrame,
  type MenuItem,
} from "@/plugins/control-frame";

export function PluginHost({ children }: { children: ReactNode }) {
  const enabled = feature("plugin_ui");

  if (!enabled) {
    return children;
  }

  return <EnabledPluginHost>{children}</EnabledPluginHost>;
}

function frameKey(p: Plugin) {
  return `${p.id}:${JSON.stringify(p.manifest)}`;
}

function EnabledPluginHost({ children }: { children: ReactNode }) {
  const plugins = useRPC("plugins.list", null, { meta: { silent: true } });
  const [menus, setMenus] = useState<Record<string, MenuItem[]>>({});
  const list = (plugins.data?.plugins ?? []).filter(
    (p) => p.status === "running",
  );
  const menuItems = list.flatMap((p) => menus[frameKey(p)] ?? []);

  return (
    <PluginContext.Provider value={{ menuItems }}>
      <div hidden>
        {list.map((p) => {
          const key = frameKey(p);

          return (
            <PluginFrame
              key={key}
              plugin={p}
              updateMenu={(update) =>
                setMenus((prev) => ({
                  ...prev,
                  [key]: update(prev[key] ?? []),
                }))
              }
            />
          );
        })}
      </div>
      {children}
    </PluginContext.Provider>
  );
}

function PluginFrame({
  plugin,
  updateMenu,
}: {
  plugin: Plugin;
  updateMenu: (update: (items: MenuItem[]) => MenuItem[]) => void;
}) {
  const frame = useControlFrame(plugin, updateMenu);
  return frame && <iframe {...frame}></iframe>;
}
