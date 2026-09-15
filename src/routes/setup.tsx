import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const queryClient = useQueryClient();

  const authInit = useInvoker("auth.init");
  const authLogin = useInvoker("auth.login");

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authInit.mutateAsync(value);
      await authLogin.mutateAsync(value);

      queryClient.clear();

      await navigate({ to: "/" });
    },
  });

  return (
    <div className="m-4">
      <h1>Set up Porla</h1>
      <p className="text-sm">
        No existing user account was found, which means you need to create one.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField
          name="username"
          children={(field) => <field.TextField label="Username" />}
        />

        <form.AppField
          name="password"
          children={(field) => (
            <field.TextField label="Password" type="password" />
          )}
        />

        <form.AppForm>
          <form.SubmitButton label="Create user" />
        </form.AppForm>
      </form>
    </div>
  );
}
