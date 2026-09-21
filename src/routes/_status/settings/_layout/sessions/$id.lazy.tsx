import {
  type Session,
  type SessionsGet,
  type SessionsSettingsGet,
  useInvoker,
  useRPC,
} from "@/api";
import { useModal } from "@/components/modal";
import SessionSettingSetModal from "@/components/modals/session-setting-set";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import z from "zod";

export const Route = createLazyFileRoute("/_status/settings/_layout/sessions/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const session = useRPC<SessionsGet>("sessions.get", { id: parseInt(id, 10) });

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

const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  metadata: z.any(),
  is_default: z.boolean(),
});

function SessionForm({ session }: { session: Session }) {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const remove = useInvoker("sessions.remove", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions.list"] });
      queryClient.invalidateQueries({
        queryKey: ["sessions.get"],
        refetchType: "all",
      });
    },
  });

  const update = useInvoker("sessions.update", {
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
      onMount: sessionSchema,
      onChange: sessionSchema,
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: session.id,
        name: value.name,
        is_default: value.is_default,
        metadata: value.metadata,
      });
    },
  });

  useEffect(() => {
    form.reset({
      name: session.name,
      metadata: session.metadata,
      is_default: session.is_default,
    });
  }, [session]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Suspense
        fallback={<span className="loading loading-spinner loading-xl"></span>}
      >
        <form.AppField
          name="name"
          children={(field) => <field.TextField label="Name" />}
        />

        <form.AppField
          name="is_default"
          children={(field) => <field.CheckboxField label="Is default" />}
        />

        <form.AppField
          name="metadata.color"
          children={(field) => <field.ColorField label="Color" />}
        />

        <div className="flex space-x-5">
          <form.AppForm>
            <form.SubmitButton label="Update" />
          </form.AppForm>

          <button
            type="button"
            className="btn btn-warning"
            disabled={
              !!(session.state && session.state.torrents_total > 0) ||
              remove.isPending
            }
            onClick={async () => {
              await remove.mutateAsync({
                id: session.id,
              });

              await navigate({ to: "/settings" });
            }}
          >
            Remove session
            {session.state && session.state.torrents_total > 0 && (
              <> ({session.state.torrents_total} torrents)</>
            )}
          </button>
        </div>
      </Suspense>
    </form>
  );
}

function SessionSettings({ session }: { session: Session }) {
  const modal = useModal();

  const settings = useRPC<SessionsSettingsGet>("sessions.settings.get", {
    id: session.id,
  });

  const [isOpen, setIsOpen] = useState(false);

  if (settings.isLoading || !settings.data) {
    return <>loading</>;
  }

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className="collapse bg-base-200 border border-base-300"
      name="settings-advanced"
    >
      <summary className="collapse-title font-semibold flex justify-between pr-4">
        <span>Session settings</span>
        <span
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDown />
        </span>
      </summary>
      <div className="collapse-content text-sm">
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
                <td>
                  <button
                    className="btn btn-xs btn-neutral btn-square"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
