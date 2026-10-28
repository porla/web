import { useRPC, type InfoHash, type Torrent, type Peer } from "@/api";
import { bytes, duration, rate } from "@/format";
import { keepPreviousData } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowDownLeft, Lock, TriangleAlert, Users } from "lucide-react";
import { type ReactNode } from "react";
import ListState from "./list-state";
import Dash from "./dash";

type PeersTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};

const has = (p: Peer, flag: string) => p.flags.includes(flag);

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const address = ([ip, port]: [string, number]) =>
  ip.includes(":") ? `[${ip}]:${port}` : `${ip}:${port}`;

// Sorts IPv4 numerically (not "10." before "9."), IPv6 after it.
const ipKey = (ip: string) =>
  ip.includes(":")
    ? `6${ip}`
    : `4${ip
        .split(".")
        .map((o) => o.padStart(3, "0"))
        .join(".")}`;

// What's going on with a peer, in plain words; the tooltip has the longer
// story. The dot is a status color ("" for the plain one); none means the
// row is shown muted.
type State = { label: string; dot?: string; why: string };

function state(p: Peer): State {
  if (has(p, "connecting")) {
    return { label: "Connecting", why: "Not connected yet" };
  }
  if (has(p, "handshake")) {
    return {
      label: "Handshaking",
      why: "Connected, exchanging the BitTorrent handshake",
    };
  }
  // The same four flags behind qBittorrent's D/d/U/u letters.
  const down = has(p, "interesting") && !has(p, "remote_choked");
  const up = has(p, "remote_interested") && !has(p, "choked");
  if (has(p, "interesting") && has(p, "snubbed")) {
    return {
      label: "Snubbed",
      dot: "status-error",
      why: "The peer stopped answering our requests, so it's asked for less until it does",
    };
  }
  if (down && up) {
    return {
      label: "Exchanging",
      dot: "status-success",
      why: "Downloading from and uploading to this peer",
    };
  }
  if (down) {
    return {
      label: "Downloading",
      dot: "status-success",
      why: "The peer has pieces we're missing and is sending them",
    };
  }
  if (up) {
    return {
      label: "Uploading",
      dot: "status-info",
      why: "The peer wants pieces we have and we're sending them",
    };
  }
  if (has(p, "interesting")) {
    return {
      label: "Choked us",
      dot: "status-warning",
      why: "The peer has pieces we're missing but isn't sending: we're waiting for one of its upload slots",
    };
  }
  if (has(p, "remote_interested")) {
    return {
      label: "Wants data",
      dot: "",
      why: "The peer wants pieces we have, but we've choked it: it's waiting for one of our upload slots",
    };
  }
  return {
    label: "Idle",
    why: has(p, "seed")
      ? "Neither side needs anything: the peer is a seed and we have what it has"
      : "Neither side has pieces the other is missing",
  };
}

function stateDetails(p: Peer, s: State) {
  return [
    s.why,
    has(p, "optimistic_unchoke") &&
      "Optimistic unchoke: we're giving this peer a try",
    has(p, "on_parole") &&
      "On parole: it sent corrupt data before, so it only gets whole pieces now",
    has(p, "endgame_mode") &&
      "Endgame: the last blocks are requested from several peers at once",
    p.download_queue_length > 0 &&
      `${count(p.download_queue_length, "block request")} outstanding`,
    `Last active ${p.last_active > 0 ? `${duration(p.last_active)} ago` : "just now"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const sources: Record<string, string> = {
  tracker: "tracker",
  dht: "DHT",
  pex: "peer exchange",
  lsd: "local discovery",
  resume_data: "resume data",
  incoming: "incoming connection",
};

function origin(p: Peer) {
  const via = p.source.map((s) => sources[s] ?? s);
  return [
    via.length > 0 && `Found via ${via.join(", ")}`,
    has(p, "outgoing_connection") ? "We connected to it" : "It connected to us",
    `Local endpoint ${address(p.local_endpoint)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// qBittorrent's flag letters (src/base/bittorrent/peerinfo.cpp), so they read
// the same as in the client people know; the tooltip spells them out.
const flagLetters: [string, string, (p: Peer) => boolean][] = [
  [
    "D",
    "Downloading: interested, and the peer unchoked us",
    (p) => has(p, "interesting") && !has(p, "remote_choked"),
  ],
  [
    "d",
    "Interested, but the peer choked us",
    (p) => has(p, "interesting") && has(p, "remote_choked"),
  ],
  [
    "U",
    "Uploading: the peer is interested and unchoked",
    (p) => has(p, "remote_interested") && !has(p, "choked"),
  ],
  [
    "u",
    "The peer is interested, but we choked it",
    (p) => has(p, "remote_interested") && has(p, "choked"),
  ],
  [
    "K",
    "The peer unchoked us, but we're not interested",
    (p) => !has(p, "remote_choked") && !has(p, "interesting"),
  ],
  [
    "?",
    "We unchoked the peer, but it's not interested",
    (p) => !has(p, "choked") && !has(p, "remote_interested"),
  ],
  ["O", "Optimistic unchoke", (p) => has(p, "optimistic_unchoke")],
  ["S", "Snubbed", (p) => has(p, "snubbed")],
  ["I", "Incoming connection", (p) => !has(p, "outgoing_connection")],
  ["H", "Found through DHT", (p) => p.source.includes("dht")],
  ["X", "Found through peer exchange", (p) => p.source.includes("pex")],
  ["L", "Found through local discovery", (p) => p.source.includes("lsd")],
  ["E", "Encrypted traffic", (p) => has(p, "rc4_encrypted")],
  ["e", "Encrypted handshake", (p) => has(p, "plaintext_encrypted")],
  ["P", "µTP", (p) => has(p, "utp_socket")],
  ["h", "NAT hole punching", (p) => has(p, "holepunched")],
];

// "Web" as in qBittorrent; the tooltip says which kind.
function connection(p: Peer) {
  if (p.connection_type !== "standard_bittorrent") return "Web";
  if (has(p, "i2p_socket")) return "I2P";
  return has(p, "utp_socket") ? "µTP" : "TCP";
}

const webSeeds = {
  web_seed: "Web seed (BEP 19)",
  http_seed: "HTTP seed (BEP 17)",
};

function encryption(p: Peer) {
  if (has(p, "ssl_socket")) return "SSL";
  if (has(p, "rc4_encrypted")) return "Encrypted traffic (RC4)";
  if (has(p, "plaintext_encrypted"))
    return "Encrypted handshake, plain traffic";
  return null;
}

// null: a database is loaded but has nothing for this address (private or
// unknown); undefined: no database.
type Country = { code?: string; name?: string } | null | undefined;
type Row = { p: Peer; c: Country; s: State };

type Column = {
  key: string;
  label: string;
  title?: string;
  numeric?: boolean;
  // Hidden below a panel width (a container query: the panel is the viewport
  // less the sidebar). Peer, State, Down and Up always stay; the tiers add
  // Progress, then the totals, the client, and last the connection details.
  // Phones also lose the port and the country.
  hide?: string;
  cell: (r: Row) => ReactNode;
};

// Thresholds: the natural width of the tier's columns with long values, plus
// a little slack.
const tiers = {
  progress: "@max-[37rem]:hidden",
  totals: "@max-[49rem]:hidden",
  client: "@max-[58rem]:hidden",
  connection: "@max-[71rem]:hidden",
};

const columns: Column[] = [
  {
    key: "address",
    label: "Peer",
    cell: ({ p, c }) => (
      <span className="flex items-center gap-1.5">
        {/* The slot is kept for addresses the database doesn't know, so the
            addresses line up. */}
        {c !== undefined && (
          <span
            className={clsx(
              "badge badge-xs badge-ghost w-7 shrink-0 px-0 font-mono @max-md:hidden",
              !c && "invisible",
            )}
            title={c?.name}
          >
            {c?.code}
          </span>
        )}
        {/* IPv6 may wrap when the column is squeezed; IPv4 never does, so it
            sets the column's floor. */}
        <span
          className={clsx(
            "font-mono",
            p.remote_endpoint[0].includes(":")
              ? "break-all"
              : "whitespace-nowrap",
          )}
          title={origin(p)}
        >
          {p.remote_endpoint[0]}
          <span className="whitespace-nowrap opacity-50 @max-md:hidden">
            :{p.remote_endpoint[1]}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: "client",
    label: "Client",
    hide: tiers.client,
    cell: ({ p }) => (
      <span className="block max-w-28 truncate" title={p.client}>
        {p.client ||
          (p.connection_type === "standard_bittorrent" ? <Dash /> : "Web seed")}
      </span>
    ),
  },
  {
    key: "connection",
    label: "Connection",
    hide: tiers.connection,
    cell: ({ p }) => {
      const enc = encryption(p);
      return (
        <span
          className="flex items-center gap-1.5 whitespace-nowrap"
          title={
            p.connection_type !== "standard_bittorrent"
              ? webSeeds[p.connection_type]
              : undefined
          }
        >
          {connection(p)}
          {enc && (
            <Lock
              className={clsx(
                "size-3",
                has(p, "rc4_encrypted") || has(p, "ssl_socket")
                  ? "opacity-70"
                  : "opacity-40",
              )}
              aria-label={enc}
            >
              <title>{enc}</title>
            </Lock>
          )}
          {!has(p, "outgoing_connection") && (
            <ArrowDownLeft
              className="size-3 opacity-70"
              aria-label="Incoming connection"
            >
              <title>Incoming connection</title>
            </ArrowDownLeft>
          )}
        </span>
      );
    },
  },
  {
    key: "rtt",
    label: "RTT",
    title: "Round-trip time to the peer",
    hide: tiers.connection,
    numeric: true,
    cell: ({ p }) => (p.rtt > 0 ? `${p.rtt} ms` : <Dash />),
  },
  {
    key: "state",
    label: "State",
    title: "What's happening with the peer; hover a row for the details",
    cell: ({ p, s }) => (
      <span
        className="flex cursor-help items-center gap-1.5 whitespace-nowrap"
        title={stateDetails(p, s)}
      >
        <span
          className={clsx("status shrink-0", s.dot ?? "opacity-30")}
          aria-hidden
        />
        <span className={clsx(s.dot === undefined && "opacity-60")}>
          {s.label}
        </span>
      </span>
    ),
  },
  {
    key: "flags",
    label: "Flags",
    title: "qBittorrent's flag letters; hover a row for what they mean",
    hide: tiers.connection,
    cell: ({ p }) => {
      const on = flagLetters.filter(([, , test]) => test(p));
      return (
        <span
          className="cursor-help font-mono text-xs whitespace-nowrap opacity-70"
          title={on.map(([l, what]) => `${l} = ${what}`).join("\n")}
        >
          {on.map(([l]) => l).join(" ")}
        </span>
      );
    },
  },
  {
    key: "progress",
    label: "Progress",
    title: "How much of the torrent the peer has",
    numeric: true,
    hide: tiers.progress,
    cell: ({ p }) => (
      <span className="inline-flex items-center gap-2">
        <progress
          className={clsx(
            "progress h-1.5 w-8",
            has(p, "seed") ? "progress-success" : "progress-primary",
          )}
          value={p.progress}
          max={1}
          aria-label="Peer progress"
        />
        <span className="w-9">
          {has(p, "seed") ? "Seed" : `${(p.progress * 100).toFixed(1)}%`}
        </span>
      </span>
    ),
  },
  {
    key: "down",
    label: "Down",
    title: "Download speed from the peer",
    numeric: true,
    cell: ({ p }) => (p.down_speed > 0 ? rate(p.down_speed) : <Dash />),
  },
  {
    key: "up",
    label: "Up",
    title: "Upload speed to the peer",
    numeric: true,
    cell: ({ p }) => (p.up_speed > 0 ? rate(p.up_speed) : <Dash />),
  },
  {
    key: "downloaded",
    label: "Downloaded",
    title: "Received from the peer over this connection",
    numeric: true,
    hide: tiers.totals,
    cell: ({ p }) =>
      p.total_download > 0 ? bytes(p.total_download) : <Dash />,
  },
  {
    key: "uploaded",
    label: "Uploaded",
    title: "Sent to the peer over this connection",
    numeric: true,
    hide: tiers.totals,
    cell: ({ p }) => (p.total_upload > 0 ? bytes(p.total_upload) : <Dash />),
  },
];

export default function PeersTab({
  info_hash,
  session_id,
  torrent: t,
}: PeersTabProps) {
  const peers = useRPC(
    "torrents.peers.list",
    {
      info_hash,
      session_id,
    },
    {
      meta: { silent: true },
      refetchInterval: 2000,
    },
  );

  // Countries come from porla's MMDB, when one is loaded. The lookups are
  // queries keyed by the peers' addresses, so a slow, older reply can't
  // overwrite a newer one. Without a database they fail, which is expected
  // and not worth a toast; the country is simply left out.
  const probe = useRPC(
    "mmdb.lookup",
    { values: ["127.0.0.1"] },
    { meta: { silent: true } },
  );

  const mmdbEnabled = !!probe.data && "127.0.0.1" in probe.data.results;

  const list = peers.data?.peers ?? [];
  // Sorted and deduplicated so the key only changes when the set of
  // addresses does, not when libtorrent lists them in another order.
  const endpoints = [...new Set(list.map((p) => p.remote_endpoint[0]))].sort();
  const lookups = useRPC(
    "mmdb.lookup",
    { values: endpoints },
    {
      enabled: mmdbEnabled && endpoints.length > 0,
      meta: { silent: true },
      placeholderData: keepPreviousData,
    },
  );

  // Lookups failing later means the database was unloaded.
  const dbLoaded = mmdbEnabled && !lookups.isError;
  const country = (p: Peer): Country => {
    if (!dbLoaded) return undefined;
    const c = lookups.data?.results[p.remote_endpoint[0]]?.country;
    return c ? { code: c.iso_code, name: c.names?.en } : null;
  };

  // Least complete first and seeds last; ties by address, so the order holds
  // still between polls.
  const seed = (p: Peer) => has(p, "seed") || p.progress >= 1;
  const rows: Row[] = list
    .map((p) => ({ p, c: country(p), s: state(p) }))
    .sort(
      (a, b) =>
        Number(seed(a.p)) - Number(seed(b.p)) ||
        a.p.progress - b.p.progress ||
        ipKey(a.p.remote_endpoint[0]).localeCompare(
          ipKey(b.p.remote_endpoint[0]),
        ) ||
        a.p.remote_endpoint[1] - b.p.remote_endpoint[1],
    );

  if (peers.isLoading) {
    return <span className="loading loading-spinner m-3" />;
  }

  if (peers.error) {
    return (
      <ListState icon={TriangleAlert} title="Couldn't load the peers">
        {peers.error.message}
      </ListState>
    );
  }

  if (list.length === 0) {
    return (
      <ListState icon={Users} title="No peers connected">
        {t?.flags.includes("paused")
          ? "The torrent is paused."
          : t && t.list_peers > 0
            ? `${t.list_peers} ${t.list_peers === 1 ? "peer" : "peers"} known, none connected.`
            : "No peer addresses known yet. Trackers, DHT and peer exchange fill the list."}
      </ListState>
    );
  }

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
            <tr
              key={address(r.p.remote_endpoint)}
              className="hover:bg-base-200/60"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-2",
                    c.numeric && "text-right tabular-nums whitespace-nowrap",
                    c.hide,
                  )}
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
