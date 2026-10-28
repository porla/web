import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute(
  "/_status/settings/_layout/plugins/install",
)({
  component: RouteComponent,
});

const githubName = z
  .string()
  .trim()
  .min(1, { error: "Required", abort: true })
  .regex(/^[A-Za-z0-9._-]+$/, "Letters, digits, '.', '-' and '_' only");

const installSchema = z.object({
  owner: githubName,
  repository: githubName,
  version: z
    .string()
    .trim()
    .min(1, { error: "Enter a release tag, like v1.0.0", abort: true })
    .regex(/^[^\s/?#]+$/, "A release tag, like v1.0.0"),
  config: z.string(),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const install = useInvoker("plugins.install", {
    meta: { silent: true },
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
    validators: {
      onMount: installSchema,
      onChange: installSchema,
    },
    onSubmit: async ({ value }) => {
      const { config, ...release } = installSchema.parse(value);

      const { id } = await install.mutateAsync({
        ...release,
        config: config.trim() ? config : null,
      });

      await navigate({
        to: "/settings/plugins/$id",
        params: { id: id.toString() },
      });
    },
  });

  return (
    <form.AppForm>
      <form.Form>
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

        <form.SaveError error={install.error} />
        <form.SubmitButton label="Install" />
      </form.Form>

      <div className="mt-5 text-sm">
        Or,{" "}
        <Link to="/settings/plugins/add" className="underline">
          add manually instead
        </Link>
      </div>
    </form.AppForm>
  );
}
