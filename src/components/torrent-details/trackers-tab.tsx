import { POLL_MS, useRPC } from "@/api";
import { date, duration } from "@/lib/format";
import {
  trackerRows,
  trackerSources,
  type TrackerMessage,
  type TrackerRow,
} from "@/lib/torrent/trackers";
import clsx from "clsx";
import { RadioTower } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { ListState } from "@/components/ui/list-state";
import { Dash } from "@/components/ui/dash";
import { peerSources } from "@/lib/torrent/flags";
import { DetailsTable, type DetailsColumn } from "./details-table";
import { StateCell } from "./state-cell";
import { QueryNotice } from "@/components/ui/query-notice";
import type { DetailsTabProps } from "./details-tab-props";

const list = (xs: string[]) =>
  xs.length > 1
    ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`
    : xs.join("");

const count = (n: number) => (n >= 0 ? n.toLocaleString() : <Dash />);

type Row = TrackerRow & { now: number };

// Tracker, State and Next announce always stay; the message then moves under
// the tracker's URL. Thresholds: the natural width of the tier's columns with
// long values, plus a little slack.
const tiers = {
  tier: "@max-[34rem]:hidden",
  message: "@max-[46rem]:hidden",
  swarm: "@max-[60rem]:hidden",
};

// The URL with the host standing out, as the peers' addresses do from their
// ports.
function Url({ url }: { url: string }) {
  const m = /^([a-z0-9+.-]+:\/\/)([^/?#]*)(.*)$/i.exec(url);
  if (!m) return url;
  return (
    <>
      <span className="opacity-50">{m[1]}</span>
      {m[2]}
      <span className="opacity-50">{m[3]}</span>
    </>
  );
}

function MessageText({ m }: { m: TrackerMessage }) {
  return <span className={clsx(m.muted && "opacity-60")}>{m.text}</span>;
}

const columns: DetailsColumn<Row>[] = [
  {
    key: "tracker",
    label: "Tracker",
    title: "Hover a tracker for its tier and where it came from",
    // Takes what the others leave, but not less than a typical URL while the
    // message column competes for it.
    className: "w-full max-w-0 @min-[46rem]:min-w-64",
    cell: (r) => (
      <span className="block">
        <span className="flex items-center gap-1">
          <span
            className="min-w-0 truncate @max-[46rem]:whitespace-normal @max-[46rem]:wrap-anywhere"
            title={[
              r.t.url,
              `Tier ${r.t.tier}`,
              ...r.t.source.map((s) => trackerSources[s] ?? s),
              r.t.trackerid && `Tracker ID ${r.t.trackerid}`,
            ]
              .filter(Boolean)
              .join("\n")}
          >
            <Url url={r.t.url} />
          </span>
          <span className="-my-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 @max-md:hidden">
            <CopyButton text={r.t.url} label="tracker URL" />
          </span>
        </span>
        {r.message && (
          <span className="block text-xs @min-[46rem]:hidden">
            <MessageText m={r.message} />
          </span>
        )}
      </span>
    ),
  },
  {
    key: "tier",
    label: "Tier",
    title:
      "Lower tiers are tried first; trackers in the same tier back each other up",
    numeric: true,
    hide: tiers.tier,
    cell: (r) => <span className="opacity-60">{r.t.tier}</span>,
  },
  {
    key: "state",
    label: "State",
    title: "How the last announce went; hover a row for the details",
    cell: (r) => (
      <StateCell label={r.state.label} dot={r.state.dot} title={r.details} />
    ),
  },
  {
    key: "message",
    label: "Message",
    title: "What the tracker said, or what went wrong",
    hide: tiers.message,
    cell: (r) =>
      r.message && (
        <span
          className="block max-w-48 truncate @min-[70rem]:max-w-xs"
          title={r.message.text}
        >
          <MessageText m={r.message} />
        </span>
      ),
  },
  {
    key: "seeds",
    label: "Seeds",
    title: "Seeds in the swarm, by the tracker's last count",
    numeric: true,
    hide: tiers.swarm,
    cell: (r) => count(r.seeds),
  },
  {
    key: "leechers",
    label: "Leechers",
    title: "Downloaders in the swarm, by the tracker's last count",
    numeric: true,
    hide: tiers.swarm,
    cell: (r) => count(r.leechers),
  },
  {
    key: "downloads",
    label: "Downloads",
    title: "Completed downloads the tracker has counted",
    numeric: true,
    hide: tiers.swarm,
    cell: (r) => count(r.downloads),
  },
  {
    key: "next",
    label: "Next announce",
    numeric: true,
    // A due time that's passed without an announce in flight (an interface
    // libtorrent skips has one perpetually) reads as nothing scheduled.
    cell: (r) => {
      if (r.announcing) return <span className="opacity-60">announcing…</span>;
      if (r.next === null || r.next <= r.now) return <Dash />;
      return (
        <span title={`Scheduled for ${date(r.next)}`}>
          in {duration(r.next - r.now)}
        </span>
      );
    },
  },
];

export function TrackersTab({
  info_hash,
  session_id,
  torrent: t,
}: DetailsTabProps) {
  const trackers = useRPC(
    "torrents.trackers.list",
    {
      info_hash,
      session_id,
    },
    {
      meta: { errorToast: false },
      refetchInterval: POLL_MS.details,
    },
  );

  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  const all = trackers.data?.trackers ?? [];

  if (trackers.isLoading || trackers.error) {
    return <QueryNotice query={trackers} what="trackers" />;
  }

  if (all.length === 0) {
    const ways = peerSources
      .filter(({ flag }) => !t?.flags.includes(flag))
      .map(({ name }) => name);

    return (
      <ListState icon={RadioTower} title="No trackers">
        {ways.length
          ? `Peers can still be found through ${list(ways)}.`
          : `${list(peerSources.map(({ name }) => name))} are off for this torrent too, so no peers will be found.`}
      </ListState>
    );
  }

  return (
    <DetailsTable
      columns={columns}
      rows={trackerRows(all, info_hash).map((r) => ({ ...r, now }))}
      rowKey={(r) => r.t.url}
    />
  );
}
