import type {
  AnnounceEndpoint,
  AnnounceEntry,
  AnnounceInfohash,
  ErrC,
  InfoHash,
} from "@/api";

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
type TrackerState = { label: string; dot?: string; why: string };
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
} satisfies Record<string, TrackerState>;

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
  // No endpoints yet: libtorrent hasn't announced to it (a lower tier while a
  // higher one works, or anything right after a restart).
  if (ls.length === 0) return "not_contacted";
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

export const trackerSources: Record<string, string> = {
  torrent: "from the .torrent file",
  client: "added here",
  magnet_link: "from the magnet link",
  tex: "from tracker exchange with a peer",
};

export type TrackerMessage = { text: string; muted?: boolean };

// One tracker, its interfaces folded in; the tooltip tells them apart.
export type TrackerRow = {
  t: AnnounceEntry;
  state: TrackerState;
  details: string;
  message: TrackerMessage | null;
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

function rowOf(t: AnnounceEntry, vs: (1 | 2)[]): TrackerRow {
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

// By tier, then URL: libtorrent moves a working tracker to the front of its
// tier, which would shuffle the rows between polls.
export function trackerRows(trackers: AnnounceEntry[], info_hash: InfoHash) {
  const vs = protocols(info_hash);
  return [...trackers]
    .sort((a, b) => a.tier - b.tier || a.url.localeCompare(b.url))
    .map((t) => rowOf(t, vs));
}
