import { AuthError, useInvoker, useRPC, type InfoHash } from "@/api";
import { ItemCard, type Choices } from "@/components/add/item-card";
import {
  addError,
  addParams,
  emptyOptions,
  fileItem,
  magnetItem,
  readTorrent,
  type Item,
} from "@/components/add/items";
import Sources from "@/components/add/sources";
import { useAppForm } from "@/hooks/form";
import { useSelector } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

export const Route = createFileRoute("/_status/_main/add")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const add = useInvoker("torrents.add", { meta: { silent: true } });
  const presets = useRPC("presets.list");
  const sessions = useRPC("sessions.list");

  const [openId, setOpenId] = useState<number>();

  const form = useAppForm({
    defaultValues: {
      items: [] as Item[],
    },
    onSubmit: async ({ value }) => {
      // One at a time keeps the order and continues past failures. Each
      // added torrent leaves the list, so a retry only sends what's left.
      let added = 0;
      let last: { info_hash: InfoHash; session_id: number } | undefined;
      for (const item of value.items) {
        update(item.id, { adding: true, error: undefined });
        try {
          const source = item.file
            ? { ti: await readTorrent(item.file) }
            : { magnet_uri: item.uri };

          const r = await add.mutateAsync({
            ...source,
            ...addParams(item.options),
          });

          last = r;
          added++;

          remove(item.id);
        } catch (err) {
          update(item.id, { adding: false, error: addError(err) });
          // The global handler is already on its way to the login page.
          if (err instanceof AuthError) return;
        }
      }

      if (added === value.items.length) {
        // One torrent opens in the list; several show their session.
        await navigate({
          to: "/",
          search:
            added === 1 && last
              ? {
                  session_id: last.session_id,
                  selected_info_hash: last.info_hash,
                  selected_session_id: last.session_id,
                  selected_tab_id: "general",
                }
              : { session_id: last?.session_id },
        });
      }
    },
  });

  const items = useSelector(form.store, (s) => s.values.items);
  const busy = useSelector(form.store, (s) => s.isSubmitting);

  const update = (id: number, patch: Partial<Item>) =>
    form.setFieldValue("items", (cur) =>
      cur.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );

  // removeFieldValue also moves the field state of the torrents after it.
  const remove = (id: number) => {
    const index = form.getFieldValue("items").findIndex((i) => i.id === id);
    if (index >= 0) void form.removeFieldValue("items", index);
  };

  // New torrents start with the options of the last one in the list.
  function append(make: (options: Item["options"]) => Item[]) {
    const cur = form.getFieldValue("items");
    const fresh = make({ ...(cur.at(-1)?.options ?? emptyOptions) });
    for (const item of fresh) form.pushFieldValue("items", item);
    if (cur.length === 0 && fresh.length === 1) setOpenId(fresh[0].id);
  }

  const addFiles = (files: File[]) =>
    append((options) => files.map((f) => fileItem(f, { ...options })));

  const addMagnets = (text: string) =>
    append((options) =>
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((uri) => magnetItem(uri, { ...options })),
    );

  const copyToAll = (from: Item) =>
    form.setFieldValue("items", (cur) =>
      cur.map((i) => ({ ...i, options: { ...from.options } })),
    );

  const choices: Choices = {
    presets: presets.data?.presets ?? [],
    sessions: sessions.data?.sessions ?? [],
  };

  return (
    <div
      className="m-5 max-w-5xl"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (busy) return;
        if (e.dataTransfer.files.length) {
          addFiles(Array.from(e.dataTransfer.files));
        } else {
          addMagnets(e.dataTransfer.getData("text/plain"));
        }
      }}
    >
      <Suspense>
        <h1>Add torrents</h1>

        <form.AppForm>
          <form.Form>
            {/* A disabled fieldset disables every control in it while adding. */}
            <fieldset disabled={busy} className="mt-3 space-y-3">
              <Sources
                compact={items.length > 0}
                onFiles={addFiles}
                onMagnets={addMagnets}
              />
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    form={form}
                    index={index}
                    count={items.length}
                    open={openId === item.id}
                    choices={choices}
                    onToggle={() =>
                      setOpenId(openId === item.id ? undefined : item.id)
                    }
                    onRemove={() => remove(item.id)}
                    onCopyToAll={() => copyToAll(item)}
                  />
                ))}
              </ul>
            </fieldset>

            {/* Not disabled by validation: submitting is what shows each
                torrent's errors and flags the ones to fix. */}
            <button
              type="submit"
              className="btn btn-primary mt-4"
              disabled={busy || items.length === 0}
            >
              {items.length > 1
                ? `Add ${items.length} torrents`
                : "Add torrent"}
            </button>
          </form.Form>
        </form.AppForm>
      </Suspense>
    </div>
  );
}
