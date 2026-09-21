import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute("/_status/settings/_layout/presets/add")({
  component: RouteComponent,
});

const addSchema = z.object({
  name: z.string().min(1, "Preset name is required"),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const add = useInvoker("presets.add", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onMount: addSchema,
      onChange: addSchema,
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
          to: "/settings/presets/$id",
          params: { id: result.id.toString() },
        });
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Add preset</h2>
        <Link className="btn btn-primary invisible" to="/settings/presets/add">
          Add preset
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

              <form.AppForm>
                <form.SubmitButton label="Add preset" />
              </form.AppForm>
            </form>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
