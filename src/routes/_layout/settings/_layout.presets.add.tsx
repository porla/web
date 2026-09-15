import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/_layout/presets/add")({
  component: RouteComponent,
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
    <div className="card bg-base-200 shadow-sm w-full">
      <div className="card-body">
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

          <form.AppForm>
            <form.SubmitButton label="Add preset" />
          </form.AppForm>
        </form>
      </div>
    </div>
  );
}
