import {
  RpcCode,
  isRpcError,
  useInvoker,
  useKv,
  useRPC,
  useRpcCache,
} from "@/api";
import { useAppForm } from "@/components/form/app-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { Spinner } from "@/components/ui/spinner";
import { useSelector } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/mmdb")({
  component: RouteComponent,
});

const MMDB_PATH = "porla.mmdb.path";
const PROBE = "1.1.1.1";

function RouteComponent() {
  const mmdbPath = useKv(MMDB_PATH);

  if (mmdbPath.query.isLoading) {
    return <Spinner size="xl" />;
  }

  const path = mmdbPath.value;

  return (
    <div className="space-y-10">
      <LookupForm />

      <SettingsSection title="Set MMDB database path">
        <PathForm savedPath={typeof path === "string" ? path : ""} />
      </SettingsSection>
    </div>
  );
}

function PathForm({ savedPath }: { savedPath: string }) {
  const cache = useRpcCache();
  const kv = useKv(MMDB_PATH);

  const status = useRPC(
    "mmdb.lookup",
    { values: [PROBE] },
    { meta: { errorToast: false } },
  );

  const notLoaded = isRpcError(status.error, RpcCode.MmdbNotLoaded);

  const form = useAppForm({
    defaultValues: {
      path: savedPath,
    },
    onSubmit: async ({ value }) => {
      await kv.set.mutateAsync(value.path);
      await cache.invalidate("mmdb.lookup");
    },
  });

  const path = useSelector(form.store, (state) => state.values.path);

  // Once the status is fetched again after the save.
  const saved =
    kv.set.isSuccess && kv.set.variables === path && !status.isFetching;

  return (
    <form.AppForm>
      <p className="my-2 text-sm">
        {status.isLoading ? (
          <Spinner size="xs" />
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

        <form.SaveError error={kv.set.error} />

        {saved && path && notLoaded ? (
          <div role="alert" className="alert alert-warning alert-soft">
            Saved, but Porla couldn't load a database from this path. Its log
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
  const lookup = useInvoker("mmdb.lookup", { meta: { errorToast: false } });

  const form = useAppForm({
    defaultValues: {
      key: "",
    },
    onSubmit: async ({ value }) => {
      await lookup.mutateAsync({ values: [value.key] });
    },
  });

  return (
    <SettingsSection title="Look up an MMDB key">
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
    </SettingsSection>
  );
}
