import { AuthError, useInvoker, type Torrent } from "@/api";
import { useModal } from "@/components/modal/use-modal";
import {
  BulkMigrateModal,
  BulkMoveModal,
  BulkPropertiesModal,
  BulkRemoveModal,
  type BulkProperties,
} from "@/components/modals/bulk-modals";
import { Spinner } from "@/components/ui/spinner";
import type { Checked } from "@/hooks/use-checked";
import { Check, ChevronDown, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { torrentCount } from "@/lib/format";

const PARALLEL = 4;

type Outcome = {
  text: string;
  failed: { t: Torrent; message: string }[];
};

// A popover menu closes once one of its buttons is clicked (a click inside it
// doesn't dismiss it).
const closeOnAction = (e: MouseEvent<HTMLElement>) => {
  if ((e.target as Element).closest("button")) e.currentTarget.hidePopover();
};

function MenuItem({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => unknown;
  className?: string;
}) {
  return (
    <li>
      <button className={className} onClick={onClick}>
        {label}
      </button>
    </li>
  );
}

// "3 selected", an Actions menu like a row's, and how the last action went.
// Shown next to the search while torrents are checked.
export function BulkActions({
  checked,
  session_id,
  onLeft,
}: {
  checked: Checked;
  session_id: number;
  // Torrents that left the session (removed, migrated).
  onLeft: (torrents: Torrent[]) => void;
}) {
  const modal = useModal();
  const noToast = { meta: { errorToast: false } };

  const pause = useInvoker("torrents.pause", noToast);
  const resume = useInvoker("torrents.resume", noToast);
  const recheck = useInvoker("torrents.recheck", noToast);
  const move = useInvoker("torrents.move", noToast);
  const migrate = useInvoker("torrents.migrate", noToast);
  const properties = useInvoker("torrents.properties.set", noToast);
  const remove = useInvoker("torrents.remove", noToast);
  const queueTop = useInvoker("torrents.queue.top", noToast);
  const queueUp = useInvoker("torrents.queue.up", noToast);
  const queueDown = useInvoker("torrents.queue.down", noToast);
  const queueBottom = useInvoker("torrents.queue.bottom", noToast);

  const [running, setRunning] = useState<{
    label: string;
    done: number;
    total: number;
  } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const stop = useRef(false);

  // A success says so briefly; failures stay until the next action.
  useEffect(() => {
    if (!outcome || outcome.failed.length > 0) return;
    const timer = setTimeout(() => setOutcome(null), 4000);
    return () => clearTimeout(timer);
  }, [outcome]);

  const run = async (
    label: string,
    done: string,
    targets: Torrent[],
    call: (t: Torrent) => Promise<unknown>,
    { sequential = false, leaves = false } = {},
  ) => {
    if (targets.length === 0) return;

    stop.current = false;
    setOutcome(null);
    setRunning({ label, done: 0, total: targets.length });

    const ok: Torrent[] = [];
    const failed: Outcome["failed"] = [];
    let next = 0;

    const worker = async () => {
      while (next < targets.length && !stop.current) {
        const t = targets[next++];
        try {
          await call(t);
          ok.push(t);
          // Right away: the details panel would notice and complain first.
          if (leaves) onLeft([t]);
        } catch (err) {
          // The global handler is already on its way to the login page.
          if (err instanceof AuthError) {
            stop.current = true;
            return;
          }
          failed.push({
            t,
            message: err instanceof Error ? err.message : String(err),
          });
        }
        setRunning((r) => r && { ...r, done: r.done + 1 });
      }
    };

    await Promise.all(
      Array.from({ length: sequential ? 1 : PARALLEL }, worker),
    );

    setRunning(null);

    const skipped = targets.length - ok.length - failed.length;

    setOutcome({
      text:
        `${done} ${failed.length || skipped ? `${ok.length} of ${targets.length}` : torrentCount(ok.length)}` +
        (failed.length ? ` · ${failed.length} failed` : "") +
        (skipped ? ` · ${skipped} not run` : ""),
      failed,
    });

    // What failed stays checked, so running the action again retries it.
    if (failed.length) checked.keep(failed.map((f) => f.t));
  };

  const ref = (t: Torrent) => ({ info_hash: t.info_hash, session_id });
  const targets = checked.torrents;
  // Queue moves only apply to queued torrents, one at a time and in an order
  // that keeps theirs: the last one first when moving to the top or down.
  const queued = targets.filter((t) => t.queue_position >= 0);
  const byPosition = (desc: boolean) =>
    [...queued].sort((a, b) =>
      desc
        ? b.queue_position - a.queue_position
        : a.queue_position - b.queue_position,
    );

  const updateProperties = async (t: Torrent, changes: BulkProperties) => {
    const params: Parameters<typeof properties.mutateAsync>[0] = {
      ...ref(t),
      ...changes.common,
    };

    // Porla replaces the tags: each torrent's own, plus and minus what was
    // asked, and only if that changes them.
    if (changes.addTags.length || changes.removeTags.length) {
      const now = t.$userdata?.tags ?? [];
      const next = [
        ...new Set([
          ...now.filter((x) => !changes.removeTags.includes(x)),
          ...changes.addTags,
        ]),
      ];

      if (next.toSorted().join() !== now.toSorted().join()) {
        params.tags = next;
      }
    }

    // Nothing to change on this one.
    if (Object.keys(params).length > 2) {
      await properties.mutateAsync(params);
    }
  };

  const queueMoves = [
    {
      label: "Top",
      doing: "Moving to the top",
      done: "Moved to the top:",
      lastFirst: true,
      call: queueTop,
    },
    {
      label: "Up",
      doing: "Moving up",
      done: "Moved up:",
      lastFirst: false,
      call: queueUp,
    },
    {
      label: "Down",
      doing: "Moving down",
      done: "Moved down:",
      lastFirst: true,
      call: queueDown,
    },
    {
      label: "Bottom",
      doing: "Moving to the bottom",
      done: "Moved to the bottom:",
      lastFirst: false,
      call: queueBottom,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {checked.count > 0 && (
        <div className="join">
          <span className="join-item btn pointer-events-none tabular-nums">
            {checked.count} selected
          </span>
          <button
            type="button"
            className="join-item btn btn-square"
            aria-label="Clear the selection"
            title="Clear the selection (Esc)"
            disabled={!!running}
            onClick={() => checked.setAll(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {running ? (
        <div role="status" className="flex items-center gap-2 text-sm">
          <Spinner size="sm" />

          <span className="tabular-nums">
            {running.label} {running.done} / {running.total}
          </span>

          <progress
            className="progress progress-primary w-24"
            value={running.done}
            max={running.total}
          />

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => (stop.current = true)}
          >
            Stop
          </button>
        </div>
      ) : (
        checked.count > 0 && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              popoverTarget="bulk-actions"
              style={{ anchorName: "--bulk-actions" }}
            >
              Actions
              <ChevronDown className="size-4" />
            </button>

            <ul
              id="bulk-actions"
              popover="auto"
              className="dropdown dropdown-end menu w-56 rounded-box bg-base-100 shadow-sm"
              style={{ positionAnchor: "--bulk-actions" }}
              onClick={closeOnAction}
            >
              <MenuItem
                label="Resume"
                onClick={() =>
                  run("Resuming", "Resumed", targets, (t) =>
                    resume.mutateAsync(ref(t)),
                  )
                }
              />
              <MenuItem
                label="Pause"
                onClick={() =>
                  run("Pausing", "Paused", targets, (t) =>
                    pause.mutateAsync(ref(t)),
                  )
                }
              />
              <MenuItem
                label="Recheck"
                onClick={() =>
                  run("Rechecking", "Started a recheck of", targets, (t) =>
                    recheck.mutateAsync(ref(t)),
                  )
                }
              />
              <MenuItem
                label="Migrate"
                onClick={async () => {
                  const target = await modal.show(BulkMigrateModal, {
                    torrents: targets,
                    session_id,
                  });
                  if (target === undefined) return;

                  await run(
                    "Migrating",
                    "Migrated",
                    targets,
                    (t) =>
                      migrate.mutateAsync({
                        ...ref(t),
                        target_session_id: target,
                      }),
                    { leaves: true },
                  );
                }}
              />
              <MenuItem
                label="Move"
                onClick={async () => {
                  const path = await modal.show(BulkMoveModal, {
                    torrents: targets,
                  });
                  if (path === undefined) return;

                  await run("Moving", "Moved", targets, (t) =>
                    move.mutateAsync({ ...ref(t), path }),
                  );
                }}
              />
              {queued.length > 0 && (
                <li>
                  <details>
                    <summary>
                      Queuing
                      {queued.length < targets.length &&
                        ` (${queued.length} queued)`}
                    </summary>
                    <ul>
                      {queueMoves.map((q) => (
                        <MenuItem
                          key={q.label}
                          label={q.label}
                          onClick={() =>
                            run(
                              q.doing,
                              q.done,
                              byPosition(q.lastFirst),
                              (t) => q.call.mutateAsync(ref(t)),
                              { sequential: true },
                            )
                          }
                        />
                      ))}
                    </ul>
                  </details>
                </li>
              )}

              <MenuItem
                label="Remove"
                className="text-error"
                onClick={async () => {
                  const options = await modal.show(BulkRemoveModal, {
                    torrents: targets,
                  });
                  if (!options) return;

                  await run(
                    "Removing",
                    "Removed",
                    targets,
                    (t) => remove.mutateAsync({ ...ref(t), ...options }),
                    { leaves: true },
                  );
                }}
              />
              <MenuItem
                label="Properties"
                onClick={async () => {
                  const changes = await modal.show(BulkPropertiesModal, {
                    torrents: targets,
                  });
                  if (!changes) return;

                  await run("Updating", "Updated", targets, (t) =>
                    updateProperties(t, changes),
                  );
                }}
              />
            </ul>
          </>
        )
      )}

      {outcome && !running && (
        <Result outcome={outcome} onDismiss={() => setOutcome(null)} />
      )}
    </div>
  );
}

function Result({
  outcome,
  onDismiss,
}: {
  outcome: Outcome;
  onDismiss: () => void;
}) {
  if (outcome.failed.length === 0) {
    return (
      <span
        role="status"
        className="flex items-center gap-1 text-sm text-success"
      >
        <Check className="size-4" />
        {outcome.text}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-soft btn-error"
        popoverTarget="bulk-failures"
        style={{ anchorName: "--bulk-failures" }}
      >
        <TriangleAlert className="size-4" />
        {outcome.text}
      </button>
      <div
        id="bulk-failures"
        popover="auto"
        role="alert"
        className="dropdown dropdown-end w-96 max-w-[calc(100vw-2rem)] rounded-box bg-base-100 p-3 text-sm shadow-sm"
        style={{ positionAnchor: "--bulk-failures" }}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-base-content/70">
            These are still selected: run the action again to retry.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Dismiss"
            onClick={(e) => {
              e.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
              onDismiss();
            }}
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {outcome.failed.map(({ t, message }) => (
            <li key={t.info_hash.join()}>
              <div className="truncate font-medium">{t.name}</div>
              <div className="text-error">{message}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
