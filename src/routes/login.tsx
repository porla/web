import { useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
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
  const queryClient = useQueryClient();

  const status = useRPC("sys.status");
  const authLogin = useInvoker("auth.login", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      await authLogin.mutateAsync(value);

      queryClient.clear();

      await navigate(redirect ? { href: redirect } : { to: "/" });
    },
  });

  // No user yet: there's nothing to log in to.
  if (status.data?.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return (
    <div className="m-4">
      <h1>Log in to Porla</h1>
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
                autoComplete="current-password"
              />
            )}
          />

          <form.SaveError error={authLogin.error} />
          <form.SubmitButton label="Log in" />
        </form.Form>
      </form.AppForm>
    </div>
  );
}
