import { useRPC, type PluginsList } from "@/api";
import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_status/settings/_layout/plugins/")({
  component: RouteComponent,
});

function RouteComponent() {
  const plugins = useRPC<PluginsList>("plugins.list");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">All plugins</h1>
        <Link className="btn btn-primary" to="/settings/plugins/install">
          Install plugin
        </Link>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plugins.data?.plugins.map((p) => (
              <tr key={`plugin_${p.id}`}>
                <td className="">{p.name}</td>
                <td className="">{p.path}</td>
                <td className="flex justify-end">
                  <Link
                    to="/settings/plugins/$id"
                    className="btn btn-neutral btn-xs"
                    params={{ id: String(p.id) }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
