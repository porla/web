import type { TorrentFlag } from "@/api";
import { useFieldContext } from "@/hooks/form-context";
import { torrentFlags } from "@/torrent-flags";
import clsx from "clsx";
import { useId } from "react";

export type FlagsValue = { flags: TorrentFlag[]; mask: TorrentFlag[] };

type State = "on" | "off" | "unset";

const STATES: { state: State; label: string }[] = [
  { state: "on", label: "On" },
  { state: "off", label: "Off" },
  { state: "unset", label: "Not set" },
];

// "preset": each flag is on, off or not set (left to libtorrent's default).
// "torrent": each flag is on or off, starting from the torrent's flags; the
// mask holds only the flags that were changed.
export default function FlagsField({
  label,
  mode,
  flags,
}: {
  label?: string;
  mode: "preset" | "torrent";
  flags: TorrentFlag[];
}) {
  const field = useFieldContext<FlagsValue>();
  const id = useId();

  const value = field.state.value;

  const set = (flag: TorrentFlag, state: State) => {
    const on = value.flags.filter((f) => f !== flag);
    const mask = value.mask.filter((f) => f !== flag);

    if (state === "on") {
      on.push(flag);
    }

    if (mode === "preset" && state !== "unset") {
      mask.push(flag);
    }

    // Toggling a flag back leaves it unchanged.
    if (mode === "torrent" && !value.mask.includes(flag)) {
      mask.push(flag);
    }

    field.handleChange({ flags: on, mask });
  };

  const stateOf = (flag: TorrentFlag): State =>
    mode === "preset" && !value.mask.includes(flag)
      ? "unset"
      : value.flags.includes(flag)
        ? "on"
        : "off";

  return (
    <div className="fieldset">
      {label && <span className="label">{label}</span>}

      <ul className="max-w-2xl divide-y divide-base-300">
        {flags.map((flag) => (
          <li
            key={flag}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="min-w-0">
              <div id={`${id}-${flag}`}>{torrentFlags[flag].label}</div>
              <div className="text-xs text-base-content/60">
                {torrentFlags[flag].description}
              </div>
            </div>

            {mode === "torrent" ? (
              <input
                type="checkbox"
                className={clsx(
                  "toggle toggle-sm shrink-0",
                  stateOf(flag) === "on" && "toggle-primary",
                )}
                aria-labelledby={`${id}-${flag}`}
                checked={stateOf(flag) === "on"}
                onChange={(e) => set(flag, e.target.checked ? "on" : "off")}
                onBlur={field.handleBlur}
              />
            ) : (
              <div
                role="radiogroup"
                aria-labelledby={`${id}-${flag}`}
                className="join shrink-0"
              >
                {STATES.map(({ state, label }) => (
                  <input
                    key={state}
                    type="radio"
                    // Not set is the default: don't make it stand out.
                    className={clsx(
                      "join-item btn btn-xs",
                      state === "unset" &&
                        "checked:border-base-300 checked:bg-base-300 checked:text-base-content",
                    )}
                    name={`${id}-${flag}`}
                    aria-label={label}
                    checked={stateOf(flag) === state}
                    onChange={() => set(flag, state)}
                    onBlur={field.handleBlur}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
