import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute("/settings/_layout/sessions/add")({
  component: RouteComponent,
});

const schema = z.object({
  name: z.string().min(1, "Session name is required."),
  settings_base: z.enum([
    "default",
    "min_memory_usage",
    "high_performance_seed",
  ]),
  timer_dht_stats: z.number(),
  timer_save_state: z.number(),
  timer_session_stats: z.number(),
  timer_torrent_updates: z.number(),
});

type Settings = z.infer<typeof schema>["settings_base"];

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const add = useInvoker("sessions.add", {
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
      onMount: schema,
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      const result = await add.mutateAsync(value);

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
            <form
              className="space-y-4"
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

              <details
                className="collapse bg-base-100 border border-base-300"
                name="settings-advanced"
              >
                <summary className="collapse-title font-semibold">
                  Advanced
                </summary>
                <div className="collapse-content text-sm">
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
                </div>
              </details>

              <form.AppForm>
                <form.SubmitButton label="Add session" />
              </form.AppForm>
            </form>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
