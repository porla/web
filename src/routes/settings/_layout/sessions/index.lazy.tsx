import { type SessionsList, useRPC } from "@/api";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export const Route = createLazyFileRoute("/settings/_layout/sessions/")({
  component: RouteComponent,
});

function RouteComponent() {
  const sessions = useRPC<SessionsList>("sessions.list");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">All sessions</h1>
        <Link className="btn btn-primary" to="/settings/sessions/add">
          Add session
        </Link>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th className="w-4"></th>
              <th>Name</th>
              <th>Torrents</th>
              <th>Listening</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.data?.sessions.map((s) => (
              <tr key={`session_${s.id}`}>
                <td>
                  <div
                    className="size-4 rounded"
                    style={{
                      backgroundColor: s.metadata["color"]
                        ? String(s.metadata["color"])
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
                    params={{ id: String(s.id) }}
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
