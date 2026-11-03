import { useInvoker, useRPC, useRpcCache } from "@/api";
import { useAppForm } from "@/components/form/app-form";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsSection } from "@/components/settings/settings-section";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_app/settings/presets/add")({
  component: RouteComponent,
});

const addSchema = (taken: string[]) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Preset name is required")
      .refine((n) => !taken.includes(n), "Preset name taken"),
  });

function RouteComponent() {
  const navigate = Route.useNavigate();
  const cache = useRpcCache();

  const presets = useRPC("presets.list");
  const taken = (presets.data?.presets ?? []).map((p) => p.name);

  const add = useInvoker("presets.add", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("presets.list"),
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onMount: addSchema(taken),
      onChange: addSchema(taken),
    },
    onSubmit: async ({ value }) => {
      const result = await add.mutateAsync({ name: value.name.trim() });

      await navigate({
        to: "/settings/presets/$id",
        params: { id: result.id },
      });
    },
  });

  return (
    <SettingsSection title="Add preset">
      <SettingsCard>
        <form.AppForm>
          <form.Form>
            <form.AppField
              name="name"
              children={(field) => <field.TextField label="Name" />}
            />

            <form.SaveError error={add.error} />
            <form.SubmitButton label="Add preset" />
          </form.Form>
        </form.AppForm>
      </SettingsCard>
    </SettingsSection>
  );
}
