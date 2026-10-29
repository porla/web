import { type Session, useInvoker, useRPC } from "@/api";
import Accordion from "@/components/accordion";
import { useModal } from "@/components/modal";
import ConfirmModal from "@/components/modals/confirm";
import SessionSettingSetModal from "@/components/modals/session-setting-set";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Lock, SlidersHorizontal } from "lucide-react";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/sessions/$id",
)({
  component: RouteComponent,
});

// settings that cannot be changed
const STATIC_SETTINGS = new Set([
  "alert_mask",
  "peer_fingerprint",
  "user_agent",
]);

function RouteComponent() {
  const { id } = Route.useParams();

  const session = useRPC(
    "sessions.get",
    { id: parseInt(id, 10) },
    { meta: { silent: true } },
  );

  if (session.isLoading) {
    return (
      <div>
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );
  }

  if (session.error) {
    return <>{session.error.message}</>;
  }

  if (!session.data) {
    return <>no session data?</>;
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-sm w-full">
        <div className="card-body">
          <SessionForm
            key={`data_${session.data.session.id}`}
            session={session.data.session}
          />
        </div>
      </div>

      <SessionSettings
        key={`settings_${session.data.session.id}`}
        session={session.data.session}
      />
    </div>
  );
}

const sessionSchema = (taken: string[]) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Session name is required")
      .refine((n) => !taken.includes(n), "Session name taken"),
    metadata: z.any(),
    is_default: z.boolean(),
  });

function SessionForm({ session }: { session: Session }) {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const modal = useModal();

  const sessions = useRPC("sessions.list");

  const taken = (sessions.data?.sessions ?? [])
    .filter((s) => s.id !== session.id)
    .map((s) => s.name);

  const remove = useInvoker("sessions.remove", { meta: { silent: true } });

  const update = useInvoker("sessions.update", {
    meta: { silent: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions.list"] });
      queryClient.invalidateQueries({
        queryKey: ["sessions.get"],
        refetchType: "all",
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: session.name,
      metadata: session.metadata,
      is_default: session.is_default,
    },
    validators: {
      onMount: sessionSchema(taken),
      onChange: sessionSchema(taken),
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: session.id,
        name: value.name.trim(),
        is_default: value.is_default,
        metadata: value.metadata,
      });
    },
  });

  const torrents = session.state?.torrents_total ?? 0;

  return (
    <Suspense
      fallback={<span className="loading loading-spinner loading-xl"></span>}
    >
      <form.AppForm>
        <form.Form>
          <form.AppField
            name="name"
            children={(field) => <field.TextField label="Name" />}
          />

          <form.AppField
            name="is_default"
            children={(field) => (
              <field.CheckboxField
                label="Is default"
                disabled={session.is_default}
                description={
                  session.is_default
                    ? "Cannot unset default session"
                    : undefined
                }
              />
            )}
          />

          <form.AppField
            name="metadata.color"
            children={(field) => (
              <field.ColorField label="Color" fallback="#9ca3af" />
            )}
          />

          <form.SaveError error={update.error} />

          <div className="flex flex-wrap gap-3">
            <form.SubmitButton label="Update" />

            <button
              type="button"
              className="btn btn-warning"
              disabled={session.is_default || torrents > 0}
              title={
                session.is_default
                  ? "Cannot remove the default session"
                  : torrents > 0
                    ? "Cannot remove a session with torrents"
                    : undefined
              }
              onClick={async () => {
                const removed = await modal.show(ConfirmModal, {
                  title: "Remove session",
                  message: `Remove the session "${session.name}"?`,
                  confirmLabel: "Remove",
                  action: () => remove.mutateAsync({ id: session.id }),
                });

                if (removed) {
                  queryClient.removeQueries({
                    queryKey: ["sessions.get", { id: session.id }],
                  });

                  await queryClient.invalidateQueries({
                    queryKey: ["sessions.list"],
                  });

                  await navigate({ to: "/settings/sessions" });
                }
              }}
            >
              Remove session
              {torrents > 0 && <> ({torrents} torrents)</>}
            </button>
          </div>
        </form.Form>
      </form.AppForm>
    </Suspense>
  );
}

function SessionSettings({ session }: { session: Session }) {
  const modal = useModal();

  const settings = useRPC("sessions.settings.get", {
    id: session.id,
  });

  if (settings.isLoading || !settings.data) {
    return <>loading</>;
  }

  return (
    <Accordion title="Session settings">
      {!session.state && (
        <div role="alert" className="alert alert-info alert-soft">
          This session isn't loaded, so its settings can't be changed.
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(
            Object.keys(
              settings.data.settings,
            ) as (keyof typeof settings.data.settings)[]
          ).map((k) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{settings.data.settings[k].toString()}</td>
              <td className="flex justify-end">
                {STATIC_SETTINGS.has(k) ? (
                  <span className="btn btn-disabled btn-xs btn-neutral btn-square">
                    <Lock className="size-4 text-white" />
                  </span>
                ) : (
                  session.state && (
                    <button
                      className="btn btn-xs btn-neutral btn-square"
                      aria-label={`Edit ${k}`}
                      onClick={async () => {
                        await modal.show(SessionSettingSetModal, {
                          session_id: session.id,
                          setting_name: k,
                          setting_value: settings.data.settings[k],
                        });
                      }}
                    >
                      <SlidersHorizontal className="size-4 text-white" />
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Accordion>
  );
}
