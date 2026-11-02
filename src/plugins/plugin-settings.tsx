import type { Plugin } from "@/api";
import { usePageFrame } from "./page-frame";
import { pluginPageUrl } from "./protocol";
import clsx from "clsx";

// The plugin's own settings page (ui.settings in its plugin.json), on its page
// in Settings. Nothing when it has none or isn't running.
export function PluginSettings({ plugin }: { plugin: Plugin }) {
  const src = pluginPageUrl(plugin, plugin.manifest?.ui?.settings);
  const { frame, sized } = usePageFrame(
    "settings",
    plugin,
    src ?? "",
    `${plugin.manifest?.name ?? plugin.slug} settings`,
  );

  if (!src || plugin.status !== "running") {
    return null;
  }

  return (
    // The page paints over the frame's own background as soon as it loads, so
    // the placeholder goes on top until the page says how tall it is.
    <div className="relative">
      <iframe {...frame} className={clsx("block w-full", !sized && "h-40")} />
      {!sized && <div className="skeleton absolute inset-0" />}
    </div>
  );
}
