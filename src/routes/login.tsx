import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const authLogin = useInvoker("auth.login");

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authLogin.mutateAsync(value);
      } catch (err) {
        console.error(err);
        return;
      }

      queryClient.clear();

      await navigate({ to: "/" });
    },
  });

  return (
    <div className="m-4">
      <h1>Log in to Porla</h1>
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
          <form.SubmitButton label="Log in" />
        </form.AppForm>
      </form>
    </div>
  );
}
