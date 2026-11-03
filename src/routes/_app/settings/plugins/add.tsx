import { useInvoker, useRpcCache } from "@/api";
import { useAppForm } from "@/components/form/app-form";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsSection } from "@/components/settings/settings-section";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { absolutePath } from "@/lib/paths";

export const Route = createFileRoute("/_app/settings/plugins/add")({
  component: RouteComponent,
});

const addSchema = z.object({
  path: absolutePath(),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const cache = useRpcCache();

  const add = useInvoker("plugins.add", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("plugins.list"),
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
        params: { id },
      });
    },
  });

  return (
    <SettingsSection title="Add plugin">
      <SettingsCard>
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
      </SettingsCard>
    </SettingsSection>
  );
}
