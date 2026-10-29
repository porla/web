import { useInvoker, useRPC } from "@/api";
import { TorrentListColumns } from "@/components/lists/torrents";
import { useAppForm } from "@/hooks/form";
import { useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_status/settings/_layout/views")({
  component: RouteComponent,
});

function RouteComponent() {
  const torrentsColumns = TorrentListColumns();
  const knownCols = new Set(Object.keys(torrentsColumns));

  const userCols = useRPC("kv.get", {
    keys: ["webui.lists.torrents.cols"],
  });

  if (userCols.isLoading || !userCols.data) {
    return <>loading</>;
  }

  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  const raw = userCols.data.values["webui.lists.torrents.cols"];

  const selectedCols: (keyof typeof torrentsColumns)[] =
    isStringArray(raw) && raw.length
      ? (raw.filter((c) =>
          knownCols.has(c),
        ) as (keyof typeof torrentsColumns)[])
      : (
          Object.keys(torrentsColumns) as (keyof typeof torrentsColumns)[]
        ).filter((c) => torrentsColumns[c].default);

  return <EditTorrentListForm initialCols={selectedCols} />;
}

function EditTorrentListForm({ initialCols }: { initialCols: string[] }) {
  const queryClient = useQueryClient();

  // The torrent list reads the same key.
  const updateCols = useInvoker("kv.set", {
    meta: { silent: true },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["kv.get", { keys: ["webui.lists.torrents.cols"] }],
      }),
  });

  const torrentsColumns = TorrentListColumns();
  const knownCols = new Set(Object.keys(torrentsColumns));

  type ColKey = keyof typeof torrentsColumns;

  const allCols = Object.keys(torrentsColumns) as ColKey[];

  const nameOf = (c: ColKey) =>
    torrentsColumns[c].name ?? torrentsColumns[c].title;

  const form = useAppForm({
    defaultValues: {
      cols: initialCols.filter((c) => knownCols.has(c)) as ColKey[],
    },
    onSubmit: async ({ value }) => {
      await updateCols.mutateAsync({
        values: {
          "webui.lists.torrents.cols": value.cols,
        },
      });
    },
  });

  const cols = useSelector(form.store, (state) => state.values.cols);

  const saved =
    updateCols.isSuccess &&
    updateCols.variables.values["webui.lists.torrents.cols"]?.toString() ===
      cols.toString();

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="cols" mode="array">
          {(field) => {
            const selected = field.state.value;
            const available = allCols.filter((c) => !selected.includes(c));

            return (
              <div className="flex flex-col gap-4">
                {/* The list reads an empty selection as "the defaults". */}
                {selected.length === 0 && (
                  <div className="text-warning">Pick at least one column</div>
                )}

                <ul className="menu bg-base-200 rounded-box w-full">
                  {selected.map((col, i) => (
                    <li
                      key={col}
                      className="flex flex-row items-center justify-between"
                    >
                      <span title={torrentsColumns[col].description}>
                        {nameOf(col)}
                      </span>
                      <div className="join">
                        <button
                          type="button"
                          className="btn btn-xs join-item"
                          disabled={i === 0}
                          onClick={() => field.moveValue(i, i - 1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs join-item"
                          disabled={i === selected.length - 1}
                          onClick={() => field.moveValue(i, i + 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-error join-item"
                          onClick={() => field.removeValue(i)}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {available.length > 0 && (
                  <ul className="menu bg-base-100 rounded-box w-64">
                    {available.map((col) => (
                      <li key={col}>
                        <button
                          type="button"
                          onClick={() => field.pushValue(col)}
                        >
                          + {nameOf(col)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }}
        </form.AppField>

        <form.SaveError error={updateCols.error} />
        <form.Saved show={saved} />
        <form.SubmitButton label="Save" disabled={cols.length === 0} />
      </form.Form>
    </form.AppForm>
  );
}
