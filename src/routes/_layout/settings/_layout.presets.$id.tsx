import { useInvoker, useRPC, type Preset, type PresetsGet } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_layout/settings/_layout/presets/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const preset = useRPC<PresetsGet>("presets.get", { id: parseInt(id, 10) });

  if (preset.isLoading) {
    return <>loading</>;
  }

  if (preset.error) {
    return <>{preset.error.message}</>;
  }

  if (!preset.data?.preset) {
    return <>no preset data?</>;
  }

  return (
    <div>
      <Suspense fallback={"Loading"}>
        <PresetForm preset={preset.data.preset} />
      </Suspense>
    </div>
  );
}

type PresetFormProps = {
  preset: Preset;
};

function PresetForm({ preset }: PresetFormProps) {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();

  const remove = useInvoker("presets.remove", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
  });

  const update = useInvoker("presets.update", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presets.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      ...preset,
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        ...value,
        id: preset.id,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.AppField
        name="name"
        children={(field) => <field.TextField label="Name" />}
      />

      <form.AppField
        name="is_default"
        children={(field) => <field.CheckboxField label="Is default" />}
      />

      <form.AppField
        name="category"
        children={(field) => <field.TextField label="Category" />}
      />

      <form.AppField
        name="download_limit"
        children={(field) => <field.NumberField label="Download limit" />}
      />

      <form.AppField
        name="max_connections"
        children={(field) => <field.NumberField label="Max connections" />}
      />

      <form.AppField
        name="max_uploads"
        children={(field) => <field.NumberField label="Max uploads" />}
      />

      <form.AppField
        name="save_path"
        children={(field) => <field.TextField label="Save path" />}
      />

      <form.AppField
        name="upload_limit"
        children={(field) => <field.NumberField label="Upload limit" />}
      />

      <form.AppForm>
        <form.SubmitButton label="Update" />
      </form.AppForm>

      <button
        type="button"
        disabled={preset.is_default}
        className="btn btn-warning ml-3"
        onClick={async () => {
          await remove.mutateAsync({ id: preset.id });
          await navigate({ to: "/settings" });
        }}
      >
        Remove
      </button>
    </form>
  );
}
