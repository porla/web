import { useInvoker } from "@/api";
import { useModal } from "@/components/modal";
import ShowApiKeyModal from "@/components/modals/apikey-show";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import z from "zod";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/api-keys/add",
)({
  component: RouteComponent,
});

const addSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a name", abort: true })
    .refine(
      (n) => new TextEncoder().encode(n).length <= 1024,
      "At most 1024 bytes",
    ),
  expires_at: z
    .number()
    .refine((t) => t > Date.now() / 1000, "Expiry must be in the future")
    .nullable(),
});

function RouteComponent() {
  const { show } = useModal();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const create = useInvoker("auth.keys.create", {
    meta: { silent: true },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["auth.keys.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      expires_at: null as number | null,
    },
    validators: {
      onMount: addSchema,
      onChange: addSchema,
    },
    onSubmit: async ({ value }) => {
      const d = await create.mutateAsync(addSchema.parse(value));

      await show(ShowApiKeyModal, {
        createdKey: d.key,
      });

      await navigate({ to: "/settings/api-keys" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Add API key</h2>
      </div>

      <div className="card bg-base-200 shadow-sm w-full">
        <div className="card-body">
          <Suspense>
            <form.AppForm>
              <form.Form>
                <form.AppField
                  name="name"
                  children={(field) => <field.TextField label="Name" />}
                />

                <form.AppField
                  name="expires_at"
                  children={(field) => (
                    <field.DateField label="Expires at (optional, inclusive)" />
                  )}
                />

                <form.SaveError error={create.error} />
                <form.SubmitButton label="Add API key" />
              </form.Form>
            </form.AppForm>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
