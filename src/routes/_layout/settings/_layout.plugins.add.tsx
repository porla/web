import { useInvoker } from "@/api";
import { useAppForm } from "@/hooks/form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/settings/_layout/plugins/add")({
  component: RouteComponent,
});

function RouteComponent() {
  const add = useInvoker("plugins.add");

  const form = useAppForm({
    defaultValues: {
      path: "",
    },
    onSubmit: async ({ value }) => {
      const p = await add.mutateAsync({
        path: value.path,
      });

      console.log(p);
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
        name="path"
        children={(field) => <field.TextField label="Path" />}
      />

      <form.AppForm>
        <form.SubmitButton label="Add plugin" />
      </form.AppForm>
    </form>
  );
}
