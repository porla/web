import { useInvoker } from "@/api";
import { useModal } from "@/components/modal";
import ShowApiKeyModal from "@/components/modals/apikey-show";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createLazyFileRoute(
  "/_status/settings/_layout/api-keys/add",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { show } = useModal();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const create = useInvoker("auth.keys.create", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["auth.keys.list"] }),
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      expires_at: null as number | null,
    },
    onSubmit: async ({ value }) => {
      const d = (await create.mutateAsync(value)) as any;

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
            <form
              className="space-y-4"
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
                name="expires_at"
                children={(field) => (
                  <field.DateField label="Expires at (optional, inclusive)" />
                )}
              />

              <form.AppForm>
                <form.SubmitButton label="Add API key" />
              </form.AppForm>
            </form>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
