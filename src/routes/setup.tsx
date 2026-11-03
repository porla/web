import { useInvoker, useRPC, useRpcCache } from "@/api";
import { AuthCard } from "@/components/auth/auth-card";
import { useAppForm } from "@/components/form/app-form";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

const setupSchema = z
  .object({
    username: z.string().min(1, "Enter a username"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    error: "The passwords don't match",
  });

function RouteComponent() {
  const navigate = Route.useNavigate();

  const cache = useRpcCache();

  const status = useRPC("sys.status");
  const authInit = useInvoker("auth.init", { meta: { errorToast: false } });
  const authLogin = useInvoker("auth.login", { meta: { errorToast: false } });

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
      confirm: "",
    },
    listeners: {
      onChange: () => authInit.reset(),
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

      cache.clear();

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
    <AuthCard
      title="Welcome to Porla"
      description="Create the account you'll use to log in."
    >
      <form.AppForm>
        <form.Form>
          <form.AppField
            name="username"
            children={(field) => (
              <field.TextField
                label="Username"
                autoCapitalize="none"
                autoComplete="username"
                autoFocus
                spellCheck={false}
              />
            )}
          />

          <form.AppField
            name="password"
            children={(field) => (
              <field.PasswordField
                label="Password"
                autoComplete="new-password"
                description="Either a passphrase or a password."
              />
            )}
          />

          <form.AppField
            name="confirm"
            children={(field) => (
              <field.PasswordField
                label="Confirm password"
                autoComplete="new-password"
              />
            )}
          />

          <div className="mt-4 flex flex-col gap-4">
            <form.SaveError error={authInit.error} />
            <form.SubmitButton label="Create account" block />
          </div>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
