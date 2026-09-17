import {
  type Session,
  type SessionsGet,
  type SessionsSettingsGet,
  useInvoker,
  useRPC,
} from "@/api";
import { useAppForm } from "@/hooks/form";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import z from "zod";

export const Route = createFileRoute("/_layout/settings/_layout/sessions/$id")({
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
    <div>
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

type CurrentSetting = {
  name: string;
  value: string | number | boolean;
  description?: string;
};

function SessionSettings({ session }: { session: Session }) {
  const settings = useRPC<SessionsSettingsGet>("sessions.settings.get", {
    id: session.id,
  });

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [setting, setSetting] = useState<CurrentSetting>();

  if (settings.isLoading || !settings.data) {
    return <>loading</>;
  }

  return (
    <>
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
                  onClick={() => {
                    setSetting({
                      name: k,
                      value: settings.data.settings[k],
                      description: `about ${k}`,
                    });
                    dialogRef.current?.showModal();
                  }}
                >
                  <SlidersHorizontal className="size-4 text-white" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dialog
        id="mdl_setting"
        className="modal"
        ref={dialogRef}
        onClose={() => setSetting(undefined)}
      >
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          {setting && (
            <EditSessionSetting
              dialog_ref={dialogRef}
              session_id={session.id}
              {...setting}
            />
          )}
        </div>
      </dialog>
    </>
  );
}

type EditSessionSettingProps = {
  dialog_ref: React.RefObject<HTMLDialogElement | null>;
  session_id: number;
  name: string;
  value: string | number | boolean;
  description?: string;
};

function EditSessionSetting({
  dialog_ref,
  session_id,
  name,
  value,
}: EditSessionSettingProps) {
  const queryClient = useQueryClient();

  const setSetting = useInvoker("sessions.settings.set", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions.settings.get"] }),
  });

  const form = useForm({
    defaultValues: {
      value: value,
    },
    onSubmit: async ({ value }) => {
      let s: Record<string, string | number | boolean> = {};
      s[name] = value.value;

      await setSetting.mutateAsync({
        id: session_id,
        settings: s,
      });

      dialog_ref?.current?.close();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <fieldset className="fieldset">
        <form.Field
          name="value"
          children={(field) => (
            <>
              <label className="label">{name}</label>
              {typeof field.state.value === "boolean" && (
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
              )}

              {typeof field.state.value === "number" && (
                <input
                  type="number"
                  className="input"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(parseInt(e.target.value, 10))
                  }
                />
              )}

              {typeof field.state.value === "string" && (
                <input
                  type="text"
                  className="input"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </>
          )}
        />

        <button
          type="submit"
          className={clsx([
            "btn btn-primary",
            form.state.isSubmitting && "btn-disabled",
          ])}
        >
          Update value
        </button>
      </fieldset>
    </form>
  );
}
