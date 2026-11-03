import { useRPC } from "@/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsTable } from "@/components/settings/settings-table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, Star } from "lucide-react";

export const Route = createFileRoute("/_app/settings/presets/")({
  component: RouteComponent,
});

function RouteComponent() {
  const presets = useRPC("presets.list");

  return (
    <SettingsSection
      title="All presets"
      action={
        <Link className="btn btn-primary" to="/settings/presets/add">
          Add preset
        </Link>
      }
    >
      <SettingsTable
        query={presets}
        rows={presets.data?.presets}
        what="presets"
        emptyIcon={SlidersHorizontal}
        emptyHint="A preset holds the options torrents are added with."
        head={
          <>
            <th>Name</th>
            <th></th>
          </>
        }
      >
        {(p) => (
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
