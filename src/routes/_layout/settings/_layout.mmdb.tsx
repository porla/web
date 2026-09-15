import { useInvoker, useRPC } from "@/api";
import { useAppForm } from "@/hooks/form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_layout/settings/_layout/mmdb")({
  component: RouteComponent,
});

function RouteComponent() {
  const mmdbSettings = useRPC<any>("kv.get", {
    keys: ["porla.mmdb.path"],
  });

  const setKey = useInvoker("kv.set");

  const form = useAppForm({
    defaultValues: {
      path: mmdbSettings.data?.values["porla.mmdb.path"],
    },
    onSubmit: async ({ value }) => {
      await setKey.mutateAsync({
        values: {
          "porla.mmdb.path": value.path,
        },
      });
    },
  });

  if (mmdbSettings.isLoading) {
    return <>loading</>;
  }

  return (
    <div>
      <LookupForm />
      <div className="mt-10">
        <h1>Set MMDB database path</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField
            name="path"
            children={(field) => <field.TextField label="MMDB file path" />}
          />

          <form.AppForm>
            <form.SubmitButton label="Upload" />
          </form.AppForm>
        </form>
      </div>
    </div>
  );
}

function LookupForm() {
  const lookup = useInvoker("mmdb.lookup");
  const [result, setResult] = useState<any>();

  const form = useAppForm({
    defaultValues: {
      key: "",
    },
    onSubmit: async ({ value }) => {
      setResult(await lookup.mutateAsync({ values: [value.key] }));
    },
  });

  return (
    <div>
      <h1>Lookup MMDB key</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField
          name="key"
          children={(field) => <field.TextField label="Key" />}
        />

        <form.AppForm>
          <form.SubmitButton label="Lookup" />
        </form.AppForm>
      </form>

      <pre>
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </div>
  );
}
