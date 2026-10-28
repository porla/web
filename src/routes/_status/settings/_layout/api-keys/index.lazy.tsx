import { useInvoker, useRPC } from "@/api";
import { useModal } from "@/components/modal";
import ConfirmModal from "@/components/modals/confirm";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { DateTime } from "luxon";

export const Route = createLazyFileRoute("/_status/settings/_layout/api-keys/")(
  {
    component: RouteComponent,
  },
);

const when = (seconds: number) =>
  DateTime.fromSeconds(seconds).toFormat("yyyy-MM-dd HH:mm");

function RouteComponent() {
  const queryClient = useQueryClient();
  const modal = useModal();

  const keys = useRPC("auth.keys.list");
  const remove = useInvoker("auth.keys.remove", {
    meta: { silent: true },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["auth.keys.list"] }),
  });

  const now = DateTime.now().toUnixInteger();

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
              <th>Last used</th>
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
                <td>{when(k.created_at)}</td>
                <td>
                  {k.expires_at === null ? (
                    <span className="opacity-60">Never</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {when(k.expires_at)}
                      {k.expires_at <= now && (
                        <span className="badge badge-error badge-soft badge-sm">
                          Expired
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td>
                  {k.last_used_at === null ? (
                    <span className="opacity-60">Never</span>
                  ) : (
                    when(k.last_used_at)
                  )}
                </td>
                <td className="flex justify-end">
                  <button
                    className="btn btn-warning btn-xs"
                    onClick={() =>
                      modal.show(ConfirmModal, {
                        title: "Revoke API key",
                        message: `Revoke "${k.name}"?`,
                        confirmLabel: "Revoke",
                        action: () => remove.mutateAsync({ id: k.id }),
                      })
                    }
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
