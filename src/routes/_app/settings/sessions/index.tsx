import { useRPC } from "@/api";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsTable } from "@/components/settings/settings-table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Star } from "lucide-react";

export const Route = createFileRoute("/_app/settings/sessions/")({
  component: RouteComponent,
});

function RouteComponent() {
  const sessions = useRPC("sessions.list");

  return (
    <SettingsSection
      title="All sessions"
      action={
        <Link className="btn btn-primary" to="/settings/sessions/add">
          Add session
        </Link>
      }
    >
      <SettingsTable
        query={sessions}
        rows={sessions.data?.sessions}
        what="sessions"
        emptyIcon={Layers}
        emptyHint="Add a session to start adding torrents to it."
        head={
          <>
            <th className="w-4"></th>
            <th>Name</th>
            <th>Torrents</th>
            <th>Listening</th>
            <th></th>
          </>
        }
      >
        {(s) => (
          <tr key={`session_${s.id}`}>
            <td>
              <div
                className="size-4 rounded"
                style={{
                  backgroundColor:
                    typeof s.metadata.color === "string" && s.metadata.color
                      ? s.metadata.color
                      : "#ccc",
                }}
              ></div>
            </td>
            <td>
              <div className="flex items-center space-x-1">
                <span className="font-semibold">{s.name}</span>
                {s.is_default && (
                  <span>
                    <Star className="size-4 text-yellow-500" />
                  </span>
                )}
              </div>
            </td>
            <td>{s.state?.torrents_total ?? "-"}</td>
            <td>
              {s.state?.is_listening === true && (
                <div
                  aria-label="success"
                  className="status status-success"
                ></div>
              )}
            </td>
            <td className="flex justify-end">
              <Link
                to="/settings/sessions/$id"
                className="btn btn-neutral btn-xs"
                params={{ id: s.id }}
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
