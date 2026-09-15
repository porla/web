import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/settings/_layout/plugins/install",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const install = useInvoker("plugins.install", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["plugins.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      owner: "",
      repository: "",
      version: "",
      config: "",
    },
    onSubmit: async ({ value }) => {
      const result = await install.mutateAsync(value);

      if (
        !!result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        await navigate({
          to: "/settings/plugins/$id",
          params: {
            id: result.id.toString(),
          },
        });
      }
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
          name="owner"
          children={(field) => <field.TextField label="Owner" />}
        />

        <form.AppField
          name="repository"
          children={(field) => <field.TextField label="Repository" />}
        />

        <form.AppField
          name="version"
          children={(field) => <field.TextField label="Version" />}
        />

        <form.AppField
          name="config"
          children={(field) => (
            <div className="mb-3">
              <textarea
                className="w-lg h-96 font-mono textarea"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Plugin configuration"
                value={field.state.value ?? ""}
              ></textarea>
            </div>
          )}
        />

        <form.AppForm>
          <form.SubmitButton label="Install" />
        </form.AppForm>
      </form>

      <div className="mt-5 text-sm">
        Or,{" "}
        <Link to="/settings/plugins/add" className="underline">
          add manually instead
        </Link>
      </div>
    </div>
  );
}
