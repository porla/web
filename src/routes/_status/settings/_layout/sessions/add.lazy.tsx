import { useInvoker, useRPC } from "@/api";
import Accordion from "@/components/accordion";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/sessions/add",
)({
  component: RouteComponent,
});

const timer = z
  .number()
  .int("Enter a whole number of milliseconds")
  .min(10, "At least 10 ms")
  .max(2147483647, "Too large");

const settingsBase = z.enum([
  "default",
  "min_memory_usage",
  "high_performance_seed",
]);

// Names are unique in porla; a duplicate would come back as a bare SQLite
// error, so it's caught here.
const schema = (taken: string[]) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Session name is required.")
      .refine((n) => !taken.includes(n), "Session name taken"),
    settings_base: settingsBase,
    timer_dht_stats: timer,
    timer_save_state: timer,
    timer_session_stats: timer,
    timer_torrent_updates: timer,
  });

type Settings = z.infer<typeof settingsBase>;

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const sessions = useRPC("sessions.list");
  const taken = (sessions.data?.sessions ?? []).map((s) => s.name);

  const add = useInvoker("sessions.add", {
    meta: { silent: true },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      settings_base: "default",
      timer_dht_stats: 5000,
      timer_save_state: 300000,
      timer_session_stats: 5000,
      timer_torrent_updates: 1000,
    },
    validators: {
      onMount: schema(taken),
      onChange: schema(taken),
    },
    onSubmit: async ({ value }) => {
      const result = await add.mutateAsync({
        ...value,
        name: value.name.trim(),
      });

      if (
        !!result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        await navigate({
          to: "/settings/sessions/$id",
          params: { id: result.id.toString() },
        });
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Add session</h2>
        <Link className="btn btn-primary invisible" to="/settings/sessions/add">
          Add session
        </Link>
      </div>

      <div className="card bg-base-200 shadow-sm w-full">
        <div className="card-body">
          <Suspense>
            <form.AppForm>
              <form.Form>
                <form.AppField
                  name="name"
                  children={(field) => <field.TextField label="Name" />}
                />

                <form.AppField
                  name="settings_base"
                  children={(field) => (
                    <div className="fieldset">
                      <label className="label">Settings base</label>

                      <select
                        className="select"
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value as Settings);
                        }}
                        value={field.state.value}
                      >
                        <option value={"default"}>Default</option>
                        <option value={"min_memory_usage"}>
                          Min. memory usage
                        </option>
                        <option value={"high_performance_seed"}>
                          High performance seed
                        </option>
                      </select>
                    </div>
                  )}
                />

                <Accordion title="Advanced" className="bg-base-100">
                  <form.AppField
                    name="timer_dht_stats"
                    children={(field) => (
                      <field.NumberField label="DHT stats interval (ms)" />
                    )}
                  />

                  <form.AppField
                    name="timer_save_state"
                    children={(field) => (
                      <field.NumberField label="Save state interval (ms)" />
                    )}
                  />

                  <form.AppField
                    name="timer_session_stats"
                    children={(field) => (
                      <field.NumberField label="Session stats interval (ms)" />
                    )}
                  />

                  <form.AppField
                    name="timer_torrent_updates"
                    children={(field) => (
                      <field.NumberField label="Torrent update interval (ms)" />
                    )}
                  />
                </Accordion>

                <form.SaveError error={add.error} />
                <form.SubmitButton label="Add session" />
              </form.Form>
            </form.AppForm>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
