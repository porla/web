// The torrent row menu items every running plugin added, provided by PluginHost.
import { createContext, useContext } from "react";
import type { MenuContext } from "./protocol";

export type MenuItem = {
  id: string;
  label: string;
  onClick: (context: MenuContext) => void;
};

export const PluginContext = createContext<{ menuItems: MenuItem[] }>({
  menuItems: [],
});

export function usePlugins() {
  return useContext(PluginContext);
}
