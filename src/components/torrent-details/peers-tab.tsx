import { POLL_MS, useRPC, type InfoHash, type Peer, type Torrent } from "@/api";
import { bytes, rate } from "@/lib/format";
import {
  comparePeers,
  peerAddress,
  peerConnection,
  peerEncryption,
  peerFlagLetters,
  peerOrigin,
  peerState,
  peerStateDetails,
  webSeedKinds,
  type PeerState,
} from "@/lib/torrent/peers";
import clsx from "clsx";
import { ArrowDownLeft, Lock, Users } from "lucide-react";
import { ListState } from "@/components/ui/list-state";
import { Dash } from "@/components/ui/dash";
import { DetailsTable, type DetailsColumn } from "./details-table";
import { ProgressCell } from "./progress-cell";
import { StateCell } from "./state-cell";
import { TabNotice } from "./tab-notice";
import { usePeerCountries, type Country } from "./use-peer-countries";

type PeersTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};

type Row = { p: Peer; c: Country; s: PeerState };

// Peer, State, Down and Up always stay; the tiers add Progress, then the
// totals, the client, and last the connection details. Phones also lose the
// port and the country. Thresholds: the natural width of the tier's columns
// with long values, plus a little slack.
const tiers = {
  progress: "@max-[37rem]:hidden",
  totals: "@max-[49rem]:hidden",
  client: "@max-[58rem]:hidden",
  connection: "@max-[71rem]:hidden",
};

const columns: DetailsColumn<Row>[] = [
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
          title={peerOrigin(p)}
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
      const enc = peerEncryption(p);
      return (
        <span
          className="flex items-center gap-1.5 whitespace-nowrap"
          title={
            p.connection_type !== "standard_bittorrent"
              ? webSeedKinds[p.connection_type]
              : undefined
          }
        >
          {peerConnection(p)}

          {enc && (
            <Lock
              className={clsx(
                "size-3",
                p.flags.includes("rc4_encrypted") ||
                  p.flags.includes("ssl_socket")
                  ? "opacity-70"
                  : "opacity-40",
              )}
              aria-label={enc}
            >
              <title>{enc}</title>
            </Lock>
          )}
          {!p.flags.includes("outgoing_connection") && (
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
      <StateCell label={s.label} dot={s.dot} title={peerStateDetails(p, s)} />
    ),
  },
  {
    key: "flags",
    label: "Flags",
    title: "qBittorrent's flag letters; hover a row for what they mean",
    hide: tiers.connection,
    cell: ({ p }) => {
      const on = peerFlagLetters.filter(([, , test]) => test(p));
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
      <ProgressCell
        value={p.progress}
        complete={p.flags.includes("seed")}
        label="Peer progress"
        textClassName="w-9"
      >
        {p.flags.includes("seed")
          ? "Seed"
          : `${(p.progress * 100).toFixed(1)}%`}
      </ProgressCell>
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

export function PeersTab({ info_hash, session_id, torrent: t }: PeersTabProps) {
  const peers = useRPC(
    "torrents.peers.list",
    {
      info_hash,
      session_id,
    },
    {
      meta: { errorToast: false },
      refetchInterval: POLL_MS.details,
    },
  );

  const list = peers.data?.peers ?? [];

  const country = usePeerCountries(list.map((p) => p.remote_endpoint[0]));
  const rows: Row[] = list
    .map((p) => ({ p, c: country(p.remote_endpoint[0]), s: peerState(p) }))
    .sort((a, b) => comparePeers(a.p, b.p));

  if (peers.isLoading || peers.error) {
    return <TabNotice query={peers} what="peers" />;
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
    <DetailsTable
      columns={columns}
      rows={rows}
      rowKey={(r) => peerAddress(r.p.remote_endpoint)}
    />
  );
}
