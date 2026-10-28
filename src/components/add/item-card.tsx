import type { Session } from "@/api";
import { withForm } from "@/hooks/form";
import { peerLimit, rateLimit } from "@/limits";
import { useSelector } from "@tanstack/react-form";
import clsx from "clsx";
import { ChevronDown, FileIcon, Magnet, TriangleAlert, X } from "lucide-react";
import z from "zod";
import { emptyOptions, type AddOptions, type Item } from "./items";

export type Choices = {
  presets: { id: number; name: string }[];
  sessions: Session[];
};

const savePath = z
  .string()
  .refine(
    (p) => p.trim() === "" || /^(\/|[A-Za-z]:[\\/])/.test(p.trim()),
    "Use an absolute path, like /downloads",
  );

// The text and number options, laid out in the rows below.
const fields: Record<
  Exclude<keyof AddOptions, "preset_id" | "session_id">,
  { label: string; rule?: z.ZodType }
> = {
  save_path: { label: "Save path", rule: savePath },
  category: { label: "Category" },
  tags: { label: "Tags (comma separated)" },
  download_limit: { label: "Download limit (B/s)", rule: rateLimit },
  upload_limit: { label: "Upload limit (B/s)", rule: rateLimit },
  max_connections: { label: "Max connections", rule: peerLimit },
  max_uploads: { label: "Max uploads", rule: peerLimit },
};

const limits = [
  "download_limit",
  "upload_limit",
  "max_connections",
  "max_uploads",
] as const;

const optionKeys = Object.keys(emptyOptions) as (keyof AddOptions)[];

// One torrent: what it is and how it's doing in the header, its options in
// the body. Bodies stay mounted while collapsed, so submitting validates and
// flags every torrent.
export const ItemCard = withForm({
  defaultValues: { items: [] as Item[] },
  props: {} as {
    index: number;
    count: number;
    open: boolean;
    choices: Choices;
    onToggle: () => void;
    onRemove: () => void;
    onCopyToAll: () => void;
  },
  render: function Render({
    form,
    index,
    count,
    open,
    choices,
    onToggle,
    onRemove,
    onCopyToAll,
  }) {
    const item = useSelector(form.store, (s) => s.values.items[index]);
    const invalid = useSelector(form.store, (s) =>
      optionKeys.some(
        (k) => s.fieldMeta[`items[${index}].options.${k}`]?.errors.length,
      ),
    );

    if (!item) return null;

    const o = item.options;
    const set = [
      choices.presets.find((p) => p.id === o.preset_id)?.name,
      o.save_path.trim(),
      o.category.trim(),
      o.tags.trim() && `tags: ${o.tags.trim()}`,
    ].filter(Boolean);
    const name = (key: keyof AddOptions) =>
      `items[${index}].options.${key}` as const;

    const option = (key: keyof typeof fields) => {
      const { label, rule } = fields[key];
      return (
        <form.AppField
          key={key}
          name={name(key)}
          validators={{
            onChange: ({ value }) =>
              rule?.safeParse(value).error?.issues[0].message,
          }}
          children={(f) =>
            typeof emptyOptions[key] === "string" ? (
              <f.TextField label={label} />
            ) : (
              <f.NumberField label={label} />
            )
          }
        />
      );
    };

    return (
      <li
        className={clsx(
          "rounded-box border bg-base-100 text-sm",
          item.error || invalid ? "border-error/60" : "border-base-300",
        )}
      >
        <div className="flex items-start gap-2 p-3">
          {item.file ? (
            <FileIcon className="mt-0.5 size-4 shrink-0 opacity-60" />
          ) : (
            <Magnet className="mt-0.5 size-4 shrink-0 opacity-60" />
          )}

          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            aria-expanded={open}
            onClick={onToggle}
          >
            <span className="font-semibold wrap-anywhere">{item.name}</span>
            {item.adding && (
              <span className="loading loading-spinner loading-xs ml-2" />
            )}
            {invalid && (
              <span className="badge badge-xs badge-soft badge-error ml-2">
                Check options
              </span>
            )}
            <div className="opacity-70 wrap-anywhere">
              {[item.detail, ...set].join(" · ")}
            </div>
          </button>

          <ChevronDown
            className={clsx(
              "mt-0.5 size-4 shrink-0 opacity-60",
              open && "rotate-180",
            )}
          />

          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            aria-label={`Remove ${item.name}`}
            onClick={onRemove}
          >
            <X className="size-4" />
          </button>
        </div>

        {item.error && (
          <div
            role="alert"
            className="-mt-2 flex gap-1 px-3 pb-3 pl-9 text-error"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Not added: {item.error}
          </div>
        )}

        <div
          className={clsx(
            // Inputs fill their grid cells instead of daisyUI's fixed width.
            "border-t border-base-300 p-3 pt-0 [&_.input]:w-full [&_.select]:w-full",
            !open && "hidden",
          )}
        >
          {/* Where it goes, how it's labeled, how fast it may go. */}
          <div className="grid gap-x-3 sm:grid-cols-2">
            <form.AppField
              name={name("preset_id")}
              children={(f) => (
                <f.SelectField
                  label="Preset"
                  items={choices.presets.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                />
              )}
            />
            {choices.sessions.length > 1 && (
              <form.AppField
                name={name("session_id")}
                children={(f) => (
                  <f.SelectField
                    label="Session"
                    items={choices.sessions.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                  />
                )}
              />
            )}
          </div>
          {option("save_path")}
          <div className="grid gap-x-3 sm:grid-cols-2">
            {option("category")}
            {option("tags")}
          </div>
          <div className="grid grid-cols-2 gap-x-3 lg:grid-cols-4">
            {limits.map(option)}
          </div>

          {count > 1 && (
            <button
              type="button"
              className="btn btn-sm mt-3"
              onClick={onCopyToAll}
            >
              Use these options for all {count} torrents
            </button>
          )}
        </div>
      </li>
    );
  },
});
