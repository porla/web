import { useInvoker, useRpcCache } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import { ShowApiKeyModal } from "@/components/modals/show-api-key-modal";
import { useAppForm } from "@/components/form/app-form";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsSection } from "@/components/settings/settings-section";

export const Route = createFileRoute("/_app/settings/api-keys/add")({
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
  const cache = useRpcCache();

  const create = useInvoker("auth.keys.create", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("auth.keys.list"),
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
    <SettingsSection title="Add API key">
      <SettingsCard>
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
      </SettingsCard>
    </SettingsSection>
  );
}
