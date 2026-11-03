import { useInvoker, useRPC, useRpcCache } from "@/api";
import { Accordion } from "@/components/ui/accordion";
import { useAppForm } from "@/components/form/app-form";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { Field } from "@/components/form/field";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsSection } from "@/components/settings/settings-section";

export const Route = createFileRoute("/_app/settings/sessions/add")({
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

// Names are unique in Porla; a duplicate would come back as a bare SQLite
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

function RouteComponent() {
  const navigate = Route.useNavigate();
  const cache = useRpcCache();

  const sessions = useRPC("sessions.list");
  const taken = (sessions.data?.sessions ?? []).map((s) => s.name);

  const add = useInvoker("sessions.add", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("sessions.list"),
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
          params: { id: result.id },
        });
      }
    },
  });

  return (
    <SettingsSection title="Add session">
      <SettingsCard>
        <form.AppForm>
          <form.Form>
            <form.AppField
              name="name"
              children={(field) => <field.TextField label="Name" />}
            />

            <form.AppField
              name="settings_base"
              children={(field) => (
                <Field label="Settings base">
                  {(control) => (
                    <select
                      {...control}
                      className="select"
                      onChange={(e) => {
                        field.handleChange(e.target.value);
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
                  )}
                </Field>
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
      </SettingsCard>
    </SettingsSection>
  );
}
