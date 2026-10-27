import { useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

const setupSchema = z
  .object({
    username: z.string().min(1, "Enter a username"),
    password: z.string().min(1, "Enter a password"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    error: "The passwords don't match",
  });

function RouteComponent() {
  const navigate = Route.useNavigate();

  const queryClient = useQueryClient();

  const status = useRPC("sys.status");
  const authInit = useInvoker("auth.init", { meta: { silent: true } });
  const authLogin = useInvoker("auth.login", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
      confirm: "",
    },
    validators: {
      onChange: setupSchema,
    },
    onSubmit: async ({ value }) => {
      const { username, password } = value;

      await authInit.mutateAsync({ username, password });

      try {
        await authLogin.mutateAsync({ username, password });
      } catch {
        // The user exists now; logging in again is all that's left.
        await navigate({ to: "/login" });
        return;
      }

      queryClient.clear();

      await navigate({ to: "/" });
    },
  });

  if (status.isLoading) {
    return null;
  }

  // Already set up (unless it's this form that just did it).
  if (status.data?.status === "ok" && authInit.isIdle) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="m-4">
      <h1>Set up Porla</h1>
      <p className="text-sm">
        No existing user account was found, which means you need to create one.
      </p>
      <form.AppForm>
        <form.Form>
          <form.AppField
            name="username"
            children={(field) => (
              <field.TextField
                label="Username"
                autoComplete="username"
                autoFocus
              />
            )}
          />

          <form.AppField
            name="password"
            children={(field) => (
              <field.TextField
                label="Password"
                type="password"
                autoComplete="new-password"
              />
            )}
          />

          <form.AppField
            name="confirm"
            children={(field) => (
              <field.TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
              />
            )}
          />

          <form.SaveError error={authInit.error} />
          <form.SubmitButton label="Create user" />
        </form.Form>
      </form.AppForm>
    </div>
  );
}
