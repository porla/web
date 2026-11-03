import { useRPC } from "@/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsTable } from "@/components/settings/settings-table";
import { pluginInfo } from "@/plugins/plugin-info";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";

export const Route = createFileRoute("/_app/settings/plugins/")({
  component: RouteComponent,
});

function RouteComponent() {
  const plugins = useRPC("plugins.list");

  return (
    <SettingsSection
      title="All plugins"
      action={
        <Link className="btn btn-primary" to="/settings/plugins/install">
          Install plugin
        </Link>
      }
    >
      <SettingsTable
        query={plugins}
        rows={plugins.data?.plugins}
        what="plugins"
        emptyIcon={Puzzle}
        emptyHint="Install one from GitHub, or add one from a folder on this machine."
        head={
          <>
            <th>Name</th>
            <th>Path</th>
            <th></th>
          </>
        }
      >
        {(p) => (
          <tr key={`plugin_${p.id}`}>
            <td className="">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{pluginInfo(p).name}</span>
                {pluginInfo(p).version && (
                  <span className="text-xs opacity-60">
                    {pluginInfo(p).version}
                  </span>
                )}
                {!pluginInfo(p).loaded && (
                  <span className="badge badge-error badge-soft badge-sm">
                    Not loaded
                  </span>
                )}
              </div>
            </td>
            <td className="">{p.path}</td>
            <td className="flex justify-end">
              <Link
                to="/settings/plugins/$id"
                className="btn btn-neutral btn-xs"
                params={{ id: p.id }}
              >
                Edit
              </Link>
            </td>
          </tr>
        )}
      </SettingsTable>
    </SettingsSection>
  );
}
