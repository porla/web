import { useInvoker, useRPC, type ApiKeysList } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { DateTime } from "luxon";

export const Route = createLazyFileRoute("/_status/settings/_layout/api-keys/")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const queryClient = useQueryClient();

  const keys = useRPC<ApiKeysList>("auth.keys.list");
  const remove = useInvoker("auth.keys.remove", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["auth.keys.list"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">All API keys</h1>
        <Link className="btn btn-primary" to="/settings/api-keys/add">
          Add API key
        </Link>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created at</th>
              <th>Expires at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {keys.data?.keys.map((k) => (
              <tr key={`key_${k.id}`}>
                <td className="">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{k.name}</span>
                  </div>
                </td>
                <td>
                  {DateTime.fromSeconds(k.created_at).toFormat(
                    "yyyy-MM-dd HH:mm",
                  )}
                </td>
                <td>
                  {k.expires_at && (
                    <>
                      {DateTime.fromSeconds(k.expires_at).toFormat(
                        "yyyy-MM-dd HH:mm:ss",
                      )}
                    </>
                  )}
                </td>
                <td className="flex justify-end">
                  <button
                    className="btn btn-warning btn-xs"
                    onClick={async () => {
                      await remove.mutateAsync({
                        id: k.id,
                      });
                    }}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
