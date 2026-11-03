import { useInvoker, useRPC, useRpcCache } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsTable } from "@/components/settings/settings-table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { DateTime } from "luxon";

export const Route = createFileRoute("/_app/settings/api-keys/")({
  component: RouteComponent,
});

const when = (seconds: number) =>
  DateTime.fromSeconds(seconds).toFormat("yyyy-MM-dd HH:mm");

function RouteComponent() {
  const cache = useRpcCache();
  const modal = useModal();

  const keys = useRPC("auth.keys.list");
  const remove = useInvoker("auth.keys.remove", {
    meta: { errorToast: false },
    onSettled: () => cache.invalidate("auth.keys.list"),
  });

  const now = DateTime.now().toUnixInteger();

  return (
    <SettingsSection
      title="All API keys"
      action={
        <Link className="btn btn-primary" to="/settings/api-keys/add">
          Add API key
        </Link>
      }
    >
      <SettingsTable
        query={keys}
        rows={keys.data?.keys}
        what="API keys"
        emptyIcon={KeyRound}
        emptyHint="An API key lets a script or another app use Porla's API."
        head={
          <>
            <th>Name</th>
            <th>Created at</th>
            <th>Expires at</th>
            <th>Last used</th>
            <th></th>
          </>
        }
      >
        {(k) => (
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
        )}
      </SettingsTable>
    </SettingsSection>
  );
}
