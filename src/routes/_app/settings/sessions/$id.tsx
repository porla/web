import { type Session, useInvoker, useRPC } from "@/api";
import { Accordion } from "@/components/ui/accordion";
import { useModal } from "@/components/modal/use-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { SetSessionSettingModal } from "@/components/modals/set-session-setting-modal";
import { useAppForm } from "@/components/form/app-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, SlidersHorizontal } from "lucide-react";
import z from "zod";
import { SettingsNotFound } from "@/components/settings/settings-not-found";
import { idParam } from "@/lib/route-params";
import { SettingsNotice } from "@/components/settings/settings-notice";
import { SettingsCard } from "@/components/settings/settings-card";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_app/settings/sessions/$id")({
  component: RouteComponent,
  notFoundComponent: SettingsNotFound,
  params: idParam,
});

// settings that cannot be changed
const STATIC_SETTINGS = new Set([
  "alert_mask",
  "peer_fingerprint",
  "user_agent",
]);

function RouteComponent() {
  const { id } = Route.useParams();

  const session = useRPC("sessions.get", { id }, { meta: { silent: true } });

  if (!session.data) {
    return (
      <SettingsNotice
        query={session}
        notFound="Session not found"
        back={{ to: "/settings/sessions", label: "Back to sessions" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard>
        <SessionForm
          key={`data_${session.data.session.id}`}
          session={session.data.session}
        />
      </SettingsCard>

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
                session.is_default ? "Cannot unset default session" : undefined
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
  );
}

function SessionSettings({ session }: { session: Session }) {
  const modal = useModal();

  const settings = useRPC("sessions.settings.get", {
    id: session.id,
  });

  if (settings.isLoading || !settings.data) {
    return <Spinner />;
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
                        await modal.show(SetSessionSettingModal, {
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
