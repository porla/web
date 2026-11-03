import { POLL_MS, useInvoker, useRPC, useRpcCache } from "@/api";
import { AuthCard } from "@/components/auth/auth-card";
import { useAppForm } from "@/components/form/app-form";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ServerOff } from "lucide-react";
import z from "zod";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  // Where to go after logging in: a path in this app (without the base path,
  // query string kept). Anything else, like another origin, is dropped.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect:
      typeof search.redirect === "string" &&
      search.redirect.startsWith("/") &&
      !search.redirect.startsWith("//")
        ? search.redirect
        : undefined,
  }),
});

const loginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();
  const cache = useRpcCache();

  // Unreachable shows right away, not after the retries, and clears once
  // Porla answers again.
  const status = useRPC("sys.status", undefined, {
    meta: { errorToast: false },
    retry: false,
    refetchInterval: (q) => (q.state.error ? POLL_MS.details : false),
  });

  const authLogin = useInvoker("auth.login", { meta: { errorToast: false } });

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    listeners: {
      onChange: () => authLogin.reset(),
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authLogin.mutateAsync(value);
      } catch (error) {
        const password = document.querySelector<HTMLInputElement>(
          "input[name=password]",
        );
        password?.focus();
        password?.select();

        throw error;
      }

      cache.clear();

      await navigate(redirect ? { href: redirect } : { to: "/" });
    },
  });

  // No user yet: there's nothing to log in to.
  if (status.data?.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return (
    <AuthCard
      title="Log in to Porla"
      description={redirect && "Log in to continue."}
    >
      {status.error && (
        <div role="alert" className="alert alert-warning">
          <ServerOff className="size-5" aria-hidden />
          <span>Can't reach Porla. Check that it's running.</span>
        </div>
      )}
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
                autoComplete="current-password"
              />
            )}
          />

          <div className="mt-4 flex flex-col gap-4">
            <form.SaveError error={authLogin.error} />
            <form.SubmitButton label="Log in" block />
          </div>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
