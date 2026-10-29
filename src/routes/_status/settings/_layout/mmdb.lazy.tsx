import { RpcError, useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createLazyFileRoute("/_status/settings/_layout/mmdb")({
  component: RouteComponent,
});

const MMDB_PATH = "porla.mmdb.path";
const PROBE = "1.1.1.1";

function RouteComponent() {
  const mmdbSettings = useRPC("kv.get", {
    keys: [MMDB_PATH],
  });

  if (mmdbSettings.isLoading) {
    return <>loading</>;
  }

  const path = mmdbSettings.data?.values[MMDB_PATH];

  return (
    <div>
      <Suspense fallback={"Loading"}>
        <LookupForm />
        <div className="mt-10">
          <h1>Set MMDB database path</h1>
          <PathForm savedPath={typeof path === "string" ? path : ""} />
        </div>
      </Suspense>
    </div>
  );
}

function PathForm({ savedPath }: { savedPath: string }) {
  const queryClient = useQueryClient();

  const status = useRPC(
    "mmdb.lookup",
    { values: [PROBE] },
    { meta: { silent: true } },
  );

  const notLoaded =
    status.error instanceof RpcError && status.error.code === -1;

  const setKey = useInvoker("kv.set", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      path: savedPath,
    },
    onSubmit: async ({ value }) => {
      await setKey.mutateAsync({ values: { [MMDB_PATH]: value.path } });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["kv.get", { keys: [MMDB_PATH] }],
        }),
        queryClient.invalidateQueries({ queryKey: ["mmdb.lookup"] }),
      ]);
    },
  });

  const path = useSelector(form.store, (state) => state.values.path);

  // Once the status is fetched again after the save.
  const saved =
    setKey.isSuccess &&
    setKey.variables?.values[MMDB_PATH] === path &&
    !status.isFetching;

  return (
    <form.AppForm>
      <p className="my-2 text-sm">
        {status.isLoading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : status.isSuccess ? (
          <span className="text-success">Database loaded</span>
        ) : notLoaded ? (
          <span className="opacity-60">No database loaded</span>
        ) : (
          <span className="text-error">{status.error?.message}</span>
        )}
      </p>

      <form.Form>
        <form.AppField
          name="path"
          children={(field) => (
            <field.TextField
              label="MMDB file path"
              description="An (absolute) path on the Porla server"
            />
          )}
        />

        <form.SaveError error={setKey.error} />

        {saved && path && notLoaded ? (
          <div role="alert" className="alert alert-warning alert-soft">
            Saved, but porla couldn't load a database from this path. Its log
            says why.
          </div>
        ) : (
          <form.Saved show={saved} />
        )}

        <form.SubmitButton label="Save" />
      </form.Form>
    </form.AppForm>
  );
}

function LookupForm() {
  const lookup = useInvoker("mmdb.lookup", { meta: { silent: true } });

  const form = useAppForm({
    defaultValues: {
      key: "",
    },
    onSubmit: async ({ value }) => {
      await lookup.mutateAsync({ values: [value.key] });
    },
  });

  return (
    <div>
      <h1>Lookup MMDB key</h1>
      <form.AppForm>
        <form.Form>
          <form.AppField
            name="key"
            children={(field) => <field.TextField label="Key" />}
          />

          <form.SaveError error={lookup.error} />
          <form.SubmitButton label="Lookup" />
        </form.Form>
      </form.AppForm>

      {lookup.data && (
        <pre>
          <code>{JSON.stringify(lookup.data, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}
