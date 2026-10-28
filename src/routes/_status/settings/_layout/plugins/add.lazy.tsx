import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/plugins/add",
)({
  component: RouteComponent,
});

const addSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, { error: "Enter a path", abort: true })
    .regex(/^(\/|[A-Za-z]:[\\/])/, "Use an absolute path"),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const add = useInvoker("plugins.add", {
    meta: { silent: true },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["plugins.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      path: "",
    },
    validators: {
      onMount: addSchema,
      onChange: addSchema,
    },
    onSubmit: async ({ value }) => {
      const { id } = await add.mutateAsync(addSchema.parse(value));

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
          name="path"
          children={(field) => <field.TextField label="Path" />}
        />

        <form.SaveError error={add.error} />
        <form.SubmitButton label="Add plugin" />
      </form.Form>
    </form.AppForm>
  );
}
