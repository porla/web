// The control frame: a plugin's hidden ui.entry page, loaded while porla runs.
// It adds menu items and opens modals.

import type { Plugin } from "@/api";
import { useModal } from "@/components/modal";
import { PluginEntryModal } from "@/components/modals/plugin-entry";
import {
  pluginPageUrl,
  SANDBOX,
  useFrameChannel,
  type MenuContext,
} from "./protocol";
import { createContext, useContext, type SyntheticEvent } from "react";

export type MenuItem = {
  id: string;
  label: string;
  onClick: (context: MenuContext) => void;
};

// Every running plugin's menu items, from PluginHost.
export const PluginContext = createContext<{ menuItems: MenuItem[] }>({
  menuItems: [],
});

export function usePlugins() {
  return useContext(PluginContext);
}

// Props for the plugin's control iframe, or null when it has no UI.
export function useControlFrame(
  plugin: Plugin,
  updateMenu: (update: (items: MenuItem[]) => MenuItem[]) => void,
) {
  const modal = useModal();

  const onChannelLoad = useFrameChannel("control", plugin, (msg, send) => {
    if (msg.type === "menu.add") {
      if (typeof msg.id !== "string" || typeof msg.label !== "string") {
        return;
      }

      const item: MenuItem = {
        // Unique across plugins, for React keys.
        id: `${plugin.id}:${msg.id}`,
        label: msg.label,
        onClick: (context) =>
          send({ type: "menu.invoke", id: msg.id, context }),
      };

      updateMenu((items) => {
        const at = items.findIndex((i) => i.id === item.id);
        return at < 0 ? [...items, item] : items.with(at, item);
      });
    } else if (msg.type === "modal.open") {
      const entry = pluginPageUrl(plugin, msg.entry);

      if (!entry) {
        console.error("no entry for modal");
        return;
      }

      modal.show(PluginEntryModal, {
        plugin,
        title: msg.title,
        src: entry,
        context: msg.context,
      });
    }
  });

  const src = pluginPageUrl(plugin, plugin.manifest?.ui?.entry);

  const onLoad = (e: SyntheticEvent<HTMLIFrameElement>) => {
    updateMenu(() => []);
    onChannelLoad(e);
  };

  return src ? { src, title: plugin.slug, sandbox: SANDBOX, onLoad } : null;
}
