import {
  useRPC,
  type AnnounceEndpoint,
  type AnnounceEntry,
  type AnnounceInfohash,
  type ErrC,
  type InfoHash,
  type Torrent,
} from "@/api";
import { date, duration } from "@/format";
import clsx from "clsx";
import { RadioTower, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import CopyButton from "./copy-button";
import ListState from "./list-state";

type TrackersTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};

// libtorrent's time_point32 default: next/min_announce "not set".
const UNSET = -2147483648;

// libtorrent's error codes (error_code.hpp, error_code_enum) that mean more
// than "the announce failed", with their messages: porla serializes the value
// without its category, and the message rules out a clash with another one.
const errors = {
  tracker_failure: [173, "tracker sent a failure message"],
  announce_skipped: [180, "skipping tracker announce (unreachable)"],
} as const;

const is = (e: ErrC | null, which: keyof typeof errors) =>
  !!e && e.value === errors[which][0] && e.message === errors[which][1];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const list = (xs: string[]) =>
  xs.length > 1
    ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`
    : xs.join("");

// A tracker is announced to once per listen interface (endpoint), and per
// protocol on a hybrid torrent: each of those is a leaf with its own state.
type Leaf = { ep: AnnounceEndpoint; ih: AnnounceInfohash; v: 1 | 2 };

// The protocols the torrent has; the other info hash's state is inert.
function protocols(ih: InfoHash): (1 | 2)[] {
  const has =
    typeof ih === "string"
      ? [ih.length < 64, ih.length === 64]
      : ih.map(Boolean);
  return has.flatMap((h, i) => (h ? [(i + 1) as 1 | 2] : []));
}

const leavesOf = (t: AnnounceEntry, vs: (1 | 2)[]): Leaf[] =>
  t.endpoints.flatMap((ep) =>
    vs.map((v) => ({ ep, ih: ep.info_hashes[v - 1], v })),
  );

const announcing = (l: Leaf) => l.ep.enabled && l.ih.updating;

// how the last announce went, in plain words; the tooltip has the longer
// story.
type State = { label: string; dot?: string; why: string };
type Verdict = keyof typeof states;

const states = {
  working: {
    label: "Working",
    dot: "status-success",
    why: "The tracker answered the last announce",
  },
  announcing: {
    label: "Announcing",
    dot: "status-info",
    why: "Waiting for the tracker's reply",
  },
  tracker_error: {
    label: "Tracker error",
    dot: "status-error",
    why: "The tracker answered, but refused the announce",
  },
  not_working: {
    label: "Not working",
    dot: "status-warning",
    why: "The announce failed; it's retried with a growing delay",
  },
  unreachable: {
    label: "Unreachable",
    why: "Skipped: the tracker has no address this interface can reach, like an IPv4-only tracker from an IPv6 interface",
  },
  not_contacted: {
    label: "Not contacted",
    why: "Not announced to yet: by default a tracker is only used when the ones before it fail",
  },
  disabled: {
    label: "Disabled",
    why: "libtorrent gave up on this interface: the tracker's address family isn't supported on it",
  },
} satisfies Record<string, State>;

// A leaf's state apart from an announce in flight, which is layered on top so
// a tracker that works doesn't flip to "Announcing" at every refresh.
function base(l: Leaf): Verdict {
  if (!l.ep.enabled) return "disabled";
  if (l.ih.fails > 0) {
    if (is(l.ih.last_error, "tracker_failure")) return "tracker_error";
    if (is(l.ih.last_error, "announce_skipped")) return "unreachable";
    return "not_working";
  }
  return l.ih.start_sent ? "working" : "not_contacted";
}

function verdictOf(ls: Leaf[], bases: Verdict[]): Verdict {
  const on = bases.filter((b) => b !== "disabled");
  const n = (v: Verdict) => on.filter((b) => b === v).length;
  if (on.length === 0) return "disabled";
  if (n("working") > 0) return "working";
  if (n("tracker_error") > 0) return "tracker_error";
  if (n("unreachable") === on.length) return "unreachable";
  if (n("unreachable") + n("not_working") === on.length) return "not_working";
  if (ls.some(announcing)) return "announcing";
  return "not_contacted";
}

// What to say next to the state: the tracker's own words when it sent any (a
// warning, or why it refused), else the error in plain words.
function reason(l: Leaf, b: Verdict) {
  if (l.ih.message) return l.ih.message;
  if (b === "tracker_error") return "The tracker refused the announce";
  if (b === "unreachable") return "No route from this interface";
  if (b === "not_working") return cap(l.ih.last_error?.message ?? "Failed");
  return null;
}

const failures = (n: number) =>
  n === 1 ? "1 failure" : `${n} failures in a row`;

// One line per interface for the tracker's tooltip.
function line(l: Leaf, b: Verdict, hybrid: boolean) {
  const s = announcing(l) ? states.announcing : states[b];
  const why = announcing(l) ? null : reason(l, b);
  return [
    `${l.ep.local_endpoint[0]}${hybrid ? ` (v${l.v})` : ""} — ${s.label}`,
    why && `: ${why}`,
    l.ih.fails > 0 && ` (${failures(l.ih.fails)})`,
  ]
    .filter(Boolean)
    .join("");
}

const sources: Record<string, string> = {
  torrent: "from the .torrent file",
  client: "added here",
  magnet_link: "from the magnet link",
  tex: "from tracker exchange with a peer",
};

type Message = { text: string; muted?: boolean };

// One tracker, its interfaces folded in; the tooltip tells them apart.
type Row = {
  t: AnnounceEntry;
  state: State;
  details: string;
  message: Message | null;
  seeds: number;
  leechers: number;
  downloads: number;
  // The next announce as Unix seconds (null: not scheduled), unless one is in
  // flight.
  next: number | null;
  announcing: boolean;
};

const nextOf = (ls: Leaf[]) => {
  const set = ls.map((l) => l.ih.next_announce).filter((n) => n !== UNSET);
  return set.length ? Math.min(...set) : null;
};

function rowOf(t: AnnounceEntry, vs: (1 | 2)[]): Row {
  const ls = leavesOf(t, vs);
  const bases = ls.map(base);
  const verdict = verdictOf(ls, bases);
  const hybrid = vs.length > 1;
  // The leaves in the tracker's own state speak for it: its message and its
  // next announce are theirs.
  const own =
    verdict === "announcing"
      ? ls.filter(announcing)
      : ls.filter((_, i) => bases[i] === verdict);
  const said = own.map((l) => reason(l, verdict)).find(Boolean);
  // Working (or not contacted) on some interfaces and failing on others
  // deserves a quiet note; an interface with no route to the tracker doesn't,
  // since nothing was lost.
  const bad = (i: number) =>
    ["not_working", "tracker_error"].includes(bases[i]);
  const failing = [...new Set(ls.map((l) => l.ep.local_endpoint[0]))].flatMap(
    (ip) => {
      const at = ls.flatMap((l, i) =>
        l.ep.local_endpoint[0] === ip ? [i] : [],
      );
      const lost = at.filter(bad);
      // On a hybrid torrent, name the protocol when only one of them fails.
      return lost.length === 0
        ? []
        : lost.length === at.length
          ? [ip]
          : lost.map((i) => `${ip} (v${ls[i].v})`);
    },
  );
  const most = (f: (ih: AnnounceInfohash) => number) =>
    Math.max(-1, ...ls.map((l) => f(l.ih)));

  return {
    t,
    state: states[verdict],
    details: [
      states[verdict].why,
      ...(ls.length > 1
        ? ls.map((l, i) => line(l, bases[i], hybrid))
        : ls.flatMap((l) => (l.ih.fails > 0 ? [failures(l.ih.fails)] : []))),
    ].join("\n"),
    message:
      verdict === "unreachable"
        ? { text: "No route from any interface" }
        : said
          ? { text: said }
          : failing.length
            ? { text: `Fails from ${failing.join(", ")}`, muted: true }
            : null,
    seeds: most((ih) => ih.scrape_complete),
    leechers: most((ih) => ih.scrape_incomplete),
    downloads: most((ih) => ih.scrape_downloaded),
    next: nextOf(own),
    announcing: own.some(announcing),
  };
}

const dash = <span className="opacity-40">–</span>;

const count = (n: number) => (n >= 0 ? n.toLocaleString() : dash);

type View = { now: number };

type Column = {
  key: string;
  label: string;
  title?: string;
  numeric?: boolean;
  // Hidden below a panel width (a container query: the panel is the viewport
  // less the sidebar). Tracker, State and Next announce always stay; the
  // message then moves under the tracker's URL.
  hide?: string;
  cell: (r: Row, v: View) => ReactNode;
};

// Thresholds: the natural width of the tier's columns with long values, plus
// a little slack.
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
function MessageText({ m }: { m: Message }) {
  return <span className={clsx(m.muted && "opacity-60")}>{m.text}</span>;
}

const columns: Column[] = [
  {
    key: "tracker",
    label: "Tracker",
    title: "Hover a tracker for its tier and where it came from",
    cell: (r) => (
      <span className="flex items-center gap-1">
        <span className="min-w-0 flex-1">
          {/* Wraps where the message column is folded under it, so the whole
              URL can be read on a phone. */}
          <span
            className="block truncate @max-[46rem]:whitespace-normal @max-[46rem]:wrap-anywhere"
            title={[
              r.t.url,
              `Tier ${r.t.tier}`,
              ...r.t.source.map((s) => sources[s] ?? s),
              r.t.trackerid && `Tracker ID ${r.t.trackerid}`,
            ]
              .filter(Boolean)
              .join("\n")}
          >
            <Url url={r.t.url} />
          </span>
          {r.message && (
            <span className="block text-xs @min-[46rem]:hidden">
              <MessageText m={r.message} />
            </span>
          )}
        </span>
        {/* Shown on hover; left out on a phone, where the URL is in full
            anyway and the slot is dear. */}
        <span className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 @max-md:hidden">
          <CopyButton text={r.t.url} label="tracker URL" />
        </span>
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
      <span
        className="flex cursor-help items-center gap-1.5 whitespace-nowrap"
        title={r.details}
      >
        <span
          className={clsx("status shrink-0", r.state.dot ?? "opacity-30")}
          aria-hidden
        />
        <span className={clsx(r.state.dot === undefined && "opacity-60")}>
          {r.state.label}
        </span>
      </span>
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
    cell: (r, { now }) => {
      if (r.announcing) return <span className="opacity-60">announcing…</span>;
      if (r.next === null || r.next <= now) return dash;
      return (
        <span title={`Scheduled for ${date(r.next)}`}>
          in {duration(r.next - now)}
        </span>
      );
    },
  },
];

export default function TrackersTab({
  info_hash,
  session_id,
  torrent: t,
}: TrackersTabProps) {
  const trackers = useRPC(
    "torrents.trackers.list",
    {
      info_hash,
      session_id,
    },
    {
      meta: { silent: true },
      refetchInterval: 2000,
    },
  );

  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  const all = trackers.data?.trackers ?? [];

  if (trackers.isLoading) {
    return <span className="loading loading-spinner m-3" />;
  }

  if (trackers.error) {
    return (
      <ListState icon={TriangleAlert} title="Couldn't load the trackers">
        {trackers.error.message}
      </ListState>
    );
  }

  if (all.length === 0) {
    const ways = [
      !t?.flags.includes("disable_dht") && "DHT",
      !t?.flags.includes("disable_pex") && "peer exchange",
      !t?.flags.includes("disable_lsd") && "local discovery",
    ].filter((w) => w !== false);
    return (
      <ListState icon={RadioTower} title="No trackers">
        {ways.length
          ? `Peers can still be found through ${list(ways)}.`
          : "DHT, peer exchange and local discovery are off for this torrent too, so no peers will be found."}
      </ListState>
    );
  }

  // By tier, then URL: libtorrent moves a working tracker to the front of its
  // tier, which would shuffle the rows between polls.
  const vs = protocols(info_hash);
  const rows = [...all]
    .sort((a, b) => a.tier - b.tier || a.url.localeCompare(b.url))
    .map((x) => rowOf(x, vs));
  const view: View = { now };

  return (
    <div className="@container">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-2 text-xs",
                  c.numeric && "text-right",
                  c.hide,
                )}
                title={c.title}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t.url} className="group hover:bg-base-200/60">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-2",
                    // Takes what the others leave, but not less than a
                    // typical URL while the message column competes for it.
                    c.key === "tracker" &&
                      "w-full max-w-0 @min-[46rem]:min-w-64",
                    c.numeric && "text-right tabular-nums whitespace-nowrap",
                    c.hide,
                  )}
                >
                  {c.cell(r, view)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
