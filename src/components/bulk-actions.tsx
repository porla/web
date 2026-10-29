import { AuthError, useInvoker, type Torrent } from "@/api";
import { useModal } from "@/components/modal";
import {
  BulkMigrateModal,
  BulkMoveModal,
  BulkPropertiesModal,
  BulkRemoveModal,
} from "@/components/modals/bulk";
import type { Checked } from "@/hooks/use-checked";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

const plural = (n: number) => `${n} torrent${n === 1 ? "" : "s"}`;

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

// "3 selected", an Actions menu like a row's, and how the last action went.
// Shown next to the search while torrents are checked.
export default function BulkActions({
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
  const queryClient = useQueryClient();
  const silent = { meta: { silent: true } };

  const pause = useInvoker("torrents.pause", silent);
  const resume = useInvoker("torrents.resume", silent);
  const recheck = useInvoker("torrents.recheck", silent);
  const move = useInvoker("torrents.move", silent);
  const migrate = useInvoker("torrents.migrate", silent);
  const properties = useInvoker("torrents.properties.set", silent);
  const remove = useInvoker("torrents.remove", silent);
  const queueTop = useInvoker("torrents.queue.top", silent);
  const queueUp = useInvoker("torrents.queue.up", silent);
  const queueDown = useInvoker("torrents.queue.down", silent);
  const queueBottom = useInvoker("torrents.queue.bottom", silent);

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

    await queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("torrents."),
    });

    setRunning(null);

    const skipped = targets.length - ok.length - failed.length;

    setOutcome({
      text:
        `${done} ${failed.length || skipped ? `${ok.length} of ${targets.length}` : plural(ok.length)}` +
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
          <span className="loading loading-spinner loading-sm" />
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
              <li>
                <button
                  onClick={() =>
                    run("Resuming", "Resumed", targets, (t) =>
                      resume.mutateAsync(ref(t)),
                    )
                  }
                >
                  Resume
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    run("Pausing", "Paused", targets, (t) =>
                      pause.mutateAsync(ref(t)),
                    )
                  }
                >
                  Pause
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    run("Rechecking", "Started a recheck of", targets, (t) =>
                      recheck.mutateAsync(ref(t)),
                    )
                  }
                >
                  Recheck
                </button>
              </li>
              <li>
                <button
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
                >
                  Migrate
                </button>
              </li>
              <li>
                <button
                  onClick={async () => {
                    const path = await modal.show(BulkMoveModal, {
                      torrents: targets,
                    });
                    if (path === undefined) return;
                    await run("Moving", "Moved", targets, (t) =>
                      move.mutateAsync({ ...ref(t), path }),
                    );
                  }}
                >
                  Move
                </button>
              </li>
              {queued.length > 0 && (
                <li>
                  <details>
                    <summary>
                      Queuing
                      {queued.length < targets.length &&
                        ` (${queued.length} queued)`}
                    </summary>
                    <ul>
                      <li>
                        <button
                          onClick={() =>
                            run(
                              "Moving to the top",
                              "Moved to the top:",
                              byPosition(true),
                              (t) => queueTop.mutateAsync(ref(t)),
                              { sequential: true },
                            )
                          }
                        >
                          Top
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            run(
                              "Moving up",
                              "Moved up:",
                              byPosition(false),
                              (t) => queueUp.mutateAsync(ref(t)),
                              { sequential: true },
                            )
                          }
                        >
                          Up
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            run(
                              "Moving down",
                              "Moved down:",
                              byPosition(true),
                              (t) => queueDown.mutateAsync(ref(t)),
                              { sequential: true },
                            )
                          }
                        >
                          Down
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            run(
                              "Moving to the bottom",
                              "Moved to the bottom:",
                              byPosition(false),
                              (t) => queueBottom.mutateAsync(ref(t)),
                              { sequential: true },
                            )
                          }
                        >
                          Bottom
                        </button>
                      </li>
                    </ul>
                  </details>
                </li>
              )}
              <li>
                <button
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
                >
                  Remove
                </button>
              </li>
              <li>
                <button
                  onClick={async () => {
                    const changes = await modal.show(BulkPropertiesModal, {
                      torrents: targets,
                    });
                    if (!changes) return;
                    await run("Updating", "Updated", targets, async (t) => {
                      const params: Parameters<
                        typeof properties.mutateAsync
                      >[0] = { ...ref(t), ...changes.common };

                      // porla replaces the tags: each torrent's own, plus and
                      // minus what was asked, and only if that changes them.
                      if (changes.addTags.length || changes.removeTags.length) {
                        const now = t.$userdata?.tags ?? [];
                        const next = [
                          ...new Set([
                            ...now.filter(
                              (x) => !changes.removeTags.includes(x),
                            ),
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
                    });
                  }}
                >
                  Properties
                </button>
              </li>
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
