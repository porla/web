import { useRPC, type PresetsList } from "@/api";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export const Route = createLazyFileRoute("/settings/_layout/presets/")({
  component: RouteComponent,
});

function RouteComponent() {
  const presets = useRPC<PresetsList>("presets.list");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">All presets</h1>
        <Link className="btn btn-primary" to="/settings/presets/add">
          Add preset
        </Link>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {presets.data?.presets.map((p) => (
              <tr key={`preset_${p.id}`}>
                <td className="">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{p.name}</span>
                    {p.is_default && (
                      <span>
                        <Star className="size-4 text-yellow-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="flex justify-end">
                  <Link
                    to="/settings/presets/$id"
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
