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
import { useRef, useState } from "react";

export const Route = createFileRoute("/_layout/settings/_layout/sessions/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const session = useRPC<SessionsGet>("sessions.get", { id: parseInt(id, 10) });

  if (session.isLoading) {
    return <>loading</>;
  }

  if (session.error) {
    return <>{session.error.message}</>;
  }

  if (!session.data) {
    return <>no session data?</>;
  }

  return (
    <div>
      <SessionData session={session.data.session} />
      <SessionSettings session={session.data.session} />
    </div>
  );
}

function SessionData({ session }: { session: Session }) {
  const queryClient = useQueryClient();

  const update = useInvoker("sessions.update", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      name: session.name,
      metadata: session.metadata,
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: session.id,
        name: value.name,
        is_default: session.is_default,
        metadata: value.metadata,
      });
    },
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField
          name="name"
          children={(field) => <field.TextField label="Name" />}
        />

        <form.AppField
          name="metadata.color"
          children={(field) => <field.ColorField label="Color" />}
        />

        <button
          type="submit"
          className={clsx([
            "btn btn-primary",
            form.state.isSubmitting && "btn-disabled",
          ])}
        >
          Update
        </button>
      </form>
    </div>
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
